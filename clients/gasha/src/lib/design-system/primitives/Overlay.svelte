<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    gap?: string;
    children: Snippet;
  }

  let { gap = '1rem', children }: Props = $props();
</script>

<div class="overlay" style:gap>
  {@render children()}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--gasha-gradient-bg);
    color: var(--gasha-text-primary);
    font-family: var(--gasha-font-ui);
  }
</style>
