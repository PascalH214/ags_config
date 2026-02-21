import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { Accessor, Setter, createComputed, createEffect, createState } from "gnim"
import Gtk from "gi://Gtk"
import PowerMenuButton from "./PowerMenuButton"

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
      if (keyval == Gdk.KEY_Escape) {
        setPowerMenuOpen(false);
        setFocusIndex(0);
        return true
      } else if (keyval == Gdk.KEY_Right || keyval == Gdk.KEY_L || keyval == Gdk.KEY_l) {
        setFocusIndex((focusIndex() + 1) % 5);
        return true
      } else if (keyval == Gdk.KEY_Left || keyval == Gdk.KEY_H || keyval == Gdk.KEY_h) {
        setFocusIndex((focusIndex() + 4) % 5);
        return true
      } else if (keyval == Gdk.KEY_Return || keyval == Gdk.KEY_KP_Enter) {
        console.log(`Activated button index: ${focusIndex()}`);
      }

      return false
    })

    ref.add_controller(keyController)
  }

  const buttonTypes = ["shutdown", "reboot", "logout", "pause", "stop"]

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
            />
          ))}
        </box>
      </centerbox>
    </window>
  )
}
