import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'

import { ModelConfig, ModelConfigFile, ModelStatus } from '../renderer/src/types/ModelConfig'

interface ModelInfo extends ModelConfig {
  port: number
  process: ChildProcess
  isInitialized: boolean
}

function UpsertKeyValue(obj, keyToChange, value): string | void {
  const keyToChangeLower = keyToChange.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value;
      // Done
      return;
    }
  }
  // Insert at end instead
  obj[keyToChange] = value;
}

function findLlamafileExec(): string | undefined {
  const paths = [
    path.join(process.resourcesPath, "llamafile", "llamafile"),
    path.join(__dirname, "..", "..", "llamafile", "llamafile"),
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  console.error("cannot find llamafile executable", paths)
  return undefined
}
const llamafilePath = findLlamafileExec()
console.log("llamafilePath", llamafilePath)

const llamafileProcesses: Map<string, ModelInfo> = new Map()

const beginPort = 8980
function findAvailablePort(): number {
  let candidatePort = beginPort
  // ascending order
  const usedPorts = Array.from(llamafileProcesses.values()).map((modelInfo) => modelInfo.port).sort((a, b) => a-b)
  if (new Set(usedPorts).has(candidatePort)) {
    candidatePort = usedPorts[usedPorts.length - 1] + 1
  }
  return candidatePort
}

async function readModelConfigFile(): Promise<ModelConfigFile | undefined> {
  const modelConfigPath = path.join(os.homedir(), 'Documents', 'ava-model-config.json')
  if (!fs.existsSync(modelConfigPath)) {
    console.log("model config file not found (~/ava-model-config.json)", modelConfigPath)
    return {models: []}
  }

  try {
    const data = await fs.promises.readFile(modelConfigPath, { encoding: "utf-8" })
    return JSON.parse(data) as ModelConfigFile
  } catch (err) {
    console.error(err)
  }
  return
}


function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 1024,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // bypass CORS for localhost
  const filter = { urls: ['*://localhost/*'] };
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    filter, (details, callback) => {
      const { requestHeaders } = details;
      UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*']);
      callback({ requestHeaders });
    },
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived(filter, (details, callback) => {
    const { responseHeaders } = details;
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
    callback({
      responseHeaders,
    });
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  // Install React DevTools in Vite development mode
  if(import.meta.env.DEV) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err))
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('ava:readModelConfigFile', async () => {
    return await readModelConfigFile()
  })

  ipcMain.on("ava:terminateModel", async (_event, modelID: string) => {
    const modelConfigFile = await readModelConfigFile()
    const modelConfig = modelConfigFile?.models.find((model) => model.id === modelID)

    if (!modelConfig) {
      console.error("modelID not found from config", modelID)
      return
    }

    const modelInfo = llamafileProcesses.get(modelConfig.id)
    if (!modelInfo) {
      console.log("model process not running", modelConfig.id)
      return
    }

    // kill process
    console.log(`model process is running, pid: ${modelInfo.process?.pid}, port: ${modelInfo.port}`)
    modelInfo.process?.kill()
    llamafileProcesses.delete(modelConfig.id)
  })

  ipcMain.on('ava:spawnModel', async (event, modelID: string ) => {
    const modelConfigFile = await readModelConfigFile()
    const modelConfig = modelConfigFile?.models.find((model) => model.id === modelID)

    if (!modelConfig) {
      console.error("modelID not found from config", modelID)
      return
    }

    if (!llamafilePath) {
      console.error("cannot launch model, llamafile not found")
      return
    }

    console.log("launching model", modelConfig)

    if (llamafileProcesses.has(modelConfig.id)) {
      const modelInfo = llamafileProcesses.get(modelConfig.id)
      console.log(`model process already running, pid: ${modelInfo?.process.pid}, port: ${modelInfo?.port}`)
      return
    }

    if (modelConfig.type !== "gguf") {
      console.log("it is not gguf model, nothing to do")
    }

    if (!modelConfig.gguf_path) {
      console.error("model gguf_path is not set")
      return
    }

    const port = findAvailablePort()
    const process = spawn(llamafilePath, ["-m", modelConfig.gguf_path, "--server", "--port", port.toString(), "--nobrowser", ...modelConfig.gguf_options || []], { shell: true })
    const modelInfo: ModelInfo = {
      ...modelConfig,
      port: port,
      process: process,
      isInitialized: false,
    }
    // check if process is running
    process.on('exit', (code, signal) => {
      console.log(`model process exit, id: ${modelInfo.id} , pid: ${process.pid}, port: ${port}, code: ${code}, signal: ${signal}`)
      llamafileProcesses.delete(modelConfig.id)
    })

    llamafileProcesses.set(modelConfig.id, modelInfo)

    // await until 'listening' message from stderr
    process.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
      if (data.toString().includes("llama server listening at")) {
        const modelInfo = llamafileProcesses.get(modelConfig.id);
        if (modelInfo) {
          modelInfo.isInitialized = true;
        }
        event.reply("ava:modelReady", {modelConfig: modelConfig, port: port})
      }
    })

    console.log(`launched model process, pid: ${process.pid}, port: ${port}`)
  })

  ipcMain.handle('ava:getModelStatuses', async () => {
    const modelStatuses = Array.from(llamafileProcesses.values()).map((modelInfo) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { process, ...modelInfoWithoutProcess } = modelInfo
      const modelStatus: ModelStatus = {
        ...modelInfoWithoutProcess,
        pid: modelInfo.process.pid,
        port: modelInfo.port,
        isInitialized: modelInfo.isInitialized,
      }
      return modelStatus
    })
    return modelStatuses
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  llamafileProcesses.forEach((modelInfo) => {
    modelInfo.process.kill()
  })
  llamafileProcesses.clear()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
