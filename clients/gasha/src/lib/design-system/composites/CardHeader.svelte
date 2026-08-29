<script lang="ts">
  import type { Snippet } from 'svelte';
  import Badge from '$lib/design-system/primitives/Badge.svelte';
  import { colorAt, totemAt, labelAt } from '$lib/design-system/tokens.js';

  interface Props {
    index: number;
    corner?: Snippet;
  }

  let { index, corner }: Props = $props();

  const color = $derived(colorAt(index));
  const totem = $derived(totemAt(index));
  const label = $derived(labelAt(index));
</script>

<div
  class="card-header"
  style="background: radial-gradient(120% 90% at 50% 18%, {color}55, #0c0a07)"
>
  <span class="totem">{totem}</span>
  <span class="badge-pos el-pos">
    <Badge variant="element">
      <i class="el-dot" style="background:{color}"></i>
      <span class="el-text">{label}</span>
    </Badge>
  </span>
  {#if corner}
    <span class="badge-pos corner-pos">{@render corner()}</span>
  {/if}
</div>

<style>
  .card-header {
    position: relative;
    height: 56px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .totem {
    font-size: 28px;
    line-height: 1;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
  }

  .badge-pos {
    position: absolute;
    top: 3px;
  }
  .el-pos {
    left: 3px;
  }
  .corner-pos {
    right: 3px;
  }

  .el-dot {
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    box-shadow: 0 0 5px currentColor;
  }

  .el-text {
    font: 700 6px var(--gasha-font-mono);
    letter-spacing: 0.05em;
    color: #f3e6c8;
  }
</style>
