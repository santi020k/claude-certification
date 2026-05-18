export interface AskResponse {
  question: string
  answer: string
  model: string
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

export interface HealthResponse {
  status: string
  environment: string
  anthropic_api_key_configured: boolean
  model: string
}
