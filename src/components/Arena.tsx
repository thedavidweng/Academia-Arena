// =============================================================================
// Arena.tsx — Main game board container
// =============================================================================
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from 'boardgame.io/react';
import type { G, CardInstance, FieldName } from '../game/types';
import { Lane } from './Lane';
import { Card } from './Card';
import { StaminaAction } from './StaminaAction';
import { GameLog } from './GameLog';
import { cn } from '../lib/utils';

export function Arena({ G, ctx, moves, playerID, undo, redo }: BoardProps<G> & { undo?: () => void; redo?: () => void }) {
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

  const isZh = lang === 'zh';

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

  const handleTraitSkill = (traitIndex: number) => {
    if (!isMyTurn) return;
    moves.useTraitSkill({ traitIndex });
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

  // Trait Animation Phase
  if (ctx.phase === 'traitAnimation') {
    return <TraitRevealScreen G={G} moves={moves} />;
  }

  // Trait display helper
  const renderTraits = (traits: G['players']['0']['traits'], label: string) => (
    <div className="mb-2">
      <div className="label text-[9px] uppercase tracking-widest text-on-surface/30 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {traits.map((trait) => (
          <div
            key={trait.id}
            className="label text-[9px] px-1.5 py-0.5 bg-surface-container-high border border-outline-variant/20"
            title={isZh ? trait.descriptionZh : trait.description}
          >
            {isZh ? trait.nameZh : trait.name}
          </div>
        ))}
      </div>
    </div>
  );

  // Trait skill buttons (e.g., ADHD)
  const traitSkillButtons = me.traits
    .map((trait, i) => ({ trait, index: i }))
    .filter(({ trait }) => trait.activeAbility);

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
          {/* Undo / Redo */}
          {undo && (
            <button
              onClick={() => undo()}
              className="label text-xs uppercase tracking-wider text-on-surface/50 hover:text-on-surface transition-colors"
              title={t('game.undo')}
            >
              ↶ {t('game.undo')}
            </button>
          )}
          {redo && (
            <button
              onClick={() => redo()}
              className="label text-xs uppercase tracking-wider text-on-surface/50 hover:text-on-surface transition-colors"
              title={t('game.redo')}
            >
              ↷ {t('game.redo')}
            </button>
          )}
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
            {renderTraits(opp.traits, t('trait.opponentTraits'))}
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
                {opp.probabilityLockActive && (
                  <span className="label text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold uppercase">
                    {t('stamina.probabilityLock')} ✓
                  </span>
                )}
                {opp.statusOverrideActive && (
                  <span className="label text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold uppercase">
                    {t('stamina.statusOverride')} ✓
                  </span>
                )}
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
            {renderTraits(me.traits, t('trait.yourTraits'))}
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
                {me.probabilityLockActive && (
                  <span className="label text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold uppercase">
                    {t('stamina.probabilityLock')} ✓
                  </span>
                )}
                {me.statusOverrideActive && (
                  <span className="label text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold uppercase">
                    {t('stamina.statusOverride')} ✓
                  </span>
                )}
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
            <div className="mt-3 flex items-center gap-3 flex-wrap">
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

              {/* Trait skill buttons */}
              {traitSkillButtons.map(({ trait, index }) => {
                const uses = me.traitUses[trait.id] || 0;
                const limit = trait.limitPerRound || 1;
                const disabled = !isMyTurn || uses >= limit;
                return (
                  <button
                    key={trait.id}
                    onClick={() => handleTraitSkill(index)}
                    disabled={disabled}
                    className={cn(
                      'label text-[10px] uppercase tracking-wider px-3 py-2',
                      'border border-outline-variant/30',
                      !disabled
                        ? 'bg-surface hover:bg-surface-dim text-on-surface cursor-pointer'
                        : 'bg-surface-dim text-on-surface/30 cursor-not-allowed'
                    )}
                    title={isZh ? trait.descriptionZh : trait.description}
                  >
                    <div className="font-bold">{isZh ? trait.nameZh : trait.name}</div>
                    <div className="text-on-surface/40 mt-0.5">
                      {uses}/{limit}
                    </div>
                  </button>
                );
              })}

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

