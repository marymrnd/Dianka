/* A mobile-first, interaction-led birthday journey. No external UI dependencies. */
const stage = document.querySelector('#stage');
const app = document.querySelector('.app-shell');
const progress = document.querySelector('.journey-progress span');
const soundButton = document.querySelector('.sound-toggle');

const state = { chapter: 0, timers: [], soundOn: false, audio: null, hold: 0, pointerStart: null };
const wait = (ms) => new Promise((resolve) => state.timers.push(setTimeout(resolve, ms)));
const $$ = (selector, root = stage) => [...root.querySelectorAll(selector)];
const $ = (selector, root = stage) => root.querySelector(selector);

function clearTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

function scene(template, className = '') {
  const node = document.createElement('section');
  node.className = `scene ${className}`;
  node.innerHTML = template;
  stage.append(node);
  requestAnimationFrame(() => node.classList.add('is-in'));
  return node;
}

async function transition(renderNext) {
  const previous = $('.scene');
  if (previous) {
    previous.classList.remove('is-in');
    previous.classList.add('is-out');
    await new Promise((resolve) => setTimeout(resolve, 560));
    previous.remove();
  }
  clearTimers();
  renderNext();
}

function updateProgress() {
  progress.style.width = `${Math.min(100, (state.chapter / 7) * 100)}%`;
}

function next() {
  state.chapter += 1;
  updateProgress();
  const renders = [renderRoute, renderStation, renderTrain, renderHamburg, renderFestival, renderEnvelope, renderFinal];
  transition(renders[state.chapter - 1]);
}

// Small synthesized layers keep the experience alive without external audio files.
function createAudio() {
  if (state.audio) return state.audio;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  const ctx = new Context();
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  gain.connect(ctx.destination);
  state.audio = { ctx, gain, nodes: [] };
  return state.audio;
}
function stopSoundscape() {
  if (!state.audio) return;
  state.audio.nodes.forEach((node) => { try { node.stop(); } catch (_) {} });
  state.audio.nodes = [];
}
function startSoundscape(kind = 'soft') {
  if (!state.soundOn) return;
  const audio = createAudio();
  if (!audio) return;
  audio.ctx.resume();
  stopSoundscape();
  const tones = kind === 'festival' ? [55, 82.4, 110] : kind === 'train' ? [58, 87] : [130.8];
  tones.forEach((frequency, i) => {
    const osc = audio.ctx.createOscillator();
    const local = audio.ctx.createGain();
    osc.type = kind === 'festival' ? (i === 0 ? 'sawtooth' : 'sine') : 'sine';
    osc.frequency.value = frequency;
    local.gain.value = kind === 'festival' ? 0.11 / (i + 1) : 0.09 / (i + 1);
    osc.connect(local).connect(audio.gain);
    osc.start();
    audio.nodes.push(osc);
  });
}
function chirp() {
  if (!state.soundOn) return;
  const audio = createAudio();
  if (!audio) return;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.frequency.setValueAtTime(420, audio.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(680, audio.ctx.currentTime + .13);
  gain.gain.setValueAtTime(.001, audio.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.11, audio.ctx.currentTime + .02);
  gain.gain.exponentialRampToValueAtTime(.001, audio.ctx.currentTime + .2);
  osc.connect(gain).connect(audio.gain); osc.start(); osc.stop(audio.ctx.currentTime + .22);
}
soundButton.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundButton.classList.toggle('is-on', state.soundOn);
  soundButton.setAttribute('aria-pressed', state.soundOn);
  soundButton.setAttribute('aria-label', state.soundOn ? 'Вимкнути звук' : 'Увімкнути звук');
  if (state.soundOn) startSoundscape(state.chapter === 5 ? 'festival' : state.chapter === 3 ? 'train' : 'soft');
  else stopSoundscape();
});

