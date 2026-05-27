import { app } from './state.js';
import { EVENT_COLOR } from './icons.js';
import { buildCardPanel, buildEventCard } from './renderers.js';
import { esc } from './utils.js';

export function eventColor(kind, subtype, ev) {
  if (kind === 'state_effect')
    return (
      EVENT_COLOR[`state_effect_${subtype}`] ?? EVENT_COLOR.state_effect_burn
    );
  if (kind === 'fight_end') {
    const bossWins = ev?.winner && ev.winner === app.data?.teams?.B?.name;
    return bossWins ? '#f43f5e' : '#22c55e';
  }
  return EVENT_COLOR[kind] ?? null;
}

export function updateDisplay() {
  const { data, step } = app;
  const snapshot = data.snapshots[step];
  const event = step > 0 ? data.events[step - 1] : null;

  const activeIds = getActiveIds(event);
  const total = data.events.length;
  const teamBName = data.teams.B.name;

  // Counter
  const counter = document.getElementById('step-counter');
  if (counter) {
    const fightEnd = data.events.find((e) => e.kind === 'fight_end');
    const winner = fightEnd?.winner;
    let extra = '';
    if (winner && step === total) {
      const col =
        winner === teamBName ? 'var(--col-end-loss)' : 'var(--col-end-win)';
      extra = ` <span style="color:${col};margin-left:12px">
        ${winner === teamBName ? '💀' : '🏆'} ${esc(winner)} wins
      </span>`;
    }
    counter.innerHTML = `${step} / ${total}${extra}`;
  }

  // Scrubber
  const scrubber = document.getElementById('scrubber');
  if (scrubber) scrubber.value = step;

  // Card panels
  const teamACards = [...data.teams.A.ids]
    .map((id) => snapshot[id])
    .filter(Boolean);
  const teamBCards = [...data.teams.B.ids]
    .map((id) => snapshot[id])
    .filter(Boolean);

  const panelA = document.getElementById('cards-team-a');
  const panelB = document.getElementById('cards-team-b');
  if (panelA)
    panelA.innerHTML = teamACards
      .map((c) => buildCardPanel(c, true, activeIds.has(c.id)))
      .join('');
  if (panelB)
    panelB.innerHTML = teamBCards
      .map((c) => buildCardPanel(c, false, activeIds.has(c.id)))
      .join('');

  // Event card
  const eventCard = document.getElementById('event-card');
  if (eventCard) {
    eventCard.innerHTML = buildEventCard(event, teamBName);
    const color = event
      ? (eventColor(event.kind, event.type ?? event.status, event) ?? null)
      : null;
    eventCard.style.borderColor = color ? color + '55' : 'var(--border)';
    eventCard.style.boxShadow = color ? `0 0 24px ${color}22` : 'none';
    eventCard.classList.toggle('event-card--empty', !event);
  }

  // Log highlight
  const prevActive = document.querySelector('.log-item--active');
  if (prevActive) {
    prevActive.classList.remove('log-item--active');
    prevActive.style.borderColor = 'var(--border-sub)';
    prevActive.style.background = '';
    prevActive.style.boxShadow = '';
    prevActive.querySelector('.log-item__label').style.color =
      'var(--text-muted)';
  }

  if (step > 0) {
    const current = document.querySelector(`.log-item[data-step="${step}"]`);
    if (current) {
      const ev = data.events[step - 1];
      const color =
        eventColor(ev.kind, ev.type ?? ev.status, ev) ?? 'var(--accent)';
      current.classList.add('log-item--active');
      current.style.borderColor = color;
      current.style.background = 'var(--surface)';
      current.style.boxShadow = `0 0 8px ${color}44`;
      current.querySelector('.log-item__label').style.color = 'var(--text)';
      current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }
}

export function getActiveIds(event) {
  const ids = new Set();
  if (!event) return ids;
  if (event.attacker) ids.add(event.attacker.id);
  if (event.source) ids.add(event.source.id);
  if (event.card) ids.add(event.card.id);
  event.damages?.forEach((d) => ids.add(d.defender?.id));
  event.buffs?.forEach((b) => ids.add(b.target?.id));
  event.debuffs?.forEach((b) => ids.add(b.target?.id));
  event.heal?.forEach((h) => ids.add(h.target?.id));
  return ids;
}
