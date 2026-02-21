import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { createComputed, Accessor, Setter } from "gnim"

import Icon from "./Icon";
import LabelWithIcon from "./LabelWithIcon";
import DividingLine from "./DividingLine";

interface InfoCenterProps extends Partial<Gtk.Box.ConstructorProps> {
  powerMenuOpen: Accessor<boolean>;
  setPowerMenuOpen: Setter<boolean>;
}

export default function InfoCenter(props: InfoCenterProps) {
  const { powerMenuOpen, setPowerMenuOpen, ...boxProps } = props
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

  return (
    <box
      name="info-center"
      class="info-center"
      $type="end"
      {...boxProps}
    >
      <box class="time-info">
        <LabelWithIcon className="time" imageName="clock" label={time} />
        <DividingLine />
        <LabelWithIcon className="date" imageName="calendar" label={date} />
        <DividingLine />
        <LabelWithIcon className="uptime" imageName="stopwatch" label={uptime} />
      </box>
      <button class="shutdown-button" onClicked={() => {
        setPowerMenuOpen(!powerMenuOpen());
      }}>
        <Icon imageName="shutdown" />
      </button>
    </box>
  )
}