import Notifd from "gi://AstalNotifd"
import { createBinding, createEffect } from "gnim"

const notifd = Notifd.get_default()

export default function Notification() {
  const notifications = createBinding(notifd, "notifications");

  createEffect(() => {
    console.log("Notifications updated:", notifications());
  });
}