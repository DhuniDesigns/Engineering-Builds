/* Sello — interactions */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const zoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1;
  const icon = id => `<svg class="i"><use href="#i-${id}"/></svg>`;
  const onView = (el, cb, threshold = 0.2) => new IntersectionObserver(([en]) => cb(en.isIntersecting), { threshold }).observe(el);

  /* ---------- nav: mobile sheet ---------- */
  const nav = $('[data-nav]');
  const toggle = $('.nav__toggle');
  const sheet = $('.nav__sheet');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    sheet.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 860 && nav.classList.contains('is-open')) setMenu(false); });

  /* nav: a soft highlight glides between links on hover */
  (() => {
    const links = $('[data-glide]');
    if (!links || !fine) return;
    const glider = $('.nav__glider', links);
    const move = a => { links.style.setProperty('--gx', `${a.offsetLeft}px`); links.style.setProperty('--gw', `${a.offsetWidth}px`); };
    $$('a', links).forEach(a => a.addEventListener('pointerenter', () => {
      if (!links.classList.contains('is-gliding')) { glider.style.transition = 'none'; move(a); void glider.offsetWidth; glider.style.transition = ''; }
      move(a); links.classList.add('is-gliding');
    }));
    links.addEventListener('pointerleave', () => links.classList.remove('is-gliding'));
  })();

  /* ---------- in-page links: smooth scroll, keep the URL clean ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) { e.preventDefault(); return; }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (id === 'top') window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior, block: 'start' });
    if (id === 'main') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    if (id === 'waitlist') setTimeout(() => $('#email').focus({ preventScroll: true }), reduceMotion ? 0 : 800);
  });

  /* ---------- hero entrance ---------- */
  const hero = $('[data-hero]');
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { hero.classList.add('is-in'); $('[data-split]', hero).classList.add('is-in'); }));

  /* ---------- statement that fills in on scroll ---------- */
  const fillEl = $('[data-fill]');
  let fillWords = [];
  if (fillEl) {
    fillEl.innerHTML = fillEl.textContent.trim().split(/\s+/).map(w => `<span class="fw">${w}</span>`).join(' ');
    fillWords = $$('.fw', fillEl);
  }

  /* ---------- one scroll loop ---------- */
  const stage = $('[data-stage]');
  const stack = $('[data-stack]');
  const frows = $$('[data-frow]');
  const navLinks = $$('.nav__links a');
  const sections = navLinks.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  let ticking = false, filled = -1;
  function onScroll() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const hr = hero.getBoundingClientRect();
    nav.classList.toggle('is-past', hr.bottom < vh * 0.55);

    let active = -1;
    sections.forEach((sec, k) => { if (sec && sec.getBoundingClientRect().top < vh * 0.45) active = k; });
    const lastSec = sections[sections.length - 1];
    if (lastSec && lastSec.getBoundingClientRect().bottom < vh * 0.3) active = -1;
    navLinks.forEach((a, k) => a.classList.toggle('is-current', k === active));

    if (!reduceMotion) {
      // hero: the product settles and zooms in as you scroll toward it
      if (hr.bottom > 0) {
        const absTop = stage.getBoundingClientRect().top + y;
        const hz = clamp(y / Math.max(200, absTop - vh * 0.14));
        hero.style.setProperty('--hz', easeOut(hz).toFixed(4));
        hero.style.setProperty('--py', `${y.toFixed(1)}px`);
      }
      // feature rows: each picture zooms in as it reaches the middle
      frows.forEach(r => {
        const rr = r.getBoundingClientRect();
        if (rr.bottom < -100 || rr.top > vh + 100) return;
        const d = Math.abs(rr.top + rr.height / 2 - vh / 2) / vh;
        r.querySelector('.frow__media').style.setProperty('--mz', (1.04 - clamp(d) * 0.14).toFixed(3));
      });
      // dark band parallax
      if (stack) {
        const sr = stack.getBoundingClientRect();
        if (sr.top < vh && sr.bottom > 0) stack.style.setProperty('--sy', `${((sr.top + sr.height / 2 - vh / 2) * -0.12).toFixed(1)}px`);
      }
    }
    if (fillWords.length) {
      const fr = fillEl.getBoundingClientRect();
      const p = clamp((vh * 0.82 - fr.top) / (fr.height + vh * 0.3));
      const n = reduceMotion ? fillWords.length : Math.round(p * fillWords.length);
      if (n !== filled) { filled = n; fillWords.forEach((w, k) => w.classList.toggle('is-on', k < n)); }
    }
    floatCta.update();
  }
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };

  /* ---------- floating waitlist button: rises from the bottom once the hero button is out of sight ---------- */
  const floatCta = (() => {
    const fl = $('[data-float-cta]');
    const origin = $('[data-fly-origin]');
    const cta = $('#waitlist');
    if (!fl || !origin) return { update() {} };
    let on = false;
    const show = v => {
      if (v === on) return;
      on = v;
      fl.classList.toggle('is-on', v);
      fl.setAttribute('aria-hidden', String(!v));
      fl.tabIndex = v ? 0 : -1;
    };
    return {
      update() {
        const vh = window.innerHeight;
        // the hero button counts as gone once it slips under the floating nav
        const heroGone = origin.getBoundingClientRect().bottom < 76;
        // step aside once the waitlist section comes up, so there's never two of the same button on screen
        const ctaNear = cta ? cta.getBoundingClientRect().top < vh * 0.85 : false;
        show(heroGone && !ctaNear);
      },
    };
  })();

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('[data-reveal], [data-frow], [data-stack], [data-footer]').forEach(el => io.observe(el));

  /* ---------- hero product: a live conversation on loop ---------- */
  (() => {
    const app = $('[data-app]');
    const thread = $('[data-thread]');
    const status = $('[data-app-status]');
    const composer = $('[data-composer]');
    const preview = $('[data-convo-preview]');
    const stockNum = $('[data-stock] b');
    const stockBar = $('[data-stock-bar]');
    const handoff = $('[data-handoff]');
    const o = k => $(`[data-o="${k}"]`);
    let visible = false, resume = null;
    onView(app, v => { visible = v; if (v && resume) { const r = resume; resume = null; r(); } }, 0.15);
    const gate = () => (visible ? Promise.resolve() : new Promise(r => { resume = r; }));
    const wait = async ms => { await sleep(ms); if (!visible) await gate(); };
    function add(el) { thread.appendChild(el); thread.scrollTo({ top: thread.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); return el; }
    function bubble(who, text, img) {
      const m = document.createElement('div');
      m.className = `msg msg--${who}`;
      m.innerHTML = (img ? `<img class="msg__img" src="${img}" alt="Pink quilted handbag" width="112" height="112">` : '') + `<div class="msg__bubble"></div>` + (who === 'sello' ? `<span class="msg__who">${icon('spark')} Sello</span>` : '');
      m.querySelector('.msg__bubble').textContent = text;
      return m;
    }
    function typing(who) { const t = document.createElement('div'); t.className = `typing${who === 'them' ? ' typing--them' : ''}`; t.innerHTML = '<i></i><i></i><i></i>'; return t; }
    function setText(el, text) { if (el.textContent === text) return; el.textContent = text; el.classList.remove('is-fill'); void el.offsetWidth; el.classList.add('is-fill'); }
    function setStock(n) { stockNum.textContent = n; stockNum.classList.remove('is-tick'); void stockNum.offsetWidth; stockNum.classList.add('is-tick'); stockBar.style.width = `${n * 10}%`; stockBar.style.backgroundColor = n <= 2 ? 'var(--orange)' : ''; }
    function orderCard() {
      const c = document.createElement('div'); c.className = 'order-card';
      c.innerHTML = `<div class="order-card__head">Order ready <span>#1043</span></div><div class="order-card__row"><span>Pink quilted bag × 1</span><b>₦38,000</b></div><div class="order-card__row"><span>Delivery · Lekki</span><b>₦3,500</b></div><div class="order-card__row order-card__row--total"><span>Total</span><b>₦41,500</b></div>`;
      return c;
    }
    function sysChip() { const s = document.createElement('div'); s.className = 'sys'; s.innerHTML = `<span class="bell">${icon('bell')}</span>Ready to pay · handed to Kemi`; return s; }
    function reset() {
      thread.innerHTML = '';
      ['item', 'delivery', 'total'].forEach(k => { o(k).textContent = '—'; });
      stockNum.textContent = '3'; stockBar.style.width = '30%'; stockBar.style.backgroundColor = '';
      handoff.classList.remove('is-on');
      status.textContent = 'Sello is replying'; composer.textContent = 'Sello is handling this chat'; preview.textContent = 'Is this pink bag still…';
    }
    const script = [
      { who: 'them', text: 'Hi! Is this pink bag still available?', img: 'assets/img/bag-pink.jpg', before: 700 },
      { who: 'sello', text: 'Hi Ada! Yes, it is. The pink quilted bag is ₦38,000 and there are 3 left.', before: 1500, after: () => setText(o('item'), 'Pink quilted bag') },
      { who: 'them', text: 'Can you deliver to Lekki?', before: 1300 },
      { who: 'sello', text: 'Yes. Lekki delivery is ₦3,500 and takes 1–2 days. Shall I set up your order?', before: 1600, after: () => setText(o('delivery'), 'Lekki · ₦3,500') },
      { who: 'them', text: 'Yes please 🙏', before: 1100 },
    ];
    if (reduceMotion) {
      reset(); script.forEach(s => add(bubble(s.who, s.text, s.img))); add(orderCard()); add(sysChip());
      setText(o('item'), 'Pink quilted bag'); setText(o('delivery'), 'Lekki · ₦3,500'); setText(o('total'), '₦41,500'); setStock(2); handoff.classList.add('is-on');
      return;
    }
    (async function run() {
      for (;;) {
        reset(); await wait(900);
        for (const s of script) {
          const t = add(typing(s.who));
          status.textContent = s.who === 'sello' ? 'Sello is replying' : 'Ada is typing…';
          await wait(s.before); t.remove();
          add(bubble(s.who, s.text, s.img));
          preview.textContent = s.who === 'them' ? s.text : 'Sello: ' + s.text;
          s.after && s.after();
          await wait(s.who === 'them' ? 500 : 900);
        }
        const t = add(typing('sello')); status.textContent = 'Writing up the order';
        await wait(1300); t.remove();
        add(orderCard()); setText(o('total'), '₦41,500'); setStock(2); preview.textContent = 'Order ready · ₦41,500';
        await wait(1000);
        add(sysChip()); handoff.classList.add('is-on'); status.textContent = 'Waiting for you'; composer.textContent = 'Your turn. Send Ada the payment link';
        await wait(5200);
        thread.style.transition = 'opacity .5s ease'; thread.style.opacity = '0'; await sleep(520); thread.style.opacity = '';
      }
    })();
  })();

  /* ---------- how it works: list + floating card ---------- */
  (() => {
    const root = $('[data-how]');
    if (!root) return;
    const items = $$('.hitem', root);
    const cards = $$('.hcard', root);
    const notes = $$('.hnote', root);
    const ghosts = $('.how__ghosts', root);
    const STEP_MS = 6500;
    let i = 0, visible = false, paused = false, raf = 0, elapsed = 0, last = performance.now();
    function go(n) {
      const prev = i;
      i = (n + items.length) % items.length;
      items.forEach((it, k) => { it.classList.toggle('is-active', k === i); $('button', it).setAttribute('aria-pressed', String(k === i)); it.style.setProperty('--p', 0); });
      cards.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.classList.toggle('is-out', k === prev && prev !== i); });
      notes.forEach((nt, k) => nt.classList.toggle('is-on', k === i));
      ghosts.style.setProperty('--gx', `${-i * 124}px`);
      const sw = $('[data-switch]', root);
      sw.classList.remove('is-on');
      if (i === 1) setTimeout(() => i === 1 && sw.classList.add('is-on'), 900);
      elapsed = 0;
    }
    function frame(now) {
      if (!paused) elapsed += now - last;
      last = now;
      const p = clamp(elapsed / STEP_MS);
      items[i].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) go(i + 1);
      if (visible) raf = requestAnimationFrame(frame);
    }
    items.forEach((it, k) => $('button', it).addEventListener('click', () => go(k)));
    const grid = $('.how__grid', root);
    if (fine) { grid.addEventListener('pointerenter', () => { paused = true; }); grid.addEventListener('pointerleave', () => { paused = false; }); }
    root.addEventListener('focusin', () => { paused = true; });
    root.addEventListener('focusout', () => { paused = root.contains(document.activeElement); });
    cards.forEach(c => c.addEventListener('transitionend', () => c.classList.contains('is-out') && setTimeout(() => c.classList.remove('is-out'), 0)));
    go(0);
    if (reduceMotion) return;
    onView(grid, v => { visible = v; cancelAnimationFrame(raf); if (v) { last = performance.now(); raf = requestAnimationFrame(frame); } }, 0.25);
  })();

  /* ---------- the everyday chaos: a message crosses the seam and comes out clean ---------- */
  (() => {
    const wrap = $('[data-split-demo]');
    if (!wrap) return;
    const bubble = $('[data-bubble]');
    const raw = $('[data-raw]', bubble);
    const clean = $('[data-clean]', bubble);
    const secs = $('[data-secs]');
    const pairs = [
      ['dis bag still dey?', 'Yes, 3 left at ₦38,000. Want it delivered?'],
      ['how much', 'The gold hoops are ₦12,500.'],
      ['u deliver to ikeja??', 'Yes. Ikeja delivery is ₦3,000.'],
      ['size 42 abeg', 'Size 42 is in stock. Black or white?'],
      ['last price?', 'Let me check with Kemi for you.'],
    ];
    const times = ['4s', '3s', '5s', '2s', '3s'];
    const vertical = window.matchMedia('(max-width: 640px)');
    let k = 0, start = 0, visible = false, raf = 0;
    const HOLD_A = 900, TRAVEL = 1700, HOLD_B = 1500, FADE = 380, CYCLE = HOLD_A + TRAVEL + HOLD_B + FADE;
    function setPair(n) {
      raw.textContent = pairs[n][0]; clean.textContent = pairs[n][1];
      if (secs && secs.textContent !== times[n]) { secs.textContent = times[n]; secs.classList.remove('is-tick'); void secs.offsetWidth; secs.classList.add('is-tick'); }
    }
    function place(e) {
      if (vertical.matches) {
        const H = wrap.offsetHeight, bh = bubble.offsetHeight, y = (-0.25 + e * 0.5) * H;
        bubble.style.setProperty('--y', `${y}px`); bubble.style.setProperty('--seam', `${clamp((bh / 2 - y) / bh) * 100}%`);
      } else {
        const W = wrap.offsetWidth, bw = bubble.offsetWidth, x = (-0.25 + e * 0.5) * W;
        bubble.style.setProperty('--x', `${x}px`); bubble.style.setProperty('--seam', `${clamp((bw / 2 - x) / bw) * 100}%`);
      }
    }
    function frame(now) {
      if (!start) start = now;
      let t = now - start;
      if (t > CYCLE) { k = (k + 1) % pairs.length; setPair(k); start = now; t = 0; bubble.classList.remove('is-fading'); }
      const e = t < HOLD_A ? 0 : t < HOLD_A + TRAVEL ? easeInOut((t - HOLD_A) / TRAVEL) : 1;
      if (t > HOLD_A + TRAVEL + HOLD_B) bubble.classList.add('is-fading');
      place(e);
      if (visible) raf = requestAnimationFrame(frame);
    }
    setPair(0);
    if (reduceMotion) { place(1); return; }
    place(0);
    onView(wrap, v => { visible = v; cancelAnimationFrame(raf); if (v) { start = 0; raf = requestAnimationFrame(frame); } }, 0.2);
  })();

  /* ---------- features ---------- */
  (() => {
    const row = $('[data-stock-card]');
    if (!row) return;
    const roll = $('[data-roll]', row);
    const sc = $('.stockcard', row);
    let n = 3, timer = 0, visible = false;
    function set(v) { n = v; roll.textContent = v; roll.classList.remove('is-tick'); void roll.offsetWidth; roll.classList.add('is-tick'); sc.classList.toggle('is-low', v <= 2); }
    const step = () => set(n <= 1 ? 3 : n - 1);
    const loop = () => { clearInterval(timer); if (visible && !reduceMotion) timer = setInterval(step, 2200); };
    onView(row, v => { visible = v; loop(); }, 0.4);
    if (fine) $('.frow__media', row).addEventListener('pointerenter', () => { step(); loop(); });
  })();

  (() => {
    const seg = $('.tone__seg');
    if (!seg) return;
    const msg = $('[data-tone-msg]');
    const lines = ['Good afternoon. Yes, the pink bag is available for ₦38,000.', 'Hi love! Yes, it’s still available. ₦38,000 😊', 'Yes o! E still dey. ₦38,000. Make I package am for you?'];
    const btns = $$('button', seg);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      btns.forEach((x, k) => { x.classList.toggle('is-on', k === i); x.setAttribute('aria-pressed', String(k === i)); });
      seg.style.setProperty('--t', i);
      msg.classList.add('is-swap');
      setTimeout(() => { msg.textContent = lines[i]; msg.classList.remove('is-swap'); }, reduceMotion ? 0 : 180);
    }));
    seg.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = btns.findIndex(b => b.classList.contains('is-on'));
      const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
      btns[n].click(); btns[n].focus();
    });
  })();

  /* ---------- dark band: rotating statements + channel capsule ---------- */
  (() => {
    if (!stack) return;
    const slides = $$('.stack__slide', stack);
    const bars = $$('.stack__bars i', stack);
    const orb = $('[data-channel]', stack);
    const channels = ['ig', 'tt', 'wa'];
    const SLIDE_MS = 5200, CH_MS = 2600;
    let s = 0, c = 0, visible = false, raf = 0, t0 = 0, tc = 0;
    function show(n) {
      s = n % slides.length;
      slides.forEach((el, k) => el.classList.toggle('is-on', k === s));
      bars.forEach((b, k) => { b.classList.toggle('is-on', k === s); b.classList.toggle('is-done', k < s); b.style.setProperty('--p', 0); });
    }
    function swap() {
      c = (c + 1) % channels.length;
      orb.classList.add('is-swap');
      setTimeout(() => {
        orb.querySelector('.ch').className = `ch ch--${channels[c]} ch--xl`;
        orb.classList.remove('is-swap');
        orb.classList.remove('is-pulse'); void orb.offsetWidth; orb.classList.add('is-pulse');
      }, 300);
    }
    function frame(now) {
      if (!t0) { t0 = now; tc = now; }
      const p = clamp((now - t0) / SLIDE_MS);
      if (bars[s]) bars[s].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) { show(s + 1); t0 = now; }
      if (now - tc > CH_MS) { swap(); tc = now; }
      if (visible) raf = requestAnimationFrame(frame);
    }
    show(0);
    if (reduceMotion) return;
    onView(stack, v => { visible = v; cancelAnimationFrame(raf); if (v) { t0 = 0; raf = requestAnimationFrame(frame); } }, 0.3);
  })();

  /* ---------- FAQ: one open at a time ---------- */
  $$('[data-faq] .qa').forEach((qa, _, all) => {
    const btn = $('button', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      all.forEach(x => { x.classList.remove('is-open'); $('button', x).setAttribute('aria-expanded', 'false'); });
      if (open) { qa.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- waitlist ---------- */
  (() => {
    const form = $('[data-waitlist]');
    const input = $('input', form);
    const msg = $('[data-waitlist-msg]');
    const label = $('.waitlist__label', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        form.classList.remove('is-error'); void form.offsetWidth; form.classList.add('is-error');
        msg.textContent = 'Please enter a valid email address.';
        input.setAttribute('aria-invalid', 'true'); input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      form.classList.add('is-done');
      label.textContent = 'You’re on the list';
      msg.textContent = 'You’re on the list. We’ll email you when Sello is ready.';
      input.value = '';
      setTimeout(() => form.classList.remove('is-done'), 3200);
      setTimeout(() => { label.textContent = 'Join the waitlist'; }, 3600);
    });
    input.addEventListener('input', () => { if (msg.textContent && !form.classList.contains('is-done')) msg.textContent = ''; input.removeAttribute('aria-invalid'); });
  })();

  /* ---------- footer: live cursor coordinates ---------- */
  (() => {
    const footer = $('[data-footer]');
    const xy = $('[data-xy]');
    if (!footer || !xy || !fine) return;
    footer.addEventListener('pointermove', e => {
      const r = footer.getBoundingClientRect(), z = zoom();
      xy.textContent = `(${Math.round((e.clientX - r.left) / z)}, ${Math.round((e.clientY - r.top) / z)})`;
    });
  })();
})();
