export interface AskResponse {
  question: string
  answer: string
  model: string
  input_tokens: number
  output_tokens: number
}

export interface HealthResponse {
  status: string
  environment: string
  anthropic_api_key_configured: boolean
  model: string
}
