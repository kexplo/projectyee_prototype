import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Conversation } from "@/types/Conversation"
import { ChatMessage } from "@/types/ChatMessage"

interface ConversationState {
  conversations: Conversation[]
  add: (conversation: Conversation) => void
  updateMessages: (conversationId: string, messages: ChatMessage[]) => void
}

import { StateStorage, PersistStorage, StorageValue } from "zustand/middleware"
function createConversationJSONStorage(getStorage: () => StateStorage): PersistStorage<ConversationState> | undefined {
  const jsonStorage: PersistStorage<ConversationState> | undefined = createJSONStorage<ConversationState>(getStorage)
  if (!jsonStorage) {
    return
  }

  return {
    getItem: (name): StorageValue<ConversationState> | null | Promise<StorageValue<ConversationState> | null> =>{
      const jsonStorageResult = jsonStorage.getItem(name)
      if (jsonStorageResult instanceof Promise) {
        return jsonStorageResult
      }
      if (jsonStorageResult instanceof Object) {
        // maybe it is a JSON object
        jsonStorageResult.state.conversations = jsonStorageResult.state.conversations.map((conversation: Conversation) => {
          // parse the updatedAt field as a Date object
          conversation.updatedAt = new Date(conversation.updatedAt)
          return conversation
        })
        return jsonStorageResult
      }
      return jsonStorageResult
    },
    setItem: jsonStorage.setItem,
    removeItem: jsonStorage.removeItem,
  }
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      conversations: [],
      add: (conversation): void => set((state) => ({ conversations: [...state.conversations, conversation] })),
      updateMessages: (conversationId, messages): void => {
        set((state) => {
          const conversation = state.conversations.find((conversation) => conversation.id === conversationId)
          if (!conversation) {
            return state
          }
          const updatedConversation = {
            ...conversation,
            messages,
          }
          return {
            conversations: state.conversations.map((conversation) => (conversation.id === conversationId ? updatedConversation : conversation)),
          }
        })
      }
    }),
    {
      name: "conversation-storage",
      storage: createConversationJSONStorage(() => localStorage),
    },
  ),
)
