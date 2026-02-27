import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, Setter, createEffect, createState } from "gnim";
import GObject from "gnim/gobject";

export interface CenteredDialogWithBackdropProps {
  gdkmonitor: Gdk.Monitor;
  windowName?: string;
  windowClass?: string;
  setupWindow?: (window: Astal.Window) => void;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onClose?: () => void;
  children: GObject.Object;
}

export default function CenteredDialogWithBackdrop({
  gdkmonitor,
  windowName,
  windowClass,
  setupWindow,
  open,
  setOpen,
  onClose,
  children
}: CenteredDialogWithBackdropProps) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

  let win: Astal.Window;
  let backdrop: Gtk.CenterBox;
  let dialog: Gtk.Box;

  createEffect(() => {
    if (!win) return
    win.visible = open();

    if (open()) {
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
        setOpen(false)
        onClose?.()
      }
    })

    backdrop.add_controller(click)
  }

  return (
    <window
      $={(ref) => {
        win = ref;
        setupWindow?.(ref)
      }}
      name={windowName}
      class={windowClass}
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
          {children}
        </box>
      </centerbox>
    </window>
  )
}