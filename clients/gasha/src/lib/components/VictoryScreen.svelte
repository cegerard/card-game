<script lang="ts">
  import Overlay from '$lib/design-system/primitives/Overlay.svelte';
  import Button from '$lib/design-system/primitives/Button.svelte';
  import XpGainList from './XpGainList.svelte';

  interface XpGain {
    cardId: string;
    name: string;
    gain: number;
  }

  interface Props {
    level: number;
    isFinalVictory: boolean;
    xpGains?: XpGain[];
    onnext?: () => void;
    onmenu?: () => void;
  }

  let { level, isFinalVictory, xpGains = [], onnext, onmenu }: Props = $props();
</script>

<Overlay>
  {#if isFinalVictory}
    <h2>All Levels Cleared!</h2>
    <p>You conquered all {level} levels!</p>
  {:else}
    <h2>Victory!</h2>
    <p>Level {level} complete</p>
  {/if}

  <XpGainList gains={xpGains} />

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
