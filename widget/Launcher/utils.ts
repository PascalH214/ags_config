export function formatBookmarkTitle(title: string): string {
  if (title.length <= 30) return title;
  return `${title.slice(0, 30)}…`;
}

export function getMatchScore(haystack: string, needle: string): number {
  const normalizedHaystack = haystack.toLowerCase();

  if (normalizedHaystack === needle) {
    return 1000;
  }

  if (normalizedHaystack.startsWith(needle)) {
    return 900;
  }

  const words = normalizedHaystack.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some(word => word.startsWith(needle))) {
    return 800;
  }

  const index = normalizedHaystack.indexOf(needle);
  if (index >= 0) {
    return 700 - Math.min(index, 200);
  }

  return -1;
}