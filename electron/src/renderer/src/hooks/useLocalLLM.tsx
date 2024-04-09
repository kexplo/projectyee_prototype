import { useState, useCallback, useEffect } from "react"
import { ModelStatus, ModelConfig } from "@/types/ModelConfig"

import * as ipcHandler from "@/ipcHandlers"

interface LocalLLMHelper {
  configs: ModelConfig[]
  statuses: ModelStatus[]
  refreshConfigs: () => void
  refreshStatuses: () => void
  startModel: (model: ModelConfig) => void
  stopModel: (model: ModelConfig) => void
  restartModel: (model: ModelConfig) => void
  downloadModel: (model: ModelConfig) => void
}

export const useLocalLLM = (): LocalLLMHelper => {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [statuses, setStatuses] = useState<ModelStatus[]>([])

  const refreshConfigs = useCallback(() => {
    async function callLoadModelConfigFile(): Promise<void> {
      const modelConfigFile = await ipcHandler.LoadModelConfigFile()
      if (modelConfigFile) {
        setConfigs(modelConfigFile.models)
      }
    }
    callLoadModelConfigFile()
  }, [])

  const refreshStatuses = useCallback(() => {
    async function callGetModelStatuses(): Promise<void> {
      const modelStatuses = await ipcHandler.GetModelStatuses()
      if (modelStatuses) {
        setStatuses(modelStatuses)
      }
    }
    callGetModelStatuses()
  }, [])

  const startModel = useCallback((model: ModelConfig) => {
    async function callSpawnModel(): Promise<void> {
      await ipcHandler.SpawnModel(model.id)
      refreshStatuses()
    }
    callSpawnModel()
  }, [])

  const stopModel = useCallback((model: ModelConfig) => {
    async function callTerminateModel(): Promise<void> {
      await ipcHandler.TerminateModel(model.id)
      refreshStatuses()
    }
    callTerminateModel()
  }, [])

  const restartModel = useCallback((model: ModelConfig) => {
    async function callRestartModel(): Promise<void> {
      await ipcHandler.TerminateModel(model.id)
      await ipcHandler.SpawnModel(model.id)
      refreshStatuses()
    }
    callRestartModel()
  }, [])

  const downloadModel = useCallback((/*model: ModelConfig*/) => {
    // TODO: implement
  }, [])

  useEffect(() => {
    refreshConfigs()
    refreshStatuses()
  }, [])

  return {
    configs,
    statuses,
    refreshConfigs,
    refreshStatuses,
    startModel,
    stopModel,
    restartModel,
    downloadModel,
  }
}
