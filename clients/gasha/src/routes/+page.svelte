<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<main>
  <h1>Gasha</h1>
  <button onclick={() => goto('/arcade')}>Arcade Mode</button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 2rem;
  }

  h1 {
    font-size: 3rem;
    margin: 0;
  }

  button {
    padding: 1rem 2rem;
    font-size: 1.25rem;
    cursor: pointer;
  }
</style>