function renderStart() {
  state.chapter = 0; updateProgress(); app.classList.remove('has-light'); startSoundscape('soft');
  const el = scene(`
    <div class="gps-orbit"><div class="gps-signal"><i></i><i></i><i></i><i></i></div><div class="gps-dot"></div></div>
    <p class="destination-state">Пошук пункту призначення...</p>
    <h1 class="destination-date">19 вересня 2026</h1>
    <p class="destination-note">До відправлення залишилося зовсім трохи.</p>
    <button class="bottom-action" type="button">Почати подорож <span>→</span></button>
  `, 'destination-scene');
  wait(2200).then(() => { $('.destination-state', el).textContent = '✓  Пункт призначення знайдено.'; $('.destination-state', el).classList.add('is-found'); chirp(); });
  wait(2880).then(() => $('.destination-date', el).classList.add('is-visible'));
  wait(3380).then(() => $('.destination-note', el).classList.add('is-visible'));
  wait(3920).then(() => $('.bottom-action', el).classList.add('is-visible'));
  $('.bottom-action', el).addEventListener('click', next);
}

function renderRoute() {
  app.classList.add('has-light'); startSoundscape('soft');
  const el = scene(`
    <div class="route-top"><span class="eyebrow">Маршрут · 19.09</span><span class="eyebrow">09:19</span></div>
    <div class="route-card"><div class="route-place"><span>Schwerin</span><div class="route-line"><i></i><i class="train-marker"></i><i></i></div><span>Hamburg</span></div><p class="route-status">Маршрут побудовано.</p></div>
    <div class="route-autostart hint">Вирушаємо…</div><div class="route-zoom"></div>
  `, 'route-scene');
  let hasDeparted = false;
  const depart = async () => {
    if (hasDeparted) return;
    hasDeparted = true;
    el.classList.add('is-travelling'); chirp();
    await wait(3100); el.classList.add('is-arrived'); await wait(1700); next();
  };
  wait(1200).then(depart);
}

function renderStation() {
  startSoundscape('soft');
  const el = scene(`
    <div class="station-name"><div><span class="eyebrow">Платформа 3</span><h1 class="scene-title">Schwerin<br>Hbf.</h1></div><span class="station-time">10:04</span></div>
    <div class="departure-board"><p>RE1&nbsp;&nbsp; Hamburg Hbf</p><span>10:19</span><p>за 15 хв</p><span>●</span></div>
    <div class="platform"><div class="meeting-glow"></div><div class="traveler maria"><div class="portrait portrait--maria"><span>М</span></div><p>Моріарті</p></div><div class="traveler diana"><div class="portrait portrait--diana"><span>Д</span></div><p>Діана</p></div><div class="station-train"><i class="door"></i></div></div>
    <div class="chat-strip"><p class="chat m1"><b>Моріарті</b>Вже тут?</p><p class="chat right d1"><b>Діана</b>Ага.</p><p class="chat m2"><b>Моріарті</b>Пішли.</p></div>
    <div class="tap-next hint">Зачекай трохи</div>
  `, 'station-scene');
  wait(600).then(() => el.classList.add('people-in'));
  wait(1500).then(() => el.classList.add('is-greeting'));
  wait(2700).then(() => $('.m1', el).classList.add('is-show'));
  wait(5000).then(() => $('.d1', el).classList.add('is-show'));
  wait(7600).then(() => { $('.m1', el).classList.remove('is-show'); $('.m2', el).classList.add('is-show'); });
  wait(10500).then(() => { $('.station-train', el).classList.add('is-arrive'); chirp(); });
  wait(12200).then(() => { $('.station-train', el).classList.add('is-open'); $('.tap-next', el).textContent = 'Натисни, щоб зайти'; });
  el.addEventListener('click', () => { if ($('.station-train', el).classList.contains('is-open')) next(); });
}

