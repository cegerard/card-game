<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { FightResult } from '$lib/arcade/types.js';
  import type Phaser from 'phaser';

  interface Props {
    fightResult: FightResult;
    playerName: string;
    // eslint-disable-next-line no-unused-vars
    oncomplete: (result: { playerWon: boolean }) => void;
  }

  let { fightResult, playerName, oncomplete }: Props = $props();

  let container: HTMLDivElement;
  let game: Phaser.Game | null = null;

  onMount(async () => {
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
      game!.scene.start('CombatScene', { fightResult, playerName });
    });

    game.events.on(
      'fight-complete',
      ({ playerWon }: { playerWon: boolean }) => {
        oncomplete({ playerWon });
      },
    );
  });

  onDestroy(() => {
    if (game) {
      game.destroy(true);
      game = null;
    }
  });
</script>

<div bind:this={container} class="phaser-container"></div>

<style>
  .phaser-container {
    width: 800px;
    height: 500px;
    margin: 0 auto;
  }
</style>
