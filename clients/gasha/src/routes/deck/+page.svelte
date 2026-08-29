<script lang="ts">
  import Button from '$lib/design-system/primitives/Button.svelte';
  import RosterCard from '$lib/deck/RosterCard.svelte';
  import { CHARACTER_ROSTER } from '$lib/deck/roster.js';
  import {
    selectedCardIds,
    toggleCard,
    isDeckComplete,
    DECK_SIZE,
  } from '$lib/deck/deck-store.js';

  const count = $derived($selectedCardIds.length);
</script>

<main>
  <header>
    <h1>Deck Builder</h1>
    <p class="counter" class:complete={$isDeckComplete}>
      {count} / {DECK_SIZE} selected
    </p>
    <p class="hint">
      {#if $isDeckComplete}
        Your deck is ready.
      {:else}
        Pick {DECK_SIZE - count} more character{DECK_SIZE - count === 1
          ? ''
          : 's'}.
      {/if}
    </p>
  </header>

  <section class="roster">
    {#each CHARACTER_ROSTER as card (card.id)}
      {@const selected = $selectedCardIds.includes(card.id)}
      <RosterCard
        {card}
        {selected}
        disabled={!selected && count >= DECK_SIZE}
        ontoggle={toggleCard}
      />
    {/each}
  </section>

  <Button href="/" variant="secondary">Back to Menu</Button>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 1rem 3rem;
    background: var(--gasha-gradient-bg);
    color: var(--gasha-text-primary);
  }

  header {
    text-align: center;
  }

  h1 {
    font-family: var(--gasha-font-display);
    color: var(--gasha-gold-300);
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  .counter {
    font: 700 1.1rem var(--gasha-font-ui);
    margin: 0;
  }

  .counter.complete {
    color: var(--gasha-gold-300);
  }

  .hint {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    opacity: 0.7;
  }

  .roster {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
    width: 100%;
    max-width: 640px;
  }
</style>
