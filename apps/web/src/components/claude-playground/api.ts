import type { AskResponse, HealthResponse } from './types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAskResponse = (value: unknown): value is AskResponse =>
  isRecord(value) &&
  typeof value.question === 'string' &&
  typeof value.answer === 'string' &&
  typeof value.model === 'string' &&
  typeof value.input_tokens === 'number' &&
  typeof value.output_tokens === 'number'

const isHealthResponse = (value: unknown): value is HealthResponse =>
  isRecord(value) &&
  typeof value.status === 'string' &&
  typeof value.environment === 'string' &&
  typeof value.anthropic_api_key_configured === 'boolean' &&
  typeof value.model === 'string'

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

export async function readHealthResponse(response: Response): Promise<HealthResponse> {
  const payload: unknown = await response.json()

  if (!isHealthResponse(payload)) {
    throw new Error('The API returned an invalid health payload.')
  }

  return payload
}
