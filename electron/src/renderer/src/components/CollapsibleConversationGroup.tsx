import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  MaterialSymbolsChevronRightRounded as ChevronRight,
  MaterialSymbolsChevronDownRounded as ChevronDown,
  IonEllipsisHorizontal as Ellipsis,
} from "@/components/Icons"

import { ConversationGroup } from "@/types/Conversation"

// TODO: read model names from the store
const modelNames: Map<string, string> = new Map<string, string>([
  ["llama-2-7b-q4", "Llama 2 7B Q4"],
  ["gpt-3.5-turbo", "GPT-3.5 Turbo"],
  ["gemini-1.0-pro", "Gemini 1.0 Pro"],
  ["gemma-1.1-2b-q4", "Gemma 1.1 2B Q4"],
  ["codellama-7b-q4", "CodeLlama 7B Q4"],
])

export default function CollapsibleConversationGroup({group, isCollapsed = true} : {group: ConversationGroup, isCollapsed: boolean}): JSX.Element {
  const [isOpen, setIsOpen] = useState(!isCollapsed)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="px-4 font-bold">{group.displayName}</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="my-2">
          {group.conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/conversations/${conversation.id}`}
              className="py-2 flex items-center justify-between hover:bg-[#F2F2F2]"
            >
              <div className="px-4 flex flex-col w-2/3">
                <span className="text-xs truncate">{conversation.modelIDs.map((id) => modelNames.get(id) ?? id).join(", ")}</span>
                <span>{conversation.title}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs"><Ellipsis className="w-5 h-5" /></Button>
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
