import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { MAX_RESULTS } from "./constants";
import { LauncherBookmark, RawBookmarkNode } from "./types";
import { getMatchScore } from "./utils";

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

export function getBookmarks(searchString: string): LauncherBookmark[] {
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
      const urlScore = getMatchScore(bookmark.url, needle);
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

export function launchBookmark(bookmark: LauncherBookmark): boolean {
  const launched = Gio.AppInfo.launch_default_for_uri(bookmark.url, null);
  if (launched) {
    return true;
  }

  console.error(`Unable to open bookmark: ${bookmark.url}`);
  return false;
}