import { Accessor } from "gnim";

import StateIcon from "./StateIcon";

export interface TimeLabelProps {
  states?: string[],
  state: number,
  className?: string
  imageGroup: string,
  text: Accessor<string> | string;
}

export default function LabelWithStateIcon({ states, state, className, imageGroup, text}: TimeLabelProps) {
  return (
    <box class={"icon-label " + className }>
      <StateIcon states={states} state={state} imageGroup={imageGroup} pixelSize={20} />
      <label label={text} />
    </box>
  )
}