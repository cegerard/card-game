<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { session, resetSession } from '$lib/arcade/session.js';
  import { selectedDeckCards, isDeckComplete } from '$lib/deck/deck-store.js';
  import { ARCADE_LEVELS } from '$lib/arcade/levels.js';
  import { fetchFight } from '$lib/combat/engine-client.js';
  import { getRendererMode } from '$lib/combat/rendererMode.js';
  import PhaserRenderer from '$lib/combat/PhaserRenderer.svelte';
  import CombatReportRenderer from '$lib/combat/CombatReportRenderer.svelte';
  import VictoryScreen from '$lib/components/VictoryScreen.svelte';
  import GameOverScreen from '$lib/components/GameOverScreen.svelte';
  import LevelIndicator from '$lib/components/LevelIndicator.svelte';
  import type { FightResult } from '$lib/arcade/types.js';
  import type { RendererMode } from '$lib/combat/rendererMode.js';
  import { toCombatConfig } from '@card-game/shared-types';

  let fightResult: FightResult | null = $state(null);
  let rendererMode: RendererMode = $state('phaser');

  async function launchCombat(levelIndex: number) {
    const level = ARCADE_LEVELS[levelIndex - 1];
    if (!level) {
      resetSession();
      goto('/');
      return;
    }

    fightResult = null;

    try {
      fightResult = await fetchFight(
        get(selectedDeckCards),
        level.enemyTeam.map(toCombatConfig),
        level.name,
      );
    } catch {
      resetSession();
      goto('/');
    }
  }

  function handleCombatComplete({ playerWon }: { playerWon: boolean }) {
    const current = get(session);
    const result = fightResult!;
    if (!playerWon) {
      session.update((s) => ({
        ...s,
        phase: 'game-over',
        fightResult: result,
      }));
      return;
    }
    if (current.currentLevel >= ARCADE_LEVELS.length) {
      session.update((s) => ({
        ...s,
        phase: 'final-victory',
        fightResult: result,
      }));
    } else {
      session.update((s) => ({ ...s, phase: 'victory', fightResult: result }));
    }
  }

  function handleNextLevel() {
    session.update((s) => ({
      ...s,
      phase: 'combat',
      currentLevel: s.currentLevel + 1,
    }));
    launchCombat(get(session).currentLevel);
  }

  function handleBackToMenu() {
    resetSession();
    goto('/');
  }

  onMount(() => {
    if (!get(isDeckComplete)) {
      goto('/deck');
      return;
    }
    rendererMode = getRendererMode();
    session.update((s) => ({ ...s, phase: 'combat' }));
    launchCombat(get(session).currentLevel);
  });
</script>

{#if $session.phase === 'combat'}
  <LevelIndicator level={$session.currentLevel} />
{/if}

{#if $session.phase === 'combat' && fightResult}
  {#if rendererMode === 'web'}
    <CombatReportRenderer
      {fightResult}
      playerName="Player"
      playerCardIds={$selectedDeckCards.map((c) => c.id)}
      oncomplete={handleCombatComplete}
    />
  {:else}
    <PhaserRenderer
      {fightResult}
      playerName="Player"
      oncomplete={handleCombatComplete}
    />
  {/if}
{/if}

{#if $session.phase === 'victory' || $session.phase === 'final-victory'}
  <VictoryScreen
    level={$session.currentLevel}
    isFinalVictory={$session.phase === 'final-victory'}
    onnext={handleNextLevel}
    onmenu={handleBackToMenu}
  />
{/if}

{#if $session.phase === 'game-over'}
  <GameOverScreen onmenu={handleBackToMenu} />
{/if}
