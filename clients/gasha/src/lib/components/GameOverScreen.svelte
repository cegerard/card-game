<script lang="ts">
  import Overlay from '$lib/design-system/primitives/Overlay.svelte';
  import Button from '$lib/design-system/primitives/Button.svelte';

  interface Props {
    onmenu?: () => void;
  }

  let { onmenu }: Props = $props();
</script>

<Overlay gap="1.5rem">
  <h2>Game Over</h2>
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
