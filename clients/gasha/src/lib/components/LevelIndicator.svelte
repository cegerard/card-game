<script lang="ts">
  interface Props {
    level: number;
  }

  let { level }: Props = $props();
</script>

<div class="level-indicator">Level {level}</div>

<style>
  .level-indicator {
    font-size: 1.25rem;
    font-weight: bold;
    color: white;
    text-align: center;
    padding: 0.5rem;
  }
</style>
