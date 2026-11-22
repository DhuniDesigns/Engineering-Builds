/* ARcast — extra motion layer, shared by every page.
   Rules: only transform/opacity, springs for anything the pointer drives, nothing faster than
   the eye can follow, and none of it for people who ask for reduced motion. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fine = matchMedia('(pointer: fine)').matches;

  // A tiny critically-damped spring that eases a value toward its target each frame.
  function spring(apply, stiffness = 0.12, damping = 0.78) {
    let v = 0, x = 0, target = 0, raf = 0;
    const tick = () => {
      v = (v + (target - x) * stiffness) * damping; x += v; apply(x);
      raf = Math.abs(v) > 0.001 || Math.abs(target - x) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    return (t) => { target = t; if (!raf) raf = requestAnimationFrame(tick); };
  }
  function spring2(apply, k, d) { let a = 0, b = 0; const sa = spring((x) => { a = x; apply(a, b); }, k, d), sb = spring((y) => { b = y; apply(a, b); }, k, d); return (x, y) => { sa(x); sb(y); }; }

  /* 1. Section titles rise word by word from behind a mask. */
  const titles = $$('.h2, .about-copy h2, .future__head h2, .sp__intro h2').filter((h) => !h.closest('.news'));
  titles.forEach((h) => {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
          const m = document.createElement('span'); m.className = 'wm';
          const w = document.createElement('span'); w.className = 'wm__in'; w.textContent = t;
          m.appendChild(w); f.appendChild(m);
        });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && !n.classList.contains('wm')) walk(n);
    });
    walk(h);
    $$('.wm__in', h).forEach((w, i) => w.style.setProperty('--wi', i));
    h.classList.add('wm-title');
  });
  const tio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('wm-in'); tio.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  titles.forEach((h) => tio.observe(h));

  /* 2. Scroll-linked depth: hero photo drifts slower than the page, its words lift away;
        the newsletter photo and the phone mockup move a touch too. */
  const hero = $('.hero'), heroImg = $('.hero__media img'), heroText = $('.hero__content');
  const newsImg = $('.news > img'), phone = $('.iphone');
  const progress = $('.bar__progress');
  let ticking = false, heroScroll = 0, leanX = 0, leanY = 0;
  const applyHero = () => { if (heroImg) heroImg.style.translate = `${leanX.toFixed(2)}px ${(heroScroll + leanY).toFixed(2)}px`; };
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, vh = innerHeight;
      if (hero && heroImg) {
        const h = hero.offsetHeight, p = Math.min(1, y / h);
        heroScroll = y * 0.22; applyHero();
        if (heroText) { heroText.style.opacity = (1 - p * 1.4).toFixed(3); heroText.style.translate = `0 ${-y * 0.12}px`; }
      }
      if (newsImg) { const r = newsImg.parentElement.getBoundingClientRect(); newsImg.style.translate = `0 ${((r.top + r.height / 2 - vh / 2) * -0.08).toFixed(1)}px`; newsImg.style.scale = '1.12'; }
      if (phone) { const r = phone.getBoundingClientRect(); phone.style.translate = `0 ${((r.top + r.height / 2 - vh / 2) * -0.06).toFixed(1)}px`; }
      if (progress) progress.style.transform = `scaleX(${(y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4)})`;
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (fine) {
    /* 3. The hero photo leans gently toward the pointer. */
    if (hero && heroImg) {
      const lean = spring2((x, y) => { leanX = x; leanY = y; applyHero(); }, 0.06, 0.8);
      hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); lean(((e.clientX - r.left) / r.width - 0.5) * -18, ((e.clientY - r.top) / r.height - 0.5) * -12); });
      hero.addEventListener('pointerleave', () => lean(0, 0));
    }

    /* 4. Magnetic buttons: big calls to action drift a few pixels toward the cursor. */
    $$('.btn-lg, .nav__cta, .bar__cta, .flow__controls button, .future__controls button').forEach((b) => {
      const move = spring2((x, y) => { b.style.translate = `${x}px ${y}px`; }, 0.16, 0.72);
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); move((e.clientX - r.left - r.width / 2) * 0.18, (e.clientY - r.top - r.height / 2) * 0.28); });
      b.addEventListener('pointerleave', () => move(0, 0));
    });

    /* 5. 3D tilt for gear and postcards, so they feel like objects you can pick up. */
    const tilt = (el, max, lift) => {
      const t = spring2((rx, ry) => { el.style.setProperty('--rx', `${rx}deg`); el.style.setProperty('--ry', `${ry}deg`); }, 0.1, 0.76);
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); t(((e.clientY - r.top) / r.height - 0.5) * -max, ((e.clientX - r.left) / r.width - 0.5) * max); });
      el.addEventListener('pointerleave', () => t(0, 0));
      el.classList.add('tilt'); if (lift) el.classList.add('tilt--lift');
    };
    $$('.gear__img').forEach((el) => tilt(el, 14));
    $$('.pcard__img').forEach((el) => tilt(el, 12, true));

    /* 6. A soft light follows the cursor across the location cards and studio cards. */
    $$('.bento .card, .sp__card, .contact__tiles a, .parking li').forEach((el) => {
      el.classList.add('glow');
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--gx', `${e.clientX - r.left}px`); el.style.setProperty('--gy', `${e.clientY - r.top}px`); });
    });
  }

  /* 7. The offers ticker speeds up with your scroll, then settles back to a calm drift. */
  const tickerTrack = $('.ticker__track');
  if (tickerTrack) {
    tickerTrack.style.animation = 'none';
    let x = 0, speed = 0, last = performance.now(), lastY = scrollY, paused = false, visible = true;
    const ticker = tickerTrack.parentElement;
    ticker.addEventListener('pointerenter', () => paused = true);
    ticker.addEventListener('pointerleave', () => paused = false);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(ticker);
    const loop = (now) => {
      const dt = Math.min(64, now - last); last = now;
      const dy = scrollY - lastY; lastY = scrollY;
      speed += (Math.min(900, Math.abs(dy) * 30) - speed) * 0.06; // eased boost
      if (visible && !paused && !document.hidden) {
        x -= (42 + speed) * dt / 1000;
        const half = tickerTrack.scrollWidth / 2 + 20;
        if (-x >= half) x += half;
        tickerTrack.style.transform = `translate3d(${x}px,0,0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* 8. Team portraits open like a shutter as they arrive. */
  $$('.member__img').forEach((el, i) => { el.classList.add('shutter'); el.style.setProperty('--si', i); });
  const sio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('shutter-in'); sio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.shutter').forEach((el) => sio.observe(el));

  /* 9. Prices in Studio Plus count up the first time the section appears. */
  const prices = $$('.flow__meta strong');
  if (prices.length) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      prices.forEach((el) => {
        const end = parseInt(el.textContent.replace(/\D/g, ''), 10); if (!end) return;
        const t0 = performance.now(), dur = 1100;
        const step = (now) => { const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3); el.textContent = `AED ${Math.round(end * eased)}`; if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.3 }).observe($('.flow'));
  }
})();
