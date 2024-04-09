import { useState, useEffect } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import{
  MaterialSymbolsAdd as Add,
  MaterialSymbolsDeleteOutlineRounded as Delete,
  MaterialSymbolsPersonRounded as Person,
  FluentEmojiHighContrastSparkles as Sparkles,
} from "@/components/Icons"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  UserChatMessage,
  AssistantChatMessage,
  ChatMessagePair,
} from "@/types/ChatMessage"


interface AddHistoryDialogProps {
  addHistory?: (user: UserChatMessage, assistant: AssistantChatMessage) => void
}

const formSchema = z.object({
  userInput: z.string({
    required_error: "사용자 입력 예시를 작성하세요",

  }).min(1, {message: "비어있을 수 없습니다"}),
  assistantInput: z.string({
    required_error: "AI 응답 예시를 작성하세요",
  }).min(1, {message: "비어있을 수 없습니다"}),
})

function AddHistoryDialog(props: AddHistoryDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const { addHistory } = props

  const onSubmit = (data: z.infer<typeof formSchema>): void => {
    const { userInput, assistantInput } = data
    if (addHistory) {
      addHistory({ role: "user", content: userInput }, { role: "assistant", content: assistantInput })
      form.resetField("userInput")
      form.resetField("assistantInput")
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Add className="w-6 h-6 mr-2" /> 대화 예시 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대화 예시 추가</DialogTitle>
          <DialogDescription>사용자 입력 예시와 예상되는 AI의 응답 예시를 추가하세요</DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col bg-white">
            <FormField
              control={form.control}
              name="userInput"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row p-2 space-x-2">
                    <span className="border rounded-full w-6 h-6 bg-gray-100">
                      <Person className="w-full h-full" />
                    </span>
                    <div className="flex flex-col grow">
                    <FormLabel className="font-bold text-md">You</FormLabel>
                    <FormControl>
                      <Textarea className="text-sm" placeholder="사용자 입력 예시를 작성하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assistantInput"
              render={({ field }) => (
                <FormItem>
                <div className="flex flex-row p-2 space-x-2">
                  <span className="border rounded-full min-w-6 min-h-6 w-6 h-6 bg-mainblue text-white">
                    <Sparkles className="w-full h-full p-1" />
                  </span>
                  <div className="flex flex-col grow">
                    <FormLabel className="font-bold text-md">AVA</FormLabel>
                    <FormControl>
                      <Textarea className="text-sm" placeholder="AI 응답 예시를 작성하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </div>
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit">추가</Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface ChatHistoryBuilderProps {
  value?: ChatMessagePair[]
  onChange?: (value: ChatMessagePair[]) => void
}

const ChatHistoryBuilder = React.forwardRef<HTMLDivElement, ChatHistoryBuilderProps>((props, ref) => {
  const { value = [], onChange: onChangeCallback } = props
  const [chatHistory, setChatHistory] = useState<ChatMessagePair[]>(value)

  useEffect(() => {
    if (onChangeCallback) {
      onChangeCallback(chatHistory)
    }
  }, [onChangeCallback, chatHistory])

  const handleDeleteChat = (index: number): void => {
    setChatHistory((prevChatHistory) => {
      const newChatHistory = [...prevChatHistory]
      newChatHistory.splice(index, 1)
      return newChatHistory
    })
  }

  const handleAddHistory = (user: UserChatMessage, assistant: AssistantChatMessage): void => {
    setChatHistory((prevChatHistory) => {
      const newPair: ChatMessagePair = {
        user: user,
        assistant: assistant,
      }
      return [...prevChatHistory, newPair]
    })
  }

  return (
    <div className="rounded-md" ref={ref}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col bg-white">
          {chatHistory.map(({ user, assistant }, index) => (
            <div key={index} className="flex flex-row p-2">
              <div className="flex-1">
                <div className="flex flex-row space-x-2 mb-2">
                  <span className="border rounded-full w-6 h-6 bg-gray-100">
                    <Person className="w-full h-full" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold">You</span>
                    <p className="text-sm">{user.content}</p>
                  </div>
                </div>

                <div className="flex flex-row space-x-2">
                  <span className="border rounded-full min-w-6 min-h-6 w-6 h-6 bg-mainblue text-white">
                    <Sparkles className="w-full h-full p-1" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold">AVA</span>
                    <p className="text-sm">{assistant.content}</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="my-auto w-6 h-6 p-0" onClick={() => {handleDeleteChat(index);}}>
                <Delete className="w-full h-full" />
              </Button>
            </div>
          ))}

        </div>
        <AddHistoryDialog addHistory={handleAddHistory} />
      </div>
    </div>
  )
})
ChatHistoryBuilder.displayName = "ChatHistoryBuilder"

export default ChatHistoryBuilder
