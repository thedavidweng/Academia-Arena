import { describe, expect, it } from 'bun:test';
import { Client } from 'boardgame.io/client';
import type { Game } from 'boardgame.io';
import { AcademiaArena } from './game';
import { cardLibrary } from '../data/entities';
import type { G } from './types';

function match(change: (G: G) => void = () => {}) {
  const game: Game<G> = {
    ...AcademiaArena,
    seed: 'regression',
    setup: (context) => {
      const G = AcademiaArena.setup!(context, undefined);
      G.firstPlayer = '0';
      for (const p of Object.values(G.players)) {
        p.traits = [];
        p.stamina = 8;
        p.hand = [0, 1, 2, 2, 5].map((n, i) => ({
          ...structuredClone(cardLibrary[n]), instanceId: String(i),
        }));
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

describe('academic year', () => {
  it('permits one card per turn, undo/redo before committing, then alternates', () => {
    const c = match();
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(4);
    c.undo();
    expect(c.getState()!.G.players['0'].hand).toHaveLength(5);
    c.redo();
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    expect(c.getState()!.G.players['0'].hand).toHaveLength(4);
    c.moves.finishTurn();
    expect(c.getState()!.ctx.currentPlayer).toBe('1');
  });

  it('keeps a passed player out until both pass, preserving hand and stamina', () => {
    const c = match();
    c.moves.useStamina({ action: 'probabilityLock' });
    c.moves.pass();
    expect(c.getState()!.ctx.currentPlayer).toBe('1');
    expect(c.getState()!.G.players['0'].passed).toBe(true);
    c.moves.playCard({ handIndex: 0, fieldName: 'Exams' });
    c.moves.finishTurn();
    const G = c.getState()!.G;
    expect(G.round).toBe(2);
    expect(G.players['1'].roundsWon).toBe(1);
    expect(G.players['0'].stamina).toBe(6);
    expect(G.players['0'].hand).toHaveLength(5);
    expect(G.players['1'].hand).toHaveLength(4);
    expect(G.players['0'].passed).toBe(false);
    expect(G.players['1'].field.Exams).toHaveLength(0);
  });

  it('ends a tied match as a draw, not as player zero winning', () => {
    const c = match();
    for (let i = 0; i < 4; i++) c.moves.pass();
    expect(c.getState()!.ctx.gameover).toEqual({ draw: true });
  });

  it('rejects invalid fields and fractional indices without losing a card', () => {
    const c = match();
    for (const args of [{ handIndex: 0, fieldName: '__proto__' }, { handIndex: 0.5, fieldName: 'Exams' }]) {
      c.moves.playCard(args);
      expect(c.getState()!.G.players['0'].hand).toHaveLength(5);
    }
  });

  it('deep copies card credits, consumes probability lock and leaves library unchanged', () => {
    const original = structuredClone(cardLibrary);
    const c = match();
    c.moves.useStamina({ action: 'probabilityLock' });
    c.moves.playCard({ handIndex: 2, fieldName: 'Assignments' });
    c.moves.finishTurn();
    c.moves.pass();
    c.moves.playCard({ handIndex: 2, fieldName: 'Assignments' });
    const p = c.getState()!.G.players['0'];
    expect(p.field.Assignments.map(c => c.credits.Assignments)).toEqual([8, 8]);
    expect(p.probabilityLockActive).toBe(false);
    expect(cardLibrary).toEqual(original);
  });

  it('discards events instead of retaining them on the field', () => {
    const c = match(G => {
      G.players['0'].hand = [structuredClone({ ...cardLibrary[7], instanceId: 'event' })];
    });
    c.moves.playCard({ handIndex: 0, fieldName: 'Assignments' });
    const p = c.getState()!.G.players['0'];
    expect(p.field.Assignments).toHaveLength(0);
    expect(p.discard).toHaveLength(1);
  });
});
