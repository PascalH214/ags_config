import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, For, Setter, createComputed, createEffect, createState } from "gnim";
import CenteredDialogWithBackdrop from "../common/CenteredDialogWithBackdrop";
import Gio from "gi://Gio"
import GLib from "gi://GLib"

function isIcon(icon?: string | null) {
  const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)
  return !!icon && iconTheme.has_icon(icon)
}

type LauncherApp = {
  appInfo: Gio.AppInfo;
  name: string;
  iconName?: string;
}

type LauncherBookmark = {
  title: string;
  url: string;
}

type LauncherTab = "apps" | "bookmarks";
type LauncherMode = "insert" | "normal";

type RawBookmarkNode = {
  type?: string;
  name?: string;
  url?: string;
  children?: RawBookmarkNode[];
}

const MAX_RESULTS = 6;

function formatBookmarkTitle(title: string): string {
  if (title.length <= 30) return title;
  return `${title.slice(0, 30)}…`;
}

function runInTerminal(command: string): boolean {
  const process = Gio.Subprocess.new(
    [
      "env",
      "-u",
      "BASH_ENV",
      "bash",
      "--noprofile",
      "--norc",
      "-c",
      [
        "cmd=\"$1\"",
        "if [ -z \"$cmd\" ]; then exit 1; fi",
        "if command -v kitty >/dev/null 2>&1; then kitty sh -lc \"$cmd\" & exit 0; fi",
        "if command -v foot >/dev/null 2>&1; then foot sh -lc \"$cmd\" & exit 0; fi",
        "if command -v alacritty >/dev/null 2>&1; then alacritty -e sh -lc \"$cmd\" & exit 0; fi",
        "if command -v wezterm >/dev/null 2>&1; then wezterm start -- sh -lc \"$cmd\" & exit 0; fi",
        "if command -v gnome-terminal >/dev/null 2>&1; then gnome-terminal -- sh -lc \"$cmd\" & exit 0; fi",
        "if command -v konsole >/dev/null 2>&1; then konsole -e sh -lc \"$cmd\" & exit 0; fi",
        "if command -v xterm >/dev/null 2>&1; then xterm -e sh -lc \"$cmd\" & exit 0; fi",
        "exit 1",
      ].join("\n"),
      "_",
      command,
    ],
    Gio.SubprocessFlags.NONE,
  )

  process.wait(null)
  return process.get_successful();
}

function getTerminalCommand(appInfo: Gio.AppInfo): string | null {
  const rawCommandline = appInfo.get_commandline();
  if (rawCommandline) {
    const sanitized = rawCommandline
      .replace(/%[fFuUdDnNickvm]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (sanitized.length > 0) return sanitized;
  }

  const executable = appInfo.get_executable();
  return executable && executable.length > 0 ? executable : null;
}

function getIconName(icon: Gio.Icon | null): string | undefined {
  if (!icon) return undefined;

  if (icon instanceof Gio.ThemedIcon) {
    const themedIconName = icon.get_names().find(name => isIcon(name));
    if (themedIconName) return themedIconName;
  }

  const iconName = icon.to_string();
  return isIcon(iconName) ? iconName! : undefined;
}

function getMatchScore(appName: string, needle: string): number {
  const normalizedName = appName.toLowerCase();

  if (normalizedName === needle) {
    return 1000;
  }

  if (normalizedName.startsWith(needle)) {
    return 900;
  }

  const words = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some(word => word.startsWith(needle))) {
    return 800;
  }

  const index = normalizedName.indexOf(needle);
  if (index >= 0) {
    return 700 - Math.min(index, 200);
  }

  return -1;
}

function getApplications(searchString: string): LauncherApp[] {
  const needle = searchString.trim().toLowerCase();
  if (!needle) return [];

  return Gio.AppInfo.get_all()
    .filter(appInfo => appInfo.should_show())
    .map(appInfo => {
      const name = appInfo.get_display_name();
      return {
        appInfo,
        name,
        iconName: getIconName(appInfo.get_icon()),
      };
    })
    .map(app => ({ app, score: getMatchScore(app.name, needle) }))
    .filter(item => item.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.app.name.localeCompare(right.app.name);
    })
    .map(item => item.app)
    .slice(0, MAX_RESULTS);
}

