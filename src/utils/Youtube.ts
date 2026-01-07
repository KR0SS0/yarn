export const extractVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);

    // youtu.be/<id>
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }

    // youtube.com/watch?v=<id>
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }

    // youtube.com/embed/<id>
    const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return null;
  } catch {
    return null;
  }
};