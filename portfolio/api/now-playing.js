// Vercel serverless function: GET /api/now-playing
// Returns what you're playing (or last played) via Last.fm: { title, artist, album, artwork, url, nowPlaying }
// Apple Music → Last.fm: use a scrobbler such as NepTunes (Mac) or QuietScrobble (iPhone).
// Needs two environment variables in Vercel (Project → Settings → Environment Variables):
//   LASTFM_API_KEY   from https://www.last.fm/api/account/create
//   LASTFM_USER      your Last.fm username
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
    res.status(200).json({
      title: t.name,
      artist: t.artist?.["#text"] || t.artist?.name || "",
      album: t.album?.["#text"] || "",
      artwork: img.includes("2a96cbd8b46e442fc41c2b86b821562f") ? "" : img,   // Last.fm's blank star placeholder
      url: t.url || "",
      nowPlaying: t["@attr"]?.nowplaying === "true",
    });
  } catch (e) {
    res.status(500).json({ error: "Could not reach Last.fm" });
  }
}
