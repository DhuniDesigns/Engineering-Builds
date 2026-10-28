/* NYTA — Day 06 interactions */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- In-page links: smooth scroll, keep the URL clean ----------
     Without this the #section is written into the address bar, so a refresh
     or a shared link reopens the page halfway down (e.g. at #contact). */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) { e.preventDefault(); return; }               // placeholder links (#)
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (id === 'top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (id === 'main') {                                    // skip link: move keyboard focus too
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ---------- Active nav link + smart floating header ---------- */
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  const heroEl = document.querySelector('.hero');
  let lastY = window.scrollY, navTick = false;
  function updateNav() {
    navTick = false;
    const y = window.scrollY, vh = window.innerHeight;
    // which section owns the middle of the screen? (About until we reach Work)
    let current = 0;
    navTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < vh * 0.5) current = i; });
    navLinks.forEach((a, i) => {
      const on = i === current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    // floating header: appears when scrolling up past the hero, hides when scrolling down
    if (nav.classList.contains('is-open')) { lastY = y; return; }
    const pastHero = y > heroEl.offsetHeight * 0.45;
    if (pastHero && !nav.classList.contains('is-floating')) {
      nav.classList.add('is-floating', 'is-hidden', 'no-anim');
      requestAnimationFrame(() => nav.classList.remove('no-anim'));
    } else if (y < 80 && nav.classList.contains('is-floating')) {
      nav.classList.remove('is-floating', 'is-hidden');
    }
    if (nav.classList.contains('is-floating') && Math.abs(y - lastY) > 6) {
      nav.classList.toggle('is-hidden', y > lastY);
    }
    lastY = y;
  }
  window.addEventListener('scroll', () => { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } }, { passive: true });
  updateNav();

  /* ---------- Hero: headline words rise in, photo drifts on scroll ---------- */
  const split = document.querySelector('[data-split]');
  if (split) {
    let w = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'split-word';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--w', w++);
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          n.replaceWith(frag);
        }
      });
    };
    split.setAttribute('aria-label', split.textContent.replace(/\s+/g, ' ').trim());
    walk(split);
    requestAnimationFrame(() => requestAnimationFrame(() => split.classList.add('is-split-in')));
  }
  const heroMedia = document.querySelector('.hero__media');
  if (heroMedia && !reduceMotion) {
    setTimeout(() => heroMedia.classList.add('is-settled'), 1700);
    let hTick = false;
    const heroParallax = () => {
      hTick = false;
      const r = heroMedia.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1;
      heroMedia.querySelector('img').style.setProperty('--py', `${(-r.top * 0.12 / z).toFixed(1)}px`);
    };
    window.addEventListener('scroll', () => { if (!hTick) { hTick = true; requestAnimationFrame(heroParallax); } }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .hero__media');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Stats: odometer digits + drawn dividers ---------- */
  document.querySelectorAll('[data-odo]').forEach(el => {
    const value = el.dataset.odo;
    const suffix = el.dataset.odoSuffix || '';
    const wrap = document.createElement('span');
    wrap.className = 'odo';
    wrap.setAttribute('aria-hidden', 'true');
    [...value].forEach((ch, i) => {
      const d = Number(ch);
      const up = i % 2 === 0;                 // neighbouring columns roll in opposite directions
      const turns = 10 + i * 3;               // later columns spin a little longer
      const seq = [];
      for (let k = 0; k <= turns; k++) seq.push((d - turns + k + 100) % 10);
      if (!up) seq.reverse();
      const col = document.createElement('span');
      col.className = 'odo__col';
      const strip = document.createElement('span');
      strip.className = 'odo__strip';
      strip.innerHTML = seq.map(n => `<span>${n}</span>`).join('');
      const end = up ? -(turns) * 1.12 : 0;
      const start = up ? 0 : -(turns) * 1.12;
      strip.style.setProperty('--from', `${start}em`);
      strip.style.setProperty('--to', `${end}em`);
      strip.style.setProperty('--dur', `${1.7 + i * 0.25}s`);
      strip.style.setProperty('--delay', `${0.25 + i * 0.08}s`);
      col.appendChild(strip);
      wrap.appendChild(col);
    });
    if (suffix) {
      const s = document.createElement('span');
      s.className = 'odo__suf';
      s.textContent = suffix;
      s.style.setProperty('--delay', `${0.9 + value.length * 0.15}s`);
      wrap.appendChild(s);
    }
    el.textContent = '';
    el.appendChild(wrap);
  });

  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      // let the card settle before the numbers start rolling
      setTimeout(() => e.target.classList.add('is-counted'), reduceMotion ? 0 : 200);
      statObserver.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.stat').forEach((s, i) => {
    s.style.setProperty('--d', `${i * 120}ms`);
    statObserver.observe(s);
  });

  /* ---------- How it works: image + step carousel ---------- */
  (() => {
    const how = document.querySelector('.how');
    if (!how) return;
    const media = how.querySelector('[data-how-media]');
    const frame = how.querySelector('.how__frame');
    const slides = [...how.querySelectorAll('.how__slide')];
    const steps = [...how.querySelectorAll('.step')];
    const bars = [...how.querySelectorAll('.how__bar')];
    const fills = steps.map(s => s.querySelector('.step__fill'));
    const countEl = how.querySelector('[data-how-count]');
    const cursor = how.querySelector('.how__cursor');
    const cursorLabel = how.querySelector('[data-how-cursor]');
    const pauseBtn = how.querySelector('[data-how-pause]');
    const STEP_MS = 7000;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let current = 0, elapsed = 0, last = performance.now();
    let hovering = false, visible = false, focusWithin = false, userPaused = false;

    slides.forEach(s => { if (s.decode) s.decode().catch(() => {}); });

    function fill(i, p) {
      bars[i]?.style.setProperty('--p', p);
      fills[i]?.style.setProperty('--p', p);
    }

    function go(i, { user = false, dir = 0 } = {}) {
      const n = steps.length;
      const target = (i + n) % n;
      if (target === current && !user) return;
      const back = dir ? dir < 0 : (user && target < current);
      const prev = slides[current];
      slides.forEach(s => s.classList.remove('is-leaving', 'is-active', 'is-back'));
      if (prev !== slides[target]) prev.classList.add('is-leaving');
      void slides[target].offsetWidth;               // restart CSS animations
      slides[target].classList.add('is-active');
      if (back) slides[target].classList.add('is-back');
      media.classList.add('is-ready');

      steps.forEach((s, k) => {
        const on = k === target;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-selected', String(on));
        s.tabIndex = on ? 0 : -1;
      });
      steps.forEach((_, k) => fill(k, k < target ? 1 : 0));

      if (countEl && target !== current) {
        countEl.textContent = String(target + 1).padStart(2, '0');
        countEl.classList.remove('is-rolling', 'is-back');
        void countEl.offsetWidth;
        countEl.classList.add('is-rolling');
        if (back) countEl.classList.add('is-back');
      }
      current = target;
      elapsed = 0;
    }

    /* pointer parallax + following cursor (lerped so it feels weighty, not glued) */
    let mx = 0, my = 0, px = 0, py = 0;           // normalised -1..1
    let cx = 0, cy = 0, tx = 0, ty = 0;           // cursor position in px

    function tick(now) {
      const dt = Math.min(now - last, 100);
      last = now;
      const running = visible && !hovering && !focusWithin && !userPaused && !document.hidden && !reduceMotion;
      if (running) {
        elapsed += dt;
        fill(current, Math.min(elapsed / STEP_MS, 1));
        if (elapsed >= STEP_MS) go(current + 1);
      }
      if (fine && !reduceMotion) {
        px += (mx - px) * 0.08;
        py += (my - py) * 0.08;
        frame.style.transform = `translate3d(${(-px * 10).toFixed(2)}px, ${(-py * 8).toFixed(2)}px, 0)`;
        cx += (tx - cx) * 0.22;
        cy += (ty - cy) * 0.22;
        cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(tick);
    }

    // which half of the photo is the pointer on?
    const sideOf = e => {
      const r = media.getBoundingClientRect();
      return (e.clientX - r.left) < r.width * 0.33 ? -1 : 1;
    };

    if (fine) {
      media.addEventListener('pointerenter', e => {
        hovering = true;
        const r = media.getBoundingClientRect();
        const z = r.width / media.offsetWidth || 1;   // undo wide-screen zoom
        tx = cx = (e.clientX - r.left) / z;
        ty = cy = (e.clientY - r.top) / z;
        media.classList.add('is-hover');
      });
      media.addEventListener('pointermove', e => {
        const r = media.getBoundingClientRect();
        const z = r.width / media.offsetWidth || 1;
        tx = (e.clientX - r.left) / z;
        ty = (e.clientY - r.top) / z;
        mx = ((e.clientX - r.left) / r.width) * 2 - 1;
        my = ((e.clientY - r.top) / r.height) * 2 - 1;
        const left = sideOf(e) < 0;
        media.classList.toggle('is-left', left);
        cursorLabel.textContent = left ? 'Back' : 'Next';
      });
      media.addEventListener('pointerleave', () => {
        hovering = false; mx = my = 0;
        media.classList.remove('is-hover', 'is-pressed');
      });
    }

    // click / tap / swipe on the photo
    let sx = null, sy = null;
    media.addEventListener('pointerdown', e => {
      sx = e.clientX; sy = e.clientY;
      media.classList.add('is-pressed');
    });
    media.addEventListener('pointerup', e => {
      media.classList.remove('is-pressed');
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        const d = dx < 0 ? 1 : -1;
        go(current + d, { user: true, dir: d });
      } else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
        const d = sideOf(e);
        go(current + d, { user: true, dir: d });
      }
    });

    // steps, bars, buttons
    steps.forEach((s, i) => s.addEventListener('click', () => go(i, { user: true })));
    bars.forEach((b, i) => b.addEventListener('click', () => go(i, { user: true })));
    how.querySelector('[data-how-next]')?.addEventListener('click', () => go(current + 1, { user: true, dir: 1 }));
    how.querySelector('[data-how-prev]')?.addEventListener('click', () => go(current - 1, { user: true, dir: -1 }));
    pauseBtn?.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    });

    // keyboard on the tab list
    how.querySelector('.how__steps').addEventListener('keydown', e => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;
      if (e.key in map) next = current + map[e.key];
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = steps.length - 1;
      if (next === null) return;
      e.preventDefault();
      go(next, { user: true });
      steps[current].focus();
    });

    // pause while reading the steps or using the keyboard
    const stepsEl = how.querySelector('.how__steps');
    stepsEl.addEventListener('mouseenter', () => { hovering = true; });
    stepsEl.addEventListener('mouseleave', () => { hovering = false; });
    how.addEventListener('focusin', () => { focusWithin = true; });
    how.addEventListener('focusout', () => { focusWithin = how.contains(document.activeElement); });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.35 }).observe(how);

    go(0, { user: true });
    elapsed = reduceMotion ? STEP_MS : STEP_MS * 0.16;   // Figma shows step 1 part-filled
    fill(0, reduceMotion ? 1 : 0.16);
    requestAnimationFrame(tick);
  })();

  /* ---------- Sliders (testimonials, case studies) ---------- */
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const track = slider.querySelector('[data-track]');
    const items = [...track.children];
    const countEl = slider.querySelector('[data-count]');
    const barEl = slider.querySelector('[data-bar]');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const total = items.length;
    const pad = n => String(n).padStart(2, '0');

    const barTrackW = 150;
    barEl.style.width = (barTrackW / total) + 'px';

    function activeIndex() {
      const left = track.scrollLeft;
      let best = 0, bestDist = Infinity;
      items.forEach((item, i) => {
        const d = Math.abs(item.offsetLeft - items[0].offsetLeft - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function update() {
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      let i = activeIndex();
      if (atEnd) i = total - 1;
      countEl.textContent = `${pad(i + 1)}/${pad(total)}`;
      barEl.style.transform = `translateX(${i * (barTrackW / total)}px)`;
      prev.disabled = atStart;
      next.disabled = atEnd;
    }

    function go(dir) {
      const i = Math.max(0, Math.min(total - 1, activeIndex() + dir));
      track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);

    // drag to scroll with the mouse
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('is-dragging');
        // snap to nearest after drag
        const i = activeIndex();
        track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });
      }
    });

    // keyboard support
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    track.tabIndex = 0;

    update();
  });

  /* ---------- Campaign highlights: pinned title fades behind floating photos ---------- */
  (() => {
    const section = document.querySelector('[data-campaigns]');
    if (!section) return;
    const title = section.querySelector('[data-campaigns-title]');
    const cards = [...section.querySelectorAll('.campaign')];
    const ink = [50, 50, 50];          // --ink #323232
    const ghost = [255, 255, 255];     // ends as the Figma white-on-mist title
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // photos fade up out of a blur as they arrive
    const cardObserver = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); cardObserver.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    cards.forEach(c => cardObserver.observe(c));

    let ticking = false;
    function update() {
      ticking = false;
      const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1;
      const vh = window.innerHeight;
      const r = section.getBoundingClientRect();
      // 0 when the section reaches the top of the screen → 1 once the first photos have covered the title
      const raw = clamp(-r.top / (vh * 0.9));
      const t = reduceMotion ? 1 : easeInOut(raw);

      const pinH = vh / z;
      const titleH = title.offsetHeight;
      const startY = window.innerWidth <= 760 ? 56 : 80;
      const endY = (pinH - titleH) / 2;
      const y = startY + (endY - startY) * t;
      const scale = 1 - 0.28 * t;
      const c = ink.map((v, i) => Math.round(v + (ghost[i] - v) * t));
      title.style.transform = `translate3d(-50%, ${(y - startY).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      title.style.color = `rgb(${c.join(',')})`;
      title.style.letterSpacing = `${(0.02 * t).toFixed(3)}em`;

      // each photo drifts at its own speed for a floating, layered feel
      if (!reduceMotion && window.innerWidth > 760) {
        cards.forEach(card => {
          const cr = card.getBoundingClientRect();
          const offset = (cr.top + cr.height / 2 - vh / 2) / z;
          card.style.transform = `translate3d(0, ${(offset * Number(card.dataset.float || 0)).toFixed(1)}px, 0)`;
        });
      } else {
        cards.forEach(card => { card.style.transform = ''; });
      }
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ---------- Services: hover / tap to open one description at a time ---------- */
  (() => {
    const list = document.querySelector('[data-services]');
    if (!list) return;
    const items = [...list.querySelectorAll('.service')];
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let timer = null;
    function open(item) {
      if (item.classList.contains('is-open')) return;
      items.forEach(it => {
        const on = it === item;
        it.classList.toggle('is-open', on);
        it.querySelector('.service__toggle').setAttribute('aria-expanded', String(on));
      });
      list.classList.add('has-open');
    }
    items.forEach(item => {
      const toggle = item.querySelector('.service__toggle');
      if (fine) {
        // small hover-intent delay so sweeping the mouse across doesn't flicker
        item.addEventListener('pointerenter', () => { clearTimeout(timer); timer = setTimeout(() => open(item), 110); });
        item.addEventListener('pointerleave', () => clearTimeout(timer));
      }
      toggle.addEventListener('click', () => open(item));
      toggle.addEventListener('focus', () => open(item));
    });
    list.classList.add('has-open');
  })();

  /* ---------- Service "Request" pre-fills the contact form ---------- */
  const messageField = document.querySelector('.form textarea');
  document.querySelectorAll('[data-service]').forEach(a => {
    a.addEventListener('click', () => {
      if (messageField && !messageField.value) {
        messageField.value = `Hi NYTA, I'd like to request: ${a.dataset.service}.`;
      }
    });
  });

  /* ---------- Contact form (front-end only) ---------- */
  const form = document.querySelector('.form');
  const status = document.querySelector('.form__status');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(input => {
      const valid = input.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
        : input.value.trim().length > 0;
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    status.classList.toggle('is-ok', ok);
    if (!ok) {
      status.textContent = 'Please fill in your name, a valid email and a message.';
      return;
    }
    const btn = form.querySelector('.form__submit');
    const label = btn.querySelector('.form__label');
    btn.classList.add('is-sending');
    label.textContent = 'Sending';
    status.textContent = '';
    // no backend yet — simulate a short send so the states can be seen
    setTimeout(() => {
      btn.classList.remove('is-sending');
      label.textContent = 'Sent';
      status.textContent = 'Thanks — we’ll be in touch within one working day.';
      form.reset();
      setTimeout(() => { label.textContent = 'Submit'; }, 2600);
    }, 900);
  });
  form?.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));

  /* ---------- Talents: drag-to-scroll row, one card open at a time ---------- */
  (() => {
    const row = document.querySelector('[data-talents]');
    if (!row) return;
    const cards = [...row.querySelectorAll('.talent')];
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const zoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1;
    let dragging = false, moved = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, vel = 0, glide = null, hoverTimer = null;

    function activate(card) {
      if (!card || card.classList.contains('is-active')) return;
      cards.forEach(c => c.classList.toggle('is-active', c === card));
      row.classList.add('has-active');
    }

    // start with the featured talent where the Figma puts it (x = 359 of 1440)
    function placeStart() {
      const active = row.querySelector('.talent.is-active') || cards[0];
      const w = row.clientWidth;
      const target = w >= 1000 ? (359 / 1440) * w : (w - active.offsetWidth) / 2;
      row.scrollLeft = Math.max(0, active.offsetLeft - target);
    }
    window.addEventListener('load', placeStart);
    placeStart();

    // hover (with a tiny intent delay) or tap/focus opens a card
    cards.forEach(card => {
      if (fine) {
        card.addEventListener('pointerenter', () => {
          if (dragging) return;
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => activate(card), 90);
        });
        card.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
      }
      card.addEventListener('click', () => {
        if (moved) return;
        activate(card);
        // on touch screens, bring the opened card fully into view
        if (!fine) setTimeout(() => card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }), 80);
      });
      card.addEventListener('focus', () => activate(card));
    });
    row.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = cards.findIndex(c => c.classList.contains('is-active'));
      const next = cards[Math.min(cards.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))];
      next.focus({ preventScroll: true });
      next.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    });

    // click-and-drag with the mouse, with a little momentum on release
    row.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(glide);
      dragging = true; moved = false;
      startX = lastX = e.clientX; startLeft = row.scrollLeft; lastT = performance.now(); vel = 0;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / zoom();
      if (!moved && Math.abs(dx) > 4) { moved = true; row.classList.add('is-dragging'); clearTimeout(hoverTimer); }
      if (!moved) return;
      row.scrollLeft = startLeft - dx;
      const now = performance.now();
      vel = ((e.clientX - lastX) / zoom()) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      row.classList.remove('is-dragging');
      if (!moved || reduceMotion) { setTimeout(() => { moved = false; }, 0); return; }
      let v = vel * 16;                                   // px per frame
      const step = () => {
        v *= 0.94;
        row.scrollLeft -= v;
        if (Math.abs(v) > 0.4) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
      setTimeout(() => { moved = false; }, 0);
    });
    row.addEventListener('dragstart', e => e.preventDefault());
    row.classList.add('has-active');
  })();

  /* ---------- Close the mobile menu with Escape / when resizing up ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760 && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
})();
