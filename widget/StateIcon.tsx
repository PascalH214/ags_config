import type { Accessor } from "gnim"
import Icon from "./Icon"

interface StateIconProps extends Omit<JSX.IntrinsicElements["image"], "file"> {
  states?: string[],
  state: Accessor<number> | number,
  imageGroup: string,
  fileEnding?: string,
  pixelSize?: number
}

export default function StateIcon({
  states = ["normal", "warning", "critical"],
  state,
  imageGroup,
  fileEnding = ".svg",
  ...props
}: StateIconProps) {
  const imageName =
    typeof state === "function"
      ? state((value) => `${imageGroup}-${states[value]}`)
      : `${imageGroup}-${states[state]}`

  return (
    <Icon
      {...props}
      imageSubFolder={imageGroup}
      imageName={imageName}
      fileEnding={fileEnding}
    />
  )
}