import { INVALID_MOVE } from 'boardgame.io/core';
import type { Game, FnContext } from 'boardgame.io';
import { cardLibrary, traitLibrary, type FieldName, type TraitDefinition } from '../data/entities';
import type { G, CardInstance, PlayCardParams, StaminaActionParams, UseTraitParams } from './types';

const fields: FieldName[] = ['Presentations', 'Assignments', 'Exams'];
type Random = FnContext<G>['random'];
type Player = '0' | '1';
const opponent = (key: Player): Player => key === '0' ? '1' : '0';

function createDeck(random: Random, player: Player): CardInstance[] {
  return random.Shuffle(cardLibrary.flatMap(card =>
    Array.from({ length: card.type === 'Character' ? 2 : 1 }, (_, i) => ({
      ...structuredClone(card), instanceId: `${player}-${card.id}-${i}`,
    }))
  ));
}

function assignTraits(random: Random): TraitDefinition[] {
  return Object.values(traitLibrary).map(group => structuredClone(group[random.Die(group.length) - 1]));
}

function initStamina(traits: TraitDefinition[]): number {
  const weight = traits.reduce((sum, t) => sum + (t.passiveValue || 0)
    + (t.passiveEffect === 'drawOnTurnStart' ? 1.5 : 0)
    + (t.passiveEffect === 'comebackBonus' ? 0.5 : 0)
    + (t.activeAbility ? 1 : 0)
    - (t.passiveEffect === 'opponentStarts' ? 0.5 : 0), 0);
  return Math.max(3, Math.min(8, Math.round(8 - weight)));
}

function calcScore(G: G): void {
  for (const p of Object.values(G.players)) {
    for (const field of fields) {
      let score = p.field[field].reduce((sum, card) => sum + card.credits[field], 0);
      for (const trait of p.traits) {
        if (trait.passiveField !== field || !trait.passiveValue) continue;
        if (trait.passiveValue < 0 && p.statusOverrideActive) continue;
        const count = p.field[field].filter(card =>
          trait.passiveValue! < 0 ? card.credits[field] > 0 : card.type === 'Character'
        ).length;
        score += trait.passiveValue * count;
      }
      p.score[field] = Math.max(0, score);
    }
    p.score.total = fields.reduce((sum, f) => sum + p.score[f], 0);
  }
}

function addLog(G: G, player: number, action: string, detail: string,
  values: Record<string, string | number> = {}): void {
  G.log.push({ round: G.round, player, action, detail, values });
}

function checkSynergy(G: G, key: Player, fieldName: FieldName, random: Random): void {
  const p = G.players[key];
  const field = p.field[fieldName];
  for (let i = 0; i < field.length - 1; i++) {
    const a = field[i], b = field[i + 1];
    if (!a.synergy || b.id !== a.synergy.partnerId || a.synergyActivated || b.synergyActivated) continue;
    a.synergyActivated = b.synergyActivated = true;
    const success = p.probabilityLockActive || random.Number() < 0.5;
    p.probabilityLockActive = false;
    if (success) {
      a.credits[fieldName] *= 2;
      b.credits[fieldName] *= 2;
    } else {
      p.discard.push(...field.splice(i, 2));
    }
    addLog(G, Number(key), 'synergy', success ? 'log.synergySuccess' : 'log.synergyFailure');
    if (!success) break;
  }
}

/** Scores the semester, awards it, and starts the next one. Returns the next
 *  semester's starting player, or null when the match is over. */
function endRound(G: G): Player | null {
  calcScore(G);
  const totals = [G.players['0'].score.total, G.players['1'].score.total];
  for (const key of ['0', '1'] as const) {
    const p = G.players[key];
    if (totals[Number(key)] < totals[Number(opponent(key))]) {
      for (const t of p.traits) {
        if (t.passiveEffect === 'comebackBonus') p.score.total += t.value!;
      }
    }
  }
  const a = G.players['0'].score.total, b = G.players['1'].score.total;
  if (a >= b) G.players['0'].roundsWon++;
  if (b >= a) G.players['1'].roundsWon++;
  addLog(G, -1, 'round', a === b ? 'log.tie' : 'log.roundWinner',
    { player: a > b ? 1 : 2, score0: a, score1: b });
  if (Object.values(G.players).some(p => p.roundsWon >= 2)) return null;

  G.round++;
  for (const p of Object.values(G.players)) {
    for (const field of fields) {
      const staying = p.field[field].filter(c => c.stayOnField);
      p.discard.push(...p.field[field].filter(c => !c.stayOnField));
      for (const card of staying) card.synergyActivated = false;
      p.field[field] = staying;
    }
    p.passed = false;
    p.playedThisTurn = false;
    p.traitUses = {};
    p.probabilityLockActive = false;
    p.statusOverrideActive = false;
  }
  const starter: Player = a > b ? '1' : '0';
  G.firstPlayer = starter;
  calcScore(G);
  return starter;
}

