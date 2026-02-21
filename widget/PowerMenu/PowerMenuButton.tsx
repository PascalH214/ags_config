import { Accessor } from "gnim"
import Icon from "../common/Icon"

export interface PowerMenuButtonProps {
  imageName: Accessor<string> | string
  focus: Accessor<boolean> | boolean
}

export default function PowerMenuButton({ imageName, focus }: PowerMenuButtonProps) {
  const buttonClass = typeof focus === "function"
    ? focus((isFocused) => isFocused ? "power-menu-button focus" : "power-menu-button")
    : focus ? "power-menu-button focus" : "power-menu-button"

  return (
    <box class={buttonClass}>
      <Icon
        imageName={imageName}
        pixelSize={79}
        widthRequest={120}
        heightRequest={120}
      />
    </box>
  )
}