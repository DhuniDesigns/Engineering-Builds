// Vercel serverless function: GET /api/now-playing
// Returns what you're playing (or last played) via Last.fm: { title, artist, album, artwork, url, nowPlaying }
// Apple Music → Last.fm: use a scrobbler such as Scrobbles for Last.fm (Mac) or QuietScrob (iPhone).
// When Last.fm has no cover for a track, the cover is looked up on Apple's public iTunes Search API instead.
// Needs two environment variables in Vercel (Project → Settings → Environment Variables):
//   LASTFM_API_KEY   from https://www.last.fm/api/account/create
//   LASTFM_USER      your Last.fm username
const coverCache = new Map();
async function itunesCover(artist, album, title) {
  const k = `${artist}|${album}|${title}`;
  if (coverCache.has(k)) return coverCache.get(k);
  let art = "";
  const alb = album.replace(/\s*[-–]\s*(EP|Single)$/i, "");
  for (const [term, entity] of [[`${artist} ${title}`, "song"], [`${artist} ${alb}`, "album"]]) {
    if (!term.trim() || art) continue;
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1`);
      const d = r.ok ? await r.json() : null;
      const a = d?.results?.[0]?.artworkUrl100;
      if (a) art = a.replace(/\/\d+x\d+bb\./, "/600x600bb.");
    } catch (_) {}
  }
  coverCache.set(k, art);
  return art;
}
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
  const key = process.env.LASTFM_API_KEY, user = process.env.LASTFM_USER;
  if (!key || !user) return res.status(500).json({ error: "Add LASTFM_API_KEY and LASTFM_USER in Vercel" });
  try {
    const u = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${key}&format=json&limit=1`;
    const r = await fetch(u);
    if (!r.ok) return res.status(502).json({ error: `Last.fm answered ${r.status}` });
    const t = (await r.json()).recenttracks?.track?.[0];
    if (!t) return res.status(204).end();
    const img = (t.image || []).find((i) => i.size === "extralarge")?.["#text"] || (t.image || []).at(-1)?.["#text"] || "";
    const title = t.name, artist = t.artist?.["#text"] || t.artist?.name || "", album = t.album?.["#text"] || "";
    let artwork = img.includes("2a96cbd8b46e442fc41c2b86b821562f") ? "" : img;   // Last.fm's blank star placeholder
    if (!artwork) artwork = await itunesCover(artist, album, title);
    res.status(200).json({
      title, artist, album, artwork,
      url: t.url || "",
      nowPlaying: t["@attr"]?.nowplaying === "true",
    });
  } catch (e) {
    res.status(500).json({ error: "Could not reach Last.fm" });
  }
}
