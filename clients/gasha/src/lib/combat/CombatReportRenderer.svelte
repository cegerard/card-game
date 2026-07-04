<script lang="ts">
  import { onMount } from 'svelte';
  import {
    aggregateCombatStats,
    type CardStat,
  } from '$lib/combat/combatStats.js';
  import { detectOutcome } from '$lib/combat/outcome.js';
  import { totemAt, CONFETTI_COLORS } from '$lib/design-system/tokens.js';
  import Button from '$lib/design-system/primitives/Button.svelte';
  import Badge from '$lib/design-system/primitives/Badge.svelte';
  import CharacterCard from '$lib/design-system/composites/CharacterCard.svelte';
  import type { FightResult } from '$lib/arcade/types.js';

  interface Props {
    fightResult: FightResult;
    playerName: string;
    playerCardIds: string[];
    // eslint-disable-next-line no-unused-vars
    oncomplete: (result: { playerWon: boolean }) => void;
  }

  let { fightResult, playerName, playerCardIds, oncomplete }: Props = $props();

  const stats = $derived(aggregateCombatStats(fightResult, playerCardIds));
  const outcome = $derived(detectOutcome(fightResult, playerName));
  const playerWon = $derived(outcome === 'victory');

  const allCards = $derived([...stats.enemyCards, ...stats.playerCards]);
  const maxDealt = $derived(Math.max(...allCards.map((c) => c.damageDealt), 1));
  const maxTaken = $derived(Math.max(...allCards.map((c) => c.damageTaken), 1));
  const maxHeal = $derived(Math.max(...allCards.map((c) => c.healingDone), 1));

  const mvp = $derived<CardStat | null>(
    allCards.length > 0
      ? allCards.reduce(
          (best, c) => (c.damageDealt > best.damageDealt ? c : best),
          allCards[0],
        )
      : null,
  );

  const mvpIndex = $derived(allCards.findIndex((c) => c.id === mvp?.id));

  let mounted = $state(false);
  let confettiEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    mounted = true;
    if (playerWon && confettiEl) spawnConfetti(confettiEl);
  });

  function spawnConfetti(container: HTMLDivElement) {
    for (let i = 0; i < 44; i++) {
      const piece = document.createElement('div');
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
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

<div class="report">
  <div class="section-label">Enemy Team</div>

  <div class="cards-row">
    {#each stats.enemyCards as card, i}
      <CharacterCard
        {card}
        index={i}
        isMvp={mvp?.id === card.id}
        {maxDealt}
        {maxTaken}
        {maxHeal}
        animate={mounted}
        row="top"
      />
    {/each}
  </div>

  <div class="banner">
    <div class="banner-line top-line"></div>
    {#if playerWon}
      <div class="battle-label won-label">— Battle won —</div>
      <div class="victory-text">VICTORY</div>
      <div class="winner-line">
        Winner · <b class="winner-name">{stats.winner ?? playerName}</b>
      </div>
      {#if mvp}
        <Badge variant="outline-pill" tone="won">
          <span class="mvp-totem">{totemAt(mvpIndex)}</span>
          <span class="mvp-tag won-tag">★ MVP</span>
          <span class="mvp-name won-name">{mvp.name}</span>
        </Badge>
      {/if}
    {:else}
      <div class="battle-label lost-label">— Squad defeated —</div>
      <div class="defeat-text">DEFEAT</div>
      <div class="winner-line lost-line">
        Winner · <b class="winner-name lost-winner">{stats.winner ?? 'Enemy'}</b
        >
      </div>
      {#if mvp}
        <Badge variant="outline-pill" tone="lost">
          <span class="mvp-totem">{totemAt(mvpIndex)}</span>
          <span class="mvp-tag lost-tag">★ TOP</span>
          <span class="mvp-name lost-name">{mvp.name}</span>
        </Badge>
      {/if}
    {/if}
    <div class="legend">
      <span
        ><i class="leg-dot" style="background:var(--gasha-dmg-from)"
        ></i>DEALT</span
      >
      <span
        ><i class="leg-dot" style="background:var(--gasha-taken-from)"
        ></i>TAKEN</span
      >
      <span
        ><i class="leg-dot" style="background:var(--gasha-heal-from)"
        ></i>HEALS</span
      >
    </div>
    <div class="banner-line bottom-line"></div>
  </div>

  <div class="cards-row">
    {#each stats.playerCards as card, i}
      <CharacterCard
        {card}
        index={i}
        isMvp={mvp?.id === card.id}
        {maxDealt}
        {maxTaken}
        {maxHeal}
        animate={mounted}
        row="bottom"
      />
    {/each}
  </div>

  <div class="continue-wrap">
    <Button
      variant="primary"
      fullWidth
      onclick={() => oncomplete({ playerWon })}>Continue</Button
    >
  </div>

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

  .report {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: var(--gasha-gradient-bg);
    color: var(--gasha-text-primary);
    font-family: var(--gasha-font-ui);
    -webkit-font-smoothing: antialiased;
    padding: 14px 12px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .section-label {
    font: 600 9px var(--gasha-font-mono);
    letter-spacing: 0.3em;
    color: var(--gasha-gold-700);
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .cards-row {
    display: flex;
    gap: 5px;
    flex: 1.05;
    align-items: stretch;
  }

  .banner {
    padding: 8px 10px;
    text-align: center;
    flex-shrink: 0;
    position: relative;
  }

  .banner-line {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 207, 107, 0.55),
      transparent
    );
  }
  .top-line {
    margin-bottom: 4px;
  }
  .bottom-line {
    margin-top: 8px;
  }

  .battle-label {
    font: 900 11px var(--gasha-font-ui);
    letter-spacing: 0.4em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .won-label {
    color: var(--gasha-gold-600);
  }
  .lost-label {
    color: var(--gasha-defeat-soft);
  }

  .victory-text {
    font: 900 clamp(32px, 9vw, 46px) / 1 var(--gasha-font-display);
    background: linear-gradient(
      95deg,
      var(--gasha-gold-700),
      var(--gasha-gold-200) 45%,
      var(--gasha-gold-100) 55%,
      var(--gasha-gold-700)
    );
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 4s linear infinite;
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
    font: 900 clamp(32px, 9vw, 46px) / 1 var(--gasha-font-display);
    color: var(--gasha-defeat);
    text-shadow: 0 2px 22px rgba(201, 85, 75, 0.4);
    margin: 3px 0;
    filter: grayscale(0.15);
  }

  .winner-line {
    font: 400 12px var(--gasha-font-ui);
    color: #e9d9b3;
  }

  .lost-line {
    color: #cdbfb0;
  }

  .winner-name {
    color: var(--gasha-gold-200);
  }
  .lost-winner {
    color: #f0a59b;
  }

  .mvp-totem {
    font-size: 12px;
  }

  .mvp-tag {
    font: 700 8px var(--gasha-font-ui);
    letter-spacing: 0.1em;
  }
  .won-tag {
    color: var(--gasha-gold-400);
  }
  .lost-tag {
    color: #f0a59b;
  }

  .mvp-name {
    font: 700 11px var(--gasha-font-ui);
  }
  .won-name {
    color: var(--gasha-gold-100);
  }
  .lost-name {
    color: #ffdde3;
  }

  .legend {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin-top: 8px;
    font: 600 8px var(--gasha-font-mono);
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

  .continue-wrap {
    margin-top: 10px;
    flex-shrink: 0;
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
