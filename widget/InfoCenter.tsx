import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time";
import { createState, createEffect, type Accessor } from "gnim"

import LabelWithIcon from "./LabelWithIcon";
import DividingLine from "./DividingLine";

export default function InfoCenter(props: Partial<Gtk.Box.ConstructorProps> = {}) {
  const uptimeState = createPoll("", 20000, `bash -c "uptime | awk '{print $3}' | cut -d, -f1"`);
  const dateState = createPoll("", 1000, () => new Date().toISOString());
  
  const [uptime, setUptime] = createState("");
  const [time, setTime] = createState("");
  const [date, setDate] = createState("");

  createEffect(() => {
    const dateObj = new Date(dateState())
    const day = dateObj.getDate().toString().padStart(2, "0")
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
    const hours = dateObj.getHours().toString().padStart(2, "0")
    const minutes = dateObj.getMinutes().toString().padStart(2, "0")
    const seconds = dateObj.getSeconds().toString().padStart(2, "0")

    setTime(`${hours}:${minutes}:${seconds}`);
    setDate(`${day}.${month}`);
  });

  createEffect(() => {
    const uptimeSplit = uptimeState().split(":")

    if (uptimeSplit.length == 1) {
        uptimeSplit[1] = "00"
    }

    const hours = uptimeSplit[0].padStart(2, "0")
    const minutes = uptimeSplit[1].padStart(2, "0")

    setUptime(`${hours}:${minutes}`);
  });

  return (
    <box
      name="info-center"
      class="info-center"
      $type="end"
      {...props}
    >
      <box class="time-info">
        <LabelWithIcon className="time" imageName="clock" label={time} />
        <DividingLine />
        <LabelWithIcon className="date" imageName="calendar" label={date} />
        <DividingLine />
        <LabelWithIcon className="uptime" imageName="stopwatch" label={uptime} />
      </box>
    </box>
  )
}