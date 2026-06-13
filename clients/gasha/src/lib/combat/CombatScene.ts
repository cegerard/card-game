import Phaser from 'phaser';
import { detectOutcome } from './outcome.js';
import type { FightResult, Step } from '$lib/arcade/types.js';

interface CombatSceneData {
  fightResult: FightResult;
  playerName: string;
}

const STEP_DELAY_MS = 300;
const LOG_MAX_LINES = 16;

export class CombatScene extends Phaser.Scene {
  private fightResult!: FightResult;
  private playerName!: string;
  private stepLog!: Phaser.GameObjects.Text;
  private steps: Step[] = [];
  private stepIndex = 0;
  private logLines: string[] = [];

  constructor() {
    super({ key: 'CombatScene' });
  }

  init(data: CombatSceneData) {
    if (!data?.fightResult) return;
    this.fightResult = data.fightResult;
    this.playerName = data.playerName;
    this.steps = Object.values(this.fightResult);
    this.stepIndex = 0;
    this.logLines = [];
  }

  create() {
    if (!this.fightResult) return;
    const { width } = this.cameras.main;

    this.add.text(width / 2, 20, 'Combat', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    this.stepLog = this.add.text(20, 60, '', {
      fontSize: '13px',
      color: '#cccccc',
      wordWrap: { width: width - 40 },
      lineSpacing: 4,
    });

    this.replayNextStep();
  }

  private replayNextStep() {
    if (this.stepIndex >= this.steps.length) return;

    const step = this.steps[this.stepIndex];
    this.stepIndex++;

    this.appendLog(this.formatStep(step));

    if (step.kind === 'fight_end') {
      this.time.delayedCall(800, () => this.endCombat());
      return;
    }

    this.time.delayedCall(STEP_DELAY_MS, () => this.replayNextStep());
  }

  private appendLog(line: string) {
    this.logLines.push(line);
    if (this.logLines.length > LOG_MAX_LINES) {
      this.logLines.shift();
    }
    this.stepLog.setText(this.logLines.join('\n'));
  }

  private formatStep(step: Step): string {
    switch (step.kind) {
      case 'attack':
      case 'special_attack':
        return `> ${step.kind.replace('_', ' ')}`;
      case 'healing':
        return `> healing`;
      case 'status_change': {
        const sc = step as { kind: string; card: { name: string }; status: string };
        return `> ${sc.card?.name ?? '?'}: ${sc.status}`;
      }
      case 'fight_end': {
        const fe = step as { kind: string; winner?: string };
        return `--- Fight over: ${fe.winner ?? 'draw'} ---`;
      }
      default:
        return `  ${step.kind}`;
    }
  }

  private endCombat() {
    const outcome = detectOutcome(this.fightResult, this.playerName);
    this.game.events.emit('fight-complete', { playerWon: outcome === 'victory' });
  }
}
