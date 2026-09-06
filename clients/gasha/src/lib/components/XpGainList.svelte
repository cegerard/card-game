<script lang="ts">
  interface XpGain {
    cardId: string;
    name: string;
    gain: number;
  }

  interface Props {
    gains: XpGain[];
  }

  let { gains }: Props = $props();
</script>

{#if gains.length > 0}
  <ul class="xp-gains">
    {#each gains as gain (gain.cardId)}
      <li>
        <span class="name">{gain.name}</span>
        <span class="amount">+{Math.round(gain.gain)} XP</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .xp-gains {
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    max-width: 220px;
  }

  .xp-gains li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font: 700 0.85rem var(--gasha-font-ui);
  }

  .name {
    color: var(--gasha-text-warm);
  }

  .amount {
    color: var(--gasha-gold-300);
  }
</style>
