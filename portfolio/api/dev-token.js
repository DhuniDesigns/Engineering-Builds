// GET /api/dev-token: a short-lived MusicKit developer token for connect-apple-music.html.
// Apple designs these tokens to be used in web pages. Delete this file once you are connected.
import crypto from "node:crypto";
export default function handler(req, res) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const key = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!key || !process.env.APPLE_KEY_ID || !process.env.APPLE_TEAM_ID)
    return res.status(500).json({ error: "Add APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY in Vercel first" });
  const head = b64({ alg: "ES256", kid: process.env.APPLE_KEY_ID });
  const body = b64({ iss: process.env.APPLE_TEAM_ID, iat: now, exp: now + 3600 });
  const sig = crypto.sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  res.status(200).json({ token: `${head}.${body}.${sig}` });
}
