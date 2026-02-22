import app from "ags/gtk4/app"
import { createState } from "gnim"

import style from "./style.scss"
import Bar from "./widget/Bar/Bar"
import PowerMenu from "./widget/PowerMenu/PowerMenu"

const [powerMenuOpen, setPowerMenuOpen] = createState(false);

app.start({
  css: style,
  requestHandler(argv: string[], response: (response: string) => void) {
    if (argv[0] === "toggle-power-menu") {
      setPowerMenuOpen(!powerMenuOpen())
    }
  },
  main() {
    app.get_monitors().map(monitor => Bar(monitor, powerMenuOpen, setPowerMenuOpen))
    app.get_monitors().map(monitor => PowerMenu(monitor, powerMenuOpen, setPowerMenuOpen))
  },
})
