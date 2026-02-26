import Mpris from "gi://AstalMpris"
import { Accessor, createBinding, createComputed, createEffect, createState } from "gnim";
import Icon from "../common/Icon";
import StateIcon from "../common/StateIcon";
import { Gtk } from "ags/gtk4";
import GObject from "gnim/gobject";

const mpris = Mpris.get_default();

export default function MultiMedia() {
  const [currentPlayer, setCurrentPlayer] = createState<Mpris.Player | null>(null);
  const [currentPlaybackStatus, setCurrentPlaybackStatus] = createState<Mpris.PlaybackStatus>(Mpris.PlaybackStatus.STOPPED);

  mpris.connect("player-added", (mpris, player) => {
    if (player.can_play) {
      setCurrentPlayer(player);
      player.connect("notify::playback-status", () => {
        setCurrentPlaybackStatus(player.playback_status);
      });
    }
  });

  mpris.connect("player-closed", (mpris, player) => {
    if (currentPlayer() === player) {
      setCurrentPlayer(null);
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

  const playPauseIcon = createComputed(() =>
    currentPlaybackStatus() === Mpris.PlaybackStatus.PLAYING ? "pause" : "play"
  )

  const enabledState = createComputed(() => (currentPlayer() == null ? 0 : 1))

  return (
    <box class="multimedia" >
      <StateIcon
        $={(ref) => setAction(ref, previous)}
        states={["surface0", "lavendar"]}
        imageGroup={"skip_previous"}
        state={currentPlayer((p) => p == null ? 0 : 1)}
        pixelSize={20}
      />
      <StateIcon
        $={(ref) => setAction(ref, toggle)}
        states={["surface0", "lavendar"]}
        imageGroup={playPauseIcon}
        state={currentPlayer((p) => p == null ? 0 : 1)}
        pixelSize={20}
      />
      <StateIcon
        $={(ref) => setAction(ref, next)}
        states={["surface0", "lavendar"]}
        imageGroup={"skip_next"}
        state={currentPlayer((p) => p == null ? 0 : 1)}
        pixelSize={20}
      />
    </box>
  );
}