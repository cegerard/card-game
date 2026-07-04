<script lang="ts">
  interface Props {
    level: number;
  }

  let { level }: Props = $props();
</script>

<div class="level-indicator">Level {level}</div>

<style>
  .level-indicator {
    font-family: var(--gasha-font-ui);
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--gasha-gold-400);
    text-align: center;
    padding: 0.5rem;
  }
</style>
