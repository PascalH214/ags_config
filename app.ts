import app from "ags/gtk4/app"
import { createState } from "gnim"

import style from "./style.scss"
import Bar from "./widget/Bar/Bar"
import PowerMenu from "./widget/PowerMenu/PowerMenu"
import NotificationContainer from "./widget/Notification/NotificationContainer"
import Launcher from "./widget/Launcher/Launcher"

const [powerMenuOpen, setPowerMenuOpen] = createState(false);
const [launcherOpen, setLauncherOpen] = createState(false);

app.start({
  css: style,
  requestHandler(argv: string[], response: (response: string) => void) {
    if (argv[0] === "toggle-launcher") {
      setLauncherOpen(!launcherOpen())
    }
    else if (argv[0] === "toggle-power-menu") {
      setPowerMenuOpen(!powerMenuOpen())
    }
  },
  main() {
    app.get_monitors().map(monitor => Bar(monitor, powerMenuOpen, setPowerMenuOpen, launcherOpen, setLauncherOpen))
    app.get_monitors().map(monitor => PowerMenu(monitor, powerMenuOpen, setPowerMenuOpen))
    app.get_monitors().map(NotificationContainer)
    app.get_monitors().map(monitor => Launcher(monitor, launcherOpen, setLauncherOpen))
  },
})
