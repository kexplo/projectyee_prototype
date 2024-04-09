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

const formSchema = z.object({
  starter: z.string({
    required_error: "질문 예시를 작성해주세요",
  }).min(1, { message: "비어있을 수 없습니다" }),
})

interface AddStarterDialogProps {
  addStarter?: (starter: string) => void
}

function AddStarterDialog(props: AddStarterDialogProps): JSX.Element {
  const { addStarter } = props
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const [open, setOpen] = useState<boolean>(false)

  const onSubmit = (data: z.infer<typeof formSchema>): void => {
    if (addStarter) {
      addStarter(data.starter)
      form.resetField("starter")
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Add className="w-6 h-6 mr-2" /> 질문 예시 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>질문 예시 추가</DialogTitle>
          <DialogDescription>AI와 대화를 시작할 질문 예시를 추가하세요</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="starter"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col bg-white">
                    <div className="flex flex-row p-2 space-x-2">
                      <span className="border rounded-full w-6 h-6 bg-gray-100">
                        <Person className="w-full h-full" />
                      </span>
                      <div className="flex flex-col grow">
                        <FormLabel className="font-bold text-md">You</FormLabel>
                        <FormControl>
                          <Textarea className="text-sm" placeholder="사용자 질문 예시를 작성하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">추가</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface ConversationStartersBuilderProps {
  value?: string[]
  onChange?: (starters: string[]) => void
}

const ConversationStartersBuilder = React.forwardRef<HTMLDivElement, ConversationStartersBuilderProps>((props, ref) => {
  const { value = [], onChange: onChangeCallback } = props
  const [starters, setStarters] = useState<string[]>(value)

  useEffect(() => {
    if (onChangeCallback) {
      onChangeCallback(starters)
    }
  }, [starters, onChangeCallback])

  const handleAddStarter = (starter: string): void => {
    setStarters((prevStarters) => [...prevStarters, starter])
  }

  const handleDeleteStarter = (index: number): void => {
    setStarters((prevStarters) => prevStarters.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-md" ref={ref}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col bg-white">
          {starters.map((starter, index) => (
            <div key={index} className="flex flex-row p-2">
              <div className="flex-1">
                <div className="flex flex-row space-x-2 mb-2">
                  <span className="border rounded-full w-6 h-6 bg-gray-100">
                    <Person className="w-full h-full" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold">You</span>
                    <p className="text-sm">{starter}</p>
                  </div>
                </div>

              </div>
              <Button variant="ghost" className="my-auto w-6 h-6 p-0" onClick={() => {handleDeleteStarter(index)}}>
                <Delete className="w-full h-full" />
              </Button>
            </div>
          ))}

        </div>
        <AddStarterDialog addStarter={handleAddStarter} />
      </div>
    </div>
  )
})
ConversationStartersBuilder.displayName = "ConversationStartersBuilder"
export default ConversationStartersBuilder
