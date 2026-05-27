import { app } from './state.js';
import { updateDisplay } from './display.js';

export function goTo(step) {
  const max = app.data.events.length;
  app.step = Math.max(0, Math.min(max, step));
  if (app.step === max) stopPlay();
  updateDisplay();
}

export function togglePlay() {
  if (app.isPlaying) {
    stopPlay();
    return;
  }

  startPlay();
}

export function startPlay() {
  if (app.step >= app.data.events.length) goTo(0);
  app.isPlaying = true;
  document.getElementById('btn-play').textContent = '⏸';
  app.timer = setInterval(() => {
    if (app.step >= app.data.events.length) {
      stopPlay();
      return;
    }
    goTo(app.step + 1);
  }, 1000 / app.speed);
}

export function stopPlay() {
  clearInterval(app.timer);
  app.isPlaying = false;
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶';
}
