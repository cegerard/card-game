<script lang="ts">
  import Panel from '$lib/design-system/primitives/Panel.svelte';
  import CardHeader from '$lib/design-system/composites/CardHeader.svelte';
  import { elementIndex, pct } from '$lib/design-system/tokens.js';
  import { TIER_CAPS } from '$lib/progression/constants.js';
  import { computeEffectiveStats } from '$lib/experience/apply-experience.js';
  import type { CardDefinition } from '@card-game/shared-types';
  import type { CardProgression } from '$lib/progression/types.js';

  interface Props {
    card: CardDefinition;
    progression: CardProgression;
    selected: boolean;
    disabled: boolean;
    // eslint-disable-next-line no-unused-vars
    ontoggle: (id: string) => void;
  }

  let { card, progression, selected, disabled, ontoggle }: Props = $props();

  const index = $derived(elementIndex(card.element));
  const isMaxTier = $derived(progression.tier >= 5);
  const tierCap = $derived(TIER_CAPS[progression.tier]);
  const xpTowardCap = $derived(Math.min(progression.experience, tierCap));
  const xpBarPct = $derived(isMaxTier ? 100 : pct(xpTowardCap, tierCap));
  const xpLabel = $derived(
    isMaxTier
      ? `${Math.round(progression.experience)} XP`
      : `${Math.round(xpTowardCap)}/${tierCap}`,
  );

  // Stats affichées = stats effectives (XP incluse), pour que la sélection
  // du deck reflète la vraie force des cartes plutôt que leurs valeurs de
  // base. La carte n'entre jamais en combat sur ses seules valeurs de base
  // dès qu'elle a de l'XP (voir Notion > Système d'expérience > § 3).
  const effectiveStats = $derived(computeEffectiveStats(card, progression));
  const isBoosted = (stat: keyof typeof card.stats) =>
    effectiveStats[stat] > card.stats[stat];

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
          <dd class:boosted={isBoosted('attack')}>
            {Math.round(effectiveStats.attack)}
          </dd>
        </div>
        <div>
          <dt>DEF</dt>
          <dd class:boosted={isBoosted('defense')}>
            {Math.round(effectiveStats.defense)}
          </dd>
        </div>
        <div>
          <dt>HP</dt>
          <dd class:boosted={isBoosted('health')}>
            {Math.round(effectiveStats.health)}
          </dd>
        </div>
      </dl>
      <div class="xp-row">
        <span class="tier-badge">★{progression.tier}</span>
        <div class="xp-track">
          <i class="xp-fill" style:width="{xpBarPct}%"></i>
        </div>
        <span class="xp-label">{xpLabel}</span>
      </div>
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

  .stats dd.boosted {
    color: var(--gasha-gold-300);
  }

  .xp-row {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 5px;
  }

  .tier-badge {
    font: 700 8px var(--gasha-font-ui);
    color: var(--gasha-gold-300);
    flex-shrink: 0;
  }

  .xp-track {
    flex: 1;
    height: 4px;
    border-radius: var(--gasha-radius-xs);
    background: rgba(255, 255, 255, 0.09);
    overflow: hidden;
  }

  .xp-fill {
    display: block;
    height: 100%;
    border-radius: var(--gasha-radius-xs);
    background: linear-gradient(
      90deg,
      var(--gasha-gold-400),
      var(--gasha-gold-300)
    );
  }

  .xp-label {
    font: 700 7px var(--gasha-font-mono);
    color: var(--gasha-text-muted);
    white-space: nowrap;
  }
</style>
