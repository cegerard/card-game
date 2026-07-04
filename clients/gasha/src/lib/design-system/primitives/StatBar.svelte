<script lang="ts">
  import { pct } from '$lib/design-system/tokens.js';

  interface Props {
    label: string;
    value: number;
    max: number;
    tone: 'damage' | 'taken' | 'heal';
    animate?: boolean;
  }

  let { label, value, max, tone, animate = true }: Props = $props();
</script>

<div class="stat-row">
  <span class="stat-label {tone}">{label}</span>
  <div class="bar-track">
    <i
      class="bar-fill {tone}"
      style:width={animate ? `${pct(value, max)}%` : '0'}
    ></i>
  </div>
  <span class="stat-count">{value}</span>
</div>

<style>
  .stat-row {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 3px;
  }

  .stat-label {
    font: 700 6px var(--gasha-font-ui);
    letter-spacing: 0.04em;
    width: 13px;
    flex-shrink: 0;
  }
  .stat-label.damage {
    color: var(--gasha-dmg-from);
  }
  .stat-label.taken {
    color: var(--gasha-taken-from);
  }
  .stat-label.heal {
    color: var(--gasha-heal-from);
  }

  .bar-track {
    flex: 1;
    height: 4px;
    border-radius: var(--gasha-radius-xs);
    background: rgba(255, 255, 255, 0.09);
    overflow: hidden;
  }

  .bar-fill {
    display: block;
    height: 100%;
    width: 0;
    border-radius: var(--gasha-radius-xs);
    transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .bar-fill.damage {
    background: linear-gradient(
      90deg,
      var(--gasha-dmg-from),
      var(--gasha-dmg-to)
    );
  }
  .bar-fill.taken {
    background: linear-gradient(
      90deg,
      var(--gasha-taken-from),
      var(--gasha-taken-to)
    );
  }
  .bar-fill.heal {
    background: linear-gradient(
      90deg,
      var(--gasha-heal-from),
      var(--gasha-heal-to)
    );
  }

  .stat-count {
    font: 700 8px var(--gasha-font-mono);
    min-width: 19px;
    text-align: right;
    color: var(--gasha-text-muted);
  }
</style>
