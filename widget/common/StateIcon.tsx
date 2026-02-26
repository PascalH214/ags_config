import { createComputed, type Accessor } from "gnim"
import Icon from "../common/Icon"

type MaybeAccessor<T> = T | Accessor<T>

interface StateIconProps extends Omit<JSX.IntrinsicElements["image"], "file"> {
  states?: string[]
  state: Accessor<number> | number
  imageGroup: MaybeAccessor<string>
  fileEnding?: string
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
      ? state((value) => `${states[value]}`)
      : `${states[state]}`

  const imageSubFolder =
    typeof imageGroup === "function"
      ? imageGroup
      : createComputed(() => imageGroup)

  return (
    <Icon
      {...props}
      imageSubFolder={imageSubFolder}
      imageName={imageName}
      fileEnding={fileEnding}
    />
  )
}