const playCard = ({ G, playerID, random }: FnContext<G>, { handIndex, fieldName }: PlayCardParams) => {
  const key = playerID as Player;
  const p = G.players[key];
  if (p.passed || p.playedThisTurn || !Number.isInteger(handIndex)
    || handIndex < 0 || handIndex >= p.hand.length || !fields.includes(fieldName)) return INVALID_MOVE;
  const card = p.hand.splice(handIndex, 1)[0];
  p.playedThisTurn = true;
  addLog(G, Number(key), 'play', 'log.play', { card: card.id, field: fieldName });
  const other = G.players[opponent(key)];
  if (card.type === 'Event') {
    p.discard.push(card);
    const negate = other.traits.some(t => t.passiveEffect === 'negateEvent' && random.Number() < t.chance!);
    if (negate) {
      addLog(G, Number(opponent(key)), 'trait', 'log.negate');
      return;
    }
  } else {
    p.field[fieldName].push(card);
  }
  if (card.deployEffect === 'drawCard') {
    const drawn = p.deck.splice(-Math.min(card.effectValue!, p.deck.length));
    p.hand.push(...drawn);
    addLog(G, Number(key), 'effect', 'log.draw', { count: drawn.length });
  } else if (card.deployEffect === 'boostField') {
    for (const c of p.field[fieldName]) c.credits[fieldName] += card.effectValue!;
    addLog(G, Number(key), 'effect', 'log.boost', { field: fieldName });
  } else if (card.deployEffect === 'removeSynergyCard') {
    const lanes = fields.filter(f => other.field[f].some(c => c.synergy));
    if (lanes.length) {
      const lane = lanes[random.Die(lanes.length) - 1];
      const candidates = other.field[lane].filter(c => c.synergy);
      const removed = candidates[random.Die(candidates.length) - 1];
      other.field[lane].splice(other.field[lane].indexOf(removed), 1);
      other.discard.push(removed);
      addLog(G, Number(key), 'effect', 'log.remove', { card: removed.id });
    }
  }
  checkSynergy(G, key, fieldName, random);
  calcScore(G);
};

/** Closes the semester once the opponent has already passed, then hands the
 *  next semester to whoever lost it. */
function endSemesterIfOpponentDone(G: G, key: Player, events: FnContext<G>['events']): void {
  if (!G.players[opponent(key)].passed) {
    events.endTurn();
    return;
  }
  const starter = endRound(G);
  if (starter) events.endTurn({ next: starter });
}

const pass = ({ G, playerID, events }: FnContext<G>) => {
  const key = playerID as Player;
  if (G.players[key].playedThisTurn) return INVALID_MOVE;
  G.players[key].passed = true;
  addLog(G, Number(key), 'pass', 'log.pass');
  endSemesterIfOpponentDone(G, key, events);
};

const finishTurn = ({ G, playerID, events }: FnContext<G>) => {
  const key = playerID as Player;
  if (!G.players[key].playedThisTurn) return INVALID_MOVE;
  endSemesterIfOpponentDone(G, key, events);
};

const useStamina = ({ G, playerID }: FnContext<G>, { action }: StaminaActionParams) => {
  const p = G.players[playerID as Player];
  if (p.passed) return INVALID_MOVE;
  switch (action) {
    case 'probabilityLock':
      if (p.stamina < 2 || p.probabilityLockActive) return INVALID_MOVE;
      p.stamina -= 2;
      p.probabilityLockActive = true;
      break;
    case 'statusOverride':
      if (p.stamina < 1 || p.statusOverrideActive) return INVALID_MOVE;
      p.stamina--;
      p.statusOverrideActive = true;
      calcScore(G);
      break;
    case 'drawCard':
      if (p.stamina < 3 || !p.deck.length) return INVALID_MOVE;
      p.stamina -= 3;
      p.hand.push(p.deck.pop()!);
      break;
    default:
      return INVALID_MOVE;
  }
  addLog(G, Number(playerID), 'stamina', `log.${action}`);
};

