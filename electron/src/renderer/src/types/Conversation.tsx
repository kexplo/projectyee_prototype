import { ChatMessage, ChatMessagePair } from "@/types/ChatMessage"

export interface Conversation {
  id: string
  updatedAt: Date
  modelIDs: string[]
  title: string
  description?: string
  nuance?: string
  systemPrompt?: string
  initialMessages?: ChatMessagePair[]
  conversationStarters?: string[]
  messages?: ChatMessage[]
}

export interface ConversationGroup {
  displayName: string
  conversations: Conversation[]
}
