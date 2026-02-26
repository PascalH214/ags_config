import Mpris from "gi://AstalMpris"
import { Accessor, createBinding, createComputed, createEffect, createState } from "gnim";
import Icon from "../common/Icon";
import StateIcon from "../common/StateIcon";
import { Gtk } from "ags/gtk4";
import GObject from "gnim/gobject";

const mpris = Mpris.get_default();

export default function MultiMedia() {
  const [currentPlayer, setCurrentPlayer] = createState<Mpris.Player | null>(null);
  const [playPauseIcon, setPlayPauseIcon] = createState<string>("play");

  mpris.connect("player-added", (mpris, player) => {
    if (player.can_play && player.can_go_next && player.can_go_previous) {
      setCurrentPlayer(player);
      const setPlayPauseIconFunc = () => setPlayPauseIcon(player.playback_status === Mpris.PlaybackStatus.PLAYING ? "pause" : "play" );
      player.connect("notify::playback-status", () => {
        setPlayPauseIconFunc();
      });
      setPlayPauseIconFunc();
    }
  });

  mpris.connect("player-closed", (mpris, player) => {
    if (currentPlayer() === player) {
      setCurrentPlayer(null);
      setPlayPauseIcon("play");
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