const useTraitSkill = ({ G, playerID, random }: FnContext<G>, { traitIndex }: UseTraitParams) => {
  const p = G.players[playerID as Player];
  if (!Number.isInteger(traitIndex) || p.passed) return INVALID_MOVE;
  const t = p.traits[traitIndex];
  if (!t || t.activeAbility !== 'adhdDraw' || !p.hand.length
    || (p.traitUses[t.id] || 0) >= t.limitPerRound!) return INVALID_MOVE;
  p.discard.push(...p.hand.splice(random.Die(p.hand.length) - 1, 1));
  p.hand.push(...p.deck.splice(-Math.min(2, p.deck.length)));
  p.traitUses[t.id] = (p.traitUses[t.id] || 0) + 1;
  addLog(G, Number(playerID), 'trait', 'log.adhd');
};

export const AcademiaArena: Game<G> = {
  name: 'academia-arena',
  setup: ({ random }) => {
    const makePlayer = (key: Player) => {
      const traits = assignTraits(random);
      const deck = createDeck(random, key);
      return {
        traits, deck, hand: deck.splice(-5),
        field: { Presentations: [], Assignments: [], Exams: [] },
        discard: [], score: { Presentations: 0, Assignments: 0, Exams: 0, total: 0 },
        roundsWon: 0, passed: false, playedThisTurn: false, stamina: initStamina(traits),
        traitUses: {}, probabilityLockActive: false, statusOverrideActive: false,
      };
    };
    const players = { '0': makePlayer('0'), '1': makePlayer('1') };
    const startsOther = (key: Player) => players[key].traits.some(t => t.passiveEffect === 'opponentStarts');
    const firstPlayer = startsOther('0') && !startsOther('1') ? '1' : '0';
    return { players, round: 1, log: [], traitAnimationDone: false, firstPlayer };
  },
  phases: {
    traitAnimation: {
      start: true,
      moves: { confirmTraits: ({ G }) => { G.traitAnimationDone = true; } },
      next: 'main',
      endIf: ({ G }) => G.traitAnimationDone,
    },
    main: {
      turn: {
        order: {
          first: ({ G }) => Number(G.firstPlayer),
          next: ({ G, ctx }) => {
            const next = (ctx.playOrderPos + 1) % 2;
            return G.players[String(next) as Player].passed ? ctx.playOrderPos : next;
          },
        },
        onBegin: ({ G, ctx }) => {
          const p = G.players[ctx.currentPlayer as Player];
          p.playedThisTurn = false;
          for (const t of p.traits) {
            if (t.passiveEffect === 'drawOnTurnStart' && p.deck.length) {
              p.hand.push(p.deck.pop()!);
              addLog(G, Number(ctx.currentPlayer), 'trait', 'log.draw', { count: 1 });
            }
          }
          calcScore(G);
        },
      },
    },
  },
  endIf: ({ G }) => {
    const [a, b] = [G.players['0'].roundsWon >= 2, G.players['1'].roundsWon >= 2];
    if (a && b) return { draw: true };
    if (a || b) return { winner: a ? '0' : '1' };
  },
  moves: {
    playCard,
    pass,
    finishTurn,
    useStamina: { move: useStamina, undoable: false },
    useTraitSkill: { move: useTraitSkill, undoable: false },
  },
  ai: {
    enumerate: (G, ctx, playerID) => {
      if (ctx.phase === 'traitAnimation') return [{ move: 'confirmTraits' }];
      const p = G.players[playerID as Player];
      if (p.playedThisTurn) return [{ move: 'finishTurn' }];
      const stamina = [
        ...(!p.probabilityLockActive && p.stamina >= 2
          ? [{ move: 'useStamina', args: [{ action: 'probabilityLock' }] }] : []),
        ...(!p.statusOverrideActive && p.stamina >= 1
          ? [{ move: 'useStamina', args: [{ action: 'statusOverride' }] }] : []),
        ...(p.deck.length && p.stamina >= 3
          ? [{ move: 'useStamina', args: [{ action: 'drawCard' }] }] : []),
      ];
      const skills = p.traits.flatMap((trait, traitIndex) =>
        trait.activeAbility && p.hand.length
          && (p.traitUses[trait.id] || 0) < trait.limitPerRound!
          ? [{ move: 'useTraitSkill', args: [{ traitIndex }] }] : []
      );
      return [
        ...p.hand.flatMap((_, handIndex) => fields.map(fieldName => ({
          move: 'playCard', args: [{ handIndex, fieldName }],
        }))),
        ...stamina,
        ...skills,
        { move: 'pass' },
      ];
    },
  },
};

export default AcademiaArena;
