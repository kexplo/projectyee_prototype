import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  MaterialSymbolsChevronLeftRounded as ChevronLeft,
  MaterialSymbolsChevronRightRounded as ChevronRight,
  MaterialSymbolsBrowserUpdatedRounded as BrowserUpdated,
 } from "@/components/Icons"

import LLMModelSelector from "./LLMModelSelector"
import ChatHistoryBuilder from "./ChatHistoryBuilder"
import ConversationStartersBuilder from "./ConversationStartersBuilder"

import { LLMModel } from "@/types/LLMModel"

import {
  UserChatMessage,
  AssistantChatMessage,
  ChatMessagePair,
} from "@/types/ChatMessage"

import { Conversation } from "@/types/Conversation"

const userChatMessageSchema: z.ZodType<UserChatMessage> = z.object({
  role: z.literal("user"),
  content: z.string(),
})

const assistantChatMessageSchema: z.ZodType<AssistantChatMessage> = z.object({
  role: z.literal("assistant"),
  content: z.string(),
})

const chatMessagePairSchema: z.ZodType<ChatMessagePair> = z.object({
  user: userChatMessageSchema,
  assistant: assistantChatMessageSchema,
})

const newConversationFormSchema: z.ZodType<Conversation> = z.object({
  id: z.string(),
  updatedAt: z.date(),
  modelIDs: z.array(z.string(), {
    required_error: "AI 모델을 최소 1개 이상 선택해주세요",
  }).max(3).min(1, {
    message: "AI 모델을 최소 1개 이상 선택해주세요",
  }),
  title: z.string({
    required_error: "제목을 입력해주세요",
  }).min(1, { message: "제목을 입력해주세요" }),
  description: z.string().default(""),
  nuance: z.string().default(""),  // XXX: is it necessary? it maybe duplicated with the systemPrompt
  systemPrompt: z.string().default(""),
  initialMessages: z.array(chatMessagePairSchema).default([]),
  conversationStarters: z.array(z.string()).default([]),
})

interface NewConversationProps {
  llmModels: LLMModel[]
  onSave?: (conversation: Conversation) => void
}

export default function NewConversationPanel(props: NewConversationProps): JSX.Element {
  const { llmModels, onSave: onSaveCallback } = props
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof newConversationFormSchema>>({
    resolver: zodResolver(newConversationFormSchema),
    defaultValues: {
      id: "dummy",
      updatedAt: new Date(),
    }
  })

  const onSubmit = (data: z.infer<typeof newConversationFormSchema>): void => {
    if (onSaveCallback) {
      onSaveCallback(data)
    }
    navigate("/")
  }

  return (
    <ScrollArea className="h-screen">
    <aside className="w-[600px] bg-[#F8FAFB] border-r p-6 h-screen">
      <div className="space-y-2 h-full flex flex-col justify-between">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col">
              <div className="flex flex-row justify-between mb-10">
                <div>
                  <h2 className="font-bold text-lg">새 대화 만들기</h2>
                  <span className="text-sm">AI 모델을 최대 3개까지 설정할 수 있습니다.</span>
                </div>
                <Button variant="outline" size="sm"><BrowserUpdated className="w-5 h-5 mr-2" /> 대화 불러오기</Button>
              </div>
                <FormField
                  control={form.control}
                  name="modelIDs"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LLMModelSelector models={llmModels} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <Separator className="my-4" />
              <div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Textarea placeholder="대화를 식별할 제목을 입력해주세요." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea placeholder="대화의 설명을 입력해주세요." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nuance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>말투</FormLabel>
                      <FormControl>
                        <Textarea placeholder="말투를 입력해주세요." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시스템 프롬프트</FormLabel>
                      <FormControl>
                        <Textarea placeholder="시스템 프롬프트를 입력해주세요." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>대화 예시</Label>
                  <FormField
                    control={form.control}
                    name="initialMessages"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ChatHistoryBuilder {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>질문 예시</Label>
                  <FormField
                    control={form.control}
                    name="conversationStarters"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ConversationStartersBuilder {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-between p-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/"><ChevronLeft className="w-5 h-5"/> 이전으로</Link>
              </Button>
              <Button size="sm" type="submit">시작하기 <ChevronRight className="w-5 h-5" /></Button>
            </div>
          </form>
        </Form>
      </div>
    </aside>
    </ScrollArea>
  )
}
