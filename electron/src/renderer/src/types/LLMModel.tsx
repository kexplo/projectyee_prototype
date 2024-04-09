export interface LLMModel {
  id: string
  name: string
  requiredMemoryGB: number
  state: "notInstalled" | "installed" | "available" | "needAPIKey" | "APIKeyInstalled"
}
