/*
window.electron.ipcRenderer.on('ava:modelReady', (event, arg: {modelConfig: ModelConfig, port: number}) => {
  console.log("ava:modelReady", arg)
})
*/
import { ModelConfigFile, ModelStatus } from './types/ModelConfig'

export const LoadModelConfigFile = async (): Promise<ModelConfigFile> => {
  window.electron.ipcRenderer.send('ava:readModelConfigFile')
  const ret: ModelConfigFile = await window.electron.ipcRenderer.invoke('ava:readModelConfigFile')
  return ret
}

export const SpawnModel = async (modelID: string): Promise<void> => {
  window.electron.ipcRenderer.send('ava:spawnModel', modelID)
}

export const TerminateModel = async (modelID: string): Promise<void> => {
  window.electron.ipcRenderer.send('ava:terminateModel', modelID)
}

export const GetModelStatuses = async (): Promise<ModelStatus[]> => {
  const ret: ModelStatus[] = await window.electron.ipcRenderer.invoke('ava:getModelStatuses')
  return ret
}
