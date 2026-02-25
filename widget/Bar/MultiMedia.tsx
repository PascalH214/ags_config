import Mpris from "gi://AstalMpris"
import { Accessor, createBinding, createComputed, createEffect, createState } from "gnim";
import Icon from "../common/Icon";
import StateIcon from "../common/StateIcon";
import { Gtk } from "ags/gtk4";
import GObject from "gnim/gobject";

const mpris = Mpris.get_default();

export default function MultiMedia() {
  const players = createBinding(mpris, "players");
  const [currentPlayer, setCurrentPlayer] = createState<Mpris.Player | null>(null);
  const [playbackStatus, setPlaybackStatus] = createState<Mpris.PlaybackStatus>(Mpris.PlaybackStatus.STOPPED);

  createEffect(() => {
    players().forEach(player => {
      if (player.can_play) {
        setCurrentPlayer(player);
        player.connect("notify::playback-status", () => {
          setPlaybackStatus(player.playbackStatus);
        });
        setPlaybackStatus(player.playbackStatus);
          return;
        }
    });
  });

  const playPauseState = createComputed(() => {
    switch (playbackStatus()) {
      case Mpris.PlaybackStatus.PLAYING:
        return 1;
      default:
        return 0;
    }
  });

  function previous() {
    if (currentPlayer()) {
      currentPlayer()!.previous();
    }
  }

  function toggle() {
    if (currentPlayer()) {
      currentPlayer()!.play_pause();
    } 
  }

  function next() {
    if (currentPlayer()) {
      currentPlayer()!.next();
    }
  }

  function setAction(ref: Gtk.Image, fun: () => void) {
    const click = Gtk.GestureClick.new();
    click.set_propagation_phase(Gtk.PropagationPhase.CAPTURE);
    click.connect("released", () => {
      fun();
      return false;
    });
    ref.add_controller(click);
  }

  return (
    <box class="multimedia" >
      <Icon
        $={(ref) => setAction(ref, previous)}
        imageName={"skip-previous"}
        pixelSize={20}
      />
      <StateIcon
        $={(ref) => setAction(ref, toggle)}
        imageGroup={"play_pause"}
        states={["play", "pause"]}
        state={playPauseState} pixelSize={20}
      />
      <Icon
        $={(ref) => setAction(ref, next)}
        imageName={"skip-next"}
        pixelSize={20}
      />
    </box>
  );
}