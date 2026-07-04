<script lang="ts">
  import Button from '$lib/design-system/primitives/Button.svelte';
</script>

<main>
  <h1>Gasha</h1>
  <Button variant="primary" href="/arcade">Arcade Mode</Button>
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
</style>
