<script lang="ts">
  import Panel from '$lib/design-system/primitives/Panel.svelte';
  import Badge from '$lib/design-system/primitives/Badge.svelte';
  import {
    colorAt,
    totemAt,
    labelAt,
    elementIndex,
  } from '$lib/design-system/tokens.js';
  import type { CardConfig } from '$lib/arcade/types.js';

  interface Props {
    card: CardConfig;
    selected: boolean;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    ontoggle: (id: string) => void;
  }

  let { card, selected, disabled, ontoggle }: Props = $props();

  const index = $derived(elementIndex(card.element));
  const color = $derived(colorAt(index));
  const totem = $derived(totemAt(index));
  const label = $derived(labelAt(index));

  function toggle() {
    if (!disabled) ontoggle(card.id);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<div
  class="roster-card"
  class:selected
  class:disabled
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-pressed={selected}
  aria-disabled={disabled}
  aria-label={card.name}
  onclick={toggle}
  onkeydown={onKeydown}
>
  <Panel>
    <div
      class="card-header"
      style="background: radial-gradient(120% 90% at 50% 18%, {color}55, #0c0a07)"
    >
      <span class="totem">{totem}</span>
      <span class="badge-pos">
        <Badge variant="element">
          <i class="el-dot" style="background:{color}"></i>
          <span class="el-text">{label}</span>
        </Badge>
      </span>
      {#if selected}
        <span class="check">✓</span>
      {/if}
    </div>
    <div class="card-body">
      <div class="card-name">{card.name}</div>
      <dl class="stats">
        <div>
          <dt>ATK</dt>
          <dd>{card.attack}</dd>
        </div>
        <div>
          <dt>DEF</dt>
          <dd>{card.defense}</dd>
        </div>
        <div>
          <dt>HP</dt>
          <dd>{card.health}</dd>
        </div>
      </dl>
    </div>
  </Panel>
</div>

<style>
  .roster-card {
    width: 100%;
    cursor: pointer;
    border-radius: var(--gasha-radius-lg);
    transition: transform 0.15s;
  }

  .roster-card:not(.disabled):hover {
    transform: translateY(-3px);
  }

  .roster-card:focus-visible {
    outline: 2px solid var(--gasha-gold-300);
    outline-offset: 2px;
  }

  .roster-card.selected {
    outline: 2px solid var(--gasha-gold-300);
    outline-offset: 2px;
  }

  .roster-card.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .card-header {
    position: relative;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .totem {
    font-size: 28px;
    line-height: 1;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
  }

  .badge-pos {
    position: absolute;
    top: 3px;
    left: 3px;
  }

  .check {
    position: absolute;
    top: 3px;
    right: 5px;
    font: 700 14px var(--gasha-font-ui);
    color: var(--gasha-gold-300);
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
    padding: 6px 8px 9px;
  }

  .card-name {
    font: 700 12px var(--gasha-font-ui);
    color: var(--gasha-text-warm);
    text-align: center;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin: 0;
  }

  .stats div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .stats dt {
    font: 700 7px var(--gasha-font-mono);
    letter-spacing: 0.05em;
    color: var(--gasha-text-primary);
    opacity: 0.6;
  }

  .stats dd {
    margin: 0;
    font: 700 12px var(--gasha-font-ui);
    color: var(--gasha-text-warm);
  }
</style>
