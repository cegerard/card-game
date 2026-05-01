import { ICON, STATUS_ICON, EVENT_COLOR } from './icons.js';
import { esc, elemBadge } from './utils.js';

export function buildLogItem(ev, i, teamBName) {
  const { icon } = describeEvent(ev, teamBName);
  const label = esc(ev.name || ev.kind);
  return `
    <div class="log-item" data-step="${i + 1}">
      <div class="log-item__step">#${ev._step}</div>
      <div class="log-item__icon">${icon}</div>
      <div class="log-item__label">${label}</div>
    </div>`;
}

export function buildCardPanel(card, isTeamA, isActive) {
  const teamColor = isTeamA ? 'var(--hero)' : 'var(--boss)';
  const nameColor = isTeamA ? 'var(--hero-text)' : 'var(--boss-text)';
  const glowColor = isTeamA ? 'var(--hero-glow)' : 'var(--boss-glow)';
  const borderCol = isActive ? teamColor : 'var(--border)';
  const shadow = isActive ? `0 0 12px ${glowColor}` : 'none';

  const pct = Math.max(0, Math.min(1, card.hp / card.maxHP));
  const hpCol =
    pct > 0.6 ? 'var(--hp-hi)' : pct > 0.3 ? 'var(--hp-mid)' : 'var(--hp-lo)';

  const statusesHtml = card.statuses.length
    ? `<div class="card-panel__statuses">
        ${card.statuses
          .map(
            (s) =>
              `<span class="status-badge">${STATUS_ICON[s] ?? '⚡'} ${esc(s)}</span>`,
          )
          .join('')}
      </div>`
    : '';

  const buffsHtml = card.buffs.length
    ? `<div class="card-panel__buffs">
        ${card.buffs
          .slice(-3)
          .map(
            (b) =>
              `<div class="card-panel__buff-row">
            ↑ ${esc(b.kind)} +${b.value}${b.turns != null ? ` (${b.turns}T)` : ' (∞)'}
          </div>`,
          )
          .join('')}
      </div>`
    : '';

  const debuffsHtml = card.debuffs.length
    ? `<div class="card-panel__buffs">
        ${card.debuffs
          .slice(-3)
          .map(
            (b) =>
              `<div class="card-panel__debuff-row">
            ↓ ${esc(b.kind)} −${b.value}${b.turns != null ? ` (${b.turns}T)` : ''}
          </div>`,
          )
          .join('')}
      </div>`
    : '';

  const hpHtml = !card.dead
    ? `
    <div class="hp-bar">
      <div class="hp-bar__info">
        <span class="mono" style="color:${hpCol}">${Math.round(card.hp)} / ${card.maxHP}</span>
        <span class="hp-bar__pct">${(pct * 100).toFixed(0)}%</span>
      </div>
      <div class="hp-bar__track">
        <div class="hp-bar__fill" style="width:${pct * 100}%;background:${hpCol}"></div>
      </div>
    </div>`
    : '';

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

export function buildEventCard(ev, teamBName) {
  if (!ev) {
    return `
      <div class="event-empty">
        <div class="event-empty__icon">⚡</div>
        <div>Press ▶ to start</div>
      </div>`;
  }

  const { icon, text, color } = describeEvent(ev, teamBName);
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
    if (detail)
      contentHtml = `<div class="event-detail-text mono">${detail}</div>`;
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

  const grouped = {};
  ev.damages.forEach((d, i) => {
    const key = d.defender?.id ?? i;
    if (!grouped[key]) {
      grouped[key] = {
        defender: d.defender,
        hits: [],
        dodge: false,
        critical: false,
        finalHP: d.remainingHealth,
      };
    }
    grouped[key].hits.push(d);
    grouped[key].finalHP = d.remainingHealth;
    if (d.dodge) grouped[key].dodge = true;
    if (d.isCritical) grouped[key].critical = true;
  });

  const rows = Object.values(grouped)
    .map((g) => {
      const totalDmg = g.hits.reduce((s, h) => s + (h.damage ?? 0), 0);
      const multiHit = g.hits.length > 1;

      const tags = [
        g.dodge
          ? `<span class="attack-target__tag attack-target__tag--dodge">DODGED</span>`
          : '',
        g.critical
          ? `<span class="attack-target__tag attack-target__tag--crit">CRIT!</span>`
          : '',
        multiHit
          ? `<span class="attack-target__tag">${g.hits.length} hits</span>`
          : '',
      ]
        .filter(Boolean)
        .join('');

      const dmgClass =
        totalDmg > 0 ? 'attack-target__dmg--dealt' : 'attack-target__dmg--zero';

      let typesHtml = '';
      if (multiHit) {
        const byType = {};
        g.hits.forEach((h) => {
          const key = (h.kind ?? ['?']).join('+');
          byType[key] = byType[key] ?? {
            kinds: h.kind ?? [],
            count: 0,
            total: 0,
          };
          byType[key].count++;
          byType[key].total += h.damage ?? 0;
        });
        const breakdownRows = Object.entries(byType)
          .map(([, t]) => {
            const dmgCls =
              t.total > 0
                ? 'attack-breakdown-row__dmg--dealt'
                : 'attack-breakdown-row__dmg--zero';
            return `
          <div class="attack-breakdown-row">
            <span class="attack-breakdown-row__count">${t.count}×</span>
            ${t.kinds.map(elemBadge).join('')}
            <span class="attack-breakdown-row__dmg ${dmgCls}">
              ${t.total > 0 ? `−${t.total}` : '0 dmg'}
            </span>
          </div>`;
          })
          .join('');
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
    })
    .join('');

  return `<div class="attack-targets">${rows}</div>`;
}

function buildBuffDebuffDetail(ev, type) {
  const items = type === 'buff' ? ev.buffs : ev.debuffs;
  if (!items?.length) return '';

  const cssClass = `detail-row--${type}`;
  const sign = type === 'buff' ? '+' : '−';

  const rows = items
    .map((b) => {
      const turns = b.remainingTurns != null ? `(${b.remainingTurns}T)` : '(∞)';
      return `
      <div class="detail-row ${cssClass}">
        <span>${esc(b.target?.name)} ← ${esc(b.kind)}</span>
        <span>${sign}${b.value} ${turns}</span>
      </div>`;
    })
    .join('');

  return `<div class="detail-rows">${rows}</div>`;
}

function buildHealDetail(ev) {
  if (!ev.heal?.length) return '';

  const rows = ev.heal
    .map(
      (h) => `
    <div class="detail-row detail-row--heal">
      <span>${esc(h.target?.name)}</span>
      <span>+${(h.healed ?? 0).toFixed(1)} → ${(h.remainingHealth ?? 0).toFixed(1)} HP</span>
    </div>`,
    )
    .join('');

  return `<div class="detail-rows">${rows}</div>`;
}

function buildGenericDetail(ev) {
  switch (ev.kind) {
    case 'state_effect':
      return `−${ev.damage} HP · ${ev.remainingTurns} turn(s) remaining · HP: ${(ev.remainingHealth ?? 0).toFixed(1)}`;
    case 'buff_expired':
    case 'debuff_expired': {
      const types = (ev.expired ?? []).map((e) => esc(e.kind)).join(', ');
      return `on ${esc(ev.card?.name)}: ${types}`;
    }
    case 'buff_removed':
    case 'debuff_removed':
      return (ev.removed ?? [])
        .map((r) => `${esc(r.kind)} from ${esc(r.target?.name)}`)
        .join(', ');
    case 'effect_removed':
      return (ev.removed ?? [])
        .map((r) => `${esc(r.effectType)} removed from ${esc(r.target?.name)}`)
        .join(', ');
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

export function describeEvent(ev, teamBName) {
  if (!ev)
    return { icon: ICON.start, text: 'Battle in progress…', color: null };

  switch (ev.kind) {
    case 'attack':
      return {
        icon: ICON.attack,
        text: `${ev.attacker?.name} — ${ev.name ?? 'Attack'}`,
        color: EVENT_COLOR.attack,
      };
    case 'special_attack':
      return {
        icon: ICON.special_attack,
        text: `${ev.attacker?.name} — ${ev.name ?? 'Special'} (SPECIAL)`,
        color: EVENT_COLOR.special_attack,
      };
    case 'healing':
      return {
        icon: ICON.healing,
        text: `${ev.source?.name} — ${ev.name ?? 'Healing'}`,
        color: EVENT_COLOR.healing,
      };
    case 'buff':
      return {
        icon: ICON.buff,
        text: `${ev.source?.name} — ${ev.name ?? 'Buff'}`,
        color: EVENT_COLOR.buff,
      };
    case 'debuff':
      return {
        icon: ICON.debuff,
        text: `${ev.source?.name} — ${ev.name ?? 'Debuff'}`,
        color: EVENT_COLOR.debuff,
      };
    case 'buff_removed':
      return {
        icon: ICON.buff_removed,
        text: `Buff removed — ${ev.eventName ?? ''}`,
        color: EVENT_COLOR.buff_removed,
      };
    case 'debuff_removed':
      return {
        icon: ICON.debuff_removed,
        text: `Debuff removed — ${ev.eventName ?? ''}`,
        color: EVENT_COLOR.debuff_removed,
      };
    case 'buff_expired': {
      const types =
        (ev.expired ?? []).map((e) => e.kind).join(', ') || 'effect';
      return {
        icon: ICON.buff_expired,
        text: `Buff expired: ${types}`,
        color: EVENT_COLOR.buff_expired,
      };
    }
    case 'debuff_expired': {
      const types =
        (ev.expired ?? []).map((e) => e.kind).join(', ') || 'effect';
      return {
        icon: ICON.debuff_expired,
        text: `Debuff expired: ${types}`,
        color: EVENT_COLOR.debuff_expired,
      };
    }
    case 'status_change':
      if (ev.status === 'dead')
        return {
          icon: ICON.dead,
          text: `${ev.card?.name} eliminated`,
          color: '#f43f5e',
        };
      return {
        icon: STATUS_ICON[ev.status] ?? ICON.status_change,
        text: `${ev.card?.name} — ${ev.status}`,
        color: EVENT_COLOR.status_change,
      };
    case 'state_effect': {
      const col =
        ev.type === 'burn'
          ? EVENT_COLOR.state_effect_burn
          : ev.type === 'poison'
            ? EVENT_COLOR.state_effect_poison
            : EVENT_COLOR.state_effect_freeze;
      return {
        icon: STATUS_ICON[ev.type] ?? ICON.state_effect,
        text: `${ev.card?.name} — ${ev.type} tick`,
        color: col,
      };
    }
    case 'targeting_override':
      return {
        icon: ICON.targeting_override,
        text: `${ev.source?.name} — ${ev.name ?? 'Targeting override'}`,
        color: EVENT_COLOR.targeting_override,
      };
    case 'targeting_reverted':
      return {
        icon: ICON.targeting_reverted,
        text: `Targeting reverted — ${ev.eventName ?? ''}`,
        color: EVENT_COLOR.targeting_reverted,
      };
    case 'effect_removed':
      return {
        icon: ICON.effect_removed,
        text: `Effects removed — ${ev.eventName ?? ''}`,
        color: EVENT_COLOR.effect_removed,
      };
    case 'fight_end': {
      const bossWins = ev.winner && ev.winner === teamBName;
      return {
        icon: ev.winner && !bossWins ? ICON.fight_end : ICON.fight_end_loss,
        text: `FIGHT END — ${ev.winner ? `Winner: ${ev.winner}` : 'Draw'}`,
        color: bossWins ? '#f43f5e' : '#22c55e',
      };
    }
    default:
      return {
        icon: ICON.unknown,
        text: ev.kind ?? 'Unknown event',
        color: '#94a3b8',
      };
  }
}
