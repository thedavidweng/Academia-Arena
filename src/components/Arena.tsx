// =============================================================================
// Arena.tsx — Main game board container
// =============================================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from 'boardgame.io/react';
import type { G, CardInstance, FieldName } from '../game/types';
import { Lane } from './Lane';
import { Card } from './Card';
import { StaminaAction } from './StaminaAction';
import { GameLog } from './GameLog';
import { cn } from '../lib/utils';

export function Arena({ G, ctx, moves, playerID }: BoardProps<G>) {
  const { t, i18n } = useTranslation();
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [lang, setLang] = useState(i18n.language);

  const myIdx = playerID || ctx.currentPlayer;
  const myKey = myIdx as '0' | '1';
  const oppKey = myKey === '0' ? '1' : '0';

  const me = G.players[myKey];
  const opp = G.players[oppKey];

  const isMyTurn = ctx.currentPlayer === myIdx;
  const fields: FieldName[] = ['Presentations', 'Assignments', 'Exams'];

  const toggleLang = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    setLang(next);
  };

  const handleHandCardClick = (index: number) => {
    if (!isMyTurn || ctx.phase !== 'main') return;
    setSelectedHandIndex(selectedHandIndex === index ? null : index);
  };

  const handleFieldClick = (fieldName: FieldName) => {
    if (selectedHandIndex === null || !isMyTurn) return;
    moves.playCard({ handIndex: selectedHandIndex, fieldName });
    setSelectedHandIndex(null);
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    moves.pass();
    setSelectedHandIndex(null);
  };

  const handleStamina = (action: 'probabilityLock' | 'statusOverride' | 'drawCard') => {
    moves.useStamina({ action });
  };

  // Game Over
  if (ctx.gameover) {
    const winnerIdx = ctx.gameover.winner;
    const isDraw = G.players['0'].roundsWon >= 2 && G.players['1'].roundsWon >= 2;
    return (
      <div className="min-h-screen surface flex flex-col items-center justify-center p-8">
        <h1 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter text-on-surface mb-4">
          {t('gameOver.title')}
        </h1>
        <p className="label text-2xl text-primary mb-8">
          {isDraw
            ? t('gameOver.draw')
            : `Player ${Number(winnerIdx) + 1} ${t('gameOver.winner')}`}
        </p>
        <div className="flex gap-8 label text-sm text-on-surface/50 mb-8">
          <div>P1: {G.players['0'].roundsWon} {t('game.semestersWon')}</div>
          <div>P2: {G.players['1'].roundsWon} {t('game.semestersWon')}</div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-on-primary label text-sm uppercase tracking-widest px-8 py-3 font-bold hover:bg-primary-container transition-colors"
        >
          {t('gameOver.playAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 surface-high border-b border-outline-variant/10">
        <h1 className="font-display text-xl font-black uppercase tracking-tighter">
          {t('app.title')}
        </h1>
        <div className="flex items-center gap-4">
          <span className="label text-xs text-on-surface/40 uppercase">
            {t('round.semester')} {G.round}
          </span>
          <button
            onClick={toggleLang}
            className="label text-xs uppercase tracking-wider text-on-surface/50 hover:text-on-surface transition-colors"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Main game area */}
        <div className="flex-1 p-6">
          {/* Opponent area */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="label text-xs font-bold uppercase tracking-widest text-on-surface/40">
                {t('game.opponentField')}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="label text-[10px] text-on-surface/40 uppercase">{t('game.stamina')}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn('stamina-segment', i < opp.stamina ? 'filled' : 'empty')}
                      />
                    ))}
                  </div>
                </div>
                <div className="label text-sm font-bold">
                  {t('game.score')}: {opp.score.total}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {fields.map((f) => (
                <Lane
                  key={f}
                  fieldName={f}
                  cards={opp.field[f]}
                  score={opp.score[f]}
                  isOpponent
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="label text-[10px] text-on-surface/30 uppercase">
                {t('game.opponentHand')}: {opp.hand.length}
              </span>
              <div className="flex gap-1">
                {opp.hand.map((_, i) => (
                  <div key={i} className="w-8 h-12 surface-high border border-outline-variant/10" />
                ))}
              </div>
            </div>
          </div>

          <div className="my-4 border-t-2 border-on-surface/10" />

          {/* Turn indicator */}
          <div className="text-center mb-4">
            <span
              className={cn(
                'label text-sm font-bold uppercase tracking-widest px-4 py-1',
                isMyTurn ? 'bg-primary text-on-primary' : 'bg-surface-high text-on-surface/50'
              )}
            >
              {isMyTurn ? t('game.yourTurn') : t('game.opponentTurn')}
              {isMyTurn && selectedHandIndex === null && ` — ${t('game.selectCard')}`}
              {isMyTurn && selectedHandIndex !== null && ` — ${t('game.chooseField')}`}
            </span>
          </div>

          {/* Player area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="label text-xs font-bold uppercase tracking-widest text-on-surface/60">
                {t('game.yourField')}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="label text-[10px] text-on-surface/40 uppercase">{t('game.stamina')}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn('stamina-segment', i < me.stamina ? 'filled' : 'empty')}
                      />
                    ))}
                  </div>
                </div>
                <div className="label text-sm font-bold">
                  {t('game.score')}: {me.score.total}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {fields.map((f) => (
                <Lane
                  key={f}
                  fieldName={f}
                  cards={me.field[f]}
                  score={me.score[f]}
                  droppable={selectedHandIndex !== null && isMyTurn}
                  onClick={() => handleFieldClick(f)}
                />
              ))}
            </div>

            {/* Hand */}
            <div className="mt-4 surface-low p-3">
              <div className="label text-[10px] uppercase tracking-widest text-on-surface/40 mb-2">
                {t('game.yourHand')} ({me.hand.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {me.hand.map((card, i) => (
                  <Card
                    key={card.instanceId}
                    card={card}
                    selected={selectedHandIndex === i}
                    onClick={() => handleHandCardClick(i)}
                  />
                ))}
                {me.hand.length === 0 && (
                  <div className="text-xs text-on-surface/30 italic">—</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handlePass}
                disabled={!isMyTurn || me.passed}
                className={cn(
                  'label text-xs uppercase tracking-widest px-6 py-2 font-bold',
                  'bg-primary text-on-primary',
                  (!isMyTurn || me.passed) && 'opacity-40 cursor-not-allowed'
                )}
              >
                {t('game.pass')}
              </button>

              {selectedHandIndex !== null && (
                <button
                  onClick={() => setSelectedHandIndex(null)}
                  className="label text-xs uppercase tracking-widest px-4 py-2 font-bold surface-high text-on-surface/60"
                >
                  {t('game.cancel')}
                </button>
              )}

              <div className="ml-auto">
                <StaminaAction
                  stamina={me.stamina}
                  onAction={handleStamina}
                  disabled={!isMyTurn}
                />
              </div>
            </div>

            <div className="mt-3 flex gap-4 label text-[10px] text-on-surface/30 uppercase">
              <span>{t('game.deck')}: {me.deck.length}</span>
              <span>{t('game.discard')}: {me.discard.length}</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Game log */}
        <div className="w-64 border-l border-outline-variant/10 p-3">
          <GameLog log={G.log} />
        </div>
      </div>
    </div>
  );
}
