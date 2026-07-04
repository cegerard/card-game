<script lang="ts">
  import Overlay from '$lib/design-system/primitives/Overlay.svelte';
  import Button from '$lib/design-system/primitives/Button.svelte';

  interface Props {
    level: number;
    isFinalVictory: boolean;
    onnext?: () => void;
    onmenu?: () => void;
  }

  let { level, isFinalVictory, onnext, onmenu }: Props = $props();
</script>

<Overlay gap="1rem">
  {#if isFinalVictory}
    <h2>All Levels Cleared!</h2>
    <p>You conquered all {level} levels!</p>
  {:else}
    <h2>Victory!</h2>
    <p>Level {level} complete</p>
  {/if}

  <div class="actions">
    {#if !isFinalVictory}
      <Button variant="secondary" onclick={onnext}>Next Level</Button>
    {/if}
    <Button variant="secondary" onclick={onmenu}>Back to Menu</Button>
  </div>
</Overlay>

<style>
  h2 {
    font-family: var(--gasha-font-display);
    color: var(--gasha-gold-300);
    font-size: 2rem;
    margin: 0;
  }

  p {
    color: var(--gasha-text-warm);
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
</style>
