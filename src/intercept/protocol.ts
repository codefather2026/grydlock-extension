export type Decision = 'proceed' | 'cancel'

export const WINDOW_REQUEST_TYPE = 'GRYDLOCK_REQUEST_DECISION'
export const WINDOW_RESPONSE_TYPE = 'GRYDLOCK_DECISION_RESPONSE'

export interface RuntimeRequestDecisionMessage {
  type: 'REQUEST_DECISION'
  requestId: string
  destination: string
  asset?: string
  score: number
}

export interface RuntimeDecisionMadeMessage {
  type: 'DECISION_MADE'
  requestId: string
  decision: Decision
}
