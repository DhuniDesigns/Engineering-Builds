// Vercel serverless function: GET /api/now-playing
// Returns the track you most recently played on Apple Music: { title, artist, album, artwork, url }
// Needs four environment variables in Vercel (Project → Settings → Environment Variables):
//   APPLE_TEAM_ID          your Apple Developer Team ID
//   APPLE_KEY_ID           the Key ID of a MusicKit key
//   APPLE_PRIVATE_KEY      contents of that key's .p8 file (paste it whole, BEGIN/END lines included)
//   APPLE_MUSIC_USER_TOKEN the token connect-apple-music.html shows you after you sign in once
import crypto from "node:crypto";

let cachedDev = null;
function developerToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedDev && cachedDev.exp - 300 > now) return cachedDev.token;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "ES256", kid: process.env.APPLE_KEY_ID });
  const exp = now + 60 * 60 * 12;
  const body = b64({ iss: process.env.APPLE_TEAM_ID, iat: now, exp });
  const key = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const sig = crypto.sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  cachedDev = { token: `${head}.${body}.${sig}`, exp };
  return cachedDev.token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  try {
    const r = await fetch("https://api.music.apple.com/v1/me/recent/played/tracks?limit=1", {
      headers: { Authorization: `Bearer ${developerToken()}`, "Music-User-Token": process.env.APPLE_MUSIC_USER_TOKEN },
    });
    if (!r.ok) return res.status(502).json({ error: `Apple Music answered ${r.status}` });
    const a = (await r.json()).data?.[0]?.attributes;
    if (!a) return res.status(204).end();
    res.status(200).json({
      title: a.name,
      artist: a.artistName,
      album: a.albumName,
      artwork: a.artwork?.url?.replace("{w}", "300").replace("{h}", "300") || "",
      url: a.url || "",
    });
  } catch (e) {
    res.status(500).json({ error: "Could not reach Apple Music" });
  }
}
