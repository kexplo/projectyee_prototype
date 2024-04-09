import { useState, } from "react"
import {
  MaterialSymbolsInfoRounded as Info,
  MaterialSymbolsContentCopyOutlineRounded as Copy,
  MaterialSymbolsDownloadRounded as Download,
} from "@/components/Icons"

import { Button } from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Conversation } from "@/types/Conversation"
import Markdown from "react-markdown"
// import { useSummaryStore } from "@/stores/summaryStore"

interface SelectModelProps {
  modelIDs: string[]
  defaultValue?: string
  onChange?: (modelID: string) => void
}

const SelectModel = (props: SelectModelProps): JSX.Element => {
  const { modelIDs, onChange, defaultValue } = props

  const handleOnValueChange = (value: string): void => {
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <Select onValueChange={handleOnValueChange} defaultValue={defaultValue}>
      <SelectTrigger className="">
        <SelectValue placeholder="모델을 고르세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {modelIDs.map((modelID) => (
            <SelectItem key={modelID} value={modelID}>{modelID}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

interface SummaryPanelProps {
  conversation: Conversation
  summary?: string
}

const SummaryPanel = (props: SummaryPanelProps): JSX.Element => {
  const { conversation, summary } = props
  const [selectedModel, setSelectedModel] = useState<string | undefined>(conversation.modelIDs.length > 0 ? conversation.modelIDs[0] : undefined)

  const handleOnModelChange = (modelID: string): void => {
    setSelectedModel(modelID)
  }

  return (
    <div className="flex flex-col justify-between h-full bg-[#F8FAFB]">
      <div className="flex flex-col p-3 pt-10 gap-4">
        <h1 className="font-bold text-xl">Summary</h1>
        <div className="bg-[#DAE3FF] rounded-lg p-3 flex flex-row gap-1 text-mainblue">
          <Info className="w-4 h-4 shrink-0 text-mainblue" />
          <p className="text-xs break-keep">
            대화창에서 대화한 내용을 기준으로 생성됩니다. 수정은 할 수 없으며 복사와 다운로드가 가능합니다.
          </p>
        </div>
        <SelectModel modelIDs={conversation.modelIDs} onChange={handleOnModelChange} defaultValue={selectedModel} />
        {selectedModel && (
          <div className="whitespace-pre-line text-sm bg-white rounded-lg border p-4">
            {summary !== undefined ? (
              <Markdown>{summary}</Markdown>
            ): (
              <div className="flex flex-row items-center gap-4 break-keep">
                <Info className="w-5 h-5 shrink-0" />
                <span>새 대화를 진행하면 요약문이 생성됩니다</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-row justify-end gap-2 px-4 py-6">
        <Button variant="ghost" className="p-0 w-6 h-6">
          <Copy className="w-6 h-6" />
        </Button>
        <Button variant="ghost" className="p-0 w-6 h-6">
          <Download className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
export default SummaryPanel

