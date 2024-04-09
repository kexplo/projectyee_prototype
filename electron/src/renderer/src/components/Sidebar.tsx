import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Conversation, ConversationGroup } from "@/types/Conversation"
import { useConversationStore } from "@/stores/conversationStore"
import CollapsibleConversationGroup from "@/components/CollapsibleConversationGroup"
import {
  MaterialSymbolsAdd as Add,
} from "@/components/Icons"

export default function Sidebar(): JSX.Element {
  const [conversationGroups, setConversationGroups] = useState<ConversationGroup[]>([])
  const { conversations } = useConversationStore()

  useEffect(() =>{
    const groups: ConversationGroup[] = conversations
      .reduce(
        (acc: ConversationGroup[], conversation: Conversation) => {
          const updatedAt = conversation.updatedAt
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const yesterday = new Date()
          yesterday.setDate(today.getDate() - 1)
          const previousTwoDays = new Date()
          previousTwoDays.setDate(today.getDate() - 2)
          const previousSevenDays = new Date()
          previousSevenDays.setDate(today.getDate() - 7)
          const previousThirtyDays = new Date()
          previousThirtyDays.setDate(today.getDate() - 30)

          if (updatedAt >= yesterday) {
            acc[0].conversations.push(conversation)
          } else if (updatedAt >= previousTwoDays) {
            acc[1].conversations.push(conversation)
          } else if (updatedAt >= previousSevenDays) {
            acc[2].conversations.push(conversation)
          } else if (updatedAt >= previousThirtyDays) {
            acc[3].conversations.push(conversation)
          } else {
            acc[4].conversations.push(conversation)
          }
          return acc
        },
        [
          { displayName: "Today", conversations: [] },
          { displayName: "Yesterday", conversations: [] },
          { displayName: "Previous 7 days", conversations: [] },
          { displayName: "Previous 30 days", conversations: [] },
          { displayName: "Older", conversations: [] },
        ]
      )
      .map((cg) => ({
        ...cg,
        conversations: cg.conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      }))
    setConversationGroups(groups)
  }, [conversations])

  return (
    <aside className="w-[300px] bg-[#F8FAFB] border-r">
      <div className="space-y-2 h-full flex flex-col justify-between">
        <div>
          <div className="m-4">
            <Button className="justify-between w-full" asChild>
              <Link to="/new-conversation">
                새 작업 만들기
                <Add className="w-6 h-6" />
              </Link>
            </Button>
          </div>
        {conversationGroups.map((group, i) => (
          <CollapsibleConversationGroup key={group.displayName} group={group} isCollapsed={i>2} />
        ))}
        </div>
        <div className="p-4">
          <SettingDialog />
        </div>
      </div>
    </aside>
  )
}
