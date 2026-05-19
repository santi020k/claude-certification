import type {
  AskResponse,
  ChatResponse,
  ChatStreamEvent,
  HealthResponse,
  RateLimitInfo,
  Specialist,
  SpecialistsResponse,
  WeatherResponse
} from './types'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isAskResponse = (value: unknown): value is AskResponse => isRecord(value) &&
  typeof value.question === 'string' &&
  typeof value.answer === 'string' &&
  typeof value.model === 'string' &&
  typeof value.input_tokens === 'number' &&
  typeof value.output_tokens === 'number'

const isHealthResponse = (value: unknown): value is HealthResponse => isRecord(value) &&
  typeof value.status === 'string' &&
  typeof value.environment === 'string' &&
  typeof value.anthropic_api_key_configured === 'boolean' &&
  typeof value.model === 'string'

const isWeatherObservation = (value: unknown) => isRecord(value) &&
  typeof value.location === 'string' &&
  typeof value.country === 'string' &&
  typeof value.latitude === 'number' &&
  typeof value.longitude === 'number' &&
  typeof value.temperature === 'number' &&
  typeof value.apparent_temperature === 'number' &&
  typeof value.temperature_unit === 'string' &&
  typeof value.humidity === 'number' &&
  typeof value.precipitation === 'number' &&
  typeof value.wind_speed === 'number' &&
  typeof value.wind_speed_unit === 'string' &&
  typeof value.condition === 'string' &&
  typeof value.observed_at === 'string'

const isWeatherResponse = (value: unknown): value is WeatherResponse => isRecord(value) &&
  typeof value.location === 'string' &&
  typeof value.question === 'string' &&
  typeof value.answer === 'string' &&
  typeof value.model === 'string' &&
  typeof value.tool_name === 'string' &&
  isWeatherObservation(value.weather) &&
  typeof value.input_tokens === 'number' &&
  typeof value.output_tokens === 'number'

const isChatMessage = (value: unknown) => isRecord(value) &&
  (value.role === 'user' || value.role === 'assistant') &&
  typeof value.content === 'string'

const isChatResponse = (value: unknown): value is ChatResponse => isRecord(value) &&
  typeof value.conversation_id === 'string' &&
  typeof value.answer === 'string' &&
  Array.isArray(value.messages) &&
  value.messages.every(isChatMessage) &&
  typeof value.model === 'string' &&
  typeof value.input_tokens === 'number' &&
  typeof value.output_tokens === 'number'

const isSpecialist = (value: unknown): value is Specialist => isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.description === 'string' &&
  typeof value.temperature === 'number'

const isSpecialistsResponse = (value: unknown): value is SpecialistsResponse => isRecord(value) &&
  Array.isArray(value.specialists) &&
  value.specialists.every(isSpecialist) &&
  typeof value.default === 'string'

const isChatStreamEvent = (value: unknown): value is ChatStreamEvent => {
  if (!isRecord(value) || typeof value.type !== 'string') return false

  if (value.type === 'text') return typeof value.text === 'string'

  if (value.type === 'error') return typeof value.detail === 'string'

  return value.type === 'final' && isChatResponse(value)
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown }

    if (typeof payload.detail === 'string') return payload.detail
  } catch {
    /* ignore */
  }

  return 'The API returned an unexpected response.'
}

/**
 * Extract slowapi rate-limit headers from any response (success or 429).
 * slowapi sends X-RateLimit-Limit, X-RateLimit-Remaining, and
 * X-RateLimit-Reset (epoch seconds) when headers_enabled=True.
 * Returns null if the headers are absent (e.g. during local dev without the
 * middleware, or when the request never reached the limiter).
 */
export function readRateLimitHeaders(response: Response): RateLimitInfo | null {
  const limit     = parseInt(response.headers.get('X-RateLimit-Limit')     ?? '', 10)
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') ?? '', 10)
  const resetSecs = parseInt(response.headers.get('X-RateLimit-Reset')     ?? '', 10)

  if (isNaN(limit) || isNaN(remaining) || isNaN(resetSecs)) return null

  return {
    limit,
    remaining,
    resetAt: resetSecs * 1_000 // convert epoch-seconds → epoch-ms
  }
}

export function parseRetryAfter(response: Response): number {
  const raw = response.headers.get('Retry-After')

  if (!raw) return 60

  const secs = parseInt(raw, 10)

  if (!isNaN(secs)) return Math.max(1, secs)

  const date = Date.parse(raw)

  if (!isNaN(date)) return Math.max(1, Math.ceil((date - Date.now()) / 1000))

  return 60
}

export async function readAskResponse(
  response: Response
): Promise<AskResponse> {
  const payload: unknown = await response.json()

  if (!isAskResponse(payload)) {
    throw new Error('The API returned an invalid answer payload.')
  }

  return payload
}

export async function readChatResponse(
  response: Response
): Promise<ChatResponse> {
  const payload: unknown = await response.json()

  if (!isChatResponse(payload)) {
    throw new Error('The API returned an invalid chat payload.')
  }

  return payload
}

export async function readWeatherResponse(
  response: Response
): Promise<WeatherResponse> {
  const payload: unknown = await response.json()

  if (!isWeatherResponse(payload)) {
    throw new Error('The API returned an invalid weather payload.')
  }

  return payload
}

export async function* readChatStream(
  response: Response
): AsyncGenerator<ChatStreamEvent> {
  if (!response.body) {
    throw new Error('The API returned an empty stream.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')

      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()

        if (!trimmed) continue

        const event: unknown = JSON.parse(trimmed)

        if (!isChatStreamEvent(event)) {
          throw new Error('The API returned an invalid chat stream payload.')
        }

        yield event
      }
    }

    buffer += decoder.decode()

    const trimmed = buffer.trim()

    if (trimmed) {
      const event: unknown = JSON.parse(trimmed)

      if (!isChatStreamEvent(event)) {
        throw new Error('The API returned an invalid chat stream payload.')
      }

      yield event
    }
  } finally {
    reader.releaseLock()
  }
}

export async function readHealthResponse(
  response: Response
): Promise<HealthResponse> {
  const payload: unknown = await response.json()

  if (!isHealthResponse(payload)) {
    throw new Error('The API returned an invalid health payload.')
  }

  return payload
}

export async function readSpecialistsResponse(
  response: Response
): Promise<SpecialistsResponse> {
  const payload: unknown = await response.json()

  if (!isSpecialistsResponse(payload)) {
    throw new Error('The API returned an invalid specialists payload.')
  }

  return payload
}
