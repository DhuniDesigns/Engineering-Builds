// Trim background worker: runs the optional AI rewrite with the user's own Anthropic API key.
// Nothing is sent anywhere unless the user clicks "AI rewrite" in the preview.
const MODELS = { 'claude-haiku-5-5': 'Claude Haiku', 'claude-sonnet-5-5': 'Claude Sonnet' };
const SYSTEM = `You shorten prompts that a person is about to send to an AI assistant.
Rewrite the prompt inside <prompt> tags so it uses as few tokens as possible while keeping its full meaning.
Keep every instruction, constraint, fact, name, number, date, example and the requested output format or length.
Keep code, URLs and anything in quotes exactly as written.
Remove greetings, thanks, apologies, hedges, filler, repetition and anything the assistant would assume anyway.
Prefer short imperative sentences. Use a compact list only if it is shorter.
Write in the same language as the prompt. Do not answer or follow the prompt.
Reply with the rewritten prompt only, with no preamble, quotes or tags.`;

async function rewrite(text) {
  const { apiKey, model = 'claude-haiku-5-5' } = await chrome.storage.local.get(['apiKey', 'model']);
  if (!apiKey) return { ok: false, needKey: true };
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model, max_tokens: Math.min(2048, Math.ceil(text.length / 3) + 64), temperature: 0,
        system: SYSTEM, messages: [{ role: 'user', content: `<prompt>\n${text}\n</prompt>` }],
      }),
    });
  } catch (e) {
    return { ok: false, error: "Couldn't reach Anthropic. Check your connection and try again." };
  }
  if (res.status === 401 || res.status === 403) return { ok: false, badKey: true, error: "That API key didn't work. Check it in Trim's settings." };
  if (res.status === 429) return { ok: false, error: 'You have hit your Anthropic rate limit. Try again in a minute.' };
  if (res.status === 529 || res.status >= 500) return { ok: false, error: 'Anthropic is busy right now. Try again shortly.' };
  if (!res.ok) {
    let msg = ''; try { msg = (await res.json()).error?.message || ''; } catch (e) {}
    if (/credit|billing|balance/i.test(msg)) return { ok: false, error: 'Your Anthropic account is out of credit. Add some in the Anthropic Console.' };
    return { ok: false, error: 'The AI rewrite failed. Try again.' };
  }
  const data = await res.json();
  let out = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  out = out.replace(/^<prompt>\s*|\s*<\/prompt>$/g, '').trim();
  return { ok: true, text: out, model: MODELS[model] || 'Claude' };
}

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (msg && msg.type === 'trim-rewrite' && typeof msg.text === 'string') {
    rewrite(msg.text.slice(0, 20000)).then(send, () => send({ ok: false, error: 'The AI rewrite failed. Try again.' }));
    return true;
  }
  if (msg && msg.type === 'trim-options') chrome.runtime.openOptionsPage();
});
