export interface ChatMessage {
  id?: string
  createdAt?: Date
  role: "system" | "user" | "assistant"
  content: string
}

export interface UserChatMessage extends ChatMessage {
  role: "user"
}

export interface AssistantChatMessage extends ChatMessage {
  role: "assistant"
}

export interface ChatMessagePair {
  user: UserChatMessage
  assistant: AssistantChatMessage
}
