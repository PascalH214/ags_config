import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, Setter } from "gnim"

import Workspaces from "./Workspaces"
import InfoCenter from "./InfoCenter"
import HwInfo from "./HwInfo"

export default function Bar(gdkmonitor: Gdk.Monitor, powerMenuOpen: Accessor<boolean>, setPowerMenuOpen: Setter<boolean>) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  const setupWindow = (ref: Astal.Window) => {
    const keyController = Gtk.EventControllerKey.new()
    keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    keyController.connect("key-pressed", (_controller: Gtk.EventControllerKey, keyval: number, _keycode: number, state: Gdk.ModifierType) => {
      const superPressed = (state & Gdk.ModifierType.SUPER_MASK) !== 0

      if (superPressed && keyval === Gdk.KEY_Delete) {
        setPowerMenuOpen(true)
        return true
      }

      return false
    })

    ref.add_controller(keyController)
  }

  return (
    <window
      $={setupWindow}
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
      keymode={Astal.Keymode.ON_DEMAND}
    >
      <centerbox>
        <HwInfo />
        <Workspaces />
        <InfoCenter powerMenuOpen={powerMenuOpen} setPowerMenuOpen={setPowerMenuOpen} />
      </centerbox>
    </window>
  )
}
