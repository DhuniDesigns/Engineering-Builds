
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
    preamble: "Skip the warm-up (\"So, I have a question…\"). Start with what you need.",
    forme: "\"For me\" is implied. Claude knows who it's writing for.",
  };

  const PHRASES = [
    [/\bin order to\b/gi, 'to'],
    [/\bso as to\b/gi, 'to'],
    [/\bdue to the fact that\b/gi, 'because'],
    [/\bowing to the fact that\b/gi, 'because'],
    [/\bin spite of the fact that\b/gi, 'although'],
    [/\b(at this point in time|at the present time|at the moment|right now)\b/gi, 'now'],
    [/\bin the event that\b/gi, 'if'],
    [/\bfor the purpose of\b/gi, 'for'],
    [/\b(is|are) able to\b/gi, 'can'],
    [/\b(has|have) the ability to\b/gi, 'can'],
    [/\bmake sure (that )?/gi, 'ensure '],
    [/\b(with regards? to|in regards? to)\b/gi, 'about'],
    [/\ba little bit\b/gi, 'slightly'],
    [/\b(a large number of|a great number of)\b/gi, 'many'],
    [/\bthe majority of\b/gi, 'most'],
    [/\bon a daily basis\b/gi, 'daily'],
    [/\bon a weekly basis\b/gi, 'weekly'],
    [/\bin the near future\b/gi, 'soon'],
    [/\bprior to\b/gi, 'before'],
    [/\bwhether or not\b/gi, 'whether'],
    [/\beach and every\b/gi, 'every'],
    [/\bfirst and foremost\b/gi, 'first'],
    [/\bso that it is\b/gi, "so it's"],
    [/\bmore clear\b/gi, 'clearer'],
    [/\bexplain to me\b/gi, 'explain'],
    [/\btell me what\b/gi, 'what'],
    [/\btake a look at\b/gi, 'check'],
    [/\b(give|provide) me with\b/gi, 'give me'],
    [/\bin simple terms\b/gi, 'simply'],
    [/\bwhat the difference is between\b/gi, 'the difference between'],
    [/\bdoes not seem to be working( properly)?\b/gi, "doesn't work"],
    [/\bis not working( properly)?\b/gi, "isn't working"],
  ];

  // Shorter forms that read the same. Applied last.
  const CONTRACT = [
    [/\b([Ii]t) is\b/g, "$1's"], [/\b([Tt]hat) is\b/g, "$1's"], [/\b([Tt]here) is\b/g, "$1's"],
    [/\bI am\b/g, "I'm"], [/\b([Yy]ou) are\b/g, "$1're"], [/\b([Ww]e) are\b/g, "$1're"], [/\b([Tt]hey) are\b/g, "$1're"],
    [/\b([Dd])o not\b/g, "$1on't"], [/\b([Dd])oes not\b/g, "$1oesn't"], [/\b([Dd])id not\b/g, "$1idn't"],
    [/\b([Ii])s not\b/g, "$1sn't"], [/\b([Aa])re not\b/g, "$1ren't"], [/\b([Cc])annot\b/g, "$1an't"], [/\b([Ww])ill not\b/g, "$1on't"],
    [/\bI have\b/g, "I've"], [/\bI would\b/g, "I'd"], [/\bI will\b/g, "I'll"],
  ];

  const RULES = [
    { id: 'greet', re: /^\s*(hi|hello|hey|hiya|good (morning|afternoon|evening))( there)?( claude)?\s*[,!.]*\s*/i, rep: '' },
    { id: 'wellbeing', re: /\b(i )?hope (you['’]re|you are|you have been|you['’]ve been|all is) (doing )?(well|good|great|okay|having a (good|great|nice|lovely) day)\s*[.!,]*\s*/gi, rep: '' },
    { id: 'sorry', re: /\b(sorry (to bother you|for the long message|if this is a (silly|dumb|stupid|basic) question)|apologies for (the|my) (long )?message)\s*[.!,]*\s*/gi, rep: '' },
    { id: 'preamble', re: /(^|\n|[.!?]\s+)(so|okay so|ok so|okay|ok|alright|well|um|basically|anyway)\s*,?\s+(?=[a-z])/gi, rep: '$1' },
    { id: 'preamble', re: /\b(i have a (quick |small |simple )?question( for you)?|quick question|my question is|here is (my|the) (question|request|task))\s*[.:!]*\s*/gi, rep: '' },
    { id: 'closer', re: /\b(please )?let me know if you (have any questions|need (anything else|any more|more|any|additional) (information|info|details|context)\b|need anything( else)?)\s*[.!]*\s*/gi, rep: '' },
    { id: 'closer', re: /\b(i hope (this|that) makes sense|any help (would be|is) (much |greatly |really )?appreciated|looking forward to your (reply|response|answer)|thanks for your (help|time)|i(['’]d| would) (really |greatly |truly )?appreciate (it|that|your help)( a lot| so much)?)\s*[.!]*\s*/gi, rep: '' },
    { id: 'thanks', re: /,?\s*\b(thanks|thank you|thx|ty|cheers)(\s+(so much|a lot|very much|in advance|again))*( for (your|the|all your) (help|time))?\s*[.!]*\s*$/i, rep: '' },
    { id: 'filler', re: /\b(?<!\b[Aa]n? )(basically|actually|literally|really|honestly|kind of|sort of|simply|very|extremely|quite|truly|totally|definitely|certainly|pretty much|essentially)\s+(?=[\w\uE002])/gi, rep: '' },
    { id: 'just', re: /\bjust\s+(?!(the|a|an|one|this|that|these|those|my|your|his|her|their|our|\d+)\b)/gi, rep: '' },
    { id: 'ask', re: /\b(i was (just )?wondering if you could|i was hoping (that )?you could|i would (really |greatly )?appreciate it if you could|it would be (great|nice|awesome|helpful|amazing) if you could|would it be possible (for you )?to|is it possible (for you )?to|do you think you could|i would like you to|i['’]d like you to|i want you to|i need you to)(\s+possibly)?\s+/gi, rep: '' },
    { id: 'canyou', re: /(^|[.!?]\s+|\n\s*)(could|can|would|will) you (please |kindly |possibly )?(?=\w)/gi, rep: '$1' },
    { id: 'ask', re: /\b(possibly )?help me (to )?(?=(write|rewrite|create|make|draft|fix|find|explain|summari[sz]e|edit|improve|turn|plan|build|design|generate|translate|review|shorten|come up|understand|figure out|choose|pick|decide|organi[sz]e|format|debug|optimi[sz]e)\b)/gi, rep: '' },
    { id: 'please', re: /\b(please|kindly)\s+/gi, rep: '' },
    { id: 'hedge', re: /,?\s*\bif (it['’]s|it is|that['’]s|that is) (not too much trouble|okay|ok|possible|alright|fine)\b,?/gi, rep: '' },
    { id: 'hedge', re: /,?\s*\b(if (you can|possible|you don['’]t mind|you have time)|when you get a chance)\b,?/gi, rep: '' },
    { id: 'hedge', re: /\bi (think|feel|believe|guess|suppose) (that |like )?(?=\w)/gi, rep: '' },
    { id: 'forme', re: /\b(write|make|create|draft|give|generate|explain|summari[sz]e)( [a-z ]{1,40}?)? for me\b/gi, rep: (m) => m.replace(/ for me$/i, '') },
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
    { const b = text.length; for (const [re, rep] of CONTRACT) text = text.replace(re, rep); note('phrase', b); }

    // A question turned into an instruction ends with a full stop.
    text = text.replace(/\uE002([^?.!\n]*)\?/g, '$1.').replace(/\uE002/g, '');

    // Drop sentences said twice.
    { const b = text.length; const seen = new Set();
      text = text.split('\n').map((line) => line.split(/(?<=[.!?])\s+/).filter((s) => {
        const k = s.toLowerCase().replace(/^(also|and|plus|again)[, ]+/, '').replace(/[^a-z0-9]/g, '');
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
    // Never trim a prompt down to nothing (e.g. a message that is only "Thank you").
    if (text.replace(/[\s.,!?]/g, '').length < 2) return { text: input, tip: null };
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
    *{box-sizing:border-box;margin:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif;
      -webkit-font-smoothing:antialiased;letter-spacing:-.006em}
    .t{--bg:rgba(255,255,255,.88);--solid:#fff;--fg:#17181b;--muted:#6b6f78;--faint:#9a9ea6;--line:rgba(17,18,24,.08);
      --hover:rgba(17,18,24,.045);--kbd:rgba(17,18,24,.06);--bar:rgba(17,18,24,.025);--hi:rgba(255,255,255,.9);
      --accent:#5e64e0;--accent-hi:#7378ec;--ok:#16935a;--ok-bg:rgba(22,147,90,.10);--cut:#d6383e;--cut-bg:rgba(214,56,62,.09);
      --shadow:0 0 0 1px var(--line),0 1px 2px rgba(17,18,24,.04),0 18px 48px -14px rgba(17,18,24,.22)}
    .t.dark{--bg:rgba(24,24,27,.86);--solid:#18181b;--fg:#f1f1f3;--muted:#8d9099;--faint:#5f626b;--line:rgba(255,255,255,.08);
      --hover:rgba(255,255,255,.055);--kbd:rgba(255,255,255,.08);--bar:rgba(255,255,255,.025);--hi:rgba(255,255,255,.06);
      --accent:#6c72f0;--accent-hi:#8288f6;--ok:#4cc38a;--ok-bg:rgba(76,195,138,.12);--cut:#ff6b70;--cut-bg:rgba(255,107,112,.11);
      --shadow:0 0 0 1px var(--line),0 2px 4px rgba(0,0,0,.2),0 24px 64px -16px rgba(0,0,0,.6)}
    .glass{background:var(--bg);-webkit-backdrop-filter:blur(24px) saturate(1.7);backdrop-filter:blur(24px) saturate(1.7);
      box-shadow:var(--shadow),inset 0 1px 0 var(--hi);color:var(--fg)}
    kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:5px;
      background:var(--kbd);color:var(--muted);font:500 11px/1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;letter-spacing:0}
    .num{font-variant-numeric:tabular-nums}
    button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}
    button:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 35%,transparent)}
    .btn.go:focus-visible{box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 0 0 1px color-mix(in srgb,var(--accent) 80%,#000),0 0 0 4px color-mix(in srgb,var(--accent) 30%,transparent)}

    /* Pill */
    .pill{position:fixed;pointer-events:auto;display:flex;align-items:center;gap:8px;height:30px;padding:0 6px 0 10px;border-radius:10px;
      font-size:12.5px;font-weight:500;opacity:0;transform:translateY(6px) scale(.98);
      transition:opacity .28s ease-out,transform .4s cubic-bezier(.16,1,.3,1),background .2s}
    .pill.on{opacity:1;transform:none}
    .pill:hover{background:var(--solid)}
    .pill:active{transform:scale(.97)}
    .pill .ic{width:14px;height:14px;color:var(--accent)}
    .chip{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;background:var(--ok-bg);color:var(--ok);
      font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums}
    .pill.mini{width:30px;padding:0;justify-content:center;gap:0}
    .pill.mini .ic{color:var(--muted);transition:color .2s}
    .pill.mini:hover .ic{color:var(--accent)}
    .toast .quiet{color:var(--muted);font-size:12px;display:inline-flex;align-items:center;gap:6px;padding-right:4px}
    .pill .quiet{color:var(--muted);font-weight:450}

    /* Panel */
    .card{position:fixed;pointer-events:auto;border-radius:14px;overflow:hidden;opacity:0;transform:translateY(8px) scale(.985);
      transform-origin:50% 100%;transition:opacity .3s ease-out,transform .42s cubic-bezier(.16,1,.3,1)}
    .card.on{opacity:1;transform:none}
    .head{display:flex;align-items:center;justify-content:space-between;gap:12px;height:48px;padding:0 16px;border-bottom:1px solid var(--line)}
    .crumb{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500}
    .logo{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;color:#fff;
      background:linear-gradient(180deg,var(--accent-hi),var(--accent));box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 2px rgba(0,0,0,.2)}
    .logo svg{width:13px;height:13px}
    .slash{color:var(--faint)}
    .crumb .sub{color:var(--muted);font-weight:450}
    .stat{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted)}
    .stat b{color:var(--fg);font-weight:500}
    .meter{height:2px;background:var(--line);position:relative}
    .meter i{position:absolute;inset:0;background:linear-gradient(90deg,var(--accent),var(--accent-hi));
      transform-origin:left;animation:fill .9s .12s cubic-bezier(.16,1,.3,1) both}
    @keyframes fill{from{transform:scaleX(1)}}
    .cols{display:grid;grid-template-columns:1fr 1fr}
    .card.narrow .cols{grid-template-columns:1fr}
    .col{padding:14px 16px 16px;min-width:0}
    .col + .col{border-left:1px solid var(--line)}
    .card.narrow .col + .col{border-left:0;border-top:1px solid var(--line)}
    .lab{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:12px;color:var(--muted);font-weight:500}
    .lab .num{color:var(--faint)}
    .txt{font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:196px;overflow:auto;scrollbar-width:thin}
    .col.old .txt{color:var(--muted)}
    del{color:var(--cut);background:var(--cut-bg);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--cut) 60%,transparent);
      border-radius:3px;padding:0 2px;margin:0 -1px}
    .tip{display:flex;gap:10px;align-items:flex-start;margin:0 16px 14px;padding:10px 12px;border-radius:10px;background:var(--bar);
      box-shadow:inset 0 0 0 1px var(--line);font-size:12.5px;line-height:1.5;color:var(--muted)}
    .tip svg{flex:none;width:14px;height:14px;margin-top:2px;color:var(--accent)}
    .tip b{color:var(--fg);font-weight:500}
    .foot{display:flex;align-items:center;gap:6px;height:48px;padding:0 8px 0 16px;border-top:1px solid var(--line);background:var(--bar)}
    .total{margin-right:auto;font-size:12px;color:var(--faint)}
    .btn{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 8px 0 12px;border-radius:8px;font-size:13px;font-weight:500;
      transition:background .18s,transform .15s}
    .btn:hover{background:var(--hover)}
    .btn:active{transform:scale(.97)}
    .btn.go{color:#fff;background:linear-gradient(180deg,var(--accent-hi),var(--accent));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 0 0 1px color-mix(in srgb,var(--accent) 80%,#000),0 2px 6px -2px rgba(0,0,0,.35)}
    .btn.go:hover{filter:brightness(1.06)}
    .btn.go kbd{background:rgba(255,255,255,.18);color:rgba(255,255,255,.9)}

    .btn.ai{color:var(--accent);padding:0 12px 0 10px}
    .btn.ai svg{width:14px;height:14px}
    .btn.ai[disabled]{opacity:.55;pointer-events:none}
    .card.narrow .total{display:none}
    .sk{height:10px;border-radius:5px;margin:9px 0;background:linear-gradient(90deg,var(--line) 0%,var(--hover) 50%,var(--line) 100%);background-size:200% 100%;animation:sk 1.1s linear infinite}
    @keyframes sk{to{background-position:-200% 0}}
    .tip .go-settings{margin-left:auto;flex:none;height:26px;padding:0 10px;border-radius:7px;font-size:12px;font-weight:500;color:var(--accent);box-shadow:inset 0 0 0 1px var(--line)}
    .tip .go-settings:hover{background:var(--hover)}
    .tip.warn svg{color:var(--cut)}

    /* Toast, like a HUD */
    .toast{position:fixed;pointer-events:auto;display:flex;align-items:center;gap:10px;height:40px;padding:0 6px 0 10px;border-radius:12px;
      font-size:13px;font-weight:500;opacity:0;transform:translate(-50%,8px) scale(.98);
      transition:opacity .28s ease-out,transform .4s cubic-bezier(.16,1,.3,1)}
    .toast.on{opacity:1;transform:translate(-50%,0)}
    .ok{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--ok-bg);color:var(--ok)}
    .ok svg{width:12px;height:12px}
    .toast .vr{width:1px;height:18px;background:var(--line)}
    .toast .btn{height:28px;padding:0 6px 0 10px}
    @media (prefers-reduced-motion:reduce){.pill,.card,.toast{transition:opacity .15s linear}.pill,.card{transform:none!important}
      .toast{transform:translate(-50%,0)!important}.meter i{animation:none}}
  </style>
  <div class="t">
    <button class="pill glass" type="button" hidden aria-label="Trim your prompt"></button>
    <div class="card glass" hidden role="dialog" aria-label="Trim preview"></div>
    <div class="toast glass" hidden role="status"></div>
  </div>`;
  document.documentElement.appendChild(host);


  const ICON = {
    scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };
  const $ = (s) => root.querySelector(s);
  const wrap = $('.t'), pill = $('.pill'), card = $('.card'), toast = $('.toast');
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // Runs as a userscript (Safari) or a Chrome extension. The extension keeps settings in chrome.storage.
  const EXT = typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.local && chrome.runtime && chrome.runtime.id);
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const KEY = MAC ? '⌥T' : 'Alt+T', KEYNAME = MAC ? 'Option+T' : 'Alt+T', UNDO = MAC ? '⌘Z' : 'Ctrl+Z';
  let enabled = true, savedTotal = 0;
  const store = {
    get() {
      if (EXT) return savedTotal;
      try { return +localStorage.getItem('trim-saved') || 0; } catch (e) { return 0; }
    },
    add(n) {
      if (EXT) { savedTotal += n; try { chrome.storage.local.set({ saved: savedTotal }); } catch (e) {} return; }
      try { localStorage.setItem('trim-saved', String(this.get() + n)); } catch (e) {}
    },
  };
  if (EXT) {
    try {
      chrome.storage.local.get({ enabled: true, saved: 0 }, (v) => { enabled = v.enabled !== false; savedTotal = +v.saved || 0; if (!enabled) sleep(); });
      chrome.storage.onChanged.addListener((c, area) => {
        if (area !== 'local') return;
        if (c.saved) savedTotal = +c.saved.newValue || 0;
        if (c.enabled) { enabled = c.enabled.newValue !== false; enabled ? check(false) : sleep(); }
      });
    } catch (e) {}
  }
  function sleep() { [pill, card, toast].forEach(hide); }

  let editor = null, edWatch = null, result = null, original = '', timer = 0, toastTimer = 0;

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
  }

  function compute() {
    const text = readEditor(editor);
    const r = trimText(text);
    result = { before: text, after: r.text, tip: r.tip, saved: tokens(text) - tokens(r.text) };
    return result;
  }

  function check(force) {
    if (!editor || !enabled) return;
    const text = readEditor(editor);
    if (!text.trim()) {
      if (force) { flash('Type a prompt first'); return null; }
      hide(pill); return null;
    }
    if (!force && words(text) < 20) { rest(); return null; }
    const { saved } = compute();
    if (saved >= 3) {
      pill.classList.remove('mini');
      pill.innerHTML = `${ICON.scissors.replace('<svg', '<svg class="ic"')}<span>Trim</span><span class="chip">−${saved} tokens</span><kbd>${KEY}</kbd>`;
      pill.title = `Trim your prompt (${KEYNAME})`;
      place(); show(pill);
    } else if (force) flash('Already tight', true);
    else rest();
    return result;
  }

  // The resting state: a small scissors button beside send, so Trim is always one tap away.
  function rest() {
    if (!enabled || !editor || !readEditor(editor).trim() || !card.hidden) { hide(pill); return; }
    pill.classList.add('mini');
    pill.innerHTML = ICON.scissors.replace('<svg', '<svg class="ic"');
    pill.title = `Trim your prompt (${KEYNAME})`;
    place(); show(pill);
  }

  function flash(msg, ok) {
    clearTimeout(pill._f);
    pill.classList.remove('mini');
    pill.innerHTML = `${ok ? ICON.check.replace('<svg', '<svg class="ic"') : ''}<span class="quiet">${msg}</span><kbd>${KEY}</kbd>`;
    place(); show(pill);
    pill._f = setTimeout(rest, 1800);
  }

  // Word-level diff so the removed words can be struck through.
  function diff(a, b) {
    const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
    if (A.length * B.length > 4e6) return esc(a);
    const norm = (w) => w.toLowerCase();
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = norm(A[i]) === norm(B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = '', cut = '';
    const flush = () => {
      if (!cut) return;
      const lead = cut.match(/^\s*/)[0], trail = cut.match(/\s*$/)[0];
      out += lead + `<del>${esc(cut.trim())}</del>` + trail; cut = '';
    };
    while (i < n) {
      if (j < m && norm(A[i]) === norm(B[j])) { flush(); out += esc(A[i]); i++; j++; }
      else if (j < m && L[i][j + 1] >= L[i + 1][j]) j++;
      else { cut += A[i]; i++; }
    }
    flush();
    return out;
  }

  function openCard() {
    if (!editor || !enabled) return;
    const r = compute();
    if (r.saved < 3) { check(true); return; }
    aiState = 'idle'; aiNote = null;
    renderCard();
    place(); hide(pill); show(card);
    card.querySelector('[data-a="use"]').focus({ preventScroll: true });
  }

  // aiState: idle | loading | done. aiNote: { text, warn, settings }
  let aiState = 'idle', aiNote = null;
  function renderCard() {
    const r = result;
    const before = tokens(r.before), after = tokens(r.after);
    const pct = Math.round(((before - after) / Math.max(1, before)) * 100);
    const total = store.get();
    const label = aiState === 'done' ? 'AI rewrite' : 'Trimmed';
    const right = aiState === 'loading'
      ? '<div class="sk" style="width:92%"></div><div class="sk" style="width:78%"></div><div class="sk" style="width:85%"></div><div class="sk" style="width:46%"></div>'
      : esc(r.after);
    const note = aiNote
      ? `<div class="tip${aiNote.warn ? ' warn' : ''}">${aiNote.warn ? ICON.bulb : ICON.spark}<span>${esc(aiNote.text)}</span>${aiNote.settings ? '<button class="go-settings" data-a="settings" type="button">Open settings</button>' : ''}</div>`
      : (r.tip ? `<div class="tip">${ICON.bulb}<span><b>Tip</b> · ${esc(r.tip)}</span></div>` : '');
    card.innerHTML = `
      <div class="head">
        <div class="crumb"><span class="logo">${ICON.scissors}</span>Trim<span class="slash">/</span><span class="sub">${aiState === 'done' ? 'AI rewrite' : 'Preview'}</span></div>
        <div class="stat"><span class="num"><b>~${before}</b> → <b>~${aiState === 'loading' ? '…' : after}</b> tokens</span><span class="chip">−${aiState === 'loading' ? '…' : pct}%</span></div>
      </div>
      <div class="meter"><i style="transform:scaleX(${(after / Math.max(1, before)).toFixed(3)})"></i></div>
      <div class="cols">
        <div class="col old"><div class="lab">Yours<span class="num">~${before}</span></div><div class="txt">${aiState === 'loading' ? esc(r.before) : diff(r.before, r.after)}</div></div>
        <div class="col"><div class="lab">${label}<span class="num">${aiState === 'loading' ? 'Rewriting…' : '~' + after}</span></div><div class="txt">${right}</div></div>
      </div>
      ${note}
      <div class="foot">
        <span class="total num">${total ? `~${total.toLocaleString()} tokens saved so far` : (aiState === 'done' ? 'Rewritten with your API key.' : 'Runs in your browser. Nothing leaves it.')}</span>
        <button class="btn" data-a="keep" type="button">Keep mine <kbd>esc</kbd></button>
        <button class="btn go" data-a="use" type="button">Use this <kbd>↵</kbd></button>
      </div>`;
    card.classList.toggle('narrow', card.getBoundingClientRect().width < 520);
  }

  function closeCard() { if (!card.hidden) { hide(card); editor && editor.focus(); setTimeout(rest, 300); } }

  function apply() {
    if (!result || !editor) return;
    original = result.before;
    writeEditor(editor, result.after);
    store.add(result.saved);
    hide(card);
    toast.innerHTML = `<span class="ok">${ICON.check}</span><span>Trimmed <span class="num">~${result.saved}</span> tokens</span><span class="vr"></span><button class="btn" type="button">Undo <kbd>${UNDO}</kbd></button><span class="vr"></span><span class="quiet">Again <kbd>${KEY}</kbd></span>`;
    toast.querySelector('button').onclick = undo;
    place(); show(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { hide(toast); rest(); }, 6000);
  }

  function undo() {
    if (!original || !editor) return;
    writeEditor(editor, original);
    original = '';
    hide(toast);
    setTimeout(rest, 300);
  }

  pill.addEventListener('click', openCard);
  card.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    const act = a.dataset.a;
    if (act === 'use') apply();
    else closeCard();
  });

  window.addEventListener('keydown', (e) => {
    if (enabled && e.altKey && !e.metaKey && !e.ctrlKey && e.code === 'KeyT') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!card.hidden && card.classList.contains('on')) closeCard(); else if (editor) openCard();
      return;
    }
    if (card.hidden || !card.classList.contains('on')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeCard(); }
    if (e.key === 'Enter' && !e.shiftKey && !e.target.closest?.('button:not([data-a="use"])')) { e.preventDefault(); e.stopImmediatePropagation(); if (aiState !== 'loading') apply(); }
  }, true);

  // Watch for typing, and for claude.ai swapping the page.
  let lastText = '';
  function onInput() {
    const now = editor ? readEditor(editor) : '';
    if (now === lastText) return;
    lastText = now;
    hide(card);
    if (!pill.classList.contains('mini')) hide(pill);
    clearTimeout(timer);
    timer = setTimeout(() => check(false), 1000);
  }

  function attach() {
    const ed = findEditor();
    if (ed === editor) return;
    if (editor) { editor.removeEventListener('input', onInput); editor.removeEventListener('paste', onInput); }
    if (edWatch) edWatch.disconnect();
    editor = ed;
    hide(pill); hide(card);
    if (editor) {
      editor.addEventListener('input', onInput);
      editor.addEventListener('paste', onInput);
      // Pastes and some edits skip the input event, so also watch the text itself.
      edWatch = new MutationObserver(onInput);
      edWatch.observe(editor, { childList: true, characterData: true, subtree: true });
      theme();
      if (readEditor(editor).trim()) onInput();
    }
  }

  new MutationObserver(() => attach()).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', place);
  addEventListener('scroll', place, true);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme);
  attach();

  window.__trim = { trimText, tokens }; // for testing
})();
