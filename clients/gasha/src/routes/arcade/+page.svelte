<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { session, resetSession } from '$lib/arcade/session.js';
  import {
    selectedCardDefinitions,
    selectedDeckCards,
    isDeckComplete,
  } from '$lib/deck/deck-store.js';
  import { ARCADE_LEVELS } from '$lib/arcade/levels.js';
  import {
    fightLevel,
    settleFight,
    type NamedXpGain,
  } from '$lib/arcade/arcade-run.js';
  import { PLAYER_NAME } from '$lib/combat/engine-client.js';
  import { progressionStore } from '$lib/progression/progression-store.js';
  import { getRendererMode } from '$lib/combat/rendererMode.js';
  import PhaserRenderer from '$lib/combat/PhaserRenderer.svelte';
  import CombatReportRenderer from '$lib/combat/CombatReportRenderer.svelte';
  import VictoryScreen from '$lib/components/VictoryScreen.svelte';
  import GameOverScreen from '$lib/components/GameOverScreen.svelte';
  import LevelIndicator from '$lib/components/LevelIndicator.svelte';
  import type { ArcadeLevel, FightResult } from '$lib/arcade/types.js';
  import type { RendererMode } from '$lib/combat/rendererMode.js';

  let fightResult: FightResult | null = $state(null);
  let rendererMode: RendererMode = $state('phaser');
  let lastXpGains: NamedXpGain[] = $state([]);
  let currentLevel: ArcadeLevel;

  async function launchCombat(levelIndex: number) {
    const level = ARCADE_LEVELS[levelIndex - 1];
    if (!level) {
      handleBackToMenu();
      return;
    }

    fightResult = null;
    currentLevel = level;

    try {
      fightResult = await fightLevel(level, get(selectedDeckCards));
    } catch {
      handleBackToMenu();
    }
  }

  function handleCombatComplete() {
    const result = fightResult!;
    const { phase, xpGains } = settleFight(
      currentLevel,
      result,
      get(selectedCardDefinitions),
      progressionStore,
    );
    lastXpGains = xpGains;
    session.update((s) => ({ ...s, phase, fightResult: result }));
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
      playerName={PLAYER_NAME}
      playerCardIds={$selectedDeckCards.map((c) => c.id)}
      oncomplete={handleCombatComplete}
    />
  {:else}
    <PhaserRenderer
      {fightResult}
      playerName={PLAYER_NAME}
      oncomplete={handleCombatComplete}
    />
  {/if}
{/if}

{#if $session.phase === 'victory' || $session.phase === 'final-victory'}
  <VictoryScreen
    level={$session.currentLevel}
    isFinalVictory={$session.phase === 'final-victory'}
    xpGains={lastXpGains}
    onnext={handleNextLevel}
    onmenu={handleBackToMenu}
  />
{/if}

{#if $session.phase === 'game-over'}
  <GameOverScreen xpGains={lastXpGains} onmenu={handleBackToMenu} />
{/if}
