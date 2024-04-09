import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useConversationStore } from "@/stores/conversationStore"
import { useSummaryStore } from "@/stores/summaryStore"

import { useChat, Message, UseChatProps } from "@/hooks/useChat"
import { useSummary } from "@/hooks/useSummary"

import{
  MaterialSymbolsPersonRounded as Person,
  FluentEmojiHighContrastSparkles as Sparkles,
  MaterialSymbolsSend as Send,
  SvgSpinners3DotsBounce as Spinner,
} from "@/components/Icons"

import Markdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { Conversation } from "@/types/Conversation"
import SummaryPanel from "./SummaryPanel"

import { ModelStatus } from "@/types/ModelConfig"
import { useLocalLLM } from "@/hooks/useLocalLLM"

const ConversationChat = (): JSX.Element => {
  const { conversations } = useConversationStore()
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [previousMessages, setPreviousMessages] = useState<Message[]>([])

  const conversation = useMemo(() => {
    return conversations.find((conv) => conv.id === conversationId)
  }, [conversationId, conversations])

  useEffect(() => {
    // if conversationId is not in the list, navigate to the home page
    if (!conversation) {
      navigate("/")
    } else {
      const systemMsg: Message | undefined = (conversation.systemPrompt) ? {
        role: "system",
        content: conversation.systemPrompt
      } : undefined

      const initialMessages: Message[] = conversation.initialMessages?.reduce((acc: Message[], message): Message[] => {
        acc.push({
          role: "user",
          content: message.user.content,
        } as Message)
        acc.push({
          id: "initial-assistant",
          role: "assistant",
          content: message.assistant.content,
        })
        return acc
      }, [] as Message[]) || []
      const prevMsgs: Message[] = conversation.messages || []

      const messages: Message[] = systemMsg ? [systemMsg, ...initialMessages,...prevMsgs] : [...initialMessages, ...prevMsgs]
      setPreviousMessages(messages)
    }
  }, [conversationId])

  if (!conversation) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-center flex flex-row items-center gap-2">
          <Spinner className="w-6 h-6" />
          <span className="text-lg">불러오는 중입니다 </span>
        </div>
      </div>
    )
  }

  return <ConversationChatBody conversation={conversation} previousMessages={previousMessages} />
}

const ConversationChatBody = ({ conversation, previousMessages }: { conversation: Conversation, previousMessages: Message[] }): JSX.Element => {
  const { updateMessages } = useConversationStore()
  const { upsert } = useSummaryStore()
  const [triggerSummary, setTriggerSummary] = useState<boolean>(false)
  const [chatHistory, setChatHistory] = useState<Message[]>([])

  const handleOnFinish = (msg: Message[]): void => {
    console.log("handleOnFinish called")

    if (conversation) {
      const newMessages = (conversation.messages || []).concat(msg)
      updateMessages(conversation.id, newMessages)
    }

    setTriggerSummary(true)
  }

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
    return statuses.find((status) => status.id === conversation.modelIDs[0])
  }, [statuses, conversation])

  const isModelInitializing = useMemo(() => {
    return modelStatus?.isInitialized === false
  }, [modelStatus])

  const chatDivRef = useRef<HTMLDivElement>(null);
  const useChatProps: UseChatProps = useMemo(() => {
    return {
      endpoint: (modelStatus ? `http://localhost:${modelStatus.port}/v1/` : "http://localhost:8080/v1/"),
      // endpoint: "http://localhost:9997/v1/",
      initialMessages: previousMessages,
      chatCompletionParams: {
        stream: true,
        model: modelStatus?.id,
        frequency_penalty: 1.0,  // for gemma
        temperature: 0.0,  // for gemma
      },
    }
  }, [modelStatus, previousMessages])

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading, error } = useChat({
    ...useChatProps,
    onFinish: handleOnFinish,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (!conversation) {
      e.preventDefault()
      return
    }

    if (isModelInitializing) {
      e.preventDefault()
      return
    }

    if (!modelStatus) {
      e.preventDefault()
      const modelConfig = configs.find((config) => config.id === conversation.modelIDs[0])
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

    console.log("messages useEffect called", messages)
  }, [messages])

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatHistory, isLoading])

  const handleOnSummaryFinish = useCallback((summary: string): void => {
    console.log("upsert summaryStore", summary)
    upsert(
      conversation.id,
      conversation.modelIDs[0],  // TODO: specify model to summarize
      summary)
  }, [conversation])

  // TODO: specify model to summarize
  const { summary, makeSummary } = useSummary({
    useChatProps: useChatProps,
    onFinish: handleOnSummaryFinish,
  })

  useEffect(() => {
    if (!triggerSummary) {
      return
    }

    if (!conversation) {
      return
    }
    makeSummary(chatHistory)

    setTriggerSummary(false)
  }, [triggerSummary])

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
    <div className="flex flex-row">
      <div className="h-full flex-1">
        <div className="flex flex-col gap-2 relative top-0 left-0 right-0 z-10 bg-background shadow-sm px-4 py-2 border-b h-48">
          <h2 className="font-bold text-lg">{conversation.title}</h2>
          <div className="rounded-md bg-[#F8FAFB] p-4">
            <h3 className="font-bold text-sm">적용된 모델</h3>
            <div className="flex flex-row gap-2">
              {conversation.modelIDs.map((id, index) => (
                <div key={index} className="flex flex-row items-center">
                  <Sparkles className="w-4 h-4 p-[1px] text-mainblue" />
                  <span className="text-sm">{
                    // TODO: display model name instead of id
                    id
                  }</span>
                </div>
              ))}
            </div>
            <h3 className="font-bold text-sm mt-4">첨부된 파일</h3>
            <p className="text-sm">WIP</p>
          </div>
        </div>
        <div className="flex flex-col">
          {isModelInitializing && (
            <div className="absolute left-1/2 top-1/2 border z-10 flex flex-row gap-2 items-center transform -translate-x-1/2 -translate-y-1/2 py-2 px-4 rounded-lg bg-[#DAE3FF] text-mainblue">
              <Spinner className="w-5 h-5" />
              <span>모델 구동 중</span>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-12rem-4rem)] px-8 pb-2 pt-2">
            <div ref={chatDivRef} className="flex flex-col bg-white space-y-4">
              {chatHistory.filter((msg) => ["user", "assistant"].includes(msg.role)).map((message, index) => (
                <div key={index} className="flex-1">
                  {message.role === "user" ? (
                  <div className="flex flex-row space-x-2 mb-4">
                    <span className="border rounded-full w-6 h-6 bg-gray-100">
                      <Person className="w-full h-full" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold mb-2">You</span>
                      <div className="text-sm whitespace-pre-line"><Markdown>{message.content}</Markdown></div>
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
                        <span className="font-bold text-sm rounded-lg border p-2 ml-2 text-mainblue border-[#F2F2F2] bg-[#F8FAFB]">{conversation.modelIDs[0]}</span>
                      </div>
                      <div className="text-sm whitespace-pre-line"><Markdown>{message.content}</Markdown></div>
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
                <Button variant="ghost" type="submit" className="relative block left-[calc(100%-50px)] bottom-[68px] p-0 h-8 w-8 pl-1" disabled={isLoading}>
                  <Send className="h-6 w-6 text-mainblue" />
                </Button>
              </form>
          </div>
        </div>
      </div>
      <div className="border-l w-[300px]">
        <SummaryPanel conversation={conversation} summary={summary} />
      </div>
    </div>
  )
}
export default ConversationChat
