import { app } from './state.js';
import { parseReport } from './parser.js';
import { goTo, togglePlay, startPlay, stopPlay } from './playback.js';
import { updateDisplay } from './display.js';
import { buildLogItem } from './renderers.js';
import { DEMO_DATA } from './demo-data.js';
import { esc } from './utils.js';

export function renderInputScreen() {
  document.getElementById('app').innerHTML = `
    <div class="input-screen">
      <div class="input-header">
        <div class="input-header__label mono text-accent">CARD GAME · FIGHT REPLAYER</div>
        <h1 class="input-header__title">Fight Replayer</h1>
        <p class="input-header__subtitle">Paste your fight result JSON to analyze the battle</p>
      </div>
      <div class="input-form">
        <textarea id="json-input" class="input-textarea"
          placeholder='{ "1": { "kind": "attack", ... }, "2": { ... } }'
          spellcheck="false"></textarea>
        <div id="json-error" class="input-error hidden"></div>
        <div class="input-actions">
          <button id="btn-analyze" class="btn btn--cta">Analyze fight →</button>
          <button id="btn-demo" class="btn btn--ghost">Load demo</button>
        </div>
      </div>
    </div>`;

  document
    .getElementById('btn-analyze')
    .addEventListener('click', handleAnalyze);
  document.getElementById('btn-demo').addEventListener('click', handleDemo);
  document.getElementById('json-input').addEventListener('input', () => {
    document.getElementById('json-error').classList.add('hidden');
    document
      .getElementById('json-input')
      .classList.remove('input-textarea--error');
  });
}

function handleAnalyze() {
  const raw = document.getElementById('json-input').value.trim();
  if (!raw) return;
  try {
    loadData(parseReport(JSON.parse(raw)));
  } catch (e) {
    const err = document.getElementById('json-error');
    err.textContent = 'Invalid JSON: ' + e.message;
    err.classList.remove('hidden');
    document
      .getElementById('json-input')
      .classList.add('input-textarea--error');
  }
}

function handleDemo() {
  try {
    loadData(parseReport(DEMO_DATA));
  } catch (e) {
    console.error('Demo load failed', e);
  }
}

export function loadData(data) {
  app.data = data;
  app.step = 0;
  stopPlay();
  renderViewer();
}

export function renderViewer() {
  const { data } = app;
  const total = data.events.length;
  const teamBName = data.teams.B.name;

  document.getElementById('app').innerHTML = `
    <div class="viewer">

      <header class="topbar">
        <button id="btn-back" class="btn btn--ghost btn--sm">← Back</button>
        <div class="topbar__center">
          <span class="mono text-accent topbar__label">CARD GAME</span>
          <span class="topbar__sep">|</span>
          <span class="topbar__name">Fight Replayer</span>
        </div>
        <div id="step-counter" class="topbar__counter">0 / ${total}</div>
      </header>

      <main class="viewer-main">

        <aside class="side-panel side-panel--left">
          <div class="side-panel__header side-panel__header--hero">
            ⚔ ${esc(data.teams.A.name)}
          </div>
          <div id="cards-team-a"></div>
        </aside>

        <section class="center-panel">
          <div class="event-card event-card--empty" id="event-card"></div>
          <div class="timeline">
            <input type="range" class="timeline__scrubber" id="scrubber"
              min="0" max="${total}" value="0">
          </div>
          <div class="controls">
            <button class="btn" id="btn-first"  title="First">⏮</button>
            <button class="btn" id="btn-prev"   title="Previous">⏪</button>
            <button class="btn btn--play" id="btn-play">▶</button>
            <button class="btn" id="btn-next"   title="Next">⏩</button>
            <button class="btn" id="btn-last"   title="Last">⏭</button>
            <div class="controls__speeds" id="speed-buttons">
              ${[0.5, 1, 2, 4]
                .map(
                  (s) =>
                    `<button class="btn btn--speed${s === app.speed ? ' active' : ''}"
                   data-speed="${s}">${s}x</button>`,
                )
                .join('')}
            </div>
          </div>
        </section>

        <aside class="side-panel side-panel--right">
          <div class="side-panel__header side-panel__header--boss">
            🔥 ${esc(teamBName)}
          </div>
          <div id="cards-team-b"></div>
        </aside>

      </main>

      <footer class="event-log">
        <div class="event-log__label mono">📋 EVENT LOG</div>
        <div class="event-log__scroll" id="log-scroll">
          ${data.events.map((ev, i) => buildLogItem(ev, i, teamBName)).join('')}
        </div>
      </footer>

    </div>`;

  document.getElementById('btn-back').addEventListener('click', () => {
    stopPlay();
    renderInputScreen();
  });

  document.getElementById('btn-first').addEventListener('click', () => goTo(0));
  document
    .getElementById('btn-prev')
    .addEventListener('click', () => goTo(app.step - 1));
  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document
    .getElementById('btn-next')
    .addEventListener('click', () => goTo(app.step + 1));
  document
    .getElementById('btn-last')
    .addEventListener('click', () => goTo(total));

  document.getElementById('scrubber').addEventListener('input', (e) => {
    stopPlay();
    goTo(+e.target.value);
  });

  document.getElementById('speed-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-speed]');
    if (!btn) return;
    app.speed = +btn.dataset.speed;
    document
      .querySelectorAll('[data-speed]')
      .forEach((b) =>
        b.classList.toggle('active', +b.dataset.speed === app.speed),
      );
    if (app.isPlaying) {
      stopPlay();
      startPlay();
    }
  });

  document.getElementById('log-scroll').addEventListener('click', (e) => {
    const item = e.target.closest('.log-item');
    if (!item) return;
    stopPlay();
    goTo(+item.dataset.step);
  });

  updateDisplay();
}
