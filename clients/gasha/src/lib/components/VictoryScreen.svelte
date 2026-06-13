<script lang="ts">
  interface Props {
    level: number;
    isFinalVictory: boolean;
    onnext?: () => void;
    onmenu?: () => void;
  }

  let { level, isFinalVictory, onnext, onmenu }: Props = $props();
</script>

<div class="overlay">
  {#if isFinalVictory}
    <h2>All Levels Cleared!</h2>
    <p>You conquered all {level} levels!</p>
  {:else}
    <h2>Victory!</h2>
    <p>Level {level} complete</p>
  {/if}

  <div class="actions">
    {#if !isFinalVictory}
      <button onclick={onnext}>Next Level</button>
    {/if}
    <button onclick={onmenu}>Back to Menu</button>
  </div>
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
    gap: 1rem;
  }

  h2 {
    font-size: 2rem;
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
