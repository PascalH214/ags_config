import Gio from "gi://Gio"

export type LauncherApp = {
  appInfo: Gio.AppInfo;
  name: string;
  iconName?: string;
}

export type LauncherBookmark = {
  title: string;
  url: string;
}

export type LauncherTab = "apps" | "bookmarks";
export type LauncherMode = "insert" | "normal";

export type RawBookmarkNode = {
  type?: string;
  name?: string;
  url?: string;
  children?: RawBookmarkNode[];
}