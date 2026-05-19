export interface AskResponse {
  question: string
  answer: string
  model: string
  input_tokens: number
  output_tokens: number
}

export interface WeatherObservation {
  location: string
  country: string
  latitude: number
  longitude: number
  temperature: number
  apparent_temperature: number
  temperature_unit: string
  humidity: number
  precipitation: number
  wind_speed: number
  wind_speed_unit: string
  condition: string
  observed_at: string
}

export interface WeatherResponse {
  location: string
  question: string
  answer: string
  model: string
  tool_name: string
  weather: WeatherObservation
  input_tokens: number
  output_tokens: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  conversation_id: string
  answer: string
  messages: ChatMessage[]
  model: string
  input_tokens: number
  output_tokens: number
}

export type ChatStreamEvent =
  | { type: 'text', text: string } |
  (ChatResponse & { type: 'final' }) |
  { type: 'error', detail: string, status_code?: number }

export interface RateLimitInfo {
  /** Total requests allowed per window (from X-RateLimit-Limit). */
  limit: number
  /** Requests remaining in the current window (from X-RateLimit-Remaining). */
  remaining: number
  /** Epoch milliseconds when the current window resets (from X-RateLimit-Reset). */
  resetAt: number
}

export interface HealthResponse {
  status: string
  environment: string
  anthropic_api_key_configured: boolean
  model: string
}

export interface Specialist {
  id: string
  name: string
  description: string
  temperature: number
}

export interface SpecialistsResponse {
  specialists: Specialist[]
  default: string
}
