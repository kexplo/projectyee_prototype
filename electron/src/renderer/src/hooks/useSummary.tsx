import { useState, useEffect } from "react"
import { UseChatProps, useChat, Message } from "@/hooks/useChat"

interface SummaryHelper {
  makeSummary: (messages: Message[], prompt?: string) => void
  summary: string
}

interface UseSummaryProps {
  useChatProps: UseChatProps
  onFinish?: (summary: string) => void
}

const defaultPrompt = "다음은 사용자와 봇의 대화 기록입니다. 전체 대화를 요약하세요. 첫번째 줄에 대화의 주제를 적어주세요. 두번째 줄부터 요약을 작성해주세요.\n\n대화 기록:\n"

export const useSummary = (props: UseSummaryProps): SummaryHelper => {
  const { useChatProps, onFinish } = props
  const [summary, setSummary] = useState<string>("")
  const { messages, sendMessage } = useChat({
    ...useChatProps,
    onFinish: (messages: Message[]) => {
      if (onFinish) {
        onFinish(messages[1].content)
      }
    }
  });

  const makeSummary = (prevMessages: Message[], prompt?: string): void => {
    const summaryPrompt: string = prompt ? prompt : defaultPrompt

    const content = prevMessages.reduce((acc, message) => {
      acc += `${message.role === "user" ? "사용자" : "봇"}: ${message.content}\n`
      return acc
    }, "") || ""

    sendMessage({
      role: "user",
      content: summaryPrompt + content
    }, true)
  }

  useEffect(() => {
    if (messages.length === 0) {
      setSummary("")
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") {
      console.log("last message is not assistant")
      return
    }

    setSummary(lastMessage.content)

  }, [messages])

  return {
    makeSummary,
    summary,
  }
}
