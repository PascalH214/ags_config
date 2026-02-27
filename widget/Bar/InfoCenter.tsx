import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { createComputed, Accessor, Setter } from "gnim"

import Icon from "../common/Icon";
import LabelWithIcon from "../common/LabelWithIcon";
import DividingLine from "../common/DividingLine";
import ShutdownButton from "./ShutdownButton";
import MultiMedia from "./MultiMedia";
import GObject from "gnim/gobject";

interface InfoCenterProps extends Partial<Gtk.Box.ConstructorProps> {
  powerMenuOpen: Accessor<boolean>;
  setPowerMenuOpen: Setter<boolean>;
  launcherOpen: Accessor<boolean>;
  setLauncherOpen: Setter<boolean>;
}

export default function InfoCenter(props: InfoCenterProps) {
  const { powerMenuOpen, setPowerMenuOpen, launcherOpen, setLauncherOpen, ...boxProps } = props
  const uptimeState = createPoll("", 20000, `bash -c "uptime | awk '{print $3}' | cut -d, -f1"`);
  const dateState = createPoll("", 1000, () => new Date().toISOString());

  const time = createComputed(() => {
    const dateObj = new Date(dateState())

    if (Number.isNaN(dateObj.getTime())) {
      return ""
    }

    const hours = dateObj.getHours().toString().padStart(2, "0")
    const minutes = dateObj.getMinutes().toString().padStart(2, "0")
    const seconds = dateObj.getSeconds().toString().padStart(2, "0")

    return `${hours}:${minutes}:${seconds}`
  });

  const date = createComputed(() => {
    const dateObj = new Date(dateState())

    if (Number.isNaN(dateObj.getTime())) {
      return ""
    }

    const day = dateObj.getDate().toString().padStart(2, "0")
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")

    return `${day}.${month}`
  });

  const uptime = createComputed(() => {
    const uptimeSplit = uptimeState().split(":")
    const hasHours = uptimeSplit.length > 1

    const hours = (hasHours ? uptimeSplit[0] : "00").padStart(2, "0")
    const minutes = (hasHours ? uptimeSplit[1] : uptimeSplit[0]).padStart(2, "0")

    return `${hours}:${minutes}`
  });

  const setupLauncherIcon = (self: Gtk.Image) => {
    const click = Gtk.GestureClick.new();
    click.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)

    click.connect("released", () => {
      setLauncherOpen(!launcherOpen())
    })

    self.add_controller(click);
  }

  return (
    <box
      name="info-center"
      class="info-center"
      $type="end"
      {...boxProps}
    >
      <box class="time-info">
        <MultiMedia />
        <LabelWithIcon className="time" imageName="clock" label={time} />
        <DividingLine />
        <LabelWithIcon className="date" imageName="calendar" label={date} />
        <DividingLine />
        <LabelWithIcon className="uptime" imageName="stopwatch" label={uptime} />
        <Icon
          $={setupLauncherIcon}
          imageName="rightArrow/lavendar"
          pixelSize={20}
        />
        <ShutdownButton onClicked={() => {
            setPowerMenuOpen(!powerMenuOpen());
          }}
        />
      </box>
    </box>
  )
}