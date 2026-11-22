// Cloudflare Pages Function: GET /api/now-playing
// Same response as the Vercel version in /api/now-playing.js: { title, artist, album, artwork, url, nowPlaying }
// Needs two variables in Cloudflare (Workers & Pages → this project → Settings → Variables and Secrets):
//   LASTFM_API_KEY   (add as a Secret)
//   LASTFM_USER      your Last.fm username
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=30, stale-while-revalidate=120",
};
const reply = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status, headers: JSON_HEADERS });

async function itunesCover(artist, album, title) {
  const alb = album.replace(/\s*[-–]\s*(EP|Single)$/i, "");
  for (const [term, entity] of [[`${artist} ${title}`, "song"], [`${artist} ${alb}`, "album"]]) {
    if (!term.trim()) continue;
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1`);
      const d = r.ok ? await r.json() : null;
      const a = d?.results?.[0]?.artworkUrl100;
      if (a) return a.replace(/\/\d+x\d+bb\./, "/600x600bb.");
    } catch (_) {}
  }
  return "";
}

export async function onRequestGet({ env }) {
  const key = env.LASTFM_API_KEY, user = env.LASTFM_USER;
  if (!key || !user) return reply({ error: "Add LASTFM_API_KEY and LASTFM_USER in Cloudflare" }, 500);
  try {
    const u = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${key}&format=json&limit=1`;
    const r = await fetch(u);
    if (!r.ok) return reply({ error: `Last.fm answered ${r.status}` }, 502);
    const t = (await r.json()).recenttracks?.track?.[0];
    if (!t) return reply(null, 204);
    const img = (t.image || []).find((i) => i.size === "extralarge")?.["#text"] || (t.image || []).at(-1)?.["#text"] || "";
    const title = t.name, artist = t.artist?.["#text"] || t.artist?.name || "", album = t.album?.["#text"] || "";
    let artwork = img.includes("2a96cbd8b46e442fc41c2b86b821562f") ? "" : img;
    if (!artwork) artwork = await itunesCover(artist, album, title);
    return reply({ title, artist, album, artwork, url: t.url || "", nowPlaying: t["@attr"]?.nowplaying === "true" });
  } catch (_) {
    return reply({ error: "Could not reach Last.fm" }, 500);
  }
}
