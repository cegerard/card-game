<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant: 'element' | 'solid-gold' | 'outline-pill';
    tone?: 'won' | 'lost';
    children: Snippet;
  }

  let { variant, tone = 'won', children }: Props = $props();
</script>

<span
  class="badge {variant}"
  class:won={variant === 'outline-pill' && tone === 'won'}
  class:lost={variant === 'outline-pill' && tone === 'lost'}
>
  {@render children()}
</span>

<style>
  .badge {
    font-family: var(--gasha-font-ui);
  }

  .element {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 4px 1px 3px;
    border-radius: var(--gasha-radius-pill);
    background: rgba(0, 0, 0, 0.4);
  }

  .solid-gold {
    display: inline-block;
    font: 700 7px var(--gasha-font-ui);
    background: var(--gasha-gold-400);
    color: var(--gasha-gold-900);
    padding: 1px 4px;
    border-radius: var(--gasha-radius-sm);
    box-shadow: var(--gasha-shadow-badge-glow);
  }

  .outline-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 11px;
    border-radius: var(--gasha-radius-pill);
  }

  .outline-pill.won {
    background: rgba(255, 207, 107, 0.13);
    border: 1px solid rgba(255, 207, 107, 0.4);
  }

  .outline-pill.lost {
    background: rgba(201, 85, 75, 0.13);
    border: 1px solid rgba(201, 85, 75, 0.4);
  }
</style>
