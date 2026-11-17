const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/7VQMGETK79';

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const RATE = 2.4;
  const f1 = v => v.toFixed(1).replace('.', ',');
  const nb = ' ';

  $('year').textContent = new Date().getFullYear();

  /* шапка */
  const header = $('header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- бюджет ---------- */
  const range = $('bRange'), board = [...document.querySelectorAll('#board li')];
  const budgetSelect = $('fBudget');
  const bandOf = v => v < 3 ? 'до ฿3 млн' : v < 5 ? '฿3–5 млн' : v < 10 ? '฿5–10 млн' : v < 25 ? '฿10–25 млн' : 'от ฿25 млн';
  const paintBudget = () => {
    const v = parseFloat(range.value);
    $('bBaht').textContent = '฿' + nb + f1(v) + ' млн';
    $('bRub').textContent = f1(v * RATE);
    $('pA').textContent = '฿' + nb + f1(v * .3) + ' млн';
    $('pB').textContent = '฿' + nb + f1(v * .2) + ' млн';
    $('pC').textContent = '฿' + nb + f1(v * .5) + ' млн';
    let n = 0;
    board.forEach(li => {
      const fit = parseFloat(li.dataset.p) <= v + 1e-9;
      li.classList.toggle('fit', fit); li.classList.toggle('over', !fit);
      if (fit) n++;
    });
    $('bCount').textContent = `В ฿${f1(v)} млн ${n === 1 ? 'входит' : 'входят'} ${n} из ${board.length} примеров каталога.`;
    range.style.setProperty('--v', ((v - 2) / 23 * 100) + '%');
  };
  range.addEventListener('input', paintBudget); paintBudget();
  const goBudget = () => { budgetSelect.value = bandOf(parseFloat(range.value)); budgetSelect.dispatchEvent(new Event('change')); };
  $('bGo').addEventListener('click', goBudget);

  /* ---------- посадочный талон: живые поля ---------- */
  const fCity = $('fCity'), fName = $('fName');
  fCity.addEventListener('input', () => { $('pFrom').textContent = fCity.value.trim() || 'Ваш город'; });
  fName.addEventListener('input', () => { $('pWho').textContent = fName.value.trim() || 'Ваше имя'; });
  budgetSelect.addEventListener('change', () => { $('pBud').textContent = budgetSelect.value; });
  $('pBud').textContent = budgetSelect.value;

  /* ---------- вкладки «что проверить» ---------- */
  const panels = [0, 1, 2, 3, 4].map(i => $('t' + i));
  document.querySelectorAll('#pills [data-pill-item]').forEach(b => b.addEventListener('click', () => {
    const k = +b.dataset.k;
    panels.forEach((p, i) => { p.hidden = i !== k; });
    document.querySelectorAll('#pills [data-pill-item]').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
  }));

  /* ---------- форма ---------- */
  const form = $('leadForm'), note = $('formNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span') || btn;
    const orig = label.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон, WhatsApp или Telegram'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    payload.page = 'Пхукет, инвестиционный тур';
    btn.disabled = true; label.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      label.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Ответим в течение 15 минут в рабочее время и согласуем маршрут тура.';
      form.reset(); $('pFrom').textContent = 'Ваш город'; $('pWho').textContent = 'Ваше имя'; $('pBud').textContent = budgetSelect.value;
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз через минуту или напишите в WhatsApp.';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });

  /* ---------- карта: остановки на линии маршрута ---------- */
  const path = $('rPath'), prog = $('rProg'), dot = $('rDot'), dotP = $('rDotP'), stopsG = $('rStops');
  const len = path.getTotalLength();
  const want = [[140, 200], [110, 382], [102, 462], [80, 566], [160, 946]];
  const names = ['HKT', 'Layan', 'Bang Tao', 'Kamala', 'Rawai'];
  const nearest = pt => { let best = 0, bd = 1e9; for (let l = 0; l <= len; l += 2) { const p = path.getPointAtLength(l); const d = (p.x - pt[0]) ** 2 + (p.y - pt[1]) ** 2; if (d < bd) { bd = d; best = l; } } return best; };
  const L = want.map(nearest); L[0] = 0; L[L.length - 1] = len;
  const circles = L.map((l, i) => {
    const p = path.getPointAtLength(l);
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 9);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', p.x + 20); t.setAttribute('y', p.y + 8); t.textContent = names[i];
    stopsG.append(c, t); return c;
  });
  const caps = [...document.querySelectorAll('#routeText .cap')], items = [...document.querySelectorAll('#routeList li')];
  let cur = -1;
  const setStop = idx => {
    if (idx === cur) return; cur = idx;
    caps.forEach((c, i) => c.classList.toggle('on', i === idx));
    items.forEach((li, i) => { li.classList.toggle('on', i === idx); li.classList.toggle('done', i < idx); });
    circles.forEach((c, i) => c.classList.toggle('on', i <= idx));
  };
  const S = { l: 0 };
  const paintRoute = () => {
    const p = path.getPointAtLength(S.l);
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dotP.setAttribute('cx', p.x); dotP.setAttribute('cy', p.y);
    prog.style.strokeDashoffset = 1 - S.l / len;
    let idx = 0; L.forEach((l, i) => { if (S.l >= l - 1) idx = i; });
    setStop(idx);
  };
  paintRoute();

  const staticState = () => {
    document.documentElement.classList.add('static');
    S.l = len; paintRoute(); caps.forEach(c => c.classList.add('on'));
    circles.forEach(c => c.classList.add('on'));
    document.querySelectorAll('.mk-roll').forEach(() => {});
  };
  if (reduce || !window.gsap || !window.ScrollTrigger) { staticState(); return; }

  /* ---------- анимации ---------- */
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: .09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = document.querySelector(id); if (!t) return;
    e.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.4 });
  }));

  /* заголовки в масках */
  document.querySelectorAll('h2.mask, #heroH').forEach(h => {
    const t = h.textContent; h.setAttribute('aria-label', t);
    h.innerHTML = `<span class="ln" aria-hidden="true"><i>${t}</i></span>`;
    const hero = h.id === 'heroH';
    gsap.from(h.querySelector('i'), { yPercent: 112, duration: hero ? 1.4 : 1.1, ease: 'expo.out', delay: hero ? .15 : 0, scrollTrigger: hero ? null : { trigger: h, start: 'top 88%' } });
  });

  /* hero: фото раскрывается, бюджет считается */
  gsap.from('#heroFig', { clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'expo.out', delay: .35 });
  gsap.from('#heroFig img', { scale: 1.2, duration: 2.2, ease: 'power3.out', delay: .35 });
  gsap.from('.hero__lead, .hero__act', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: .12, delay: .7 });
  const hb = $('heroBaht'), H = { v: 0 };
  gsap.to(H, { v: 4000000, duration: 2.2, delay: 1.1, ease: 'power3.out', onUpdate: () => { hb.textContent = '฿' + nb + Math.round(H.v).toLocaleString('ru-RU').replace(/[\s  ]/g, nb); } });

  /* манифест по словам */
  const m = $('manifest'), words = m.textContent.trim().split(/\s+/);
  m.setAttribute('aria-label', m.textContent.trim());
  m.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  gsap.to('#manifest .w', { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: m, start: 'top 80%', end: 'bottom 45%', scrub: true } });

  /* сцена маршрута: скролл ведёт метку по острову */
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.route', start: 'top top', end: '+=520%', pin: '.route__pin', scrub: .6, anticipatePin: 1 } });
  tl.to({}, { duration: .5 });
  for (let i = 1; i < L.length; i++) {
    tl.to(S, { l: L[i], duration: Math.max(.7, (L[i] - L[i - 1]) / len * 5), ease: 'power1.inOut', onUpdate: paintRoute });
    tl.to({}, { duration: .9 });
  }

  /* бюджет: строки каталога */
  gsap.from('#board li', { opacity: 0, y: 26, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '#board', start: 'top 85%' }, clearProps: 'opacity,transform' });
  gsap.from('.fee__list li', { opacity: 0, y: 28, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.fee__list', start: 'top 85%' } });
  gsap.from('.fee__fig img', { scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.fee__fig', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.fee__zero', { yPercent: 18, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.fee', start: 'top 70%' } });

  /* покупка: линия заполняется, шаги появляются */
  gsap.fromTo('#stepsBar', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps__list', start: 'top 85%', end: 'bottom 70%', scrub: true } });
  gsap.from('.steps__list li', { opacity: 0, y: 28, duration: .9, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.steps__list', start: 'top 85%' } });

  /* доверие: цифры и цитаты */
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.5, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.from('.proof__q blockquote', { opacity: 0, y: 28, duration: 1, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '.proof__q', start: 'top 85%' } });

  /* талон */
  gsap.from('.pass', { y: 50, rotate: -1.2, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.pass', start: 'top 88%' } });

  /* бегущая строка: скорость связана со скоростью скролла */
  const mq = $('marq'); let x = 0;
  gsap.ticker.add(() => {
    x -= .7 + Math.abs(lenis.velocity) * .35;
    const half = mq.scrollWidth / 2; if (-x >= half) x += half;
    mq.style.transform = `translate3d(${x}px,0,0)`;
  });
})();
