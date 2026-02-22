import { Accessor } from "gnim"
import Gtk from "gi://Gtk"
import Icon from "../common/Icon"

export interface PowerMenuButtonProps {
  imageName: Accessor<string> | string
  focus: Accessor<boolean> | boolean
  label: string
}

export default function PowerMenuButton({ imageName, focus, label }: PowerMenuButtonProps) {
  const buttonClass = typeof focus === "function"
    ? focus((isFocused) => isFocused ? "power-menu-button focus" : "power-menu-button")
    : focus ? "power-menu-button focus" : "power-menu-button"

  return (
    <box class={buttonClass} orientation={Gtk.Orientation.VERTICAL}>
      <Icon
        imageName={imageName}
        pixelSize={79}
        widthRequest={120}
        heightRequest={120}
      />
      <label halign={Gtk.Align.CENTER} label={label} />
    </box>
  )
}