function collectBookmarks(node: RawBookmarkNode | undefined, output: LauncherBookmark[]) {
  if (!node) return;

  if (node.type === "url" && typeof node.url === "string") {
    output.push({
      title: typeof node.name === "string" && node.name.length > 0 ? node.name : node.url,
      url: node.url,
    });
    return;
  }

  if (!Array.isArray(node.children)) return;
  node.children.forEach(child => collectBookmarks(child, output));
}

function readBookmarksFile(path: string): LauncherBookmark[] {
  try {
    const file = Gio.File.new_for_path(path);
    if (!file.query_exists(null)) return [];

    const process = Gio.Subprocess.new(
      ["cat", path],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    );
    const [, stdout] = process.communicate_utf8(null, null);

    let data = stdout ?? "";
    if (!process.get_successful() || data.length === 0) {
      const [ok, contents] = file.load_contents(null);
      if (!ok) return [];
      data = new TextDecoder("utf-8").decode(contents);
    }

    const parsed = JSON.parse(data) as { roots?: Record<string, RawBookmarkNode> };
    if (!parsed.roots) return [];

    const bookmarks: LauncherBookmark[] = [];
    Object.values(parsed.roots).forEach(root => collectBookmarks(root, bookmarks));
    return bookmarks;
  } catch (error) {
    console.error(`Unable to read bookmarks from ${path}:`, error);
    return [];
  }
}

function getChromeBookmarkFilePaths(): string[] {
  const home = GLib.get_home_dir();
  const browserConfigDirs = [
    `${home}/.config/google-chrome`,
    `${home}/.config/chromium`,
    `${home}/.config/google-chrome-beta`,
    `${home}/.config/google-chrome-unstable`,
  ];

  const process = Gio.Subprocess.new(
    [
      "env",
      "-u",
      "BASH_ENV",
      "bash",
      "--noprofile",
      "--norc",
      "-c",
      [
        "for dir in \"$@\"; do",
        "  [ -d \"$dir\" ] || continue",
        "  find \"$dir\" -maxdepth 2 -type f -name Bookmarks 2>/dev/null",
        "done",
      ].join("\n"),
      "_",
      ...browserConfigDirs,
    ],
    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
  );

  const [, stdout] = process.communicate_utf8(null, null);
  const paths = stdout
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return Array.from(new Set(paths));
}

function getAllChromeBookmarks(): LauncherBookmark[] {
  const bookmarkPaths = getChromeBookmarkFilePaths();
  if (bookmarkPaths.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  return bookmarkPaths
    .flatMap(path => readBookmarksFile(path))
    .filter(bookmark => {
      if (seen.has(bookmark.url)) return false;
      seen.add(bookmark.url);
      return true;
    });
}

function getBookmarks(searchString: string): LauncherBookmark[] {
  const needle = searchString.trim().toLowerCase();
  const allBookmarks = getAllChromeBookmarks();

  if (!needle) {
    return allBookmarks
      .slice()
      .sort((left, right) => left.title.localeCompare(right.title))
      .slice(0, MAX_RESULTS);
  }

  return allBookmarks
    .map(bookmark => {
      const titleScore = getMatchScore(bookmark.title, needle);
      const urlScore = getMatchScore(bookmark.url.toLowerCase(), needle);
      const score = Math.max(titleScore >= 0 ? titleScore + 150 : -1, urlScore);
      return { bookmark, score };
    })
    .filter(item => item.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.bookmark.title.localeCompare(right.bookmark.title);
    })
    .map(item => item.bookmark)
    .slice(0, MAX_RESULTS);
}

