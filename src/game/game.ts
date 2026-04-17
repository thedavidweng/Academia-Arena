// =============================================================================
// game.ts — boardgame.io Game definition (isomorphic, server-ready)
// =============================================================================

import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import type { Game, FnContext } from 'boardgame.io';
import {
  cardLibrary,
  traitLibrary,
  type CardDefinition,
  type FieldName,
  type TraitDefinition,
} from '../data/entities';
import type { G, CardInstance, PlayCardParams, StaminaActionParams } from './types';

// ---- Helpers ----

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck(): (CardDefinition & { instanceId: string })[] {
  const deck: (CardDefinition & { instanceId: string })[] = [];
  for (const card of cardLibrary) {
    const copies = card.type === 'Character' ? 2 : 1;
    for (let i = 0; i < copies; i++) {
      deck.push({ ...card, instanceId: generateId() });
    }
  }
  return shuffle(deck);
}

function assignTraits(): TraitDefinition[] {
  const bg = traitLibrary.background;
  const phys = traitLibrary.physiological;
  const psy = traitLibrary.psychological;
  return [
    bg[Math.floor(Math.random() * bg.length)],
    phys[Math.floor(Math.random() * phys.length)],
    psy[Math.floor(Math.random() * psy.length)],
  ];
}

function traitWeight(traits: TraitDefinition[]): number {
  let weight = 0;
  for (const t of traits) {
    if (t.passiveValue && t.passiveValue > 0) weight += t.passiveValue;
    if (t.passiveEffect === 'drawOnTurnStart') weight += 1.5;
    if (t.passiveEffect === 'comebackBonus') weight += 0.5;
    if (t.activeAbility) weight += 1;
    if (t.passiveEffect === 'opponentStarts') weight -= 0.5;
    if (t.passiveValue && t.passiveValue < 0) weight += t.passiveValue;
  }
  return weight;
}

function initStamina(traits: TraitDefinition[]): number {
  const w = traitWeight(traits);
  return Math.max(3, Math.min(8, Math.round(8 - w)));
}

function hasTrait(p: G['players']['0'], passiveEffect: string): boolean {
  return p.traits.some((t) => t.passiveEffect === passiveEffect);
}

function hasTraitWithChance(p: G['players']['0'], passiveEffect: string, chance: number): boolean {
  return p.traits.some((t) => t.passiveEffect === passiveEffect && t.chance && Math.random() < t.chance);
}

function calcScore(G: G, playerIdx: number): void {
  const pKey = String(playerIdx) as '0' | '1';
  const p = G.players[pKey];
  const negateNegatives = p.statusOverrideActive;
  let total = 0;
  const fields: FieldName[] = ['Presentations', 'Assignments', 'Exams'];

  for (const field of fields) {
    let score = 0;
    for (const card of p.field[field]) {
      score += card.credits[field] || 0;
    }
    for (const trait of p.traits) {
      if (trait.passiveField === field && trait.passiveValue) {
        if (trait.passiveValue < 0) {
          // Negative trait: skip if status override is active
          if (negateNegatives) continue;
          for (const c of p.field[field]) {
            if ((c.credits[field] || 0) > 0) score += trait.passiveValue;
          }
        } else {
          const charCount = p.field[field].filter((c) => c.type === 'Character').length;
          score += trait.passiveValue * charCount;
        }
      }
    }
    p.score[field] = Math.max(0, score);
    total += p.score[field];
  }
  p.score.total = total;
}

function addLog(G: G, player: number, action: string, detail: string): void {
  G.log.push({ round: G.round, player, action, detail, timestamp: Date.now() });
}

