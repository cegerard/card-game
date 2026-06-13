<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { session, resetSession } from '$lib/arcade/session.js';
  import { PLAYER_TEAM } from '$lib/arcade/player-team.js';
  import { ARCADE_LEVELS } from '$lib/arcade/levels.js';
  import { fetchFight } from '$lib/combat/engine-client.js';
  import VictoryScreen from '$lib/components/VictoryScreen.svelte';
  import GameOverScreen from '$lib/components/GameOverScreen.svelte';
  import LevelIndicator from '$lib/components/LevelIndicator.svelte';
  import type { FightResult } from '$lib/arcade/types.js';
  import type Phaser from 'phaser';

  let container: HTMLDivElement;
  let game: Phaser.Game | null = null;

  async function launchCombat(levelIndex: number) {
    const level = ARCADE_LEVELS[levelIndex - 1];
    if (!level) {
      resetSession();
      goto('/');
      return;
    }

    let fightResult: FightResult;
    try {
      fightResult = await fetchFight(PLAYER_TEAM, level.enemyTeam, level.name);
    } catch {
      resetSession();
      goto('/');
      return;
    }

    if (game) {
      game.destroy(true);
      game = null;
    }

    const PhaserLib = (await import('phaser')).default;
    const { CombatScene } = await import('$lib/combat/CombatScene.js');

    game = new PhaserLib.Game({
      type: PhaserLib.AUTO,
      parent: container,
      width: 800,
      height: 500,
      backgroundColor: '#1a1a2e',
      scene: [CombatScene],
    });

    game.events.once('ready', () => {
      game!.scene.start('CombatScene', { fightResult, playerName: 'Player' });
    });

    game.events.on('fight-complete', ({ playerWon }: { playerWon: boolean }) => {
      const current = get(session);
      if (!playerWon) {
        session.update((s) => ({ ...s, phase: 'game-over', fightResult }));
        return;
      }
      if (current.currentLevel >= ARCADE_LEVELS.length) {
        session.update((s) => ({ ...s, phase: 'final-victory', fightResult }));
      } else {
        session.update((s) => ({ ...s, phase: 'victory', fightResult }));
      }
    });
  }

  function handleNextLevel() {
    session.update((s) => ({ ...s, phase: 'combat', currentLevel: s.currentLevel + 1 }));
    launchCombat(get(session).currentLevel);
  }

  function handleBackToMenu() {
    resetSession();
    goto('/');
  }

  onMount(() => {
    session.update((s) => ({ ...s, phase: 'combat' }));
    launchCombat(get(session).currentLevel);
  });

  onDestroy(() => {
    if (game) {
      game.destroy(true);
      game = null;
    }
  });
</script>

{#if $session.phase === 'combat'}
  <LevelIndicator level={$session.currentLevel} />
{/if}

<div bind:this={container} class="phaser-container"></div>

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

<style>
  .phaser-container {
    width: 800px;
    height: 500px;
    margin: 0 auto;
  }
</style>
