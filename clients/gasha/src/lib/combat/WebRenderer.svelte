<script lang="ts">
  import { detectOutcome } from '$lib/combat/outcome.js';
  import type { FightResult } from '$lib/arcade/types.js';

  interface Props {
    fightResult: FightResult;
    playerName: string;
    // eslint-disable-next-line no-unused-vars
    oncomplete: (result: { playerWon: boolean }) => void;
  }

  let { fightResult, playerName, oncomplete }: Props = $props();

  const outcome = $derived(detectOutcome(fightResult, playerName));
  const playerWon = $derived(outcome === 'victory');

  const fightEnd = $derived(
    Object.values(fightResult).find((s) => s.kind === 'fight_end'),
  );
  const winner = $derived(
    fightEnd?.kind === 'fight_end' ? (fightEnd.winner ?? 'Draw') : 'Unknown',
  );
</script>

<div class="result-container">
  <h2>{playerWon ? 'Victory!' : 'Defeat'}</h2>
  <p class="winner">Winner: {winner}</p>
  <button onclick={() => oncomplete({ playerWon })}>Continue</button>
</div>

<style>
  .result-container {
    width: 800px;
    height: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a2e;
    color: white;
    gap: 1.5rem;
  }

  h2 {
    font-size: 2.5rem;
    margin: 0;
  }

  .winner {
    font-size: 1.2rem;
    color: #cccccc;
    margin: 0;
  }

  button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }
</style>