function checkSynergy(G: G, pKey: '0' | '1', fieldName: string): void {
  const p = G.players[pKey];
  const field = p.field[fieldName as FieldName];
  const lockActive = p.probabilityLockActive;

  for (let i = 0; i < field.length - 1; i++) {
    const c1 = field[i];
    const c2 = field[i + 1];
    if (
      c1.synergy &&
      c1.synergy.type === 'Essay Ghostwriting' &&
      c2.id === c1.synergy.partnerId &&
      !c1.synergyActivated &&
      !c2.synergyActivated
    ) {
      c1.synergyActivated = true;
      c2.synergyActivated = true;

      // Probability Lock guarantees success
      const success = lockActive || Math.random() < 0.5;

      if (lockActive) {
        addLog(G, Number(pKey), 'stamina', 'Probability Lock: synergy guaranteed!');
        p.probabilityLockActive = false;
      }

      if (success) {
        const f = fieldName as FieldName;
        (c1.credits as Record<FieldName, number>)[f] = (c1.credits[f] || 0) * 2;
        (c2.credits as Record<FieldName, number>)[f] = (c2.credits[f] || 0) * 2;
        addLog(G, Number(pKey), 'synergy', `${c1.synergy.type}: Success! Credits doubled!`);
      } else {
        field.splice(i + 1, 1);
        field.splice(i, 1);
        p.discard.push(c1, c2);
        addLog(G, Number(pKey), 'synergy', `${c1.synergy.type}: Caught cheating! Both expelled!`);
        break;
      }
    }
  }
}

function endRound(G: G): void {
  calcScore(G, 0);
  calcScore(G, 1);

  for (const key of ['0', '1'] as const) {
    const p = G.players[key];
    const opp = G.players[key === '0' ? '1' : '0'];
    for (const t of p.traits) {
      if (t.passiveEffect === 'comebackBonus' && p.score.total < opp.score.total) {
        p.score.total += t.value || 2;
        addLog(G, Number(key), 'trait', `${t.name}: comeback bonus +${t.value || 2}`);
      }
    }
  }

  const s0 = G.players['0'].score.total;
  const s1 = G.players['1'].score.total;

  if (s0 > s1) {
    G.players['0'].roundsWon++;
    addLog(G, -1, 'round', `Semester ${G.round}: Player 1 wins (${s0} vs ${s1})`);
  } else if (s1 > s0) {
    G.players['1'].roundsWon++;
    addLog(G, -1, 'round', `Semester ${G.round}: Player 2 wins (${s1} vs ${s0})`);
  } else {
    G.players['0'].roundsWon++;
    G.players['1'].roundsWon++;
    addLog(G, -1, 'round', `Semester ${G.round}: Tie! (${s0} vs ${s1})`);
  }

  if (G.players['0'].roundsWon >= 2 || G.players['1'].roundsWon >= 2) return;

  G.round++;
  for (const key of ['0', '1'] as const) {
    const p = G.players[key];
    for (const field of (['Presentations', 'Assignments', 'Exams'] as FieldName[])) {
      const keep: CardInstance[] = [];
      for (const c of p.field[field]) {
        if (c.stayOnField) {
          c.synergyActivated = false;
          keep.push(c);
        } else {
          p.discard.push(c);
        }
      }
      p.field[field] = keep;
    }
    p.passed = false;
    p.traitUses = {};
    p.probabilityLockActive = false;
    p.statusOverrideActive = false;
  }
  calcScore(G, 0);
  calcScore(G, 1);
}

// ---- Moves ----

const playCard = (
  { G, ctx, playerID }: FnContext<G>,
  { handIndex, fieldName }: PlayCardParams
) => {
  const pKey = playerID as '0' | '1';
  const p = G.players[pKey];

  if (handIndex < 0 || handIndex >= p.hand.length) return INVALID_MOVE;
  const card = p.hand.splice(handIndex, 1)[0];
  p.field[fieldName].push(card);

  addLog(G, Number(pKey), 'play', `Played ${card.name} to ${fieldName}`);

  // Check if opponent has Calm Mind and can negate this Event
  if (card.type === 'Event') {
    const oppKey = pKey === '0' ? '1' : '0';
    const opp = G.players[oppKey];
    if (hasTraitWithChance(opp, 'negateEvent', 0.5)) {
      // Event negated — remove it, don't apply effects
      const idx = p.field[fieldName].indexOf(card);
      if (idx !== -1) p.field[fieldName].splice(idx, 1);
      p.discard.push(card);
      addLog(G, Number(oppKey), 'trait', 'Calm Mind: negated opponent event!');
      calcScore(G, 0);
      calcScore(G, 1);
      return;
    }
  }

  if (card.deployEffect === 'drawCard') {
    const count = card.effectValue || 1;
    for (let i = 0; i < count; i++) {
      if (p.deck.length > 0) p.hand.push(p.deck.pop()!);
    }
    addLog(G, Number(pKey), 'effect', `${card.name}: drew ${count} card(s)`);
  } else if (card.deployEffect === 'boostField') {
    for (const c of p.field[fieldName]) {
      (c.credits as Record<FieldName, number>)[fieldName] = (c.credits[fieldName] || 0) + (card.effectValue || 1);
    }
    addLog(G, Number(pKey), 'effect', `${card.name}: boosted ${fieldName}`);
  } else if (card.deployEffect === 'removeSynergyCard') {
    const oppKey = pKey === '0' ? '1' : '0';
    const opp = G.players[oppKey];
    const nonEmpty = (['Presentations', 'Assignments', 'Exams'] as FieldName[]).filter(
      (f) => opp.field[f].length > 0
    );
    if (nonEmpty.length > 0) {
      const randField = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
      const synergyCards = opp.field[randField].filter((c) => c.synergy);
      if (synergyCards.length > 0) {
        const removeIdx = Math.floor(Math.random() * synergyCards.length);
        const removeCard = synergyCards[removeIdx];
        const idx = opp.field[randField].indexOf(removeCard);
        const removed = opp.field[randField].splice(idx, 1)[0];
        opp.discard.push(removed);
        addLog(G, Number(pKey), 'effect', `${card.name}: removed ${removed.name} from opponent`);
      }
    }
    p.discard.push(card);
  } else if (card.type === 'Event') {
    p.discard.push(card);
  }

  checkSynergy(G, pKey, fieldName);
  calcScore(G, 0);
  calcScore(G, 1);
};