function renderTrain() {
  startSoundscape('train');
  const el = scene(`
    <div class="train-header"><span class="eyebrow">RE1 · В дорозі</span><span class="delay">+6 хв</span></div>
    <div class="delay-notice"><strong>+6 хв</strong><span>Невелика затримка</span></div>
    <div class="train-interior"><div class="train-window"><div class="sky"></div><div class="mountains"></div><div class="lake"></div><div class="fields"></div><div class="window-reflection"></div></div><div class="seat seat-one"></div><div class="seat seat-two"></div><div class="coffee-pair"><i class="cup">☕</i><i class="cup">☕</i></div></div>
    <div class="train-caption"><p class="chat t1"><b>Моріарті</b>Треш-Надюш.</p><p class="chat right t2"><b>Діана</b>😂</p></div>
    <div class="hold-control"><span>Утримуй, щоб їхати далі</span></div>
  `, 'train-scene');
  wait(1400).then(() => $('.coffee-pair', el).classList.add('is-show'));
  wait(2500).then(() => el.classList.add('is-delay'));
  wait(3300).then(() => el.classList.add('show-lake'));
  wait(4700).then(() => $('.t1', el).classList.add('is-show'));
  wait(6000).then(() => { $('.t2', el).classList.add('is-show'); control.classList.add('is-ready'); });
  const control = $('.hold-control', el);
  let frame; let startedAt;
  const endHold = () => { cancelAnimationFrame(frame); startedAt = null; };
  const tick = (now) => {
    const pct = Math.min(100, ((now - startedAt) / 1500) * 100);
    control.style.setProperty('--hold', `${pct}%`);
    if (pct >= 100) { control.classList.add('is-done'); chirp(); setTimeout(next, 480); return; }
    frame = requestAnimationFrame(tick);
  };
  control.addEventListener('pointerdown', (event) => { event.preventDefault(); startedAt = performance.now(); frame = requestAnimationFrame(tick); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((event) => control.addEventListener(event, () => { if (!control.classList.contains('is-done')) { endHold(); control.style.setProperty('--hold', '0%'); } }));
}

function renderHamburg() {
  startSoundscape('soft');
  const el = scene(`
    <div class="hamburg-map"></div><div class="walk-head"><div><span class="eyebrow">Hamburg · 19.09</span><h1 class="scene-title">Місто<br>попереду.</h1></div><span class="eyebrow">11 km</span></div>
    <div class="walk-photo"><div class="cityline"><i style="--h:54%"></i><i style="--h:79%"></i><i style="--h:66%"></i><i style="--h:92%"></i><i style="--h:61%"></i><i style="--h:74%"></i><i style="--h:47%"></i></div><i class="flash"></i></div>
    <div class="moments"><div class="moment"><time>13:15</time><span>Кава</span><b>✓</b></div><div class="moment"><time>15:40</time><span>Прогулянка біля води</span><b>✓</b></div><div class="moment"><time>18:20</time><span>Майже прийшли...</span><b>→</b></div></div>
    <div class="walk-action"><span>Свайпай, щоб іти</span><span class="walk-meter"><i></i></span></div>
  `, 'hamburg-scene');
  let distance = 0; let startX = null;
  const setDistance = (delta) => { distance = Math.max(0, Math.min(3, distance + delta)); el.classList.toggle('is-walking', distance > 0); $$('.moment', el).forEach((item, i) => item.classList.toggle('is-done', i < distance)); $('.walk-action', el).style.setProperty('--walk', `${(distance / 3) * 100}%`); if (distance === 3) { $('.walk-action span:first-child', el).textContent = 'Вечір стає гучнішим'; setTimeout(next, 900); } };
  el.addEventListener('pointerdown', (event) => { startX = event.clientX; });
  el.addEventListener('pointerup', (event) => { if (startX !== null && Math.abs(event.clientX - startX) > 18) { setDistance(1); chirp(); } startX = null; });
  el.addEventListener('click', (event) => { if (event.target.closest('.walk-action') && distance < 3) { setDistance(1); chirp(); } });
}

function renderFestival() {
  startSoundscape('festival');
  const el = scene(`
    <div class="dance-orb"></div><div class="festival-stage"><i></i><i></i><i></i></div><div class="crowd"></div>
    <div class="festival-label"><p class="eyebrow">St. Pauli · Hamburg</p><h1 class="festival-name">REEPERBAHN<br>FESTIVAL</h1><p class="festival-year">19 SEPTEMBER 2026</p></div>
    <button class="festival-enter" type="button" aria-label="Увійти">→</button><div class="tap-next hint">Натисни на сцену</div>
  `, 'festival-scene');
  wait(1600).then(() => el.classList.add('is-listening'));
  el.addEventListener('click', (event) => {
    if (event.target.closest('.festival-enter') || el.classList.contains('is-reveal')) return;
    el.classList.add('is-reveal');
    $('.tap-next', el).textContent = 'Увійти у світ';
    chirp();
  });
  $('.festival-enter', el).addEventListener('click', () => {
    el.classList.add('is-dancing');
    $('.festival-enter', el).style.pointerEvents = 'none';
    $('.tap-next', el).style.opacity = '0';
    chirp();
    wait(4200).then(() => { stopSoundscape(); next(); });
  }, { once: true });
}

function renderEnvelope() {
  app.classList.remove('has-light'); stopSoundscape();
  const el = scene(`
    <div class="envelope-wrap"><div class="envelope-letter"><p>Невелика пригода<br>для великих спогадів.</p></div><div class="envelope"></div><div class="envelope-flap"></div><div class="seal">♡</div></div>
    <div class="pull-up"><i class="pull-arrow"></i><span>Потягни вгору</span></div>
  `, 'envelope-scene');
  let y = 0;
  el.addEventListener('pointerdown', (event) => { y = event.clientY; });
  el.addEventListener('pointerup', (event) => { if (y - event.clientY > 45) { el.classList.add('is-open'); chirp(); $('.pull-up', el).style.opacity = '0'; setTimeout(next, 1550); } });
}

function renderFinal() {
  app.classList.remove('has-light');
  const confetti = Array.from({ length: 30 }, (_, i) => `<i style="--x:${(i * 31) % 104}%;--drift:${(i % 2 ? -1 : 1) * (15 + (i % 6) * 8)}px;--d:${2.7 + (i % 5) * .35}s;--delay:${.1 + (i % 8) * .11}s;--c:${['#e5d7b7','#a84d5a','#7a9685','#c5c1e8'][i % 4]}"></i>`).join('');
  const el = scene(`
    <div class="systemish eyebrow">19 вересня 2026 · для Діани</div>
    <article class="letter-card"><p>Красотка,</p><p>Я дуже хотіла подарувати тобі не просто річ, а день, який ми будемо пам’ятати, поки не настане деменція.</p><p>Тому...</p><p>19 вересня ми їдемо разом у Гамбург <span class="heart">♥</span></p></article>
    <div class="ticket"><div class="ticket-main"><div class="ticket-top"><span>ВХІД × 1</span><span>19.09.26</span></div><div class="ticket-route"><span>SCHWERIN</span><i></i><span>HAMBURG</span></div><div class="ticket-event">REEPERBAHN<br>FESTIVAL</div><div class="ticket-foot"><span>ДІАНА + МОРІАРТІ</span><span>ВХІД</span></div></div><div class="ticket-stub"><span>RF 2026</span><span class="barcode"></span><span>19 ВЕР</span></div></div>
    <div class="final-status"><b>✓</b> Пункт призначення досягнуто.</div><h2 class="final-title">Reeperbahn Festival</h2><p class="final-ask">Ну що...<br>Поїхали? <strong>♥</strong></p><div class="confetti">${confetti}</div>
  `, 'final-scene');
  wait(600).then(() => el.classList.add('is-letter'));
  wait(3000).then(() => { el.classList.add('is-ticket'); chirp(); });
}

renderStart();
