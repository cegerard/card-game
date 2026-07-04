<script lang="ts">
  import Panel from '$lib/design-system/primitives/Panel.svelte';
  import Badge from '$lib/design-system/primitives/Badge.svelte';
  import StatBar from '$lib/design-system/primitives/StatBar.svelte';
  import { colorAt, totemAt, labelAt } from '$lib/design-system/tokens.js';
  import type { CardStat } from '$lib/combat/combatStats.js';

  interface Props {
    card: CardStat;
    index: number;
    isMvp: boolean;
    maxDealt: number;
    maxTaken: number;
    maxHeal: number;
    animate?: boolean;
    row?: 'top' | 'bottom';
  }

  let {
    card,
    index,
    isMvp,
    maxDealt,
    maxTaken,
    maxHeal,
    animate = true,
    row = 'top',
  }: Props = $props();

  const color = $derived(colorAt(index));
  const totem = $derived(totemAt(index));
  const label = $derived(labelAt(index));
  const delay = $derived(`${0.05 + index * 0.05}s`);
</script>

<div class="card-slot {row}" style:animation-delay={delay}>
  <Panel dead={card.isDead}>
    <div
      class="card-header"
      style="background: radial-gradient(120% 90% at 50% 18%, {color}55, #0c0a07)"
    >
      <span class="totem">{totem}</span>
      <span class="badge-pos el-pos">
        <Badge variant="element">
          <i class="el-dot" style="background:{color}"></i>
          <span class="el-text">{label}</span>
        </Badge>
      </span>
      {#if isMvp}
        <span class="badge-pos mvp-pos">
          <Badge variant="solid-gold">MVP</Badge>
        </span>
      {/if}
    </div>
    <div class="card-body">
      <div class="card-name">{card.name}</div>
      <StatBar
        label="DG"
        value={card.damageDealt}
        max={maxDealt}
        tone="damage"
        {animate}
      />
      <StatBar
        label="EN"
        value={card.damageTaken}
        max={maxTaken}
        tone="taken"
        {animate}
      />
      {#if card.healingDone > 0}
        <StatBar
          label="SO"
          value={card.healingDone}
          max={maxHeal}
          tone="heal"
          {animate}
        />
      {:else}
        <div class="stat-row-placeholder"></div>
      {/if}
    </div>
  </Panel>
  {#if card.isDead}
    <div class="ko-overlay"><span class="ko-stamp">K.O.</span></div>
  {/if}
</div>

<style>
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

  .card-slot {
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    animation: cardIn-top 0.4s ease both;
  }
  .card-slot.bottom {
    animation-name: cardIn-bottom;
  }

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

  .badge-pos {
    position: absolute;
    top: 3px;
  }
  .el-pos {
    left: 3px;
  }
  .mvp-pos {
    right: 3px;
  }

  .el-dot {
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    box-shadow: 0 0 5px currentColor;
  }

  .el-text {
    font: 700 6px var(--gasha-font-mono);
    letter-spacing: 0.05em;
    color: #f3e6c8;
  }

  .card-body {
    padding: 5px 6px 7px;
    flex: 1;
  }

  .card-name {
    font: 700 11px var(--gasha-font-ui);
    color: var(--gasha-text-warm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    margin-bottom: 4px;
  }

  .stat-row-placeholder {
    height: 13px;
    margin-top: 3px;
  }

  .ko-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .ko-stamp {
    font: 700 11px var(--gasha-font-ui);
    color: var(--gasha-danger);
    border: 2px solid var(--gasha-danger);
    padding: 1px 6px;
    border-radius: var(--gasha-radius-md);
    transform: rotate(-11deg);
    letter-spacing: 0.08em;
    background: rgba(10, 6, 4, 0.55);
    box-shadow: 0 0 12px rgba(255, 90, 77, 0.55);
  }
</style>
