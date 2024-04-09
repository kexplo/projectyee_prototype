export interface ModelConfig {
  id: string
  name: string
  type: "gguf" | "api"
  gguf_path?: string
  gguf_options?: string[]
  gguf_required_memory_gb?: number
  api_model_id?: string
  api_key?: string
  api_endpoint?: string
}

export interface ModelConfigFile {
  models: ModelConfig[]
}

export interface ModelStatus extends ModelConfig {
  port?: number
  pid?: number
  isInitialized?: boolean
}
