import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { Accessor, Setter, createComputed, createEffect, createState } from "gnim"
import Gtk from "gi://Gtk"
import PowerMenuButton from "./PowerMenuButton"

const buttons = {
  "shutdown": "s",
  "reboot": "r",
  "lock": "c",
  "logout": "o",
  "pause": "p",
  "stop": "t"
}

const buttonTypes = Object.keys(buttons) as Array<keyof typeof buttons>
const buttonKeyVals = buttonTypes.map((buttonType) => Gdk.keyval_from_name(buttons[buttonType]))

export default function PowerMenu(gdkmonitor: Gdk.Monitor, powerMenuOpen: Accessor<boolean>, setPowerMenuOpen: Setter<boolean>) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

  let win: Astal.Window;
  let backdrop: Gtk.CenterBox;
  let dialog: Gtk.Box;

  createEffect(() => {
    if (!win) return
    const open = powerMenuOpen()
    win.visible = open;

    if (open) {
      win.present()
    }
  });

  const setupBackdrop = (ref: Gtk.CenterBox) => {
    backdrop = ref
    const click = Gtk.GestureClick.new()

    click.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)

    click.connect("released", (_gesture, _presses, x, y) => {
      if (!dialog) return

      const picked = win.pick(x, y, Gtk.PickFlags.DEFAULT)
      const inside = picked === dialog || (!!picked && picked.is_ancestor(dialog))

      if (!inside) {
        setPowerMenuOpen(false)
      }
    })

    backdrop.add_controller(click)
  }

  const [focusIndex, setFocusIndex] = createState(0);

  const setupWindow = (ref: Astal.Window) => {
    win = ref

    const keyController = Gtk.EventControllerKey.new()
    keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    keyController.connect("key-pressed", (_controller, keyval) => {
      const length = buttonTypes.length

      const index = buttonKeyVals.indexOf(Gdk.keyval_from_name(String.fromCharCode(keyval).toLowerCase()));
      if (index !== -1) {
        setFocusIndex(index);
        return true;
      }

      switch (keyval) {
        case Gdk.KEY_Escape:
          setPowerMenuOpen(false);
          setFocusIndex(0);
          break;
        case Gdk.KEY_Right:
        case Gdk.KEY_L:
        case Gdk.KEY_l:
          setFocusIndex((focusIndex() + 1) % length);
          break;
        case Gdk.KEY_Left:
        case Gdk.KEY_H:
        case Gdk.KEY_h:
          setFocusIndex((focusIndex() + length - 1) %  length);
          break;
        case Gdk.KEY_Return:
        case Gdk.KEY_KP_Enter:
          console.log(`Activated button index: ${focusIndex()}`);
          break;
        default:
          break;
      }

      return true
    })

    ref.add_controller(keyController)
  }

  return (
    <window
      $={setupWindow}
      name="power-menu"
      class="PowerMenu"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      application={app}
      keymode={Astal.Keymode.EXCLUSIVE}
    >
      <centerbox
        $={setupBackdrop}
        class="power-menu-backdrop"
        hexpand
        vexpand
        halign={Gtk.Align.FILL}
        valign={Gtk.Align.FILL}
      >
        <box
          $={(ref) => (dialog = ref)}
          class="dialog"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          $type="center"
        >
          {buttonTypes.map((buttonType, index) => (
            <PowerMenuButton
              imageName={createComputed(() => `${buttonType}/${focusIndex() === index ? "base" : "lavendar"}`)}
              focus={createComputed(() => focusIndex() === index)}
              label={buttonType.replace(buttons[buttonType], `[${buttons[buttonType]}]`)}
            />
          ))}
        </box>
      </centerbox>
    </window>
  )
}