export default function Launcher(gdkmonitor: Gdk.Monitor, launcherOpen: Accessor<boolean>, setLauncherOpen: Setter<boolean>) {
  let entry: Gtk.Entry | undefined;
  let pendingGSequence = false;
  const tabOrder: LauncherTab[] = ["apps", "bookmarks"];

  const [entryText, setEntryText] = createState("");
  const [activeTab, setActiveTab] = createState<LauncherTab>("apps");
  const [mode, setMode] = createState<LauncherMode>("insert");
  const [selectedIndex, setSelectedIndex] = createState(0);
  const [apps, setApps] = createState<LauncherApp[]>([]);
  const [bookmarks, setBookmarks] = createState<LauncherBookmark[]>([]);
  const modeLabel = createComputed(() => mode() === "insert" ? "-- INSERT --" : "-- NORMAL --");
  const appsTabClass = createComputed(() => activeTab() === "apps" ? "tab active" : "tab");
  const bookmarksTabClass = createComputed(() => activeTab() === "bookmarks" ? "tab active" : "tab");

  const closeDialog = () => {
    setEntryText("");
    entry?.set_text("");
    setActiveTab("apps");
    setMode("insert");
    pendingGSequence = false;
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

  const cycleTab = (delta: number) => {
    const index = tabOrder.indexOf(activeTab());
    const next = (index + delta + tabOrder.length) % tabOrder.length;
    switchTab(tabOrder[next]);
  }

  const launchApp = (app: LauncherApp) => {
    try {
      const launched = app.appInfo.launch([], null);
      if (launched) {
        closeDialog();
        return;
      }

      throw new Error("app launch returned false");
    } catch (error) {
      const errorMessage = `${error}`.toLowerCase();
      const requiresTerminal =
        errorMessage.includes("terminal") ||
        errorMessage.includes("gio.ioerrorenum") ||
        errorMessage.includes("unable to find terminal");

      if (requiresTerminal) {
        const terminalCommand = getTerminalCommand(app.appInfo);
        if (terminalCommand && runInTerminal(terminalCommand)) {
          closeDialog();
          return;
        }
      }

      console.error(`Unable to launch app: ${app.name}`, error);
    }
  }

  const launchBookmark = (bookmark: LauncherBookmark) => {
    const launched = Gio.AppInfo.launch_default_for_uri(bookmark.url, null);
    if (launched) {
      closeDialog();
      return;
    }

    console.error(`Unable to open bookmark: ${bookmark.url}`);
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

  const moveCursor = (delta: number) => {
    if (!entry) return;

    const current = entry.get_position();
    const max = entry.text.length;
    const next = Math.max(0, Math.min(max, current + delta));
    entry.set_position(next);
  }

  const getKeyChar = (keyval: number): string => {
    const unicode = Gdk.keyval_to_unicode(keyval);
    if (!unicode) return "";
    return String.fromCharCode(unicode);
  }

  const handleKeyPress = (keyval: number, state: Gdk.ModifierType) => {
    const keyChar = getKeyChar(keyval);
    const keyName = Gdk.keyval_name(keyval) ?? "";
    const isShiftPressed = (state & Gdk.ModifierType.SHIFT_MASK) !== 0;
    const isUpperG = keyChar === "G" || keyName === "G";
    const isLowerG = keyChar === "g" || keyName === "g";
    const isTKey = keyChar.toLowerCase() === "t" || keyName.toLowerCase() === "t";

    if (mode() === "normal") {
      if (pendingGSequence) {
        pendingGSequence = false;

        if (isTKey) {
          cycleTab(isShiftPressed ? -1 : 1)
          return true;
        }

        if (isLowerG) {
            setSelectedIndex(0)
            return true;
        }
      }

      switch (keyval) {
        case Gdk.KEY_Escape:
          closeDialog()
          return true;
        case Gdk.KEY_Left:
          moveCursor(-1)
          return true;
        case Gdk.KEY_Right:
          moveCursor(1)
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
          break;
      }

      if (keyChar === "i" || keyChar === "a") {
        pendingGSequence = false
        setMode("insert")
        entry?.grab_focus()
        return true;
      }

      if (keyChar === "h") {
        moveCursor(-1)
        return true;
      }

      if (keyChar === "l") {
        moveCursor(1)
        return true;
      }

      if (keyChar === "j") {
        moveSelection(1)
        return true;
      }

      if (keyChar === "k") {
        moveSelection(-1)
        return true;
      }

      if (isLowerG) {
        pendingGSequence = true
        return true;
      }

      if (isUpperG) {
        pendingGSequence = false
        setSelectedIndex(Math.max(getResultCount() - 1, 0))
        return true;
      }

      pendingGSequence = false
      return true;
    }

    if (keyval === Gdk.KEY_Escape) {
      pendingGSequence = false
      setMode("normal")
      return true;
    }

    if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) {
      return launchSelected();
    }

    if (keyval === Gdk.KEY_Tab) {
      switchTab(activeTab() === "apps" ? "bookmarks" : "apps")
      return true;
    }

    return false;
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
      if (entryText().length < 3) {
        setApps([]);
        setBookmarks([]);
        return;
      }

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
      class="dialog"
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
        $={setupInputField}
        widthRequest={400}
      />
      <label class="mode" label={modeLabel} />
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
                {item.iconName ? <image iconName={item.iconName} /> : null}
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