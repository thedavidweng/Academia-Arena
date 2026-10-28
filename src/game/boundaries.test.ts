import { describe, expect, it } from 'bun:test';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { RandomBot } from 'boardgame.io/ai';
import type { Game } from 'boardgame.io';
import { AcademiaArena } from './game';
import { cardLibrary, traitLibrary, type TraitDefinition } from '../data/entities';
import type { G } from './types';

const card = (id: string, instanceId: string) => ({
  ...structuredClone(cardLibrary.find(c => c.id === id)!), instanceId,
});
const trait = (id: string): TraitDefinition =>
  Object.values(traitLibrary).flat().find(t => t.id === id)!;

function match(change: (G: G) => void = () => {}) {
  const game: Game<G> = {
    ...AcademiaArena,
    seed: 'boundaries',
    setup: context => {
      const G = AcademiaArena.setup!(context, undefined);
      G.firstPlayer = '0';
      for (const p of Object.values(G.players)) {
        p.traits = [];
        p.stamina = 8;
        p.deck = [card('nerd1', 'deck0'), card('nerd1', 'deck1')];
        p.hand = [card('gymbro1', 'a'), card('richkid1', 'b'), card('richkid1', 'c'),
          card('studious1', 'd'), card('dropout1', 'e')];
      }
      change(G);
      return G;
    },
  };
  const client = Client({ game, debug: false });
  client.start();
  client.moves.confirmTraits();
  return client;
}

const settle = () => new Promise(resolve => setTimeout(resolve, 25));

describe('initial stamina from trait weight', () => {
  it('derives starting stamina from the assigned traits', () => {
    const expected = (traits: TraitDefinition[]) => {
      const weight = traits.reduce((sum, t) => sum + (t.passiveValue || 0)
        + (t.passiveEffect === 'drawOnTurnStart' ? 1.5 : 0)
        + (t.passiveEffect === 'comebackBonus' ? 0.5 : 0)
        + (t.activeAbility ? 1 : 0)
        - (t.passiveEffect === 'opponentStarts' ? 0.5 : 0), 0);
      return Math.max(3, Math.min(8, Math.round(8 - weight)));
    };
    for (const seed of ['stamina-a', 'stamina-b', 'stamina-c', 'stamina-d']) {
      const game: Game<G> = { ...AcademiaArena, seed };
      const client = Client({ game, debug: false });
      client.start();
      const G = client.getState()!.G;
      for (const key of ['0', '1'] as const) {
        expect(G.players[key].traits).toHaveLength(3);
        expect(G.players[key].stamina, `${seed} player ${key}`)
          .toBe(expected(G.players[key].traits));
      }
    }
  });

});

/** Drives the production `setup` with a controlled `random`, so trait
 *  assignment (and therefore the first-player rule) is decided by the real
 *  code path rather than injected state. `Die` results are consumed in order
 *  by `assignTraits`: background, physiological, psychological per player. */
function setupWithTraits(physiological: [number, number]) {
  const dies = [0, physiological[0], 0, 0, physiological[1], 0];
  let call = 0;
  const random = {
    Die: () => dies[call++ % dies.length] + 1,
    Number: () => 0.5,
    Shuffle: <T,>(deck: T[]) => deck,
  };
  return AcademiaArena.setup!({ random } as never, undefined);
}

describe('first player from the real setup', () => {
  it('gives the first turn to the opponent of a Physically Impaired player', () => {
    // physiological index 2 = trait_impaired, index 0 = trait_gym
    const G = setupWithTraits([2, 0]);
    expect(G.players['0'].traits.map(t => t.id)).toContain('trait_impaired');
    expect(G.players['1'].traits.map(t => t.id)).not.toContain('trait_impaired');
    expect(G.firstPlayer).toBe('1');
  });

  it('does not let both Physically Impaired players cancel each other out', () => {
    const G = setupWithTraits([2, 2]);
    expect(G.players['0'].traits.map(t => t.id)).toContain('trait_impaired');
    expect(G.players['1'].traits.map(t => t.id)).toContain('trait_impaired');
    expect(G.firstPlayer).toBe('0');
  });

  it('starts player zero when only the second player is Physically Impaired', () => {
    const G = setupWithTraits([0, 2]);
    expect(G.firstPlayer).toBe('0');
  });
});