const pass = ({ G, playerID }: FnContext<G>) => {
  const pKey = playerID as '0' | '1';
  G.players[pKey].passed = true;
  addLog(G, Number(pKey), 'pass', 'Passed turn');

  const oppKey = pKey === '0' ? '1' : '0';
  if (G.players[oppKey].passed) {
    endRound(G);
  }
};

const useStamina = ({ G, playerID }: FnContext<G>, { action }: StaminaActionParams) => {
  const pKey = playerID as '0' | '1';
  const p = G.players[pKey];

  switch (action) {
    case 'probabilityLock':
      if (p.stamina < 2) return INVALID_MOVE;
      p.stamina -= 2;
      p.probabilityLockActive = true;
      addLog(G, Number(pKey), 'stamina', 'Probability Lock (2 Stamina) — synergy guaranteed!');
      break;
    case 'statusOverride':
      if (p.stamina < 1) return INVALID_MOVE;
      p.stamina -= 1;
      p.statusOverrideActive = true;
      addLog(G, Number(pKey), 'stamina', 'Status Override (1 Stamina) — negative traits negated');
      break;
    case 'drawCard':
      if (p.stamina < 3 || p.deck.length === 0) return INVALID_MOVE;
      p.stamina -= 3;
      p.hand.push(p.deck.pop()!);
      addLog(G, Number(pKey), 'stamina', 'Resource Exchange: drew 1 card (3 Stamina)');
      break;
  }
};

const useTraitSkill = ({ G, playerID }: FnContext<G>, { traitIndex }: { traitIndex: number }) => {
  const pKey = playerID as '0' | '1';
  const p = G.players[pKey];
  const trait = p.traits[traitIndex];
  if (!trait || !trait.activeAbility) return INVALID_MOVE;

  const uses = p.traitUses[trait.id] || 0;
  if (trait.limitPerRound && uses >= trait.limitPerRound) return INVALID_MOVE;

  if (trait.activeAbility === 'adhdDraw') {
    if (p.hand.length < 1) return INVALID_MOVE;
    const discardIdx = Math.floor(Math.random() * p.hand.length);
    p.discard.push(p.hand.splice(discardIdx, 1)[0]);
    for (let i = 0; i < 2; i++) {
      if (p.deck.length > 0) p.hand.push(p.deck.pop()!);
    }
    p.traitUses[trait.id] = uses + 1;
    addLog(G, Number(pKey), 'trait', `${trait.name}: discarded 1, drew 2`);
  }
};

const confirmTraits = ({ G }: FnContext<G>) => {
  G.traitAnimationDone = true;
};

