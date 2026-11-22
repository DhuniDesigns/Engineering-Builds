/* ARcast — interactions. Motion follows a few rules: respond on press, ease out,
   never faster than the eye can follow, and stay still for people who ask for less motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const A = (f) => `assets/${f}`;

  // Hero entrance once the hero image is ready (or after a short wait).
  const heroImg = $('.hero__media img');
  const start = () => requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
  if (heroImg.complete) start(); else { heroImg.addEventListener('load', start, { once: true }); setTimeout(start, 900); }

  // Scroll reveals (one time).
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  const watch = (els) => els.forEach((el) => io.observe(el));

  /* ---------- Studio carousel (looping, drag + momentum) ---------- */
  const car = $('[data-carousel]');
  const slides = [
    ['studio-3.webp', 'Setup 1', 'Wood-panelled studio with a desk set and cameras'],
    ['studio-4.webp', 'Setup 2', 'Podcast studio set'],
    ['studio-5.webp', 'Setup 3', 'Podcast studio set'],
    ['studio-1.webp', 'Setup 4', 'Podcast studio set'],
    ['studio-2.webp', 'Setup 5', 'Podcast studio set'],
  ];
  const track = $('.carousel__track', car);
  track.style.position = 'relative';
  const nodes = slides.map(([img, name, alt], i) => {
    const s = document.createElement('div');
    s.className = 'slide';
    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${name}, ${i + 1} of ${slides.length}`);
    s.innerHTML = `<img class="slide__img" src="${A(img)}" alt="${alt}" ${i > 1 ? 'loading="lazy"' : ''} draggable="false">
      <div class="slide__nav"><button class="prev" aria-label="Previous setup"><img src="${A('chev-left.svg')}" alt=""></button><button class="next" aria-label="Next setup"><img src="${A('chev-left.svg')}" alt=""></button></div>
      <div class="dots">${slides.map((_, d) => `<button aria-label="Go to setup ${d + 1}" ${d === i ? 'aria-current="true"' : ''}></button>`).join('')}</div>
      <div class="setup-card"><p>${name}</p><button class="btn btn-md btn--light" data-open-contact="${name}">Book Your Session</button></div>`;
    Object.assign(s.style, { position: 'absolute', left: '50%', top: 0 });
    track.appendChild(s);
    return s;
  });
  let active = 0, lastOffsets = [];
  const n = slides.length;
  const step = () => nodes[0].offsetWidth + (innerWidth <= 760 ? 12 : 24 * Math.min(1, innerWidth / 1728));
  function layout(drag = 0) {
    const w = step();
    nodes.forEach((s, i) => {
      let off = ((i - active) % n + n) % n; if (off > n / 2) off -= n;
      const jumped = lastOffsets[i] !== undefined && Math.abs(off - lastOffsets[i]) > 1;
      s.style.transition = jumped || drag ? 'none' : `transform 760ms var(--ease-drawer)`;
      s.style.transform = `translateX(calc(-50% + ${off * w + drag}px))`;
      s.classList.toggle('is-active', off === 0);
      s.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
      s.inert = off !== 0;
      lastOffsets[i] = off;
    });
  }
  const go = (i) => { active = ((i % n) + n) % n; layout(); };
  car.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('prev')) go(active - 1);
    else if (b.classList.contains('next')) go(active + 1);
    else if (b.parentElement.classList.contains('dots')) go([...b.parentElement.children].indexOf(b));
  });
  car.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(active - 1); if (e.key === 'ArrowRight') go(active + 1); });
  // Drag: follow the finger 1:1, then project momentum to pick the slide.
  let sx = 0, dx = 0, hist = [], dragging = false, moved = false;
  car.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a') || e.button !== 0) return;
    dragging = true; moved = false; sx = e.clientX; dx = 0; hist = [[e.clientX, performance.now()]];
    car.setPointerCapture(e.pointerId);
  });
  car.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - sx; if (Math.abs(dx) > 6) { moved = true; car.classList.add('is-dragging'); }
    hist.push([e.clientX, performance.now()]); if (hist.length > 6) hist.shift();
    if (moved) layout(dx);
  });
  const end = () => {
    if (!dragging) return; dragging = false; car.classList.remove('is-dragging');
    if (!moved) return;
    const [x0, t0] = hist[0], [x1, t1] = hist[hist.length - 1];
    const v = (x1 - x0) / Math.max(1, t1 - t0) * 1000; // px/s
    const projected = dx + (v / 1000) * 0.998 / (1 - 0.998) * 0.35;
    // A short flick is enough: move once the projected travel passes a quarter of a slide.
    const moveBy = Math.abs(projected) > step() * 0.25 ? -Math.sign(projected) : 0;
    active = ((active + moveBy) % n + n) % n; layout();
  };
  car.addEventListener('pointerup', end); car.addEventListener('pointercancel', end);
  addEventListener('resize', () => layout());
  layout();
  // Autoplay is driven by the active dot filling up (CSS). Hover or focus pauses the fill, and the
  // slide only advances when the fill finishes, so the timer and the visual can never disagree.
  if (!reduce) {
    new IntersectionObserver(([e]) => car.classList.toggle('is-auto', e.isIntersecting), { threshold: 0.4 }).observe(car);
    car.addEventListener('animationend', (e) => { if (e.animationName === 'dotfill' && !dragging) go(active + 1); });
  }

  /* ---------- Studio Plus coverflow ---------- */
  const flow = $('[data-flow]');
  const addons = [
    ['addon-teleprompter.webp', 'Teleprompter', 'AED 50'],
    ['addon-subtitles.webp', 'Subtitles (per session)', 'AED 400'],
    ['addon-multicam.webp', 'Multi-Cam Recording', ''],
    ['addon-trailer.webp', 'Podcast Trailer', 'AED 2500'],
    ['addon-branding.webp', 'Podcast Branding', 'AED 7500'],
  ];
  // Slot geometry from the design, in design pixels.
  const SLOTS = { '-2': [-920, 220, 300, 5], '-1': [-555, 350, 450, 12], '0': [0, 520, 680, 14], '1': [555, 350, 450, 12], '2': [920, 220, 300, 5] };
  const items = addons.map(([img, name, price]) => {
    const el = document.createElement('article');
    el.className = 'flow__item';
    el.innerHTML = `<div class="flow__media"><img src="${A(img)}" alt="" loading="lazy"><button class="flow__label" data-open-contact="the ${name} add-on" tabindex="-1">${name}<img src="${A('arrow-up-right.svg')}" alt=""></button></div>
      <div class="flow__meta"><span>${name}</span>${price ? `<strong>${price}</strong>` : ''}</div>`;
    flow.insertBefore(el, $('.flow__fade', flow));
    el.addEventListener('click', (e) => { const o = el._off; if (o) flowGo(flowActive + o); else if (!e.target.closest('.flow__label')) el.querySelector('.flow__label').click(); });
    return el;
  });
  let flowActive = 2;
  function flowLayout() {
    items.forEach((el, i) => {
      let off = ((i - flowActive) % 5 + 5) % 5; if (off > 2) off -= 5;
      const jumped = el._off !== undefined && Math.abs(off - el._off) > 2;
      const [x, w, h, r] = SLOTS[off];
      el.style.transition = jumped ? 'none' : '';
      el.querySelector('.flow__media').style.transition = jumped ? 'none' : '';
      el.style.setProperty('--x', `calc(${x} * var(--px))`);
      el.style.setProperty('--w', `calc(${w} * var(--px))`);
      el.style.setProperty('--h', `calc(${h} * var(--px))`);
      el.style.setProperty('--r', `${r}px`);
      el.classList.toggle('is-center', off === 0);
      const lb = el.querySelector('.flow__label'); lb.tabIndex = off === 0 ? 0 : -1;
      el._off = off;
    });
  }
  const flowGo = (i) => { flowActive = ((i % 5) + 5) % 5; flowLayout(); };
  $('.flow__controls .prev').addEventListener('click', () => flowGo(flowActive - 1));
  $('.flow__controls .next').addEventListener('click', () => flowGo(flowActive + 1));
  flowLayout();
  // Drag Studio Plus: items follow the pointer 1:1 (with resistance past one slot),
  // then a short flick or a third of a slot is enough to move on.
  let fx = null, fdx = 0, ft = 0, fMoved = false, fPid = 0;
  const slot = () => (innerWidth <= 760 ? 0.5 : Math.min(1, innerWidth / 1728)) * 555;
  flow.addEventListener('pointerdown', (e) => {
    if (e.button || e.target.closest('button')) return;
    fx = e.clientX; fdx = 0; ft = performance.now(); fMoved = false; fPid = e.pointerId;
  });
  flow.addEventListener('pointermove', (e) => {
    if (fx === null) return;
    fdx = e.clientX - fx;
    if (!fMoved && Math.abs(fdx) > 6) { fMoved = true; flow.classList.add('is-dragging'); try { flow.setPointerCapture(fPid); } catch (_) {} }
    if (fMoved) { const s = slot(), d = Math.abs(fdx) > s ? Math.sign(fdx) * (s + (Math.abs(fdx) - s) * 0.3) : fdx; flow.style.setProperty('--dx', `${d}px`); }
  });
  const flowEnd = () => {
    if (fx === null) return; fx = null;
    if (!fMoved) return;
    const v = fdx / Math.max(1, performance.now() - ft);
    flow.classList.remove('is-dragging'); flow.style.setProperty('--dx', '0px');
    if (Math.abs(fdx) > slot() / 3 || Math.abs(v) > 0.45) flowGo(flowActive - Math.sign(fdx));
    justDragged = true; setTimeout(() => { justDragged = false; }, 50);
  };
  let justDragged = false;
  // swallow the click that follows a drag
  flow.addEventListener('click', (ev) => { if (justDragged) { ev.stopPropagation(); ev.preventDefault(); } }, true);
  flow.addEventListener('pointerup', flowEnd); flow.addEventListener('pointercancel', flowEnd);
  addEventListener('keydown', (e) => { if (!flow.matches(':hover, :focus-within')) return; if (e.key === 'ArrowLeft') flowGo(flowActive - 1); if (e.key === 'ArrowRight') flowGo(flowActive + 1); });

  /* ---------- Gear tooltips pop in as the section arrives ---------- */
  const gear = $('[data-gear]');
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; $$('.tip', gear).forEach((t) => t.classList.add('is-in')); o.disconnect();
  }, { threshold: 0.35 }).observe(gear);

  /* ---------- Welcome player: slow push-in tied to scroll ---------- */
  const player = $('[data-player]');
  const poster = $('.player__poster img', player);
  new IntersectionObserver(([e]) => player.classList.toggle('is-in', e.isIntersecting), { threshold: 0.3 }).observe(player);
  if (!reduce) {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = player.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / (innerHeight + r.height / 2)));
        poster.style.setProperty('--zoom', (1.12 - 0.12 * p).toFixed(4));
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- Community wall ---------- */
  const av50 = A('t-996b4.webp'), av40 = A('t-63329.webp');
  const LINE = { l4: A('t-4933a.png'), l5: A('t-6b4e9.png'), l6: A('t-76b74.png'), l7: A('t-1f8cd.png'), l8: A('t-64dd0.png') };
  const tweet = () => `<article class="tcard">
      <div class="tcard__who"><img class="av" src="${av50}" alt=""><div><div class="tcard__name">Sarah Johnson <img src="${A('t-85a20.svg')}" alt="Verified"></div><div class="tcard__handle">@sarahjohnson</div></div></div>
      <p class="tcard__text">The moment I stepped into ARcast’s studio, I knew my podcast was in expert hands. Incredible audio quality, pro-level equipment, and a seamless recording experience. Best in Dubai!</p>
      <div class="tcard__meta"><span>10:45 AM</span><img src="${A('t-314da.svg')}" alt=""><span>Jan 15, 2025</span></div>
      <div class="tcard__stats"><p><b>480</b> <span>retweets</span></p><p><b>3.5k</b> <span>likes</span></p></div></article>`;
  const review = () => `<article class="tcard" style="min-height:401px">
      <div class="tcard__review-head"><div class="tcard__name">Fatima Al Zahra</div>
        <div class="tcard__meta muted"><span>Jan 15, 2025</span><img src="${A('t-314da.svg')}" alt=""><span>10:45 AM</span></div>
        <div class="stars" role="img" aria-label="5 out of 5 stars">${`<img src="${A('t-606ac.svg')}" alt="">`.repeat(5)}</div></div>
      <img class="tcard__line" src="${LINE.l6}" alt="">
      <p class="tcard__text">I’ve recorded at many studios, but nothing matches ARcast’s video production quality. The multi-cam setup and lighting made my podcast look stunning!</p>
      <p class="tcard__text">The multi-camera setup captured every angle perfectly, making my podcast look like a professional talk show. The team guided me through lighting, framing, and branding, and I didn’t have to worry about a thing.</p></article>`;
  const insta = (liked) => `<article class="tcard tcard--insta">
      <div class="tcard__who"><img class="av" src="${av40}" alt=""><div class="tcard__name">adamlevine</div></div>
      <img class="tcard__line" src="${LINE.l5}" alt="">
      <div><div class="insta-row"><b>@ARcast</b><button class="${liked ? 'liked' : ''}" aria-pressed="${liked}" aria-label="Like"><img src="${A(liked ? 't-d80a4.svg' : 't-dea03.svg')}" alt=""></button></div>
      <p class="tcard__text">ARcast have the most amazing spaces, with such sleek and modern designs .</p></div></article>`;
  const post = (name, handle, paras, sb) => `<article class="tcard">
      <div class="tcard__who"><img class="av" src="${av50}" alt=""><div><div class="tcard__name ${sb ? 'sb' : ''}">${name}</div><div class="tcard__handle">${handle}</div></div></div>
      <img class="tcard__line" src="${LINE.l4}" alt="">${paras.map((p) => `<p class="tcard__text">${p}</p>`).join('')}</article>`;
  const email = () => `<article class="tcard">
      <div class="tcard__who"><img class="av" src="${av50}" alt=""><div><div class="tcard__name sb">Ellen Grace</div><div class="tcard__handle reg">ARcast is a GAME CHANGER</div></div></div>
      <div class="mail-meta"><span><b>To:</b>ARcast Team</span><span>February 5, 2025</span></div>
      <img class="tcard__line" src="${LINE.l7}" alt="">
      <p class="tcard__text">Hey ARcast Team,</p>
      <div class="tcard__text"><p>I just wrapped up my first video podcast recording at your Dubai Media City studio, and WOW – I am blown away!</p><p>🔥 The quality? Absolutely NEXT LEVEL.<br>🎙️ The acoustics were perfect, and your team made sure my setup was ideal.</p></div>
      <p class="tcard__text">The multi-angle video recording made my podcast look SO professional.<br>📝 The teleprompter saved me so much time! My audience already noticed the improvement, and my latest episode is performing better than ever. ARcast is my new go-to studio!</p>
      <p class="tcard__text">Much love,<br>Ellen</p></article>`;
  // Chat bubbles: shapes and positions taken from the design's bubble vectors.
  const abs = (l, t, extra = '') => `position:absolute;left:${l}px;top:${t}px;${extra}`;
  const chat = () => `<article class="tcard chat">
      <div class="tcard__who"><img class="av" src="${av50}" alt=""><div><div class="tcard__name sb">Martha Craig</div><div class="tcard__handle reg">tap here for contact info</div></div></div>
      <img class="tcard__line" src="${LINE.l8}" alt="">
      <div class="chat__day">Fri, Jul 26</div>
      <div class="chat__group">
        <div class="bub bub--out" style="width:221px;height:34px;overflow:hidden">
          <div style="position:absolute;inset:2.94% 0.54% 0 0.53%"><img class="shadow" src="${A('t-8b78f.svg')}" alt="" style="position:absolute;inset:-4.94% -0.75%;width:101.5%;height:109.88%"></div>
          <img class="shape" src="${A('t-ab41a.svg')}" alt="" style="position:absolute;inset:0;width:100%;height:100%">
          <img class="read" src="${A('t-842d0.svg')}" alt="Read" style="position:absolute;left:89.04%;right:3.74%;top:50%;bottom:26.47%;width:auto;height:auto">
          <p style="${abs(9.5, 7)}">Hey ARcast team!</p><time style="${abs(157, 15)}">10:10</time>
        </div>
        <div class="bub bub--out" style="width:263px;height:96px">
          <img class="shadow" src="${A('t-f2122.svg')}" alt="" style="${abs(1 - 1.64, 14.5 - 1.63, 'width:263.3px;height:84.8px')}">
          <img class="shape" src="${A('t-b9d34.svg')}" alt="" style="${abs(0, 0, 'width:262.46px;height:96px')}">
          <img class="read" src="${A('t-d12eb.svg')}" alt="" style="${abs(232.5, 79)}">
          <p style="${abs(9.46, 8, 'width:184px')}">Just finished recording at Loft Offices 3 and WOW… The quality is insane! 🔥</p>
          <time style="${abs(199, 77)}">11:43</time>
        </div>
      </div>
      <div class="chat__group">
        <div class="bub bub--in" style="width:192px;height:34px">
          <img class="shadow flip" src="${A('t-a66ff.svg')}" alt="" style="${abs(1 - 1.62, 1 - 1.63, 'width:194.2px;height:36.3px')}">
          <img class="shape flip" src="${A('t-8f0c2.svg')}" alt="" style="${abs(0, 0, 'width:192px;height:34px')}">
          <p style="${abs(16, 7)}">Glad you loved it,</p><time style="${abs(151, 17)}">11:45</time>
        </div>
        <div class="bub bub--in" style="width:234px;height:50px">
          <img class="shadow flip" src="${A('t-66ce1.svg')}" alt="" style="${abs(1 - 1.62, 1 - 1.63, 'width:235.2px;height:52.3px')}">
          <img class="shape flip" src="${A('t-9b71c.svg')}" alt="" style="${abs(0, 0, 'width:234px;height:50px')}">
          <p style="${abs(16, 5, 'width:210px')}"> How did the multi-cam setup work for you?</p><time style="${abs(195, 31)}">11:40</time>
        </div>
      </div>
      <div class="chat__group">
        <div class="bub bub--out" style="width:221px;height:34px;overflow:hidden">
          <div style="position:absolute;inset:2.94% 0.45% 0 29.41%"><img class="shadow" src="${A('t-6fac0.svg')}" alt="" style="position:absolute;inset:-4.94% -1.05%;width:102.1%;height:109.88%"></div>
          <img class="shape" src="${A('t-619cc.svg')}" alt="" style="position:absolute;left:29.41%;top:0;right:0;bottom:0;width:70.59%;height:100%">
          <img class="read" src="${A('t-842d0.svg')}" alt="" style="position:absolute;left:89.04%;right:3.74%;top:50%;bottom:26.47%;width:auto;height:auto">
          <p style="${abs(75, 7)}">Seamless!</p><time style="${abs(157, 15)}">10:10</time>
        </div>
        <div class="bub bub--out" style="width:282px;height:121px">
          <img class="shadow" src="${A('t-dfe01.svg')}" alt="" style="${abs(0.5 - 1.62, 3 - 1.63, 'width:283.2px;height:120.3px')}">
          <img class="shape" src="${A('t-07897.svg')}" alt="" style="${abs(0, 0, 'width:281.5px;height:120.5px')}">
          <img class="read" src="${A('t-d12eb.svg')}" alt="" style="${abs(251.54, 103.5)}">
          <p style="${abs(13.5, 10, 'width:198px')}">The setup was smooth, and your team was super professional. Definitely booking my next session soon. 🙌</p>
          <time style="${abs(218.04, 101.5)}">11:43</time>
        </div>
      </div></article>`;
  const david = () => post('David Malik', '@DavidMalikCEO', ['ARcast is a game-changer for corporate podcasts! The high-end audio quality and professional editing make our brand sound incredible.']);
  const ahmed = () => post('Ahmed Khan', '@KhanOnAir', ['Just tried the teleprompter feature at @ARcastDubai, and WOW! Made my delivery so smooth and natural. No more retakes—just confident podcasting.', 'I’m obsessed with the quality. Highly recommend!'], true);
  const columns = [
    [tweet, review, chat, () => insta(false)],
    [david, email, () => insta(true), tweet, chat],
    [review, () => insta(false), tweet, email],
    [ahmed, chat, review, tweet],
  ];
  const wall = $('[data-wall]');
  columns.forEach((col, ci) => {
    const c = document.createElement('div'); c.className = 'wall__col';
    const html = col.map((f) => f()).join('');
    c.innerHTML = `<div class="wall__track" style="--dur:${[78, 92, 84, 96][ci]}s">${html}<div aria-hidden="true" style="display:contents">${html}</div></div>`;
    wall.appendChild(c);
  });
  $$('[aria-hidden="true"] button', wall).forEach((b) => b.tabIndex = -1);
  wall.addEventListener('click', (e) => {
    const b = e.target.closest('.insta-row button'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); b.classList.toggle('liked', on);
    b.querySelector('img').src = A(on ? 't-d80a4.svg' : 't-dea03.svg');
  });

  /* ---------- FAQ accordion ---------- */
  $('[data-faq]').addEventListener('click', (e) => {
    const q = e.target.closest('.qa__q'); if (!q) return;
    const item = q.parentElement, open = !item.classList.contains('is-open');
    $$('.qa', item.parentElement).forEach((x) => { x.classList.remove('is-open'); $('.qa__q', x).setAttribute('aria-expanded', 'false'); });
    if (open) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
  });

  /* ---------- Newsletter (design preview: not connected yet) ---------- */
  const form = $('[data-form]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = $('.form__note', form), email = form.email.value.trim();
    note.classList.remove('is-in');
    requestAnimationFrame(() => {
      note.textContent = /.+@.+\..+/.test(email) ? 'Thanks! Sign-ups aren’t connected yet in this preview.' : 'Please enter a valid email address.';
      note.classList.add('is-in');
    });
  });

  /* ---------- Keep the phone mockup in proportion with its card ---------- */
  const phoneCard = $('.phone-card'), iphone = $('.iphone');
  new ResizeObserver(([e]) => {
    const { width, height } = e.contentRect;
    iphone.style.setProperty('--phone-scale', Math.min(1, width / 494, height / 845).toFixed(3));
  }).observe(phoneCard);

  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('is-hidden-tab', document.hidden));

  watch($$('[data-reveal]'));
})();
