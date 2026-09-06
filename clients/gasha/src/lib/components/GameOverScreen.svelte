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
    xpGains?: XpGain[];
    onmenu?: () => void;
  }

  let { xpGains = [], onmenu }: Props = $props();
</script>

<Overlay gap="1.5rem">
  <h2>Game Over</h2>
  <XpGainList gains={xpGains} />
  <Button variant="secondary" onclick={onmenu}>Back to Menu</Button>
</Overlay>

<style>
  h2 {
    font-family: var(--gasha-font-display);
    color: var(--gasha-defeat);
    font-size: 2rem;
    margin: 0;
  }
</style>