// =============================================================================
// TraitRevealScreen — Slot-machine style trait reveal animation
// =============================================================================
interface TraitRevealProps {
  G: G;
  moves: Record<string, (...args: unknown[]) => void>;
}

function TraitRevealScreen({ G, moves }: TraitRevealProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [lang, setLang] = useState(i18n.language);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  const toggleLang = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    setLang(next);
  };

  const p0Traits = G.players['0'].traits;
  const p1Traits = G.players['1'].traits;
  const categoryLabels = [
    { key: 'background', label: t('trait.background') },
    { key: 'physiological', label: t('trait.physiological') },
    { key: 'psychological', label: t('trait.psychological') },
  ];

  useEffect(() => {
    const totalTraits = 6; // 3 per player
    if (revealedCount < totalTraits) {
      const timer = setTimeout(() => setRevealedCount(revealedCount + 1), 600);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowContinue(true), 400);
      return () => clearTimeout(timer);
    }
  }, [revealedCount]);

  return (
    <div className="min-h-screen surface flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 surface-high border-b border-outline-variant/10">
        <h1 className="font-display text-xl font-black uppercase tracking-tighter">
          {t('app.title')}
        </h1>
        <button
          onClick={toggleLang}
          className="label text-xs uppercase tracking-wider text-on-surface/50 hover:text-on-surface transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-on-surface mb-2">
          {t('trait.assigning')}
        </h2>
        <p className="label text-sm text-on-surface/40 uppercase tracking-[0.2em] mb-12">
          {t('trait.noChoice')}
        </p>

        <div className="flex gap-16 w-full max-w-4xl">
          {/* Player 1 Traits */}
          <div className="flex-1">
            <h3 className="label text-xs font-bold uppercase tracking-widest text-on-surface/60 mb-4">
              {t('trait.yourTraits')} (P1)
            </h3>
            <div className="space-y-3">
              {categoryLabels.map((cat, i) => {
                const trait = p0Traits[i];
                const revealed = revealedCount > i * 2;
                const name = isZh ? trait.nameZh : trait.name;
                const desc = isZh ? trait.descriptionZh : trait.description;
                return (
                  <div
                    key={cat.key}
                    className={cn(
                      'transition-all duration-500',
                      revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    )}
                  >
                    <div className="label text-[9px] uppercase tracking-widest text-on-surface/30 mb-1">
                      {cat.label}
                    </div>
                    <div className="surface-lowest ghost-border p-3">
                      <div className="font-bold text-sm">{name}</div>
                      <div className="text-[11px] text-on-surface/60 mt-1">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-outline-variant/20" />

          {/* Player 2 Traits */}
          <div className="flex-1">
            <h3 className="label text-xs font-bold uppercase tracking-widest text-on-surface/40 mb-4">
              {t('trait.opponentTraits')} (P2)
            </h3>
            <div className="space-y-3">
              {categoryLabels.map((cat, i) => {
                const trait = p1Traits[i];
                const revealed = revealedCount > i * 2 + 1;
                const name = isZh ? trait.nameZh : trait.name;
                const desc = isZh ? trait.descriptionZh : trait.description;
                return (
                  <div
                    key={cat.key}
                    className={cn(
                      'transition-all duration-500',
                      revealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                    )}
                  >
                    <div className="label text-[9px] uppercase tracking-widest text-on-surface/30 mb-1">
                      {cat.label}
                    </div>
                    <div className="surface-lowest ghost-border p-3">
                      <div className="font-bold text-sm">{name}</div>
                      <div className="text-[11px] text-on-surface/60 mt-1">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className={cn(
          'mt-12 transition-all duration-500',
          showContinue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}>
          <button
            onClick={() => moves.confirmTraits()}
            className="bg-primary text-on-primary label text-sm uppercase tracking-[0.2em] px-12 py-4 font-bold hover:bg-primary-container transition-colors"
          >
            {t('trait.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
