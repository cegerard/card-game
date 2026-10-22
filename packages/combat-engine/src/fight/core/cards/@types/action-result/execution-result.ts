import { FightingCard } from '../../fighting-card';

/** A defender an execution finished off, or left at 1 HP through SURVIVE. */
export type ExecutionResult = {
  card: FightingCard;
  survived?: boolean;
  survivedSkillName?: string;
};
