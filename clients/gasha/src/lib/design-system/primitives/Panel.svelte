<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    dead?: boolean;
    children: Snippet;
  }

  let { dead = false, children }: Props = $props();
</script>

<div class="panel" class:dead>
  {@render children()}
</div>

<style>
  .panel {
    position: relative;
    border-radius: var(--gasha-radius-lg);
    overflow: hidden;
    background: linear-gradient(
      165deg,
      var(--gasha-bg-card-a),
      var(--gasha-bg-card-b)
    );
    border: 1.5px solid rgba(255, 207, 107, 0.3);
    box-shadow: var(--gasha-shadow-card);
    display: flex;
    flex-direction: column;
  }

  .panel.dead {
    filter: grayscale(0.7);
    opacity: 0.65;
  }
</style>
