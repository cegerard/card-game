<script lang="ts">
  import Button from '$lib/design-system/primitives/Button.svelte';
  import { isDeckComplete } from '$lib/deck/deck-store.js';
</script>

<main>
  <h1>Gasha</h1>
  <Button variant="primary" href="/arcade" disabled={!$isDeckComplete}>
    Arcade Mode
  </Button>
  <Button variant="secondary" href="/deck">Deck Builder</Button>
  {#if !$isDeckComplete}
    <p class="warning">Build a full deck of 5 to play.</p>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 2rem;
    background: var(--gasha-gradient-bg);
    color: var(--gasha-text-primary);
  }

  h1 {
    font-family: var(--gasha-font-display);
    color: var(--gasha-gold-300);
    font-size: 3rem;
    margin: 0;
  }

  .warning {
    margin: 0;
    font-size: 0.85rem;
    color: var(--gasha-danger);
  }
</style>
