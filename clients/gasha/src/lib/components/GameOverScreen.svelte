<script lang="ts">
  interface Props {
    onmenu?: () => void;
  }

  let { onmenu }: Props = $props();
</script>

<div class="overlay">
  <h2>Game Over</h2>
  <button onclick={onmenu}>Back to Menu</button>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    gap: 1.5rem;
  }

  h2 {
    font-size: 2rem;
    margin: 0;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
