<script lang="ts">
  import Panel from '$lib/design-system/primitives/Panel.svelte';
  import CardHeader from '$lib/design-system/composites/CardHeader.svelte';
  import { elementIndex } from '$lib/design-system/tokens.js';
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
    <CardHeader {index}>
      {#snippet corner()}
        {#if selected}<span class="check">✓</span>{/if}
      {/snippet}
    </CardHeader>
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

  .check {
    font: 700 14px var(--gasha-font-ui);
    color: var(--gasha-gold-300);
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
