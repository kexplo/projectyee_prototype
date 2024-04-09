import { useState, useRef, useEffect, useMemo } from "react"

import { useChat, UseChatProps, Message } from "@/hooks/useChat"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { LLMModel } from "@/types/LLMModel"
import { ModelStatus } from "@/types/ModelConfig"
import { useLocalLLM } from "@/hooks/useLocalLLM"

import{
  MaterialSymbolsPersonRounded as Person,
  FluentEmojiHighContrastSparkles as Sparkles,
  MaterialSymbolsSend as Send,
  SvgSpinners3DotsBounce as Spinner,
} from "@/components/Icons"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import Markdown from "react-markdown"

interface LLMModelTesterProps {
  testableModels: LLMModel[]
}

export default function LLMModelTester(props: LLMModelTesterProps): JSX.Element {
  const { testableModels } = props
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null)
  const [chatHistory, setChatHistory] = useState<Message[]>([])

  const { configs, statuses, refreshConfigs, refreshStatuses, startModel } = useLocalLLM()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshConfigs()
      refreshStatuses()
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const modelStatus: ModelStatus | undefined = useMemo(() => {
    return statuses.find((status) => status.id === selectedModel?.id)
  }, [statuses, selectedModel])

  const isModelInitializing = useMemo(() => {
    return modelStatus?.isInitialized === false
  }, [modelStatus])

  const chatDivRef = useRef<HTMLDivElement>(null);
  const useChatProps: UseChatProps = useMemo(() => {
    return {
      endpoint: (modelStatus ? `http://localhost:${modelStatus.port}/v1/` : "http://localhost:8080/v1/"),
      // endpoint: "http://localhost:9997/v1/",
      chatCompletionParams: {
        stream: true,
        model: modelStatus?.id,
        frequency_penalty: 1.0,  // for gemma
        temperature: 0.0,  // for gemma
      },
    }
  }, [modelStatus])

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading, error } = useChat({
    ...useChatProps,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (!selectedModel) {
      e.preventDefault()
      return
    }

    if (isModelInitializing) {
      e.preventDefault()
      return
    }

    if (!modelStatus) {
      e.preventDefault()
      const modelConfig = configs.find((config) => config.id === selectedModel.id)
      if (modelConfig) {
        startModel(modelConfig)
      }
      return
    }

    handleChatSubmit(e)
  }

  useEffect(() => {
    // TOOD: display error message
    if (error) {
      console.log(error)
    }
  }, [error])

  useEffect(() => {
    setChatHistory(messages)
  }, [messages])

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatHistory, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && e.shiftKey === false) {
          e.preventDefault();
          if(isLoading) {
              return;
          }
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
  }

  return (
    <div className="h-full">
      <div className="flex flex-row items-center gap-2 fixed top-0 z-10 bg-background w-full shadow-sm px-4 py-2 border-b h-16">
        <h2 className="font-bold text-lg">모델 테스트</h2>
        <Select onValueChange={(modelId: string) => {
          const selectedModel = testableModels.filter((model) => model.id === modelId)
          if (selectedModel.length === 1) {
            setSelectedModel(selectedModel[0])
          } else {
            setSelectedModel(null)
          }
        }}>
          <SelectTrigger className="w-[248px]">
            <SelectValue placeholder="테스트할 모델을 고르세요" />
          </SelectTrigger>
          <SelectContent>
            {testableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedModel === null ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">테스트할 모델을 고르세요</p>
          </div>
        </div>
      ) : (
          <div className="flex flex-col">
            {isModelInitializing && (
              <div className="absolute left-1/2 top-1/2 border z-10 flex flex-row gap-2 items-center transform -translate-x-1/2 -translate-y-1/2 py-2 px-4 rounded-lg bg-[#DAE3FF] text-mainblue">
                <Spinner className="w-5 h-5" />
                <span>모델 구동 중</span>
              </div>
            )}
            <ScrollArea className="h-[calc(100vh-4rem)] px-8 pt-16 pb-2">
              <div ref={chatDivRef} className="flex flex-col bg-white space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className="flex-1">
                    {message.role === "user" ? (
                    <div className="flex flex-row space-x-2 mb-4">
                      <span className="border rounded-full w-6 h-6 bg-gray-100">
                        <Person className="w-full h-full" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold mb-2">You</span>
                        <p className="text-sm whitespace-pre-line"><Markdown>{message.content}</Markdown></p>
                      </div>
                    </div>
                    ) : (
                    <div className="flex flex-row space-x-2">
                      <span className="border rounded-full min-w-6 min-h-6 w-6 h-6 bg-mainblue text-white">
                        <Sparkles className="w-full h-full p-1" />
                      </span>
                      <div className="flex flex-col">
                        <div className="mb-2">
                          <span className="font-bold">AVA</span>
                          <span className="font-bold text-sm rounded-lg border p-2 ml-2 text-mainblue border-[#F2F2F2] bg-[#F8FAFB]">{selectedModel.name}</span>
                        </div>
                        <p className="text-sm whitespace-pre-line"><Markdown>{message.content}</Markdown></p>
                      </div>
                    </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="pl-8">
                    <p className="text-sm"><Spinner className="w-6 h-6" /></p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="h-16 px-8">
                <form className="p-0 m-0 h-16" onSubmit={handleSubmit}>
                  <Textarea name="usermsg" value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="메시지를 작성하세요" className="rounded-full px-10 py-4 min-h-4 max-h-14 resize-none bg-background" />
                  <Sparkles className="relative left-2 bottom-10 p-[2px] h-6 w-6 text-mainblue" />
                  <Button variant="ghost" type="submit" className="absolute right-12 bottom-5 p-0 h-8 w-8" disabled={isLoading}>
                    <Send className="h-6 w-6 text-mainblue" />
                  </Button>
                </form>
            </div>
          </div>
      )}
    </div>
  )
}
