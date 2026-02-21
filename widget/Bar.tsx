import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"

import Workspaces from "./Workspaces"
import InfoCenter from "./InfoCenter"
import HwInfo from "./HwInfo"

export default function Bar(gdkmonitor: Gdk.Monitor) {
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
    >
      <centerbox>
        <HwInfo />
        <Workspaces />
        <InfoCenter />
      </centerbox>
    </window>
  )
}
