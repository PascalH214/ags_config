import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import Adw from "gi://Adw"
import GLib from "gi://GLib"
import Notifd from "gi://AstalNotifd"
import Pango from "gi://Pango"
import app from "ags/gtk4/app"
import StateIcon from "../common/StateIcon"
import GObject from "gnim/gobject"
import sleep from "../../sleep"

function fileExists(path: string) {
  return GLib.file_test(path, GLib.FileTest.EXISTS)
}

function urgency(n: Notifd.Notification) {
  const { LOW, NORMAL, CRITICAL } = Notifd.Urgency
  switch (n.urgency) {
    case LOW:
      return "low"
    case CRITICAL:
      return "critical"
    case NORMAL:
    default:
      return "normal"
  }
}

interface NotificationProps {
  notification: Notifd.Notification
}

const urgencies = ["low", "normal", "critical"];

export default function Notification({ notification }: NotificationProps) {
  let iconName: string | null = null;

  let image: GObject.Object | null = null;
  if (notification.image != null && notification.image != "") {
    iconName = notification.image
  } else if (notification.appIcon != null && notification.appIcon != "") {
    iconName = notification.appIcon
  } else if (notification.desktopEntry != null && notification.desktopEntry != "") {
    iconName = notification.desktopEntry
  }

  const thisUrgency = urgency(notification);
  image = iconName == null || !fileExists(iconName)
    ? <StateIcon
      states={urgencies}
      state={urgencies.indexOf(thisUrgency)}
      imageGroup={"urgencyEmojis"}
      pixelSize={60}
    />
    : new Gtk.Image({
      file: iconName == null ? "" : iconName,
      pixelSize: 60
    });

  const appNameLabelObject = Gtk.Label.new((`${notification.get_app_name()}`).toUpperCase());
  appNameLabelObject.set_css_classes(["title", thisUrgency]);
  appNameLabelObject.set_halign(Gtk.Align.START);
  appNameLabelObject.set_wrap(true);
  appNameLabelObject.set_wrap_mode(Pango.WrapMode.CHAR);
  appNameLabelObject.set_max_width_chars(20);

  let content = notification.get_body();
  if (
    content == null || content == "" ||
    (
      content.length > 120 &&
      notification.get_summary() != null &&
      notification.get_summary() != ""
    )
  ) {
    content = `Summary: ${notification.get_summary()}`;
  }

  const contentLabelObject = Gtk.Label.new(content);
  contentLabelObject.set_halign(Gtk.Align.START);
  contentLabelObject.set_wrap(true);
  contentLabelObject.set_wrap_mode(Pango.WrapMode.CHAR);
  contentLabelObject.set_max_width_chars(40);

  return (
    <box
      $={async (ref) => {
        const click = Gtk.GestureClick.new()
        click.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
        click.connect("released", async () => {
          notification.dismiss();
        });

        ref.add_controller(click);

        if (notification.get_expire_timeout() <= 0) {
          await sleep(5000);
          notification.dismiss();
        }
      }}
      class={"notification"}
      widthRequest={300}
      orientation={Gtk.Orientation.HORIZONTAL}
    >
      {image}
      <box
        orientation={Gtk.Orientation.VERTICAL}
      >
        {appNameLabelObject}
        {contentLabelObject}
      </box>
    </box>
  );
}