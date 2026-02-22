import { Accessor, createState } from "gnim"
import Gtk from "gi://Gtk"
import Icon from "../common/Icon"
import sleep from "../../sleep"

export interface PowerMenuButtonProps {
  imageName: Accessor<string> | string
  focus: Accessor<boolean> | boolean
  label: string
  onClick: (firstClick: boolean, secondClick: boolean) => void
}

export default function PowerMenuButton({ imageName, focus, label, onClick }: PowerMenuButtonProps) {
  const buttonClass = typeof focus === "function"
    ? focus((isFocused) => isFocused ? "power-menu-button focus" : "power-menu-button")
    : focus ? "power-menu-button focus" : "power-menu-button"

  const setupBox = (ref: Gtk.Box) => {
    const [firstClick, setFirstClick] = createState(false);
    const [secondClick, setSecondClick] = createState(false);

    const click = Gtk.GestureClick.new()
    click.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    click.connect("released", async () => {
      if (!firstClick()) {
        setFirstClick(true)
        onClick(true, false)
        await sleep(200);
        if (secondClick()) onClick(true, true);
        setFirstClick(false)
        setSecondClick(false)
      } else {
        setSecondClick(true)
      }

      return false
    });

    ref.add_controller(click)
  }

  return (
    <box 
      $={setupBox}
      class={buttonClass}
      orientation={Gtk.Orientation.VERTICAL}
    >
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