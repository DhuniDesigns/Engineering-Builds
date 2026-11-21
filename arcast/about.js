/* ARcast About page: words light up as you read, the founder film pushes in,
   and the postcards drop in, then slide with arrows or a drag. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal], .pcard.drop').forEach((el) => io.observe(el));

  // Reading highlight: split paragraphs into words (keeping the orange <em> runs) and light them as they pass 70% of the screen.
  const words = [];
  if (!reduce) {
    $$('.reading p').forEach((p) => {
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((t) => {
              if (!t) return;
              if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t));
              else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.appendChild(s); words.push(s); }
            });
            n.replaceWith(frag);
          } else walk(n);
        });
      };
      walk(p);
    });
  }
  const founder = $('[data-founder]'), poster = $('img', founder);
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const line = innerHeight * 0.72;
      for (const w of words) w.classList.toggle('on', w.getBoundingClientRect().top < line);
      if (!reduce) {
        const r = founder.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / (innerHeight + r.height / 2)));
        poster.style.setProperty('--zoom', (1.12 - 0.12 * p).toFixed(4));
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  // Postcards carousel.
  const wrap = $('[data-cards]'), track = $('.cards__track', wrap), cards = $$('.pcard', wrap);
  const prev = $('.future__controls .prev'), next = $('.future__controls .next');
  const px = () => innerWidth <= 760 ? 0.5 : Math.min(1, innerWidth / 1728);
  const step = () => Math.max(510 * px(), 300);
  const maxIndex = () => Math.max(0, cards.length - (innerWidth <= 760 ? 1 : 3));
  let index = 0;
  const set = (i, drag = 0) => {
    index = Math.max(0, Math.min(maxIndex(), i));
    track.style.transform = `translateX(${-index * step() + drag}px)`;
    prev.disabled = index === 0; next.disabled = index === maxIndex();
  };
  prev.addEventListener('click', () => set(index - 1));
  next.addEventListener('click', () => set(index + 1));
  let sx = null, dx = 0, t0 = 0;
  wrap.addEventListener('pointerdown', (e) => { if (e.button) return; sx = e.clientX; dx = 0; t0 = performance.now(); wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', (e) => {
    if (sx === null) return; dx = e.clientX - sx;
    if (Math.abs(dx) > 6) { wrap.classList.add('is-dragging'); const edge = (index === 0 && dx > 0) || (index === maxIndex() && dx < 0); set(index, edge ? dx * 0.35 : dx); }
  });
  const end = () => {
    if (sx === null) return; sx = null; wrap.classList.remove('is-dragging');
    const v = dx / Math.max(1, performance.now() - t0);
    set(Math.abs(dx) > step() * 0.25 || Math.abs(v) > 0.45 ? index - Math.sign(dx) : index);
  };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  addEventListener('resize', () => set(index));
  set(0);

  // Newsletter form (preview, not connected).
  const form = $('[data-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = $('.form__note', form), ok = /.+@.+\..+/.test(form.email.value.trim());
    note.classList.remove('is-in');
    requestAnimationFrame(() => { note.textContent = ok ? 'Thanks! Sign-ups aren’t connected yet in this preview.' : 'Please enter a valid email address.'; note.classList.add('is-in'); });
  });
})();
