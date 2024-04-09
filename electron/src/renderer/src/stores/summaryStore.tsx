import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface Summary {
  conversationID: string
  modelID: string
  summary: string
}

interface SummaryState {
  summaries: Summary[]
  upsert: (conversationID: string, modelID: string, summary: string) => void
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set) => ({
      summaries: [],
      upsert: (conversationID: string, modelID: string, summary: string): void => {
        set((state) => {
          const existingSummary = state.summaries.find((summary) => summary.conversationID === conversationID && summary.modelID === modelID)
          if (existingSummary) {
            return {
              summaries: state.summaries.map((item) => (
                (item.conversationID === conversationID && item.modelID === modelID) ? { conversationID: conversationID, modelID: modelID, summary: summary } : item
              )),
            }
          }
          return {
            summaries: [...state.summaries, { conversationID: conversationID, modelID: modelID, summary: summary } as Summary],
          }
        })
      },
    }),
    {
      name: "summary-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