describe('first player and semester boundaries', () => {
  it('gives the first turn to the opponent of a Physically Impaired player', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_impaired')];
      G.firstPlayer = '1';
    });
    expect(c.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('does not let both Physically Impaired players cancel each other out', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_impaired')];
      G.players['1'].traits = [trait('trait_impaired')];
      G.firstPlayer = '0';
    });
    expect(c.getState()!.ctx.currentPlayer).toBe('0');
  });

  it('starts the next semester with the player who lost it', () => {
    const c = match();
    c.moves.playCard({ handIndex: 4, fieldName: 'Presentations' });
    c.moves.finishTurn();
    c.moves.pass();
    c.moves.playCard({ handIndex: 3, fieldName: 'Exams' });
    c.moves.finishTurn();
    const G = c.getState()!.G;
    expect(G.round).toBe(2);
    expect(G.players['0'].roundsWon).toBe(1);
    expect(G.firstPlayer).toBe('1');
    expect(c.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('ends the semester when the last active player commits after a pass', () => {
    const c = match();
    c.moves.pass();
    c.moves.playCard({ handIndex: 4, fieldName: 'Presentations' });
    c.moves.finishTurn();
    const G = c.getState()!.G;
    expect(G.round).toBe(2);
    expect(G.players['1'].roundsWon).toBe(1);
    expect(G.players['0'].roundsWon).toBe(0);
    expect(G.players['1'].playedThisTurn).toBe(false);
    expect(c.getState()!.ctx.currentPlayer).toBe('0');
  });

  it('keeps a Stay on Field card across semesters and clears its synergy flag', () => {
    const c = match(G => {
      G.players['0'].hand = [card('dropout1', 'stay'), card('richkid1', 'x'), card('richkid1', 'y')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    c.moves.finishTurn();
    c.moves.pass();
    c.moves.pass();
    const G = c.getState()!.G;
    expect(G.round).toBe(2);
    expect(G.players['0'].field.Exams.map(x => x.id)).toEqual(['dropout1']);
    expect(G.players['0'].field.Exams[0].synergyActivated).toBe(false);
    expect(G.players['0'].score.Exams).toBe(1);
  });

  it('runs a full best-of-three to a winner and a draw', () => {
    const c = match();
    const win = (winner: '0' | '1') => {
      const loser = winner === '0' ? '1' : '0';
      const state = c.getState()!;
      if (state.ctx.currentPlayer !== winner) {
        c.moves.pass();
        c.moves.pass();
      }
      c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
      c.moves.finishTurn();
      if (c.getState()!.ctx.currentPlayer !== loser) return;
      c.moves.pass();
      if (c.getState()!.ctx.currentPlayer === winner) c.moves.pass();
    };
    win('0');
    win('0');
    expect(c.getState()!.ctx.gameover).toEqual({ winner: '0' });
  });
});

describe('trait and stamina boundaries', () => {
  it('draws at turn start for Domestic and only for the current player', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_local')];
      G.players['1'].traits = [trait('trait_local')];
    });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(6);
    expect(c.getState()!.G.players['1'].hand).toHaveLength(5);
    c.moves.pass();
    expect(c.getState()!.G.players['1'].hand).toHaveLength(6);
  });

  it('does not draw at turn start when the deck is empty', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_local')];
      G.players['0'].deck = [];
    });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(5);
  });

  it('suppresses negative Presentation credits for the rest of the semester', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_depressed')];
      G.players['0'].hand = [card('gymbro1', 'g'), card('nerd1', 'n')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Presentations' });
    expect(c.getState()!.G.players['0'].score.Presentations).toBe(5);
    c.moves.finishTurn();
    c.moves.pass();
    expect(c.getState()!.ctx.currentPlayer).toBe('0');
    c.moves.useStamina({ action: 'statusOverride' });
    expect(c.getState()!.G.players['0'].score.Presentations).toBe(6);
    expect(c.getState()!.G.players['0'].stamina).toBe(7);
  });

  it('rejects stamina the player cannot afford or has already spent', () => {
    const c = match(G => { G.players['0'].stamina = 2; G.players['0'].deck = []; });
    c.moves.useStamina({ action: 'drawCard' });
    expect(c.getState()!.G.players['0'].stamina).toBe(2);
    c.moves.useStamina({ action: 'probabilityLock' });
    c.moves.useStamina({ action: 'probabilityLock' });
    expect(c.getState()!.G.players['0'].stamina).toBe(0);
    c.moves.useStamina({ action: 'statusOverride' });
    expect(c.getState()!.G.players['0'].stamina).toBe(0);
    expect(c.getState()!.G.players['0'].statusOverrideActive).toBe(false);
  });

  it('rejects a second card, a pass after playing, and an out-of-range trait skill', () => {
    const c = match(G => { G.players['0'].traits = [trait('trait_adhd')]; });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(4);
    c.moves.pass();
    expect(c.getState()!.ctx.currentPlayer).toBe('0');
    expect(c.getState()!.G.players['0'].passed).toBe(false);
    c.moves.useTraitSkill({ traitIndex: 7 });
    expect(c.getState()!.G.log.some(e => e.detail === 'log.adhd')).toBe(false);
  });

  it('lets ADHD discard and draw once per semester', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_adhd')];
      G.players['0'].deck = [card('nerd1', 'd0'), card('nerd1', 'd1')];
    });
    c.moves.useTraitSkill({ traitIndex: 0 });
    let G = c.getState()!.G;
    expect(G.players['0'].hand).toHaveLength(6);
    expect(G.players['0'].discard).toHaveLength(1);
    expect(G.players['0'].deck).toHaveLength(0);
    c.moves.useTraitSkill({ traitIndex: 0 });
    G = c.getState()!.G;
    expect(G.players['0'].hand).toHaveLength(6);
    expect(G.players['0'].traitUses['trait_adhd']).toBe(1);
  });

  it('keeps a spent Probability Lock until the next synergy attempt', () => {
    const c = match(G => {
      G.players['0'].hand = [card('richkid1', 'r1'), card('richkid1', 'r2'), card('nerd1', 'n')];
    });
    c.moves.useStamina({ action: 'probabilityLock' });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    expect(c.getState()!.G.players['0'].probabilityLockActive).toBe(true);
    c.moves.finishTurn();
    c.moves.pass();
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const p = c.getState()!.G.players['0'];
    expect(p.field.Exams.map(x => x.credits.Exams)).toEqual([2, 2]);
    expect(p.probabilityLockActive).toBe(false);
    expect(p.field.Exams.every(x => x.synergyActivated)).toBe(true);
  });

  it('applies the comeback bonus only to a trailing player', () => {
    const c = match(G => {
      G.players['1'].traits = [trait('trait_minority')];
      G.players['0'].hand = [card('gymbro1', 'g')];
      G.players['1'].hand = [card('nerd1', 'n')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Presentations' });
    c.moves.finishTurn();
    c.moves.playCard({ handIndex: 0, fieldName: 'Assignments' });
    c.moves.finishTurn();
    c.moves.pass();
    c.moves.pass();
    const G = c.getState()!.G;
    const semester = G.log.filter(e => e.action === 'round');
    expect(semester).toHaveLength(1);
    expect(semester[0].values).toEqual({ player: 2, score0: 6, score1: 7 });
    expect(G.players['1'].roundsWon).toBe(1);
    expect(G.players['0'].roundsWon).toBe(0);
  });

  it('negates an opponent event without placing it on the field', () => {
    const c = match(G => {
      G.players['1'].traits = [{ ...trait('trait_calm'), chance: 1 }];
      G.players['0'].hand = [card('event_allnighter', 'ev')];
      G.players['0'].field.Exams = [card('nerd1', 'x')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const G = c.getState()!.G;
    expect(G.players['0'].field.Exams[0].credits.Exams).toBe(5);
    expect(G.players['0'].discard.map(x => x.id)).toEqual(['event_allnighter']);
    expect(G.log.some(e => e.detail === 'log.negate')).toBe(true);
  });

  it('blocks undo when an opponent negate trait rolled and did not fire', () => {
    // chance 0 forces the non-negated outcome, but the roll is still consumed
    const c = match(G => {
      G.players['1'].traits = [{ ...trait('trait_calm'), chance: 0 }];
      G.players['0'].hand = [card('event_allnighter', 'ev')];
      G.players['0'].field.Exams = [card('nerd1', 'x')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const played = c.getState()!.G.players['0'];
    expect(played.revealedThisTurn).toBe(true);
    expect(played.playedThisTurn).toBe(true);
    c.undo();
    const after = c.getState()!.G.players['0'];
    expect(after.revealedThisTurn).toBe(true);
    expect(after.playedThisTurn).toBe(true);
    expect(after.hand.map(x => x.instanceId)).toEqual([]);
    expect(after.discard.map(x => x.id)).toEqual(['event_allnighter']);
    // nerd1 has 5 Exams credits and All-Nighter added 1.
    expect(after.field.Exams[0].credits.Exams).toBe(6);
  });

  it('removes the opponent synergy card from a lane other than the one played into', () => {
    const c = match(G => {
      G.players['0'].hand = [card('event_conflict', 'conflict')];
      G.players['1'].field.Presentations = [];
      G.players['1'].field.Assignments = [card('richkid1', 'ghost')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const G = c.getState()!.G;
    expect(G.players['1'].field.Assignments).toHaveLength(0);
    expect(G.players['1'].discard.map(x => x.id)).toEqual(['richkid1']);
    expect(G.log.some(e => e.detail === 'log.remove')).toBe(true);
  });

  it('does not let undo hide a drawn card or a spent stamina action', () => {
    const c = match(G => { G.players['0'].stamina = 8; });
    const hand = c.getState()!.G.players['0'].hand.length;
    c.moves.useStamina({ action: 'drawCard' });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(hand + 1);
    c.undo();
    const G = c.getState()!.G.players['0'];
    expect(G.hand).toHaveLength(hand + 1);
    expect(G.stamina).toBe(5);
  });

  it('still allows undo before committing a card', () => {
    const c = match();
    const hand = c.getState()!.G.players['0'].hand.length;
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    c.undo();
    expect(c.getState()!.G.players['0'].hand).toHaveLength(hand);
  });

  it('blocks undo after a synergy roll so a failed pairing cannot be retried', () => {
    const c = match(G => {
      G.players['0'].field.Exams = [card('richkid1', 'onField')];
      G.players['0'].hand = [card('richkid1', 'inHand'), card('gymbro1', 'other')];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const played = c.getState()!.G;
    expect(played.log.some(e => e.detail === 'log.synergyFailure'
      || e.detail === 'log.synergySuccess')).toBe(true);
    expect(played.players['0'].revealedThisTurn).toBe(true);
    c.undo();
    const after = c.getState()!.G.players['0'];
    // The play stands: the player cannot take back a revealed synergy outcome,
    // so the card is not back in hand whichever way the roll went.
    expect(after.hand.map(x => x.instanceId)).toEqual(['other']);
    expect(after.playedThisTurn).toBe(true);
  });

  it('blocks undo after drawing a card, so the peeked card stays drawn', () => {
    const c = match(G => {
      G.players['0'].deck = [card('nerd1', 'deck0'), card('nerd1', 'deck1')];
      G.players['0'].hand = [card('studious1', 'studious'), card('gymbro1', 'other')];
    });
    const deckBefore = c.getState()!.G.players['0'].deck.length;
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    const played = c.getState()!.G.players['0'];
    expect(played.deck).toHaveLength(deckBefore - 1);
    expect(played.revealedThisTurn).toBe(true);
    c.undo();
    const after = c.getState()!.G.players['0'];
    expect(after.deck).toHaveLength(deckBefore - 1);
    expect(after.hand.map(x => x.instanceId)).toContain('deck1');
  });

  it('allows undo of a plain deterministic play in the same turn', () => {
    const c = match(G => {
      G.players['0'].hand = [card('gymbro1', 'plain')];
      G.players['0'].field.Exams = [];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    expect(c.getState()!.G.players['0'].revealedThisTurn).toBe(false);
    c.undo();
    const after = c.getState()!.G.players['0'];
    expect(after.hand.map(x => x.instanceId)).toEqual(['plain']);
    expect(after.field.Exams).toHaveLength(0);
  });

  it('offers the bot its stamina actions and trait skill', () => {
    const c = match(G => {
      G.players['0'].traits = [trait('trait_adhd')];
      G.players['0'].stamina = 8;
      G.players['0'].deck = [card('nerd1', 'd')];
      G.players['0'].hand = [card('nerd1', 'h')];
    });
    const G = c.getState()!.G;
    const moves = AcademiaArena.ai!.enumerate(G, c.getState()!.ctx, '0');
    const names = moves.map(m => ('move' in m ? m.move : ''));
    expect(names).toContain('useStamina');
    expect(names).toContain('useTraitSkill');
    expect(moves).toContainEqual({ move: 'useStamina', args: [{ action: 'probabilityLock' }] });
    expect(moves).toContainEqual({ move: 'useTraitSkill', args: [{ traitIndex: 0 }] });
  });
});

describe('local transport and bot integration', () => {
  it('lets the bot play its own turns and end the match', async () => {
    const client = Client({
      game: { ...AcademiaArena, seed: 'bot' },
      numPlayers: 2,
      playerID: '0',
      multiplayer: Local({ bots: { '1': RandomBot } }),
    });
    client.start();
    await settle();
    client.moves.confirmTraits();
    for (let i = 0; i < 400 && client.getState()!.ctx.gameover === undefined; i++) {
      const state = client.getState()!;
      if (state.ctx.phase === 'main' && state.ctx.currentPlayer === '0') {
        const G = state.G;
        if (G.players['0'].playedThisTurn) client.moves.finishTurn();
        else if (G.players['0'].hand.length) {
          client.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
        } else client.moves.pass();
      }
      await settle();
    }
    const state = client.getState()!;
    expect(state.ctx.gameover).toBeDefined();
    expect(state.G.round).toBeGreaterThan(1);
    expect(state.G.log.length).toBeGreaterThan(4);
  });

  it('undoes and redoes over the local transport', async () => {
    const client = Client({
      game: {
        ...AcademiaArena,
        seed: 'undo',
        setup: context => {
          const G = AcademiaArena.setup!(context, undefined);
          G.firstPlayer = '0';
          return G;
        },
      },
      numPlayers: 2,
      playerID: '0',
      multiplayer: Local(),
    });
    client.start();
    await settle();
    client.moves.confirmTraits();
    await settle();
    const start = client.getState()!;
    const hand = start.G.players['0'].hand.length;
    client.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    await settle();
    expect(client.getState()!.G.players['0'].hand).toHaveLength(hand - 1);
    client.undo();
    await settle();
    expect(client.getState()!.G.players['0'].hand).toHaveLength(hand);
    client.redo();
    await settle();
    expect(client.getState()!.G.players['0'].hand).toHaveLength(hand - 1);
  });
});
