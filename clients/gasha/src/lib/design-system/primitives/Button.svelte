<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    fullWidth?: boolean;
    // eslint-disable-next-line no-unused-vars
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    href,
    type = 'button',
    disabled = false,
    fullWidth = false,
    onclick,
    children,
  }: Props = $props();
</script>

{#if href}
  <a
    {href}
    role="button"
    class="gasha-btn {variant}"
    class:full-width={fullWidth}>{@render children()}</a
  >
{:else}
  <button
    {type}
    {disabled}
    {onclick}
    class="gasha-btn {variant}"
    class:full-width={fullWidth}>{@render children()}</button
  >
{/if}

<style>
  .gasha-btn {
    display: inline-block;
    border: none;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    font-family: var(--gasha-font-ui);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: filter 0.2s;
    box-sizing: border-box;
  }

  .gasha-btn.full-width {
    display: block;
    width: 100%;
  }

  .gasha-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .primary {
    padding: 13px;
    border-radius: var(--gasha-radius-xl);
    background: var(--gasha-gradient-button);
    background-size: 200% auto;
    color: var(--gasha-gold-900);
    font-size: 15px;
    box-shadow: var(--gasha-shadow-button);
  }

  .primary:hover {
    filter: brightness(1.08);
  }

  .secondary {
    padding: 0.75rem 1.5rem;
    border-radius: var(--gasha-radius-lg);
    background: var(--gasha-bg-panel);
    border: 1.5px solid rgba(255, 207, 107, 0.4);
    color: var(--gasha-gold-100);
    font-size: 14px;
  }

  .secondary:hover {
    background: var(--gasha-bg-deep);
    border-color: rgba(255, 207, 107, 0.65);
  }
</style>
