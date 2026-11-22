/* ARcast — shared shell: Studios panel, Contact drawer and mobile menu, used on every page.
   Panels are injected once so each page keeps a single copy of the markup. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const studios = [
    ['studio-1.webp', 'Studio 1'], ['studio-3.webp', 'Studio 2'], ['studio-4.webp', 'Studio 3'],
    ['studio-2.webp', 'Studio 4'], ['studio-5.webp', 'Studio 5'], ['studio-6.webp', 'Studio 6'],
  ];
  const links = (dark) => `
    <li><a href="index.html">Home</a></li>
    <li><button class="nav__studios" aria-expanded="false" aria-controls="studios-panel">Studios <img class="caret" src="assets/${dark ? 'caret-down-dark.svg' : 'caret-down.svg'}" alt=""></button></li>
    <li><a href="index.html#addons">Packages</a></li>
    <li><a href="index.html#addons">Memberships</a></li>
    <li><a href="about.html">About Us</a></li>
    <li><button class="nav__contact">Contact Us</button></li>
    <li><a href="index.html#community">Blog</a></li>`;

  document.body.insertAdjacentHTML('beforeend', `
  <header class="bar" data-bar aria-label="Site">
    <span class="bar__progress" aria-hidden="true"></span>
    <a class="bar__logo" href="index.html" aria-label="ARcast home"><img src="assets/logo.svg" alt="ARcast" width="112" height="32"></a>
    <ul class="nav__links bar__links">${links(false)}</ul>
    <div class="bar__right">
      <button class="btn btn-md bar__cta" data-open-contact>Book your studio</button>
      <button class="nav__burger" aria-label="Open menu"><span></span></button>
    </div>
  </header>
  <div class="sp-scrim" data-sp-scrim></div>
  <section class="sp" id="studios-panel" role="dialog" aria-modal="false" aria-label="Our studios" hidden>
    <div class="sp__nav">
      <a href="index.html" aria-label="ARcast home"><img src="assets/logo-dark.svg" alt="ARcast" width="140" height="40"></a>
      <div class="sp__navright">
        <ul class="nav__links nav__links--dark">${links(true)}</ul>
        <div class="lang lang--dark"><button aria-pressed="true">ENG</button><span></span><button aria-pressed="false" lang="ar">ARA</button></div>
        <button class="sp__close" aria-label="Close studios"><span></span></button>
      </div>
    </div>
    <div class="sp__body">
      <div class="sp__intro">
        <h2>Our Studios</h2>
        <p>Offering exceptional audio-visual quality and a seamless recording experience.</p>
        <button class="btn btn-lg sp__book" data-open-contact>Book your studio</button>
      </div>
      <div class="sp__grid">
        ${studios.map(([img, name], i) => `<article class="sp__card" style="--i:${i}">
          <img src="assets/${img}" alt="${name}" loading="lazy">
          <div class="sp__mini"><p>${name}</p><button class="sp__now" data-open-contact="${name}">Book now</button></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <div class="cd" id="contact" role="dialog" aria-modal="true" aria-labelledby="cd-title" hidden>
    <div class="cd__scrim" data-cd-close></div>
    <aside class="cd__panel">
      <div class="cd__scroll">
        <button class="cd__back" data-cd-close>Back</button>
        <h2 id="cd-title">Contact Us</h2>
        <p class="cd__lede">Have questions? Need a custom podcast solution? We’re here to help. Reach out, and let’s bring your podcast to life!</p>
        <p class="cd__topic" hidden><span>About:</span> <b></b><button type="button" aria-label="Clear topic">&times;</button></p>
        <form class="cd__form" id="cd-form" novalidate>
          <div class="cd__row">
            <label class="sr-only" for="cd-first">First name</label><input class="cd__field" id="cd-first" name="first" placeholder="First name" autocomplete="given-name" required>
            <label class="sr-only" for="cd-last">Last name</label><input class="cd__field" id="cd-last" name="last" placeholder="Last name" autocomplete="family-name">
          </div>
          <label class="sr-only" for="cd-email">Email address</label><input class="cd__field" id="cd-email" name="email" type="email" placeholder="Email address" autocomplete="email" spellcheck="false" required>
          <div class="cd__row">
            <div class="cd__cc"><label class="sr-only" for="cd-cc">Country code</label><select class="cd__field" id="cd-cc" name="cc"><option>+971</option><option>+234</option><option>+44</option><option>+1</option></select><img src="assets/caret-down-lg.svg" alt=""></div>
            <label class="sr-only" for="cd-phone">Phone number</label><input class="cd__field" id="cd-phone" name="phone" type="tel" inputmode="tel" placeholder="Phone number" autocomplete="tel-national">
          </div>
          <label class="sr-only" for="cd-msg">Message</label><textarea class="cd__field cd__msg" id="cd-msg" name="message" placeholder="Message"></textarea>
          <p class="cd__note" role="status" aria-live="polite"></p>
        </form>
        <h3 class="cd__connect">Connect with us</h3>
        <ul class="cd__list">
          <li><img src="assets/mail-dark.svg" alt=""><a href="mailto:hello@arcastdubai.com">hello@arcastdubai.com</a></li>
          <li><img src="assets/phone-dark.svg" alt=""><a href="tel:+9716583657364">+971 6583657364</a></li>
        </ul>
      </div>
      <div class="cd__done" hidden>
        <svg class="cd__tick" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29"/><path d="M20 33l8 8 16-17"/></svg>
        <h2 tabindex="-1">Your message is ready</h2>
        <p>This preview isn’t connected to the studio’s inbox yet. Send it from your email app and the ARcast team will get back to you.</p>
        <a class="btn btn-lg cd__mail" href="mailto:hello@arcastdubai.com">Open in email app</a>
        <button class="cd__again" data-cd-close>Back to the site</button>
      </div>
      <div class="cd__bar"><button class="btn btn-lg cd__send" type="submit" form="cd-form">Send</button></div>
    </aside>
  </div>

  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu">
    <button class="menu__close" aria-label="Close menu">&times;</button>
    <ul>
      <li style="--i:0"><a href="index.html">Home</a></li>
      <li style="--i:1"><button class="menu__link" data-open-studios>Studios</button></li>
      <li style="--i:2"><a href="index.html#addons">Packages</a></li>
      <li style="--i:3"><a href="about.html">About Us</a></li>
      <li style="--i:4"><button class="menu__link" data-open-contact>Contact Us</button></li>
      <li style="--i:5"><a href="index.html#community">Blog</a></li>
      <li style="--i:6"><button class="btn btn-lg" data-open-contact>Book your studio</button></li>
    </ul>
  </div>`);

  const html = document.documentElement;
  let lastFocus = null;
  const lock = (on) => { document.body.style.overflow = on ? 'hidden' : ''; };

  /* ---------- Studios panel ---------- */
  const sp = $('#studios-panel'), scrim = $('[data-sp-scrim]');
  const setStudios = (on) => {
    if (on === !sp.hidden && on === sp.classList.contains('is-open')) return;
    $$('.nav__studios').forEach((b) => b.setAttribute('aria-expanded', on));
    if (on) {
      lastFocus = document.activeElement; setMenu(false, true);
      sp.hidden = false; scrim.classList.add('is-on');
      requestAnimationFrame(() => requestAnimationFrame(() => sp.classList.add('is-open')));
      setTimeout(() => $('.sp__close', sp).focus({ preventScroll: true }), 60);
      if (innerWidth <= 1100) lock(true);
    } else {
      sp.classList.remove('is-open'); scrim.classList.remove('is-on'); lock(false);
      setTimeout(() => { if (!sp.classList.contains('is-open')) sp.hidden = true; }, reduce ? 0 : 260);
      lastFocus?.focus?.({ preventScroll: true });
    }
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav__studios, [data-open-studios]')) { e.preventDefault(); setStudios(sp.hidden || !sp.classList.contains('is-open')); }
    else if (e.target.closest('.sp__close') || e.target === scrim) setStudios(false);
  });

  /* ---------- Contact drawer (swipe right or tap outside to close) ---------- */
  const cd = $('#contact'), panel = $('.cd__panel', cd);
  const topicEl = $('.cd__topic', cd), msg = () => $('#cd-msg');
  const setTopic = (t) => {
    topicEl.hidden = !t; $('b', topicEl).textContent = (t || '').replace(/^the /, '');
    if (t && !msg().value.trim()) msg().value = `Hi ARcast, I’d like to book ${t}. `;
  };
  $('button', topicEl).addEventListener('click', () => { if (msg().value.startsWith('Hi ARcast, I’d like to book')) msg().value = ''; setTopic(''); });
  const showForm = () => { $('.cd__scroll', cd).hidden = false; $('.cd__bar', cd).hidden = false; $('.cd__done', cd).hidden = true; cd.classList.remove('is-done'); };
  const setContact = (on, topic) => {
    if (on) {
      showForm(); if (topic !== undefined) setTopic(topic);
      setStudios(false); setMenu(false, true);
      lastFocus = document.activeElement; cd.hidden = false; lock(true);
      requestAnimationFrame(() => requestAnimationFrame(() => cd.classList.add('is-open')));
      setTimeout(() => $('#cd-first').focus({ preventScroll: true }), 420);
    } else {
      cd.classList.remove('is-open'); panel.style.transform = ''; lock(false);
      setTimeout(() => { if (!cd.classList.contains('is-open')) cd.hidden = true; }, reduce ? 0 : 520);
      lastFocus?.focus?.({ preventScroll: true });
    }
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.nav__contact, [data-open-contact]');
    if (t) { e.preventDefault(); setContact(true, t.dataset.openContact || ''); }
    else if (e.target.closest('[data-cd-close]')) setContact(false);
  });
  // Drag the panel to the right; it follows 1:1 and a short flick is enough to dismiss.
  let sx = null, dx = 0, t0 = 0;
  panel.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || e.target.closest('input, textarea, select, button, a')) return;
    sx = e.clientX; dx = 0; t0 = performance.now(); panel.style.transition = 'none';
  });
  panel.addEventListener('pointermove', (e) => {
    if (sx === null) return; dx = Math.max(0, e.clientX - sx);
    panel.style.transform = `translateX(${dx}px)`;
  });
  const endDrag = () => {
    if (sx === null) return; sx = null; panel.style.transition = '';
    const v = dx / Math.max(1, performance.now() - t0);
    if (dx > panel.offsetWidth * 0.35 || v > 0.5) setContact(false); else panel.style.transform = '';
  };
  panel.addEventListener('pointerup', endDrag); panel.addEventListener('pointercancel', endDrag);
  // Keep keyboard focus inside the drawer while it is open.
  cd.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a, input, select, textarea', panel).filter((x) => !x.disabled && x.offsetParent);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  $('#cd-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, note = $('.cd__note', f);
    const bad = [f.first, f.email].find((x) => !x.value.trim() || (x.type === 'email' && !/.+@.+\..+/.test(x.value)));
    $$('.cd__field', f).forEach((x) => x.removeAttribute('aria-invalid'));
    note.classList.remove('is-in');
    requestAnimationFrame(() => {
      if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); note.textContent = bad.name === 'email' ? 'Add a valid email address so we can reply.' : 'Add your first name so we know who to reply to.'; }
      else {
        const body = [`${f.message.value.trim()}`, '', `Name: ${f.first.value.trim()} ${f.last.value.trim()}`.trim(), `Email: ${f.email.value.trim()}`, f.phone.value.trim() ? `Phone: ${f.cc.value} ${f.phone.value.trim()}` : ''].filter((x, i) => x || i === 1).join('\n');
        const subject = topicEl.hidden ? 'Hello from the ARcast website' : `Booking: ${$('b', topicEl).textContent}`;
        $('.cd__mail', cd).href = `mailto:hello@arcastdubai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        $('.cd__scroll', cd).hidden = true; $('.cd__bar', cd).hidden = true; $('.cd__done', cd).hidden = false;
        requestAnimationFrame(() => cd.classList.add('is-done'));
        setTimeout(() => $('.cd__done h2', cd).focus({ preventScroll: true }), 300);
        return;
      }
      note.classList.add('is-in');
    });
  });

  /* ---------- Language toggle (visual only for now) ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button'); if (!b) return;
    $$('button', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', x === b));
  });

  /* ---------- Mobile menu ---------- */
  const menu = $('#menu');
  function setMenu(on, silent) {
    if (!menu) return;
    menu.classList.toggle('is-open', on);
    $$('.nav__burger').forEach((b) => b.setAttribute('aria-expanded', on));
    if (!silent) lock(on);
    if (on) $('a, button.menu__link', menu)?.focus();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav__burger')) setMenu(true);
    else if (e.target.closest('#menu a, .menu__close') || e.target === menu) setMenu(false);
  });

  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!cd.hidden) setContact(false); else if (!sp.hidden) setStudios(false); else if (menu.classList.contains('is-open')) setMenu(false);
  });
  /* ---------- Sticky glass header: appears when you scroll back up ---------- */
  const bar = $('[data-bar]');
  const page = location.pathname.endsWith('about.html') ? 'about' : 'home';
  $$('a', bar).forEach((a) => { if ((page === 'about' && a.getAttribute('href') === 'about.html') || (page === 'home' && a.getAttribute('href') === 'index.html')) a.setAttribute('aria-current', 'page'); });
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, past = y > Math.min(innerHeight * 0.9, 900);
      const show = past && (y < lastY - 2 || bar.matches(':focus-within'));
      if (y > lastY + 4 || !past) bar.classList.remove('is-shown'); else if (show) bar.classList.add('is-shown');
      lastY = y; ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  if (location.hash === '#contact') setContact(true);
  if (location.hash === '#studios-panel') setStudios(true);
})();
