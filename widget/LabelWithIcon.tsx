import { Accessor } from "gnim";

import Icon from "./Icon";

export interface TimeLabelProps {
  className?: string
  imageName: string,
  label: Accessor<string> | string;
}

export default function LabelWithIcon({ className, imageName, label }: TimeLabelProps) {
  return (
    <box class={"icon-label " + className }>
      <Icon imageName={imageName} pixelSize={20} />
      <label label={label} />
    </box>
  )
}