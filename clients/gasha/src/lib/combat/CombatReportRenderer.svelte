<script lang="ts">
  import { aggregateCombatStats } from '$lib/combat/combatStats.js';
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

  const stats = $derived(aggregateCombatStats(fightResult, playerCardIds));
  const outcome = $derived(detectOutcome(fightResult, playerName));
  const playerWon = $derived(outcome === 'victory');
</script>

<div class="report">
  <section class="cards-row">
    {#each stats.enemyCards as card}
      <div class="card-panel" class:dead={card.isDead}>
        <p class="card-name">{card.name}</p>
        <p>DMG dealt: {card.damageDealt}</p>
        <p>DMG taken: {card.damageTaken}</p>
        {#if card.healingDone > 0}
          <p>Healing: {card.healingDone}</p>
        {/if}
      </div>
    {/each}
  </section>

  <section class="banner">
    <h2>{playerWon ? 'Victory!' : 'Defeat'}</h2>
    <p class="winner-name">{stats.winner ?? 'Draw'}</p>
    <button onclick={() => oncomplete({ playerWon })}>Continue</button>
  </section>

  <section class="cards-row">
    {#each stats.playerCards as card}
      <div class="card-panel" class:dead={card.isDead}>
        <p class="card-name">{card.name}</p>
        <p>DMG dealt: {card.damageDealt}</p>
        <p>DMG taken: {card.damageTaken}</p>
        {#if card.healingDone > 0}
          <p>Healing: {card.healingDone}</p>
        {/if}
      </div>
    {/each}
  </section>
</div>

<style>
  .report {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: #1a1a2e;
    color: white;
  }

  .cards-row {
    flex: 2;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .banner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
  }

  .banner h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  .winner-name {
    margin: 0;
    color: #cccccc;
  }

  .card-panel {
    flex: 1 1 0;
    min-width: 0;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .card-panel.dead {
    filter: grayscale(1);
    opacity: 0.5;
  }

  .card-name {
    font-weight: bold;
    margin: 0 0 0.25rem;
  }

  p {
    margin: 0;
  }
</style>
