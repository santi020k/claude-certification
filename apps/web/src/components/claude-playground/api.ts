import type { AskResponse, ChatResponse, HealthResponse, Specialist, SpecialistsResponse } from './types'

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

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown }

    if (typeof payload.detail === 'string') return payload.detail
  } catch { /* ignore */ }

  return 'The API returned an unexpected response.'
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

export async function readAskResponse(response: Response): Promise<AskResponse> {
  const payload: unknown = await response.json()

  if (!isAskResponse(payload)) {
    throw new Error('The API returned an invalid answer payload.')
  }

  return payload
}

export async function readChatResponse(response: Response): Promise<ChatResponse> {
  const payload: unknown = await response.json()

  if (!isChatResponse(payload)) {
    throw new Error('The API returned an invalid chat payload.')
  }

  return payload
}

export async function readHealthResponse(response: Response): Promise<HealthResponse> {
  const payload: unknown = await response.json()

  if (!isHealthResponse(payload)) {
    throw new Error('The API returned an invalid health payload.')
  }

  return payload
}

export async function readSpecialistsResponse(response: Response): Promise<SpecialistsResponse> {
  const payload: unknown = await response.json()

  if (!isSpecialistsResponse(payload)) {
    throw new Error('The API returned an invalid specialists payload.')
  }

  return payload
}
