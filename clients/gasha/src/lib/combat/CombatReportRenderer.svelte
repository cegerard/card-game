<script lang="ts">
  import { onMount } from 'svelte';
  import { aggregateCombatStats, type CardStat } from '$lib/combat/combatStats.js';
  import { detectOutcome } from '$lib/combat/outcome.js';
  import type { FightResult } from '$lib/arcade/types.js';

  interface Props {
    fightResult: FightResult;
    playerName: string;
    playerCardIds: string[];
    // eslint-disable-next-line no-unused-vars
    oncomplete: (result: { playerWon: boolean }) => void;
  }

  let { fightResult, playerName, playerCardIds, oncomplete }: Props = $props();

  const PALETTE = ['#ff6b35', '#3aacf0', '#5ec85e', '#ffc044', '#c87bff'];
  const TOTEMS = ['🔥', '💧', '🌿', '⚡', '⚔️'];
  const EL_LABELS = ['FIR', 'WAT', 'EAR', 'AIR', 'PHY'];

  const stats = $derived(aggregateCombatStats(fightResult, playerCardIds));
  const outcome = $derived(detectOutcome(fightResult, playerName));
  const playerWon = $derived(outcome === 'victory');

  const allCards = $derived([...stats.enemyCards, ...stats.playerCards]);
  const maxDealt = $derived(Math.max(...allCards.map((c) => c.damageDealt), 1));
  const maxTaken = $derived(Math.max(...allCards.map((c) => c.damageTaken), 1));
  const maxHeal = $derived(Math.max(...allCards.map((c) => c.healingDone), 1));

  const mvp = $derived<CardStat | null>(
    allCards.length > 0
      ? allCards.reduce((best, c) => (c.damageDealt > best.damageDealt ? c : best), allCards[0])
      : null,
  );

  const mvpIndex = $derived(allCards.findIndex((c) => c.id === mvp?.id));

  function colorAt(index: number) {
    return PALETTE[index % PALETTE.length];
  }
  function totemAt(index: number) {
    return TOTEMS[index % TOTEMS.length];
  }
  function labelAt(index: number) {
    return EL_LABELS[index % EL_LABELS.length];
  }
  function pct(value: number, max: number) {
    return Math.round((value / max) * 100);
  }

  let mounted = $state(false);
  let confettiEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    mounted = true;
    if (playerWon && confettiEl) spawnConfetti(confettiEl);
  });

  function spawnConfetti(container: HTMLDivElement) {
    const colors = ['#ffcf6b', '#ff7a45', '#4ade80', '#37e0ff', '#c87bff'];
    for (let i = 0; i < 44; i++) {
      const piece = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isCircle = Math.random() > 0.5;
      Object.assign(piece.style, {
        position: 'absolute',
        width: `${5 + Math.random() * 6}px`,
        height: `${8 + Math.random() * 8}px`,
        background: color,
        borderRadius: isCircle ? '50%' : '2px',
        left: `${Math.random() * 100}%`,
        top: '-20px',
        opacity: '0',
        animation: `confFall ${1.8 + Math.random() * 2}s ${Math.random() * 1.2}s ease-in forwards`,
      });
      container.appendChild(piece);
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="report">
  <div class="section-label">Enemy Team</div>

  <div class="cards-row top-row">
    {#each stats.enemyCards as card, i}
      {@const color = colorAt(i)}
      {@const isMvp = mvp?.id === card.id}
      <div class="card" class:dead={card.isDead} style="--el:{color}">
        <div class="card-header" style="background: radial-gradient(120% 90% at 50% 18%, {color}55, #0c0a07)">
          <span class="totem">{totemAt(i)}</span>
          <span class="el-badge">
            <i class="el-dot" style="background:{color}"></i>
            <span class="el-text">{labelAt(i)}</span>
          </span>
          {#if isMvp}<span class="mvp-badge">MVP</span>{/if}
        </div>
        <div class="card-body">
          <div class="card-name">{card.name}</div>
          <div class="stat-row">
            <span class="stat-label dmg-label">DG</span>
            <div class="bar-track">
              <i class="bar-fill dmg-fill" style:width={mounted ? `${pct(card.damageDealt, maxDealt)}%` : '0'}></i>
            </div>
            <span class="stat-count">{card.damageDealt}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label tak-label">EN</span>
            <div class="bar-track">
              <i class="bar-fill tak-fill" style:width={mounted ? `${pct(card.damageTaken, maxTaken)}%` : '0'}></i>
            </div>
            <span class="stat-count">{card.damageTaken}</span>
          </div>
          {#if card.healingDone > 0}
            <div class="stat-row">
              <span class="stat-label heal-label">SO</span>
              <div class="bar-track">
                <i class="bar-fill heal-fill" style:width={mounted ? `${pct(card.healingDone, maxHeal)}%` : '0'}></i>
              </div>
              <span class="stat-count">{card.healingDone}</span>
            </div>
          {:else}
            <div class="stat-row-placeholder"></div>
          {/if}
        </div>
        {#if card.isDead}
          <div class="ko-overlay"><span class="ko-stamp">K.O.</span></div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="banner">
    <div class="banner-line top-line"></div>
    {#if playerWon}
      <div class="battle-label won-label">— Battle won —</div>
      <div class="victory-text">VICTORY</div>
      <div class="winner-line">Winner · <b class="winner-name">{stats.winner ?? playerName}</b></div>
      {#if mvp}
        <div class="mvp-pill won-pill">
          <span class="mvp-totem">{totemAt(mvpIndex)}</span>
          <span class="mvp-tag">★ MVP</span>
          <span class="mvp-name">{mvp.name}</span>
        </div>
      {/if}
    {:else}
      <div class="battle-label lost-label">— Squad defeated —</div>
      <div class="defeat-text">DEFEAT</div>
      <div class="winner-line lost-line">Winner · <b class="winner-name lost-winner">{stats.winner ?? 'Enemy'}</b></div>
      {#if mvp}
        <div class="mvp-pill lost-pill">
          <span class="mvp-totem">{totemAt(mvpIndex)}</span>
          <span class="mvp-tag lost-tag">★ TOP</span>
          <span class="mvp-name lost-mvp-name">{mvp.name}</span>
        </div>
      {/if}
    {/if}
    <div class="legend">
      <span><i class="leg-dot" style="background:#ff7a45"></i>DEALT</span>
      <span><i class="leg-dot" style="background:#5aa0e6"></i>TAKEN</span>
      <span><i class="leg-dot" style="background:#4ade80"></i>HEALS</span>
    </div>
    <div class="banner-line bottom-line"></div>
  </div>

  <div class="cards-row bottom-row">
    {#each stats.playerCards as card, i}
      {@const color = colorAt(i)}
      {@const isMvp = mvp?.id === card.id}
      <div class="card" class:dead={card.isDead} style="--el:{color}">
        <div class="card-header" style="background: radial-gradient(120% 90% at 50% 18%, {color}55, #0c0a07)">
          <span class="totem">{totemAt(i)}</span>
          <span class="el-badge">
            <i class="el-dot" style="background:{color}"></i>
            <span class="el-text">{labelAt(i)}</span>
          </span>
          {#if isMvp}<span class="mvp-badge">MVP</span>{/if}
        </div>
        <div class="card-body">
          <div class="card-name">{card.name}</div>
          <div class="stat-row">
            <span class="stat-label dmg-label">DG</span>
            <div class="bar-track">
              <i class="bar-fill dmg-fill" style:width={mounted ? `${pct(card.damageDealt, maxDealt)}%` : '0'}></i>
            </div>
            <span class="stat-count">{card.damageDealt}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label tak-label">EN</span>
            <div class="bar-track">
              <i class="bar-fill tak-fill" style:width={mounted ? `${pct(card.damageTaken, maxTaken)}%` : '0'}></i>
            </div>
            <span class="stat-count">{card.damageTaken}</span>
          </div>
          {#if card.healingDone > 0}
            <div class="stat-row">
              <span class="stat-label heal-label">SO</span>
              <div class="bar-track">
                <i class="bar-fill heal-fill" style:width={mounted ? `${pct(card.healingDone, maxHeal)}%` : '0'}></i>
              </div>
              <span class="stat-count">{card.healingDone}</span>
            </div>
          {:else}
            <div class="stat-row-placeholder"></div>
          {/if}
        </div>
        {#if card.isDead}
          <div class="ko-overlay"><span class="ko-stamp">K.O.</span></div>
        {/if}
      </div>
    {/each}
  </div>

  <button class="continue-btn" onclick={() => oncomplete({ playerWon })}>Continue</button>

  <div class="confetti-layer" bind:this={confettiEl}></div>
</div>

<style>
  @keyframes shimmer {
    to {
      background-position: -200% center;
    }
  }
  @keyframes rayspin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes confFall {
    0% {
      transform: translateY(-30px) rotate(0);
      opacity: 0;
    }
    9% {
      opacity: 1;
    }
    100% {
      transform: translateY(820px) rotate(720deg);
      opacity: 0.12;
    }
  }
  @keyframes cardIn-top {
    from {
      opacity: 0;
      transform: translateY(-14px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes cardIn-bottom {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .report {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: radial-gradient(120% 80% at 50% 0%, #241a10, #0d0a07 70%);
    color: #e7e5e4;
    font-family: Oswald, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    padding: 14px 12px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .section-label {
    font: 600 9px 'JetBrains Mono', monospace;
    letter-spacing: 0.3em;
    color: #9a7b45;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* ── Card rows ── */

  .cards-row {
    display: flex;
    gap: 5px;
    flex: 1.05;
    align-items: stretch;
  }

  .top-row .card {
    animation: cardIn-top 0.4s ease both;
  }

  .bottom-row .card {
    animation: cardIn-bottom 0.4s ease both;
  }

  .cards-row .card:nth-child(1) { animation-delay: 0.05s; }
  .cards-row .card:nth-child(2) { animation-delay: 0.1s; }
  .cards-row .card:nth-child(3) { animation-delay: 0.15s; }
  .cards-row .card:nth-child(4) { animation-delay: 0.2s; }
  .cards-row .card:nth-child(5) { animation-delay: 0.25s; }

  /* ── Card ── */

  .card {
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    border-radius: 11px;
    overflow: hidden;
    background: linear-gradient(165deg, #322516, #160f08);
    border: 1.5px solid rgba(255, 207, 107, 0.3);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.09);
    display: flex;
    flex-direction: column;
  }

  .card.dead {
    filter: grayscale(0.7);
    opacity: 0.65;
  }

  /* ── Card header ── */

  .card-header {
    position: relative;
    height: 56px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .totem {
    font-size: 28px;
    line-height: 1;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
  }

  .el-badge {
    position: absolute;
    left: 3px;
    top: 3px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px 4px 1px 3px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.4);
  }

  .el-dot {
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    box-shadow: 0 0 5px var(--el);
  }

  .el-text {
    font: 700 6px 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    color: #f3e6c8;
  }

  .mvp-badge {
    position: absolute;
    right: 3px;
    top: 3px;
    font: 700 7px Oswald, sans-serif;
    background: #ffcf6b;
    color: #241a08;
    padding: 1px 4px;
    border-radius: 4px;
    box-shadow: 0 0 9px #ffcf6baa;
    letter-spacing: 0.04em;
  }

  /* ── Card body ── */

  .card-body {
    padding: 5px 6px 7px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .card-name {
    font: 700 11px Oswald, sans-serif;
    color: #fde7bd;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    margin-bottom: 4px;
  }

  /* ── Stat bars ── */

  .stat-row {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 3px;
  }

  .stat-row-placeholder {
    height: 13px;
    margin-top: 3px;
  }

  .stat-label {
    font: 700 6px Oswald, sans-serif;
    letter-spacing: 0.04em;
    width: 13px;
    flex-shrink: 0;
  }
  .dmg-label { color: #ff7a45; }
  .tak-label { color: #5aa0e6; }
  .heal-label { color: #4ade80; }

  .bar-track {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.09);
    overflow: hidden;
  }

  .bar-fill {
    display: block;
    height: 100%;
    width: 0;
    border-radius: 2px;
    transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .dmg-fill { background: linear-gradient(90deg, #ff7a45, #ffb35b); }
  .tak-fill { background: linear-gradient(90deg, #4a86d6, #7db6f0); }
  .heal-fill { background: linear-gradient(90deg, #37b86a, #74e89e); }

  .stat-count {
    font: 700 8px 'JetBrains Mono', monospace;
    min-width: 19px;
    text-align: right;
    color: rgba(255, 255, 255, 0.55);
  }

  /* ── K.O. overlay ── */

  .ko-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .ko-stamp {
    font: 700 11px Oswald, sans-serif;
    color: #ff5a4d;
    border: 2px solid #ff5a4d;
    padding: 1px 6px;
    border-radius: 5px;
    transform: rotate(-11deg);
    letter-spacing: 0.08em;
    background: rgba(10, 6, 4, 0.55);
    box-shadow: 0 0 12px rgba(255, 90, 77, 0.55);
  }

  /* ── Banner ── */

  .banner {
    padding: 8px 10px;
    text-align: center;
    flex-shrink: 0;
    position: relative;
  }

  .banner-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 207, 107, 0.55), transparent);
  }
  .top-line { margin-bottom: 4px; }
  .bottom-line { margin-top: 8px; }

  .battle-label {
    font: 900 11px Oswald, sans-serif;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .won-label { color: #caa24a; }
  .lost-label { color: #a85149; }

  .victory-text {
    font: 900 clamp(32px, 9vw, 46px) / 1 Cinzel, serif;
    background: linear-gradient(95deg, #a9802f, #ffe9af 45%, #fff6df 55%, #a9802f);
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 4s linear infinite;
    text-shadow: none;
    margin: 3px 0;
    position: relative;
  }

  .victory-text::before {
    content: '';
    position: absolute;
    top: -26px;
    left: 50%;
    width: 300px;
    height: 300px;
    transform: translateX(-50%);
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(255, 207, 107, 0.18) 12deg,
      transparent 24deg,
      transparent 36deg,
      rgba(255, 207, 107, 0.14) 48deg,
      transparent 60deg
    );
    border-radius: 50%;
    animation: rayspin 16s linear infinite;
    -webkit-mask: radial-gradient(circle, #000 30%, transparent 70%);
    mask: radial-gradient(circle, #000 30%, transparent 70%);
    pointer-events: none;
  }

  .defeat-text {
    font: 900 clamp(32px, 9vw, 46px) / 1 Cinzel, serif;
    color: #c9554b;
    text-shadow: 0 2px 22px rgba(201, 85, 75, 0.4);
    margin: 3px 0;
    filter: grayscale(0.15);
  }

  .winner-line {
    font: 400 12px Oswald, sans-serif;
    color: #e9d9b3;
  }

  .lost-line { color: #cdbfb0; }

  .winner-name { color: #ffe1a3; }
  .lost-winner { color: #f0a59b; }

  .mvp-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 7px;
    padding: 4px 11px;
    border-radius: 999px;
  }

  .won-pill {
    background: rgba(255, 207, 107, 0.13);
    border: 1px solid rgba(255, 207, 107, 0.4);
  }

  .lost-pill {
    background: rgba(201, 85, 75, 0.13);
    border: 1px solid rgba(201, 85, 75, 0.4);
  }

  .mvp-totem { font-size: 12px; }

  .mvp-tag {
    font: 700 8px Oswald, sans-serif;
    letter-spacing: 0.1em;
    color: #ffcf6b;
  }

  .lost-tag { color: #f0a59b; }

  .mvp-name {
    font: 700 11px Oswald, sans-serif;
    color: #fff2d6;
  }

  .lost-mvp-name { color: #ffdde3; }

  .legend {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin-top: 8px;
    font: 600 8px 'JetBrains Mono', monospace;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.4);
  }

  .leg-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 1px;
    vertical-align: middle;
    margin-right: 3px;
  }

  /* ── Continue button ── */

  .continue-btn {
    margin-top: 10px;
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 13px;
    background: linear-gradient(95deg, #e0a83a, #ffd87a, #e0a83a);
    background-size: 200% auto;
    color: #2a1c06;
    font: 700 15px Oswald, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(255, 207, 107, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: filter 0.2s;
    flex-shrink: 0;
  }

  .continue-btn:hover {
    filter: brightness(1.08);
  }

  /* ── Confetti ── */

  .confetti-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 60;
    overflow: hidden;
  }
</style>
