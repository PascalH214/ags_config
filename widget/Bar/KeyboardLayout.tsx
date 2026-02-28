import { Gtk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"
import Gio from "gi://Gio"
import { createState } from "gnim"

import LabelWithIcon from "../common/LabelWithIcon"

const keyboardLayoutCmd = `
  hyprctl devices | 
  awk -f ${SRC}/awk/get_keyboard_layouts.awk |
  sort |
  tail -n 1 |
  awk '{ if (NF==2) { print $2; exit } else print $2,$NF }'
 `

const hyprland = Hyprland.get_default()

function getKeyboardLayout(): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = Gio.Subprocess.new(
      ["env", "-u", "BASH_ENV", "bash", "--noprofile", "--norc", "-c", keyboardLayoutCmd],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE)
    const cancellable = new Gio.Cancellable()
    process.wait(cancellable)

    const [bool, stdout, stderr] = process.communicate_utf8(null, null)

    if (process.get_successful()) {
      resolve(stdout.trim())
    }
    reject("Failed to get keyboard layout")
  })
}

export default function KeyboardLayout(props: Partial<Gtk.Box.ConstructorProps> = {}) {
  const [keyboardLayout, setKeyboardLayout] = createState("")

  getKeyboardLayout()
    .then((layout) => setKeyboardLayout(layout))
    .catch(() => setKeyboardLayout("?") )

  hyprland.connect("keyboard-layout", () => {
    getKeyboardLayout().then(layout => setKeyboardLayout(layout)).catch(() => setKeyboardLayout("?") )
  })

  return (
    <LabelWithIcon
      imageName="keyboard"
      label={keyboardLayout}
      {...props}
    />
  )
}
