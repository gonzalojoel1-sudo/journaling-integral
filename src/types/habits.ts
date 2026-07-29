import type { HabitType } from '@/lib/constants-domain';

export interface IBaseHabit {
  id: string;
  name: string;
  habitType: HabitType;
  domain?: string | null;
  currentStrength?: number;
  activeAction?: string | null;
  rescueAction?: string | null;
  celebration?: string | null;
  identityLabel?: string | null;
  anchor?: string | null;
  cue?: string | null;
  newRoutine?: string | null;
  ifTrigger?: string | null;
  ifAction?: string | null;
}

export interface ChainStep {
  id: string;
  name: string;
  order: number;
}

export interface ISembrarHabit extends IBaseHabit {
  habitType: 'sembrar';
  evolutionCycle?: number;
  daysInCurrentCycle?: number;
  evolutionOptimal?: string | null;
  evolutionMinimum?: string | null;
}

export interface ICadenaHabit extends IBaseHabit {
  habitType: 'cadena';
  chainId?: string;
  chainSteps?: ChainStep[];
}

export interface ICrecerHabit extends IBaseHabit {
  habitType: 'crecer';
  currentStreak?: number;
  streakShields?: number;
}

export interface ICambiarHabit extends IBaseHabit {
  habitType: 'cambiar';
  oldRoutine?: string | null;
  victoryCount?: number;
}

export interface IPrecisoHabit extends IBaseHabit {
  habitType: 'preciso';
  triggerHitCount?: number;
  actionExecutedCount?: number;
}

export interface IPilarHabit extends IBaseHabit {
  habitType: 'pilar';
  pilarCompleted?: number;
  otherHabitsCount?: number;
  otherHabitsCompleted?: number;
  otherHabits?: { name: string; completed: boolean; domain?: string | null }[];
}

export type HabitCardHabit =
  | ISembrarHabit
  | ICadenaHabit
  | ICrecerHabit
  | ICambiarHabit
  | IPrecisoHabit
  | IPilarHabit
  | IBaseHabit;