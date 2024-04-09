import { useState, useEffect, useCallback } from "react"
import OpenAI from "openai";
import { Stream } from "openai/streaming"
import { ChatMessage as Message } from "@/types/ChatMessage"

export type { ChatMessage as Message } from "@/types/ChatMessage"

export interface ChatHelper {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: Error | undefined
  sendMessage: (msg: Message, clearPreviousMessages?: boolean) => void
}

export interface ChatCompletionParams {
  // chat completion params
  model?: string
  frequency_penalty?: number | null;
  logprobs?: boolean | null;
  max_tokens?: number | null;
  n?: number | null;
  presence_penalty?: number | null;
  seed?: number | null;
  stop?: string | null | Array<string>;
  stream?: boolean
  temperature?: number | null;
  top_logprobs?: number | null;
  top_p?: number | null;
}

const initialCompletionParams: ChatCompletionParams = {
  stream: true,
  model: "",
}

export interface UseChatProps {
  endpoint: string
  apiKey?: string
  initialMessages?: Message[]
  chatCompletionParams?: ChatCompletionParams
  onFinish?: (message: Message[]) => void
}

export function useChat(props: UseChatProps): ChatHelper {
  const { endpoint, apiKey = "dummy", initialMessages, chatCompletionParams = initialCompletionParams, onFinish } = props
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [openai, setOpenai] = useState<OpenAI | null>(null)

  useEffect(() => {
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: endpoint,
      dangerouslyAllowBrowser: true,
    })
    setOpenai(client)
  }, [apiKey, endpoint])

  // FIXME: derived state occurs re-rendering
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  const sendMessage = useCallback(async (userMsg: Message, clearPreviousMessages?: boolean) => {
    if (!openai) return

    try {
      setIsLoading(true)

      setMessages((prevMsgs: Message[]): Message[] => {
        if (clearPreviousMessages) {
          return [userMsg]
        }
        return [...prevMsgs, userMsg]
      })

      const msgs = clearPreviousMessages ? [userMsg] : [...messages, userMsg]
      const completion = await openai.chat.completions.create({
        messages: msgs.map((m) => ({ role: m.role, content: m.content })),
        model: chatCompletionParams.model || "",
        frequency_penalty: chatCompletionParams.frequency_penalty,
        logprobs: chatCompletionParams.logprobs,
        max_tokens: chatCompletionParams.max_tokens,
        n: chatCompletionParams.n,
        presence_penalty: chatCompletionParams.presence_penalty,
        seed: chatCompletionParams.seed,
        stop: chatCompletionParams.stop,
        stream: chatCompletionParams.stream,
        temperature: chatCompletionParams.temperature,
        top_logprobs: chatCompletionParams.top_logprobs,
        top_p: chatCompletionParams.top_p,
      })

      if (chatCompletionParams.stream) {
        for await (const part of (completion as Stream<OpenAI.ChatCompletionChunk>)) {
          setMessages((prevMsgs: Message[]): Message[] => {
            // if (prevMsgs.length >= 1 && prevMsgs[prevMsgs.length - 1].id == part.id) {
            if (prevMsgs.length >= 1 && prevMsgs[prevMsgs.length - 1].role == "assistant") {
              const msgRef = prevMsgs[prevMsgs.length - 1]
              msgRef.content += part.choices[0]?.delta?.content || ''

              if (part.choices[0]?.finish_reason && onFinish) {
                onFinish([userMsg, msgRef])
              }

              return ([...prevMsgs.slice(0, prevMsgs.length - 1), msgRef])
            } else {
              const newMsg: Message = {
                id: part.id,
                createdAt: new Date(),  // TODO: parse from part.created
                content: part.choices[0]?.delta?.content || '',
                role: "assistant"
              }

              if (part.choices[0]?.finish_reason && onFinish) {
                onFinish([userMsg, newMsg])
              }

              return ([...prevMsgs, newMsg])
            }
          })
        }
      } else {
        const [firstChoice] = (completion as OpenAI.Chat.ChatCompletion).choices
        setMessages((prevMsgs: Message[]): Message[] => {
          const newMsg: Message = {
            id: (completion as OpenAI.Chat.ChatCompletion).id,
            createdAt: new Date(),  // TODO: parse from completion.created
            content: firstChoice.message.content || "",
            role: "assistant"
          }
          if (onFinish) {
            onFinish([userMsg, newMsg])
          }
          return [...prevMsgs, newMsg]
        })
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [openai, messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (!input) return

    const newMessage: Message = {
      id: Date.now().toString(),  // TODO:
      content: input,
      role: "user"
    }

    sendMessage(newMessage)

    setInput("")
  }

  return {
    input,
    messages,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
  }
}
