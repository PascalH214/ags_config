import { Gdk, Gtk } from "ags/gtk4"
import Gio from "gi://Gio"
import { MAX_RESULTS } from "./constants";
import { LauncherApp } from "./types";
import { getMatchScore } from "./utils";

function isIcon(icon?: string | null) {
  const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)
  return !!icon && iconTheme.has_icon(icon)
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

export function getApplications(searchString: string): LauncherApp[] {
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

export function launchApp(app: LauncherApp): boolean {
  try {
    const launched = app.appInfo.launch([], null);
    if (launched) {
      return true;
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
        return true;
      }
    }

    console.error(`Unable to launch app: ${app.name}`, error);
    return false;
  }
}