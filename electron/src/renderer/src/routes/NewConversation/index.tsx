import { useState, useEffect } from "react"
import NewConversationPanel from "./NewConversationPanel"
import LLMModelTester from "./LLMModelTester"

import { LLMModel } from "@/types/LLMModel"
import { Conversation } from "@/types/Conversation"
import { useConversationStore } from "@/stores/conversationStore"

import { LoadModelConfigFile } from "@/ipcHandlers"

export default function NewConversation(): JSX.Element {
  const [testableModels, setTestableModels] = useState<LLMModel[]>([])

  const addConversation = useConversationStore((state) => state.add)

  useEffect(() => {
    async function loadModels(): Promise<void> {
      const modelConfigFile = await LoadModelConfigFile()
      const llmModels: LLMModel[] =
        modelConfigFile.models.map((model) => {
          const llmModel: LLMModel = {
            id: model.id,
            name: model.name,
            requiredMemoryGB: model.gguf_required_memory_gb || 0,
            state: model.type === "gguf" ? "available" : "needAPIKey",
          }
          return llmModel
        })
      setTestableModels(llmModels)
    }
    loadModels()
  }, [])

  const handleOnNewConversation = (conversation: Conversation): void => {
    conversation.id = crypto.randomUUID()
    conversation.updatedAt = new Date()
    addConversation(conversation)
  }

  return (
      <div className="min-h-screen flex flex-row">
        <NewConversationPanel llmModels={testableModels} onSave={handleOnNewConversation} />
        <main className="flex-1">
          <LLMModelTester testableModels={testableModels}/>
        </main>
      </div>
  )
}
