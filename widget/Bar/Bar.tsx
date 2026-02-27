import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, Setter } from "gnim"

import Workspaces from "./Workspaces"
import InfoCenter from "./InfoCenter"
import HwInfo from "./HwInfo"

export default function Bar(
  gdkmonitor: Gdk.Monitor,
  powerMenuOpen: Accessor<boolean>,
  setPowerMenuOpen: Setter<boolean>,
  launcherOpen: Accessor<boolean>,
  setLauncherOpen: Setter<boolean>
) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
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
        <InfoCenter
          powerMenuOpen={powerMenuOpen}
          setPowerMenuOpen={setPowerMenuOpen}
          launcherOpen={launcherOpen}
          setLauncherOpen={setLauncherOpen}
        />
      </centerbox>
    </window>
  )
}
