import { useState } from "react"
import * as React from "react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"

import { LLMModel } from "@/types/LLMModel"

interface LLMModelSelectorProps {
  maxSelect?: number
  models: LLMModel[]
  onChange?: (selected: string[]) => void
  value?: string[]
}

const selectableModelStates = ["installed", "available", "APIKeyInstalled"]

export const LLMModelSelector = React.forwardRef<HTMLDivElement, LLMModelSelectorProps>((props, ref) => {
  const { maxSelect = 3, onChange: onChangeCallback, value = [] } = props
  const [disableNewToggle, setDisableNewToggle] = useState(false)
  const [selected, setSelected] = useState<string[]>(value)

  return (
    <div className="flex flex-col" ref={ref}>
      <span>{selected.length} / {maxSelect}</span>
      <ToggleGroup type="multiple" className="flex flex-col" onValueChange={(v) => {
        setDisableNewToggle(v.length == 3);
        setSelected(v);
        onChangeCallback?.(v);
      }}>
        {props.models.map((model) => (
          <ToggleGroupItem
            className="w-full justify-between"
            key={model.id}
            value={model.id}
            aria-label={`Toggle ${model.name}`}
            disabled={(disableNewToggle && !selected.includes(model.id)) || !selectableModelStates.includes(model.state)}
          >
            <span>{model.name}</span>
            <div>
              <span className="mr-2">{model.requiredMemoryGB} GB</span>
              <Button size="sm" className="z-50" onClick={(e) => { e.stopPropagation(); }}>{model.state}</Button>
            </div>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
})
LLMModelSelector.displayName = "LLMModelSelector"

export default LLMModelSelector
