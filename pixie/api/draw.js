// Pixie drawing endpoint (Vercel serverless function).
// Turns a style or scene prompt (and an optional reference image) into a reply from Claude.
// Needs the ANTHROPIC_API_KEY environment variable. Optional: PIXIE_MODEL.
// Designed and built by Hafsoh Bashar.

const MODEL = process.env.PIXIE_MODEL || 'claude-sonnet-5-5';
const LIMIT_PER_HOUR = Number(process.env.PIXIE_HOURLY_LIMIT || 40);
const hits = new Map();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ configured: !!key });
  if (req.method !== 'POST') return res.status(405).json({ code: 'method_not_allowed' });
  if (!key) return res.status(503).json({ code: 'not_configured' });

  // Light per-instance rate limit so one visitor can't drain the key.
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (recent.length >= LIMIT_PER_HOUR) return res.status(429).json({ code: 'rate_limited' });
  recent.push(now); hits.set(ip, recent);

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const { prompt, image } = body;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) return res.status(400).json({ code: 'invalid_prompt' });

  const content = [];
  if (image) {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(image));
    if (!m || image.length > 1500000) return res.status(400).json({ code: 'invalid_image' });
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({ type: 'text', text: prompt });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000, messages: [{ role: 'user', content }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ code: r.status === 429 ? 'rate_limited' : 'upstream_error' });
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ code: 'upstream_error' });
  }
};

function safeJson(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
