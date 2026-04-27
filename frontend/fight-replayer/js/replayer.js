/**
 * Fight Replayer — Main Application
 * Vanilla JS, no framework.  Manages state, renders DOM, drives playback.
 */

import { ICON, STATUS_ICON, EVENT_COLOR, ELEM_COLOR } from './icons.js';
import { parseReport } from './parser.js';

// ── Utilities ──────────────────────────────────────────────────

/** HTML-escape a value so it's safe to inject via innerHTML. */
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Return the CSS variable name for an event's colour. */
function eventColor(kind, subtype, ev) {
  if (kind === 'state_effect') return EVENT_COLOR[`state_effect_${subtype}`] ?? EVENT_COLOR.state_effect_burn;
  if (kind === 'fight_end') {
    const bossWins = ev?.winner && ev.winner === app.data?.teams?.B?.name;
    return bossWins ? '#f43f5e' : '#22c55e';
  }
  return EVENT_COLOR[kind] ?? null;
}

/** Render an element-type badge HTML string. */
function elemBadge(type) {
  return `<span class="elem-badge elem-badge--${esc(type)}">${esc(type)}</span>`;
}

// ── Application state ──────────────────────────────────────────

const app = {
  data: null,       // parseReport() result
  step: 0,          // 0 = before any event
  isPlaying: false,
  speed: 1,
  timer: null,
};

// ── Bootstrap ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderInputScreen);

// ── Input screen ───────────────────────────────────────────────

