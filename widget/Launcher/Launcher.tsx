import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, Setter, createEffect } from "gnim";

export default function Launcher(gdkmonitor: Gdk.Monitor, launcherOpen: Accessor<boolean>, setLauncherOpen: Setter<boolean>) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

  let win: Astal.Window;
  let backdrop: Gtk.CenterBox;
  let dialog: Gtk.Box;

  createEffect(() => {
    if (!win) return
    const open = launcherOpen()
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
        setLauncherOpen(false)
      }
    })

    backdrop.add_controller(click)
  }

  return (
    <window
      $={(ref) => win = ref}
      name="launcher"
      class="Launcher"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      application={app}
      keymode={Astal.Keymode.EXCLUSIVE}
    >
      <centerbox
        $={setupBackdrop}
        class="backdrop"
        hexpand
        vexpand
        halign={Gtk.Align.FILL}
        valign={Gtk.Align.FILL}
      >
        <box
          $={(ref) => dialog = ref}
          class="dialog"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          $type="center"
        >
          a
        </box>
      </centerbox>
    </window>
  )
}