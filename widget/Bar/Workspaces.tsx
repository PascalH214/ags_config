import Hyprland from "gi://AstalHyprland"
import { createBinding, createEffect, createState, For } from "gnim"
import { Gtk } from "ags/gtk4"
import GObject from "gnim/gobject"
import Gio from "gi://Gio?version=2.0"

const hyprland = Hyprland.get_default()

export default function Workspaces(props: Partial<Gtk.Box.ConstructorProps> = {}) {
  const workspacesProperty = createBinding(hyprland, "workspaces")
  const focusedWorkspaceId = createBinding(hyprland, "focused_workspace", "id")

  const [buttons, setButtons] = createState<GObject.Object[]>([])

  createEffect(() => {
    const sortedWorkspaces = workspacesProperty().slice()
    sortedWorkspaces.sort((a, b) => a.get_id() - b.get_id())

    const nextButtons = sortedWorkspaces.map(workspace => {
      const id = workspace.get_id();
      let name = workspace.get_name();

      if (name == "10") { 
        name = "0"
      } else if (name == "special:magic") {
        name = "S"
      }

      return (
        <button
          class={id == focusedWorkspaceId() ? "focused" : ""}
          label={name}
          onClicked={() => {
            if (name == "S") {
              const process = Gio.Subprocess.new(["hyprctl", "dispatch", "togglespecialworkspace", "magic"], Gio.SubprocessFlags.NONE);
              process.wait(null);
              return;
            }

            id != focusedWorkspaceId();
            workspace.focus()
          }}
        />
      )
    })

    setButtons(nextButtons)
  })

  return (
    <box
      $type="center"
      {...props}
      class="workspaces"
      hexpand={false}
    >
      <For each={buttons}>
        {(item, index) => (item)}
      </For>
    </box>
  )
}