function renderInputScreen() {
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

  document.getElementById('btn-analyze').addEventListener('click', handleAnalyze);
  document.getElementById('btn-demo').addEventListener('click', handleDemo);
  document.getElementById('json-input').addEventListener('input', () => {
    document.getElementById('json-error').classList.add('hidden');
    document.getElementById('json-input').classList.remove('input-textarea--error');
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
    document.getElementById('json-input').classList.add('input-textarea--error');
  }
}

function handleDemo() {
  try { loadData(parseReport(DEMO_DATA)); }
  catch (e) { console.error('Demo load failed', e); }
}

function loadData(data) {
  app.data = data;
  app.step = 0;
  stopPlay();
  renderViewer();
}

// ── Viewer ─────────────────────────────────────────────────────

function renderViewer() {
  const { data } = app;
  const total = data.events.length;

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
              ${[0.5, 1, 2, 4].map(s =>
                `<button class="btn btn--speed${s === app.speed ? ' active' : ''}"
                   data-speed="${s}">${s}x</button>`
              ).join('')}
            </div>
          </div>
        </section>

        <aside class="side-panel side-panel--right">
          <div class="side-panel__header side-panel__header--boss">
            🔥 ${esc(data.teams.B.name)}
          </div>
          <div id="cards-team-b"></div>
        </aside>

      </main>

      <footer class="event-log">
        <div class="event-log__label mono">📋 EVENT LOG</div>
        <div class="event-log__scroll" id="log-scroll">
          ${data.events.map((ev, i) => buildLogItem(ev, i)).join('')}
        </div>
      </footer>

    </div>`;

  // ── Bind controls ────────────────────────────────────────────

  document.getElementById('btn-back').addEventListener('click', () => {
    stopPlay();
    renderInputScreen();
  });

  document.getElementById('btn-first').addEventListener('click', () => goTo(0));
  document.getElementById('btn-prev').addEventListener('click', () => goTo(app.step - 1));
  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document.getElementById('btn-next').addEventListener('click', () => goTo(app.step + 1));
  document.getElementById('btn-last').addEventListener('click', () => goTo(total));

  document.getElementById('scrubber').addEventListener('input', e => {
    stopPlay();
    goTo(+e.target.value);
  });

  document.getElementById('speed-buttons').addEventListener('click', e => {
    const btn = e.target.closest('[data-speed]');
    if (!btn) return;
    app.speed = +btn.dataset.speed;
    document.querySelectorAll('[data-speed]').forEach(b =>
      b.classList.toggle('active', +b.dataset.speed === app.speed)
    );
    if (app.isPlaying) { stopPlay(); startPlay(); }
  });

  document.getElementById('log-scroll').addEventListener('click', e => {
    const item = e.target.closest('.log-item');
    if (!item) return;
    stopPlay();
    goTo(+item.dataset.step);
  });

  // Initial display
  updateDisplay();
}

// ── Step navigation ────────────────────────────────────────────

function goTo(step) {
  const max = app.data.events.length;
  app.step = Math.max(0, Math.min(max, step));
  if (app.step === max) stopPlay();
  updateDisplay();
}

function togglePlay() {
  app.isPlaying ? stopPlay() : startPlay();
}

function startPlay() {
  if (app.step >= app.data.events.length) goTo(0);
  app.isPlaying = true;
  document.getElementById('btn-play').textContent = '⏸';
  app.timer = setInterval(() => {
    if (app.step >= app.data.events.length) { stopPlay(); return; }
    goTo(app.step + 1);
  }, 1000 / app.speed);
}

function stopPlay() {
  clearInterval(app.timer);
  app.isPlaying = false;
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶';
}

// ── Display update ─────────────────────────────────────────────

function updateDisplay() {
  const { data, step } = app;
  const snapshot = data.snapshots[step];
  const event    = step > 0 ? data.events[step - 1] : null;

  const activeIds = getActiveIds(event);
  const total = data.events.length;

  // Counter
  const counter = document.getElementById('step-counter');
  if (counter) {
    const fightEnd = data.events.find(e => e.kind === 'fight_end');
    const winner   = fightEnd?.winner;
    let extra = '';
    if (winner && step === total) {
      const col = winner === data.teams.B.name ? 'var(--col-end-loss)' : 'var(--col-end-win)';
      extra = ` <span style="color:${col};margin-left:12px">
        ${winner === data.teams.B.name ? '💀' : '🏆'} ${esc(winner)} wins
      </span>`;
    }
    counter.innerHTML = `${step} / ${total}${extra}`;
  }

  // Scrubber
  const scrubber = document.getElementById('scrubber');
  if (scrubber) scrubber.value = step;

  // Card panels
  const teamACards = [...data.teams.A.ids].map(id => snapshot[id]).filter(Boolean);
  const teamBCards = [...data.teams.B.ids].map(id => snapshot[id]).filter(Boolean);

  const panelA = document.getElementById('cards-team-a');
  const panelB = document.getElementById('cards-team-b');
  if (panelA) panelA.innerHTML = teamACards.map(c => buildCardPanel(c, true, activeIds.has(c.id))).join('');
  if (panelB) panelB.innerHTML = teamBCards.map(c => buildCardPanel(c, false, activeIds.has(c.id))).join('');

  // Event card
  const eventCard = document.getElementById('event-card');
  if (eventCard) {
    eventCard.innerHTML = buildEventCard(event);
    const color = event ? (eventColor(event.kind, event.type ?? event.status, event) ?? null) : null;
    eventCard.style.borderColor  = color ? color + '55' : 'var(--border)';
    eventCard.style.boxShadow    = color ? `0 0 24px ${color}22` : 'none';
    eventCard.classList.toggle('event-card--empty', !event);
  }

  // Log highlight: only touch affected items
  const prevActive = document.querySelector('.log-item--active');
  if (prevActive) {
    prevActive.classList.remove('log-item--active');
    prevActive.style.borderColor = 'var(--border-sub)';
    prevActive.style.background  = '';
    prevActive.style.boxShadow   = '';
    prevActive.querySelector('.log-item__label').style.color = 'var(--text-muted)';
  }

  if (step > 0) {
    const current = document.querySelector(`.log-item[data-step="${step}"]`);
    if (current) {
      const ev    = data.events[step - 1];
      const color = eventColor(ev.kind, ev.type ?? ev.status, ev) ?? 'var(--accent)';
      current.classList.add('log-item--active');
      current.style.borderColor = color;
      current.style.background  = 'var(--surface)';
      current.style.boxShadow   = `0 0 8px ${color}44`;
      current.querySelector('.log-item__label').style.color = 'var(--text)';
      current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}

function getActiveIds(event) {
  const ids = new Set();
  if (!event) return ids;
  if (event.attacker) ids.add(event.attacker.id);
  if (event.source)   ids.add(event.source.id);
  if (event.card)     ids.add(event.card.id);
  event.damages?.forEach(d => ids.add(d.defender?.id));
  event.buffs?.forEach(b => ids.add(b.target?.id));
  event.debuffs?.forEach(b => ids.add(b.target?.id));
  event.heal?.forEach(h => ids.add(h.target?.id));
  return ids;
}

// ── HTML builders ──────────────────────────────────────────────

function buildLogItem(ev, i) {
  const { icon } = describeEvent(ev);
  const label = esc(ev.name || ev.kind);
  return `
    <div class="log-item" data-step="${i + 1}">
      <div class="log-item__step">#${ev._step}</div>
      <div class="log-item__icon">${icon}</div>
      <div class="log-item__label">${label}</div>
    </div>`;
}

function buildCardPanel(card, isTeamA, isActive) {
  const teamColor  = isTeamA ? 'var(--hero)' : 'var(--boss)';
  const nameColor  = isTeamA ? 'var(--hero-text)' : 'var(--boss-text)';
  const glowColor  = isTeamA ? 'var(--hero-glow)' : 'var(--boss-glow)';
  const borderCol  = isActive ? teamColor : 'var(--border)';
  const shadow     = isActive ? `0 0 12px ${glowColor}` : 'none';

  const pct    = Math.max(0, Math.min(1, card.hp / card.maxHP));
  const hpCol  = pct > 0.6 ? 'var(--hp-hi)' : pct > 0.3 ? 'var(--hp-mid)' : 'var(--hp-lo)';

  const statusesHtml = card.statuses.length
    ? `<div class="card-panel__statuses">
        ${card.statuses.map(s =>
          `<span class="status-badge">${STATUS_ICON[s] ?? '⚡'} ${esc(s)}</span>`
        ).join('')}
      </div>`
    : '';

  const buffsHtml = card.buffs.length
    ? `<div class="card-panel__buffs">
        ${card.buffs.slice(-3).map(b =>
          `<div class="card-panel__buff-row">
            ↑ ${esc(b.kind)} +${b.value}${b.turns != null ? ` (${b.turns}T)` : ' (∞)'}
          </div>`
        ).join('')}
      </div>`
    : '';

  const debuffsHtml = card.debuffs.length
    ? `<div class="card-panel__buffs">
        ${card.debuffs.slice(-3).map(b =>
          `<div class="card-panel__debuff-row">
            ↓ ${esc(b.kind)} −${b.value}${b.turns != null ? ` (${b.turns}T)` : ''}
          </div>`
        ).join('')}
      </div>`
    : '';

  const hpHtml = !card.dead ? `
    <div class="hp-bar">
      <div class="hp-bar__info">
        <span class="mono" style="color:${hpCol}">${Math.round(card.hp)} / ${card.maxHP}</span>
        <span class="hp-bar__pct">${(pct * 100).toFixed(0)}%</span>
      </div>
      <div class="hp-bar__track">
        <div class="hp-bar__fill" style="width:${pct * 100}%;background:${hpCol}"></div>
      </div>
    </div>` : '';

  return `
    <div class="card-panel${card.dead ? ' card-panel--dead' : ''}"
         style="border-color:${borderCol};box-shadow:${shadow}">
      ${card.dead ? '<div class="card-panel__dead-icon">💀</div>' : ''}
      <div class="card-panel__name" style="color:${nameColor}">${esc(card.name)}</div>
      ${card.deckIdentity ? `<div class="card-panel__identity">${esc(card.deckIdentity)}</div>` : ''}
      ${hpHtml}
      ${statusesHtml}
      ${buffsHtml}
      ${debuffsHtml}
    </div>`;
}

function buildEventCard(ev) {
  if (!ev) {
    return `
      <div class="event-empty">
        <div class="event-empty__icon">⚡</div>
        <div>Press ▶ to start</div>
      </div>`;
  }

  const { icon, text, color } = describeEvent(ev);
  let contentHtml = '';

  if (ev.kind === 'attack' || ev.kind === 'special_attack') {
    contentHtml = buildAttackDetail(ev);
  } else if (ev.kind === 'buff') {
    contentHtml = buildBuffDebuffDetail(ev, 'buff');
  } else if (ev.kind === 'debuff') {
    contentHtml = buildBuffDebuffDetail(ev, 'debuff');
  } else if (ev.kind === 'healing') {
    contentHtml = buildHealDetail(ev);
  } else {
    const detail = buildGenericDetail(ev);
    if (detail) contentHtml = `<div class="event-detail-text mono">${detail}</div>`;
  }

  return `
    <div class="event-inner">
      <div class="event-header">
        <span class="event-icon">${icon}</span>
        <div class="event-heading">
          <div class="event-meta mono">EVENT #${ev._step} · ${esc(ev.kind.toUpperCase())}</div>
          <div class="event-title" style="color:${color ?? 'var(--text)'}">${esc(text)}</div>
        </div>
      </div>
      ${contentHtml}
    </div>`;
}

function buildAttackDetail(ev) {
  if (!ev.damages?.length) return '';

  // Group hits by defender id
  const grouped = {};
  ev.damages.forEach((d, i) => {
    const key = d.defender?.id ?? i;
    if (!grouped[key]) {
      grouped[key] = { defender: d.defender, hits: [], dodge: false, critical: false, finalHP: d.remainingHealth };
    }
    grouped[key].hits.push(d);
    grouped[key].finalHP = d.remainingHealth;
    if (d.dodge)      grouped[key].dodge    = true;
    if (d.isCritical) grouped[key].critical = true;
  });

  const rows = Object.values(grouped).map(g => {
    const totalDmg = g.hits.reduce((s, h) => s + (h.damage ?? 0), 0);
    const multiHit = g.hits.length > 1;

    const tags = [
      g.dodge    ? `<span class="attack-target__tag attack-target__tag--dodge">DODGED</span>` : '',
      g.critical ? `<span class="attack-target__tag attack-target__tag--crit">CRIT!</span>` : '',
      multiHit   ? `<span class="attack-target__tag">${g.hits.length} hits</span>` : '',
    ].filter(Boolean).join('');

    const dmgClass = totalDmg > 0 ? 'attack-target__dmg--dealt' : 'attack-target__dmg--zero';

    let typesHtml = '';
    if (multiHit) {
      // Group hits by element type
      const byType = {};
      g.hits.forEach(h => {
        const key = (h.kind ?? ['?']).join('+');
        byType[key] = byType[key] ?? { kinds: h.kind ?? [], count: 0, total: 0 };
        byType[key].count++;
        byType[key].total += h.damage ?? 0;
      });
      const breakdownRows = Object.entries(byType).map(([, t]) => {
        const dmgCls = t.total > 0 ? 'attack-breakdown-row__dmg--dealt' : 'attack-breakdown-row__dmg--zero';
        return `
          <div class="attack-breakdown-row">
            <span class="attack-breakdown-row__count">${t.count}×</span>
            ${t.kinds.map(elemBadge).join('')}
            <span class="attack-breakdown-row__dmg ${dmgCls}">
              ${t.total > 0 ? `−${t.total}` : '0 dmg'}
            </span>
          </div>`;
      }).join('');
      typesHtml = `<div class="attack-target__breakdown">${breakdownRows}</div>`;
    } else {
      const kinds = g.hits[0]?.kind ?? [];
      if (kinds.length) {
        typesHtml = `<div class="attack-target__types">${kinds.map(elemBadge).join('')}</div>`;
      }
    }

    return `
      <div class="attack-target">
        <div class="attack-target__row">
          <div class="attack-target__name-row">
            <span class="attack-target__name">${esc(g.defender?.name ?? '?')}</span>
            ${tags}
          </div>
          <div class="attack-target__dmg ${dmgClass}">
            ${totalDmg > 0 ? `−${totalDmg}` : '0'}
            <span class="attack-target__hp"> → ${(g.finalHP ?? 0).toFixed(1)} HP</span>
          </div>
        </div>
        ${typesHtml}
      </div>`;
  }).join('');

  return `<div class="attack-targets">${rows}</div>`;
}

function buildBuffDebuffDetail(ev, type) {
  const items = type === 'buff' ? ev.buffs : ev.debuffs;
  if (!items?.length) return '';

  const cssClass = `detail-row--${type}`;
  const sign = type === 'buff' ? '+' : '−';

  const rows = items.map(b => {
    const turns = b.remainingTurns != null ? `(${b.remainingTurns}T)` : '(∞)';
    return `
      <div class="detail-row ${cssClass}">
        <span>${esc(b.target?.name)} ← ${esc(b.kind)}</span>
        <span>${sign}${b.value} ${turns}</span>
      </div>`;
  }).join('');

  return `<div class="detail-rows">${rows}</div>`;
}

function buildHealDetail(ev) {
  if (!ev.heal?.length) return '';

  const rows = ev.heal.map(h => `
    <div class="detail-row detail-row--heal">
      <span>${esc(h.target?.name)}</span>
      <span>+${(h.healed ?? 0).toFixed(1)} → ${(h.remainingHealth ?? 0).toFixed(1)} HP</span>
    </div>`
  ).join('');

  return `<div class="detail-rows">${rows}</div>`;
}

function buildGenericDetail(ev) {
  switch (ev.kind) {
    case 'state_effect':
      return `−${ev.damage} HP · ${ev.remainingTurns} turn(s) remaining · HP: ${(ev.remainingHealth ?? 0).toFixed(1)}`;
    case 'buff_expired':
    case 'debuff_expired': {
      const types = (ev.expired ?? []).map(e => esc(e.kind)).join(', ');
      return `on ${esc(ev.card?.name)}: ${types}`;
    }
    case 'buff_removed':
    case 'debuff_removed':
      return (ev.removed ?? []).map(r => `${esc(r.kind)} from ${esc(r.target?.name)}`).join(', ');
    case 'effect_removed':
      return (ev.removed ?? []).map(r => `${esc(r.effectType)} removed from ${esc(r.target?.name)}`).join(', ');
    case 'targeting_override':
      return `${esc(ev.previousStrategy)} → ${esc(ev.newStrategy)}`;
    case 'targeting_reverted':
      return `${esc(ev.revertedStrategy)} → ${esc(ev.restoredStrategy)}`;
    case 'fight_end':
      return ev.winner ? `Winner: ${esc(ev.winner)}` : 'Draw';
    default:
      return null;
  }
}

// ── Event description (icon + text + colour) ───────────────────

function describeEvent(ev) {
  if (!ev) return { icon: ICON.start, text: 'Battle in progress…', color: null };

  switch (ev.kind) {
    case 'attack':
      return { icon: ICON.attack, text: `${ev.attacker?.name} — ${ev.name ?? 'Attack'}`, color: EVENT_COLOR.attack };
    case 'special_attack':
      return { icon: ICON.special_attack, text: `${ev.attacker?.name} — ${ev.name ?? 'Special'} (SPECIAL)`, color: EVENT_COLOR.special_attack };
    case 'healing':
      return { icon: ICON.healing, text: `${ev.source?.name} — ${ev.name ?? 'Healing'}`, color: EVENT_COLOR.healing };
    case 'buff':
      return { icon: ICON.buff, text: `${ev.source?.name} — ${ev.name ?? 'Buff'}`, color: EVENT_COLOR.buff };
    case 'debuff':
      return { icon: ICON.debuff, text: `${ev.source?.name} — ${ev.name ?? 'Debuff'}`, color: EVENT_COLOR.debuff };
    case 'buff_removed':
      return { icon: ICON.buff_removed, text: `Buff removed — ${ev.eventName ?? ''}`, color: EVENT_COLOR.buff_removed };
    case 'debuff_removed':
      return { icon: ICON.debuff_removed, text: `Debuff removed — ${ev.eventName ?? ''}`, color: EVENT_COLOR.debuff_removed };
    case 'buff_expired': {
      const types = (ev.expired ?? []).map(e => e.kind).join(', ') || 'effect';
      return { icon: ICON.buff_expired, text: `Buff expired: ${types}`, color: EVENT_COLOR.buff_expired };
    }
    case 'debuff_expired': {
      const types = (ev.expired ?? []).map(e => e.kind).join(', ') || 'effect';
      return { icon: ICON.debuff_expired, text: `Debuff expired: ${types}`, color: EVENT_COLOR.debuff_expired };
    }
    case 'status_change':
      if (ev.status === 'dead')
        return { icon: ICON.dead, text: `${ev.card?.name} eliminated`, color: '#f43f5e' };
      return { icon: STATUS_ICON[ev.status] ?? ICON.status_change, text: `${ev.card?.name} — ${ev.status}`, color: EVENT_COLOR.status_change };
    case 'state_effect': {
      const col = ev.type === 'burn' ? EVENT_COLOR.state_effect_burn
                : ev.type === 'poison' ? EVENT_COLOR.state_effect_poison
                : EVENT_COLOR.state_effect_freeze;
      return { icon: STATUS_ICON[ev.type] ?? ICON.state_effect, text: `${ev.card?.name} — ${ev.type} tick`, color: col };
    }
    case 'targeting_override':
      return { icon: ICON.targeting_override, text: `${ev.source?.name} — ${ev.name ?? 'Targeting override'}`, color: EVENT_COLOR.targeting_override };
    case 'targeting_reverted':
      return { icon: ICON.targeting_reverted, text: `Targeting reverted — ${ev.eventName ?? ''}`, color: EVENT_COLOR.targeting_reverted };
    case 'effect_removed':
      return { icon: ICON.effect_removed, text: `Effects removed — ${ev.eventName ?? ''}`, color: EVENT_COLOR.effect_removed };
    case 'fight_end': {
      const bossWins = ev.winner && ev.winner === app.data?.teams?.B?.name;
      return { icon: (ev.winner && !bossWins) ? ICON.fight_end : ICON.fight_end_loss, text: `FIGHT END — ${ev.winner ? `Winner: ${ev.winner}` : 'Draw'}`, color: bossWins ? '#f43f5e' : '#22c55e' };
    }
    default:
      return { icon: ICON.unknown, text: ev.kind ?? 'Unknown event', color: '#94a3b8' };
  }
}

// ── Demo data ──────────────────────────────────────────────────

const DEMO_DATA = {"1":{"kind":"attack","name":"Frappe solide","attacker":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"damages":[{"defender":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damage":60,"isCritical":false,"dodge":false,"remainingHealth":1140,"kind":["PHYSICAL"]}],"energy":10},"2":{"kind":"attack","name":"Poings de Braise","attacker":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damages":[{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":700,"kind":["PHYSICAL","FIRE"]}],"energy":10},"3":{"kind":"status_change","status":"burn","card":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"}},"4":{"kind":"buff","name":"Fierté du lion","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"buffs":[{"target":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"kind":"attack","value":4.25,"remainingTurns":null}],"energy":10},"5":{"kind":"attack","name":"Écrasement","attacker":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damages":[{"defender":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"damage":100,"isCritical":false,"dodge":false,"remainingHealth":600,"kind":["PHYSICAL","FIRE"]}],"energy":10},"6":{"kind":"status_change","status":"poison","card":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"}},"7":{"kind":"buff","name":"Rage du boss","source":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"buffs":[{"target":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"kind":"attack","value":18,"remainingTurns":3}],"energy":10},"8":{"kind":"attack","name":"Frappe solide","attacker":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damages":[{"defender":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":550,"kind":["PHYSICAL"]}],"energy":10},"9":{"kind":"state_effect","card":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"type":"burn","damage":8.5,"remainingTurns":2,"remainingHealth":691.5},"10":{"kind":"attack","name":"Poings de Braise","attacker":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damages":[{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":691.5,"kind":["PHYSICAL","FIRE"]}],"energy":20},"11":{"kind":"buff","name":"Fierté du lion","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"buffs":[{"target":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"kind":"attack","value":4.25,"remainingTurns":null}],"energy":20},"12":{"kind":"attack","name":"Frappe solide","attacker":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"damages":[{"defender":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damage":60,"isCritical":false,"dodge":false,"remainingHealth":1080,"kind":["PHYSICAL"]}],"energy":20},"13":{"kind":"state_effect","card":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"type":"poison","damage":36,"remainingTurns":2,"remainingHealth":564},"18":{"kind":"special_attack","name":"Rugissement solaire","attacker":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damages":[{"defender":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damage":153,"isCritical":false,"dodge":false,"remainingHealth":927},{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":73,"isCritical":false,"dodge":false,"remainingHealth":618.5}],"energy":0},"19":{"kind":"buff","name":"Rugissement solaire","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"buffs":[{"target":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"kind":"attack","value":6,"remainingTurns":1},{"target":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"kind":"defense","value":8,"remainingTurns":1}],"energy":0},"20":{"kind":"status_change","status":"burn","card":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"}},"33":{"kind":"attack","name":"Griffes ardentes","attacker":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damages":[{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":610,"kind":["PHYSICAL"]},{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":610,"kind":["PHYSICAL"]},{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":610,"kind":["PHYSICAL"]},{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":0,"isCritical":false,"dodge":false,"remainingHealth":610,"kind":["PHYSICAL"]},{"defender":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"damage":5,"isCritical":false,"dodge":false,"remainingHealth":605,"kind":["FIRE"]}],"energy":10},"39":{"kind":"attack","name":"Écrasement","attacker":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damages":[{"defender":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"damage":154,"isCritical":false,"dodge":false,"remainingHealth":0,"kind":["PHYSICAL","FIRE"]}],"energy":50},"40":{"kind":"status_change","card":{"id":"kaelion","name":"Kaelion","deckIdentity":"Héros-0"},"status":"dead"},"44":{"kind":"buff","name":"Buff Héroïque","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"buffs":[{"target":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"kind":"attack","value":34,"remainingTurns":null}],"energy":20,"powerId":"lion-heritage"},"45":{"name":"Vengeance","kind":"targeting_override","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"previousStrategy":"from-position","newStrategy":"targeted-card","powerId":"lion-heritage"},"48":{"kind":"special_attack","name":"Tempête infernale","attacker":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damages":[{"defender":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damage":408,"isCritical":false,"dodge":false,"remainingHealth":142}],"energy":0},"49":{"kind":"status_change","status":"burn","card":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"}},"52":{"kind":"attack","name":"Écrasement","attacker":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"damages":[{"defender":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"damage":184,"isCritical":false,"dodge":false,"remainingHealth":0,"kind":["PHYSICAL","FIRE"]}],"energy":10},"53":{"kind":"status_change","card":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"status":"dead"},"54":{"kind":"effect_removed","source":{"id":"arionis","name":"Arionis","deckIdentity":"Héros-1"},"eventName":"lion-heritage-end","removed":[{"target":{"id":"boss","name":"Seigneur des Cendres","deckIdentity":"Boss-0"},"effectType":"burn"},{"target":{"id":"ennemy","name":"Ennemy 1","deckIdentity":"Boss-1"},"effectType":"burn"}]},"56":{"kind":"fight_end","winner":"Boss"}};
