import { useEffect, useRef } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "./ui/button"

import { AntDesignSettingOutlined as Settings } from "./Icons"
import { useLocalLLM } from "@/hooks/useLocalLLM"
import { ModelConfig, ModelStatus } from "@/types/ModelConfig"

interface LLMListerProps {
  configs: ModelConfig[]
  statuses: ModelStatus[]
  onClickStart?: (model: ModelConfig) => void
  onClickStop?: (model: ModelConfig) => void
}
const LLMLister = (props: LLMListerProps): JSX.Element => {
  const { configs, statuses, onClickStart, onClickStop } = props

  const isRunning = (modelID: string): boolean => {
    const status = statuses.find((status) => status.id === modelID)
    return (status !== undefined)
  }

  const isInitialized = (modelID: string): boolean => {
    const status = statuses.find((status) => status.id === modelID)
    return (status?.isInitialized === true)
  }

  const handleOnClickStart = (model: ModelConfig): void => {
    if (onClickStart) {
      onClickStart(model)
    }
  }
  const handleOnClickStop = (model: ModelConfig): void => {
    if (onClickStop) {
      onClickStop(model)
    }
  }

  return (
    <div>
      {configs.map((config, index) => (
        <div key={index} className="items-center justify-between w-full flex flex-row border border-mainblue rounded-xl p-4 m-2">
          <span>{config.name}</span>
          <div className="flex flex-row gap-2 items-center">
            <span>{config.gguf_required_memory_gb || "-"} GB</span>
            <div className="flex flex-row gap-2 items-center">
              {config.type === "gguf" ? (
                isRunning(config.id) ? (
                  <>
                    {isInitialized(config.id) ? (
                      <span className="px-2 py-1 rounded-lg text-xs text-[#4dc465] bg-[#d1e7dd]">
                        실행 중
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-xs text-[#b59824] bg-[#fff3cd]">
                        초기화 중
                      </span>
                    )}
                    <Button onClick={() => { handleOnClickStop(config); }}>종료하기</Button>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-1 rounded-lg text-xs text-mainblue bg-[#dae3ff]">
                      사용 가능
                    </span>
                    <Button onClick={() => { handleOnClickStart(config); }}>실행하기</Button>
                  </>
                )
              ) : (
                <>
                  <span className="px-2 py-1 rounded-lg text-xs text-red-500 bg-red-200">
                   사용 불가
                  </span>
                  <Button disabled>키 입력 필요</Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const SettingDialog = (): JSX.Element => {
  const { configs, statuses, refreshConfigs, refreshStatuses, startModel, stopModel } = useLocalLLM()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleOnClickRefresh = (): void => {
    refreshConfigs()
    refreshStatuses()
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshStatuses()
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-6 h-6 p-0">
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
          <DialogDescription>
            모델을 관리합니다.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleOnClickRefresh}>새로고침</Button>
        <LLMLister configs={configs} statuses={statuses} onClickStart={startModel} onClickStop={stopModel} />
        <DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SettingDialog;