// ---- Determine first player from traits ----
function determineFirstPlayer(trait0: TraitDefinition[], trait1: TraitDefinition[]): '0' | '1' {
  const p0hasOpponentStarts = trait0.some((t) => t.passiveEffect === 'opponentStarts');
  const p1hasOpponentStarts = trait1.some((t) => t.passiveEffect === 'opponentStarts');

  if (p0hasOpponentStarts && !p1hasOpponentStarts) return '1'; // P0's opponent goes first
  if (p1hasOpponentStarts && !p0hasOpponentStarts) return '0'; // P1's opponent goes first
  return '0'; // default
}

// ---- Game definition ----

export const AcademiaArena: Game<G> = {
  name: 'academia-arena',

  setup: () => {
    const trait0 = assignTraits();
    const trait1 = assignTraits();
    const firstPlayer = determineFirstPlayer(trait0, trait1);

    const makePlayer = (traits: TraitDefinition[]) => ({
      deck: createDeck(),
      hand: [] as CardInstance[],
      field: { Presentations: [] as CardInstance[], Assignments: [] as CardInstance[], Exams: [] as CardInstance[] },
      discard: [] as CardInstance[],
      score: { Presentations: 0, Assignments: 0, Exams: 0, total: 0 },
      roundsWon: 0,
      passed: false,
      stamina: initStamina(traits),
      traits,
      traitUses: {} as Record<string, number>,
      probabilityLockActive: false,
      statusOverrideActive: false,
    });

    const players = { '0': makePlayer(trait0), '1': makePlayer(trait1) };

    for (let i = 0; i < 5; i++) {
      for (const key of ['0', '1'] as const) {
        if (players[key].deck.length > 0) {
          players[key].hand.push(players[key].deck.pop()!);
        }
      }
    }

    return { players, round: 1, currentPlayer: Number(firstPlayer), log: [], traitAnimationDone: false, firstPlayer };
  },

  phases: {
    traitAnimation: {
      start: true,
      moves: { confirmTraits },
      next: 'main',
      endIf: ({ G }) => G.traitAnimationDone,
    },
    main: {
      turn: {
        order: {
          first: ({ G }) => Number(G.firstPlayer),
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
        onBegin: ({ G, playerID }) => {
          const pKey = playerID as '0' | '1';
          G.players[pKey].passed = false;
          // Reset status override at start of each turn
          G.players[pKey].statusOverrideActive = false;
          for (const t of G.players[pKey].traits) {
            if (t.passiveEffect === 'drawOnTurnStart' && G.players[pKey].deck.length > 0) {
              G.players[pKey].hand.push(G.players[pKey].deck.pop()!);
              addLog(G, Number(pKey), 'trait', `${t.name}: drew 1 card`);
            }
          }
        },
      },
    },
  },

  endIf: ({ G }) => {
    if (G.players['0'].roundsWon >= 2) return { winner: '0' };
    if (G.players['1'].roundsWon >= 2) return { winner: '1' };
  },

  moves: {
    playCard: { move: playCard, undoable: true },
    pass: { move: pass, undoable: true },
    useStamina: { move: useStamina, undoable: true },
    useTraitSkill: { move: useTraitSkill, undoable: true },
  },

  ai: {
    enumerate: (_G: G, _ctx: unknown, playerID: string) => {
      const pKey = playerID as '0' | '1';
      const p = _G.players[pKey];
      const moves: Array<{ move: string; args?: unknown[] }> = [];

      for (let i = 0; i < p.hand.length; i++) {
        for (const field of (['Presentations', 'Assignments', 'Exams'] as FieldName[])) {
          moves.push({ move: 'playCard', args: [{ handIndex: i, fieldName: field }] });
        }
      }
      moves.push({ move: 'pass' });
      if (p.stamina >= 2 && !p.probabilityLockActive) moves.push({ move: 'useStamina', args: [{ action: 'probabilityLock' }] });
      if (p.stamina >= 1 && !p.statusOverrideActive) moves.push({ move: 'useStamina', args: [{ action: 'statusOverride' }] });
      if (p.stamina >= 3 && p.deck.length > 0) moves.push({ move: 'useStamina', args: [{ action: 'drawCard' }] });
      for (let i = 0; i < p.traits.length; i++) {
        const t = p.traits[i];
        if (t.activeAbility) {
          const uses = p.traitUses[t.id] || 0;
          if (!t.limitPerRound || uses < t.limitPerRound) {
            moves.push({ move: 'useTraitSkill', args: [{ traitIndex: i }] });
          }
        }
      }
      return moves;
    },
  },
};

export default AcademiaArena;
