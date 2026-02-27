import { Gdk, Gtk } from "ags/gtk4"
import { Accessor, Setter, createEffect, createState } from "gnim";
import CenteredDialogWithBackdrop from "../common/CenteredDialogWithBackdrop";

export default function Launcher(gdkmonitor: Gdk.Monitor, launcherOpen: Accessor<boolean>, setLauncherOpen: Setter<boolean>) {
  let entry: Gtk.Entry;

  const [entryText, setEntryText] = createState("");

  const closeDialog = () => {
    setEntryText("");
    entry.set_text("");
    setLauncherOpen(false);
  }

  const setupInputField = (ref: Gtk.Entry) => {
    entry = ref
    const keyController = Gtk.EventControllerKey.new()
    keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    keyController.connect("key-released", (_controller, keyval) => {
      if (keyval === Gdk.KEY_Escape) {
        closeDialog()
        return true;
      }
      setEntryText(ref.text)
      return true;
    });

    ref.add_controller(keyController)
  };

  createEffect(() => {
    if (!launcherOpen()) closeDialog()
  });

  return <CenteredDialogWithBackdrop
    gdkmonitor={gdkmonitor}
    windowName="launcher"
    windowClass="Launcher"
    open={launcherOpen}
    setOpen={setLauncherOpen}
  >
    <box
      class="dialog"
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      $type="center"
    >
      <Gtk.Entry
        $={setupInputField}
        widthRequest={400}
      />
    </box>
  </CenteredDialogWithBackdrop>
}