// ==UserScript==
// @name         Trim
// @description  Shortens your Claude prompt so it uses fewer tokens. You see before and after, then choose.
// @version      0.1.0
// @author       Hafsoh Bashar
// @match        https://claude.ai/*
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  if (window.__trimLoaded) return;
  window.__trimLoaded = true;

  /* ---------- 1. The rules ---------- */

  const TIPS = {
    greet: "Skip the hello. Claude does the same work without it.",
    wellbeing: "Small talk costs tokens. Start with the task.",
    sorry: "No need to apologise. Long, clear prompts are welcome.",
    thanks: "Sign-offs like \"thanks!\" add tokens and change nothing.",
    ask: "Write the instruction directly: \"Write…\" not \"I want you to write…\".",
    canyou: "\"Could you…\" becomes a plain instruction. Claude still understands.",
    please: "Claude follows instructions without \"please\".",
    hedge: "Hedges like \"if that's okay\" can go. Claude won't mind.",
    filler: "Words like \"basically\" and \"really\" rarely change the answer.",
    just: "\"Just\" is usually filler. Keep it only when it limits something.",
    phrase: "Short phrases work: \"to\" instead of \"in order to\".",
    closer: "\"Let me know if you have questions\" isn't needed. Claude will ask.",
    dupe: "You said the same thing twice. Once is enough.",
  };

  const PHRASES = [
    [/\bin order to\b/gi, 'to'],
    [/\bdue to the fact that\b/gi, 'because'],
    [/\bat this point in time\b/gi, 'now'],
    [/\bin the event that\b/gi, 'if'],
    [/\bfor the purpose of\b/gi, 'for'],
    [/\b(is|are) able to\b/gi, 'can'],
    [/\bin spite of the fact that\b/gi, 'although'],
  ];

  const RULES = [
    { id: 'greet', re: /^\s*(hi|hello|hey|hiya|good (morning|afternoon|evening))( there)?( claude)?\s*[,!.]*\s*/i, rep: '' },
    { id: 'wellbeing', re: /\b(i )?hope (you're|you are|you have been|you've been|all is) (doing )?(well|good|great|okay|having a (good|great|nice|lovely) day)\s*[.!,]*\s*/gi, rep: '' },
    { id: 'sorry', re: /\b(sorry (to bother you|for the long message|if this is a (silly|dumb|stupid) question)|apologies for (the|my) (long )?message)\s*[.!,]*\s*/gi, rep: '' },
    { id: 'closer', re: /\b(please )?let me know if you (have any questions|need (anything else|more (info|information|details|context)))\s*[.!]*\s*/gi, rep: '' },
    { id: 'thanks', re: /\s*\b(thanks|thank you|thx|ty)( so much| a lot| very much| in advance)?( for (your|the) help)?\s*[.!]*\s*$/i, rep: '' },
    { id: 'ask', re: /\b(i was wondering if you could|i would like you to|i'd like you to|i want you to|i need you to)\s+/gi, rep: '' },
    { id: 'canyou', re: /(^|[.!?]\s+|\n\s*)(could|can|would|will) you (please |kindly )?(?=\w)/gi, rep: '$1\uE002' },
    { id: 'please', re: /\b(please|kindly)\s+/gi, rep: '' },
    { id: 'hedge', re: /,?\s*\bif (it's|it is|that's|that is) (not too much trouble|okay|ok|possible|alright|fine)\b,?/gi, rep: '' },
    { id: 'filler', re: /\b(basically|actually|literally|really|honestly|kind of|sort of|simply)\s+/gi, rep: '' },
    { id: 'just', re: /\bjust\s+(?!(the|a|an|one|this|that|these|those|my|your|his|her|their|our|\d+)\b)/gi, rep: '' },
  ];

  // Code, links and quotes are never changed.
  const PROTECT = /```[\s\S]*?```|`[^`\n]+`|https?:\/\/\S+|"[^"\n]{1,400}"|“[^”\n]{1,400}”/g;

  function trimText(input) {
    const kept = [];
    let text = input.replace(PROTECT, (m) => `${kept.push(m) - 1}`);
    const saved = {};
    const note = (id, before) => { const d = before - text.length; if (d > 0) saved[id] = (saved[id] || 0) + d; };

    for (const r of RULES) { const b = text.length; text = text.replace(r.re, r.rep); note(r.id, b); }
    { const b = text.length; for (const [re, rep] of PHRASES) text = text.replace(re, rep); note('phrase', b); }

    // A question turned into an instruction ends with a full stop.
    text = text.replace(/\uE002([^?.!\n]*)\?/g, '$1.').replace(/\uE002/g, '');

    // Drop sentences said twice.
    { const b = text.length; const seen = new Set();
      text = text.split('\n').map((line) => line.split(/(?<=[.!?])\s+/).filter((s) => {
        const k = s.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (k.length < 20) return true;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      }).join(' ')).join('\n');
      note('dupe', b); }

    // Tidy up what the rules left behind.
    text = text
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/ +([,.!?;:])/g, '$1')
      .replace(/,\s*([.!?])/g, '$1')
      .replace(/,{2,}/g, ',')
      .replace(/(^|\n)[ \t]*[,.;:]+[ \t]*/g, '$1')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (m, a, c) => a + c.toUpperCase())
      .trim();

    text = text.replace(/(\d+)/g, (m, i) => kept[+i]);
    const top = Object.entries(saved).sort((a, b) => b[1] - a[1])[0];
    return { text, tip: top ? TIPS[top[0]] : null };
  }

  const tokens = (s) => Math.max(0, Math.round(s.trim().length / 4));
  const words = (s) => (s.trim().match(/\S+/g) || []).length;

  /* ---------- 2. Talking to claude.ai's editor ---------- */

  const findEditor = () =>
    document.querySelector('div.ProseMirror[contenteditable="true"]') ||
    document.querySelector('[contenteditable="true"][role="textbox"]');

  const findSend = () =>
    document.querySelector('button[aria-label="Send message"], button[aria-label="Send Message"], button[aria-label*="send" i]');

  function readEditor(ed) {
    const blocks = [...ed.children];
    if (!blocks.length) return ed.innerText || '';
    return blocks.map((b) => b.innerText.replace(/\n$/, '')).join('\n');
  }

  async function writeEditor(ed, text) {
    ed.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ed);
    sel.removeAllRanges();
    sel.addRange(range);
    // Give the editor a moment to notice the selection.
    await new Promise((r) => setTimeout(r, 40));
    // Paste the way a person would, so ProseMirror updates properly.
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      if (ev.clipboardData && ev.clipboardData.getData('text/plain') === text) {
        ed.dispatchEvent(ev);
        if (ev.defaultPrevented) return;
      }
    } catch (e) { /* fall through */ }
    document.execCommand('insertText', false, text);
  }

  /* ---------- 3. The interface ---------- */

  const host = document.createElement('div');
  host.id = 'trim-root';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    :host{all:initial}
    *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif}
    .t{--bg:#fff;--fg:#1f1e1d;--muted:#73726c;--line:rgba(31,30,29,.12);--cut:#b4432f;--accent:#c96442;--chip:#f4f2ee}
    .t.dark{--bg:#262624;--fg:#f5f4ef;--muted:#a6a39b;--line:rgba(245,244,239,.14);--cut:#f08a72;--accent:#d97757;--chip:#30302e}
    .pill{position:fixed;pointer-events:auto;display:flex;align-items:center;gap:6px;height:32px;padding:0 12px 0 10px;border-radius:999px;
      border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:13px;font-weight:500;cursor:pointer;
      box-shadow:0 2px 10px rgba(0,0,0,.08);opacity:0;transform:translateY(4px) scale(.97);
      transition:opacity .24s ease-out,transform .32s cubic-bezier(.2,.9,.3,1.2),border-color .2s}
    .pill.on{opacity:1;transform:none}
    .pill:hover{border-color:var(--accent)}
    .pill:active{transform:scale(.96)}
    .pill:focus-visible,.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .pill b{color:var(--accent);font-weight:600}
    .pill svg{width:15px;height:15px;color:var(--accent)}
    .card{position:fixed;pointer-events:auto;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:16px;
      box-shadow:0 12px 40px rgba(0,0,0,.18);padding:16px;opacity:0;transform:translateY(8px);
      transition:opacity .26s ease-out,transform .34s cubic-bezier(.2,.9,.3,1)}
    .card.on{opacity:1;transform:none}
    .head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}
    .title{font-size:15px;font-weight:600}
    .title b{color:var(--accent)}
    .total{font-size:12px;color:var(--muted)}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .card.narrow .cols{grid-template-columns:1fr}
    .col{background:var(--chip);border-radius:10px;padding:10px 12px;max-height:210px;overflow:auto}
    .lab{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;display:flex;justify-content:space-between}
    .txt{font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
    del{color:var(--cut);text-decoration-thickness:1.5px;opacity:.85}
    .tip{margin-top:12px;font-size:12.5px;color:var(--muted);line-height:1.45}
    .tip b{color:var(--fg);font-weight:600}
    .row{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    .btn{height:34px;padding:0 14px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--fg);transition:transform .15s,background .2s}
    .btn:active{transform:scale(.97)}
    .btn.go{background:var(--accent);border-color:var(--accent);color:#fff}
    .keys{font-size:11px;color:var(--muted);margin-right:auto;align-self:center}
    .toast{position:fixed;pointer-events:auto;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;border-radius:12px;
      background:var(--fg);color:var(--bg);font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;transform:translateY(6px);
      transition:opacity .24s ease-out,transform .3s cubic-bezier(.2,.9,.3,1)}
    .toast.on{opacity:1;transform:none}
    .toast button{background:transparent;border:0;color:var(--bg);font-weight:600;font-size:13px;cursor:pointer;padding:4px 8px;border-radius:8px;text-decoration:underline}
    @media (prefers-reduced-motion:reduce){.pill,.card,.toast{transition:opacity .15s linear;transform:none!important}}
  </style>
  <div class="t">
    <button class="pill" type="button" hidden aria-label="Trim your prompt">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>
      <span class="pl">Trim</span>
    </button>
    <div class="card" hidden role="dialog" aria-label="Trim preview"></div>
    <div class="toast" hidden role="status"></div>
  </div>`;
  document.documentElement.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const wrap = $('.t'), pill = $('.pill'), card = $('.card'), toast = $('.toast');
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const store = {
    get() { try { return +localStorage.getItem('trim-saved') || 0; } catch (e) { return 0; } },
    add(n) { try { localStorage.setItem('trim-saved', String(this.get() + n)); } catch (e) {} },
  };

  let editor = null, result = null, original = '', timer = 0, toastTimer = 0;

  function show(el) {
    clearTimeout(el._t); el._want = true; el.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (el._want) el.classList.add('on'); }));
  }
  function hide(el) {
    el._want = false; el.classList.remove('on');
    clearTimeout(el._t); el._t = setTimeout(() => { if (!el._want) el.hidden = true; }, 280);
  }

  function theme() {
    if (!editor) return;
    const m = getComputedStyle(editor).color.match(/\d+/g);
    const lum = m ? (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 : 0;
    wrap.classList.toggle('dark', lum > 0.5);
  }

  // The box around the editor: the smallest parent that also holds the send button.
  function inputBox() {
    const send = findSend();
    let el = editor;
    for (let i = 0; i < 10 && el && el.parentElement; i++) {
      el = el.parentElement;
      if (send && el.contains(send)) return { box: el.getBoundingClientRect(), send: send.getBoundingClientRect() };
    }
    return { box: (editor.parentElement || editor).getBoundingClientRect(), send: null };
  }

  function place() {
    if (!editor || !editor.isConnected) return;
    const { box, send } = inputBox();
    const right = send ? send.right : box.right - 12;
    pill.style.top = `${box.top - 40}px`;
    pill.style.left = 'auto';
    pill.style.right = `${Math.max(8, innerWidth - right)}px`;
    const w = Math.min(box.width, 680);
    card.style.width = `${w}px`;
    card.style.left = `${box.left + (box.width - w) / 2}px`;
    card.style.bottom = `${innerHeight - box.top + 10}px`;
    card.classList.toggle('narrow', w < 520);
    toast.style.left = `${box.left + box.width / 2}px`;
    toast.style.bottom = `${innerHeight - box.top + 12}px`;
    toast.style.translate = '-50% 0';
  }

  function compute() {
    const text = readEditor(editor);
    const r = trimText(text);
    result = { before: text, after: r.text, tip: r.tip, saved: tokens(text) - tokens(r.text) };
    return result;
  }

  function check(force) {
    if (!editor) return;
    if (!force && words(readEditor(editor)) < 20) { hide(pill); return null; }
    const { saved } = compute();
    if (saved >= 3) {
      $('.pl').innerHTML = `Trim · save <b>~${saved}</b> tokens`;
      pill.title = 'Trim (Option+T)';
      place(); show(pill);
    } else if (force) {
      $('.pl').textContent = 'Already tight';
      place(); show(pill); setTimeout(() => hide(pill), 1600);
    } else hide(pill);
    return result;
  }

  // Word-level diff so the removed words can be struck through.
  function diff(a, b) {
    const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
    if (A.length * B.length > 4e6) return esc(a);
    const norm = (w) => w.toLowerCase();
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = norm(A[i]) === norm(B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = '';
    while (i < n) {
      if (j < m && norm(A[i]) === norm(B[j])) { out += esc(A[i]); i++; j++; }
      else if (j < m && L[i][j + 1] >= L[i + 1][j]) j++;
      else { out += /^\s+$/.test(A[i]) ? A[i] : `<del>${esc(A[i])}</del>`; i++; }
    }
    return out;
  }

  function openCard() {
    if (!editor) return;
    const r = compute();
    if (r.saved < 3) { check(true); return; }
    const pct = Math.round((r.saved / Math.max(1, tokens(r.before))) * 100);
    card.innerHTML = `
      <div class="head"><div class="title">Save <b>~${r.saved} tokens</b> (${pct}% shorter)</div>
        <div class="total">${store.get() ? `~${store.get()} saved so far` : ''}</div></div>
      <div class="cols">
        <div class="col"><div class="lab"><span>Yours</span><span>~${tokens(r.before)}</span></div><div class="txt">${diff(r.before, r.after)}</div></div>
        <div class="col"><div class="lab"><span>Trimmed</span><span>~${tokens(r.after)}</span></div><div class="txt">${esc(r.after)}</div></div>
      </div>
      ${r.tip ? `<div class="tip"><b>Tip:</b> ${esc(r.tip)}</div>` : ''}
      <div class="row"><span class="keys">Enter to use · Esc to keep yours</span>
        <button class="btn" data-a="keep" type="button">Keep mine</button>
        <button class="btn go" data-a="use" type="button">Use this</button></div>`;
    place(); hide(pill); show(card);
    card.querySelector('[data-a="use"]').focus({ preventScroll: true });
  }

  function closeCard() { if (!card.hidden) { hide(card); editor && editor.focus(); } }

  function apply() {
    if (!result || !editor) return;
    original = result.before;
    writeEditor(editor, result.after);
    store.add(result.saved);
    hide(card);
    toast.innerHTML = `Trimmed · ~${result.saved} tokens saved <button type="button">Undo</button>`;
    toast.querySelector('button').onclick = undo;
    place(); show(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => hide(toast), 6000);
  }

  function undo() {
    if (!original || !editor) return;
    writeEditor(editor, original);
    original = '';
    hide(toast);
  }

  pill.addEventListener('click', openCard);
  card.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    a.dataset.a === 'use' ? apply() : closeCard();
  });

  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyT') { e.preventDefault(); openCard(); return; }
    if (card.hidden || !card.classList.contains('on')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeCard(); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); apply(); }
  }, true);

  // Watch for typing, and for claude.ai swapping the page.
  function onInput() {
    hide(card);
    hide(pill);
    clearTimeout(timer);
    timer = setTimeout(() => check(false), 1000);
  }

  function attach() {
    const ed = findEditor();
    if (ed === editor) return;
    if (editor) editor.removeEventListener('input', onInput);
    editor = ed;
    hide(pill); hide(card);
    if (editor) { editor.addEventListener('input', onInput); theme(); }
  }

  new MutationObserver(() => attach()).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', place);
  addEventListener('scroll', place, true);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme);
  attach();

  window.__trim = { trimText, tokens }; // for testing
})();
