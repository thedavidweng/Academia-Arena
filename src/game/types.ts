// =============================================================================
// types.ts — Game state & move type definitions
// =============================================================================

import type { CardDefinition, FieldName, TraitDefinition } from '../data/entities';

/** A card instance on the field or in hand (extends definition with runtime state) */
export interface CardInstance extends CardDefinition {
  instanceId: string;
  synergyActivated?: boolean;
}

export interface PlayerState {
  deck: CardInstance[];
  hand: CardInstance[];
  field: Record<FieldName, CardInstance[]>;
  discard: CardInstance[];
  score: Record<FieldName, number> & { total: number };
  roundsWon: number;
  passed: boolean;
  playedThisTurn: boolean;
  stamina: number;
  traits: TraitDefinition[];
  traitUses: Record<string, number>;
  probabilityLockActive: boolean;
  statusOverrideActive: boolean;
  /** Set when a play revealed randomness or hidden information (synergy roll,
   *  drawn card, negated event, random removal). Cleared at turn start and
   *  semester end; blocks undoing the play that produced the reveal. */
  revealedThisTurn: boolean;
}

export interface GameLogEntry {
  round: number;
  player: number;
  action: string;
  detail: string;
  values: Record<string, string | number>;
}

export interface G {
  players: Record<'0' | '1', PlayerState>;
  round: number;
  log: GameLogEntry[];
  traitAnimationDone: boolean;
  firstPlayer: '0' | '1';
}

// Move parameter types
export interface PlayCardParams {
  handIndex: number;
  fieldName: FieldName;
}

export interface StaminaActionParams {
  action: 'probabilityLock' | 'statusOverride' | 'drawCard';
}

export interface UseTraitParams {
  traitIndex: number;
}

// Re-export FieldName for convenience
export type { FieldName } from '../data/entities';
