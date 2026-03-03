import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, For, Setter, createComputed, createEffect, createState } from "gnim";
import CenteredDialogWithBackdrop from "../common/CenteredDialogWithBackdrop";
import { getApplications, launchApp as launchApplication } from "./apps";
import { getBookmarks, launchBookmark as launchBrowserBookmark } from "./bookmarks";
import { LauncherApp, LauncherBookmark, LauncherTab } from "./types";
import { formatBookmarkTitle } from "./utils";

export default function Launcher(gdkmonitor: Gdk.Monitor, launcherOpen: Accessor<boolean>, setLauncherOpen: Setter<boolean>) {
  let entry: Gtk.Entry | undefined;

  const [entryText, setEntryText] = createState("");
  const [activeTab, setActiveTab] = createState<LauncherTab>("apps");
  const [selectedIndex, setSelectedIndex] = createState(0);
  const [apps, setApps] = createState<LauncherApp[]>([]);
  const [bookmarks, setBookmarks] = createState<LauncherBookmark[]>([]);
  const appsTabClass = createComputed(() => activeTab() === "apps" ? "tab active" : "tab");
  const bookmarksTabClass = createComputed(() => activeTab() === "bookmarks" ? "tab active" : "tab");

  const closeDialog = () => {
    setEntryText("");
    entry?.set_text("");
    setActiveTab("apps");
    setSelectedIndex(0);
    setApps([]);
    setBookmarks([]);
    setLauncherOpen(false);
  }

  const getResultCount = () => activeTab() === "apps" ? apps().length : bookmarks().length;

  const switchTab = (tab: LauncherTab) => {
    setActiveTab(tab);
    setSelectedIndex(0);
  }

  const launchApp = (app: LauncherApp) => {
    if (launchApplication(app)) {
      closeDialog();
    }
  }

  const launchBookmark = (bookmark: LauncherBookmark) => {
    if (launchBrowserBookmark(bookmark)) {
      closeDialog();
    }
  }

  const launchSelected = () => {
    if (activeTab() === "apps") {
      const app = apps()[selectedIndex()] ?? apps()[0];
      if (!app) return false;
      launchApp(app);
      return true;
    }

    const bookmark = bookmarks()[selectedIndex()] ?? bookmarks()[0];
    if (!bookmark) return false;
    launchBookmark(bookmark);
    return true;
  }

  const moveSelection = (delta: number) => {
    const count = getResultCount();
    if (count === 0) return;

    const current = selectedIndex();
    const next = (current + delta + count) % count;
    setSelectedIndex(next);
  }

  const handleKeyPress = (keyval: number, state: Gdk.ModifierType) => {
    const isCtrlPressed = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;
    if (isCtrlPressed && (keyval === Gdk.KEY_j || keyval === Gdk.KEY_J)) {
      moveSelection(1)
      return true;
    }

    if (isCtrlPressed && (keyval === Gdk.KEY_k || keyval === Gdk.KEY_K)) {
      moveSelection(-1)
      return true;
    }

    switch (keyval) {
      case Gdk.KEY_Escape:
        closeDialog()
        return true;
      case Gdk.KEY_Down:
        moveSelection(1)
        return true;
      case Gdk.KEY_Up:
        moveSelection(-1)
        return true;
      case Gdk.KEY_Return:
      case Gdk.KEY_KP_Enter:
        return launchSelected();
      case Gdk.KEY_Tab:
        switchTab(activeTab() === "apps" ? "bookmarks" : "apps")
        return true;
      default:
        return false;
    }
  }

  const setupWindow = (win: Astal.Window) => {
    const keyController = Gtk.EventControllerKey.new()
    keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
    keyController.connect("key-pressed", (_controller, keyval, _keycode, state) => handleKeyPress(keyval, state))
    win.add_controller(keyController)
  }

  const setupInputField = (ref: Gtk.Entry) => {
    entry = ref

    ref.connect("changed", () => {
      setEntryText(ref.text)
      setSelectedIndex(0)
    })
  };

  createEffect(() => {
    if (!launcherOpen()) closeDialog()
  });

  createEffect(() => {
    if (launcherOpen()) {
      entry?.grab_focus()
    }
  });

  createEffect(() => {
    const count = getResultCount();
    const index = selectedIndex();
    if (count === 0) {
      if (index !== 0) setSelectedIndex(0);
      return;
    }

    if (index >= count) {
      setSelectedIndex(count - 1);
    }
  });

  createEffect(() => {
    if (activeTab() === "apps") {
      setApps(getApplications(entryText()));
      setBookmarks([]);
      return;
    }

    setBookmarks(getBookmarks(entryText()));
    setApps([]);
  });

  return <CenteredDialogWithBackdrop
    gdkmonitor={gdkmonitor}
    windowName="launcher"
    windowClass="Launcher"
    setupWindow={setupWindow}
    open={launcherOpen}
    setOpen={setLauncherOpen}
  >
    <box
      class="launcher-dialog"
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.VERTICAL}
      $type="center"
    >
      <box orientation={Gtk.Orientation.HORIZONTAL} class="tabs">
        <button
          class={appsTabClass}
          onClicked={() => switchTab("apps")}
        >
          <label label="Apps" />
        </button>
        <button
          class={bookmarksTabClass}
          onClicked={() => switchTab("bookmarks")}
        >
          <label label="Bookmarks" />
        </button>
      </box>
      <Gtk.Entry
        class="launcher-entry"
        $={setupInputField}
        widthRequest={400}
        placeholderText={"Search"}
      />
      <box
        orientation={Gtk.Orientation.VERTICAL}
        visible={activeTab((tab) => tab === "apps")}
      >
        <For each={apps}>
          {(item, index) => (
            <button
              class={createComputed(() => selectedIndex() === index() ? "launcher-row selected" : "launcher-row")}
              halign={Gtk.Align.FILL}
              hexpand
              onClicked={() => launchApp(item)}
            >
              <box class="launcher-item">
                {item.iconName ? <image iconName={item.iconName} pixelSize={20} /> : null}
                <label label={item.name} />
              </box>
            </button>
          )}
        </For>
      </box>
      <box
        orientation={Gtk.Orientation.VERTICAL}
        visible={activeTab((tab) => tab === "bookmarks")}
      >
        <For each={bookmarks}>
          {(item, index) => (
            <button
              class={createComputed(() => selectedIndex() === index() ? "launcher-row selected" : "launcher-row")}
              halign={Gtk.Align.FILL}
              hexpand
              onClicked={() => launchBookmark(item)}
            >
              <box class="launcher-item">
                <image iconName="google-chrome" />
                <label label={formatBookmarkTitle(item.title)} />
              </box>
            </button>
          )}
        </For>
        <label
          visible={bookmarks((items) => items.length === 0)}
          label="No bookmarks found."
        />
      </box>
    </box>
  </CenteredDialogWithBackdrop>
}