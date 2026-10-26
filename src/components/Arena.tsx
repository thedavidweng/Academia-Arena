import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from 'boardgame.io/react';
import type { G, FieldName } from '../game/types';
import { Lane } from './Lane';
import { Card } from './Card';
import { StaminaAction } from './StaminaAction';
import { GameLog } from './GameLog';
import { cn } from '../lib/utils';

export type ArenaProps = BoardProps<G> & {
  hotseat?: boolean;
  onPlayerChange?: (player: string) => void;
};

export function Arena(props: ArenaProps) {
  const { G: live, ctx: liveCtx, moves, playerID, undo, redo, hotseat, onPlayerChange } = props;
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [undone, setUndone] = useState(0);
  const [history, setHistory] = useState<{ G: G; ctx: typeof liveCtx }[]>([]);
  const [review, setReview] = useState(-1);
  useEffect(() => {
    setSelected(null);
    setReady(false);
    setUndone(0);
    if (hotseat) onPlayerChange?.(liveCtx.currentPlayer);
  }, [liveCtx.turn, liveCtx.currentPlayer, hotseat, onPlayerChange]);
  useEffect(() => {
    setHistory(previous => previous.at(-1)?.G === live ? previous : [...previous, { G: live, ctx: liveCtx }]);
  }, [live, liveCtx]);

  const G = review < 0 ? live : history[review].G;
  const ctx = review < 0 ? liveCtx : history[review].ctx;
  const myKey = (playerID || ctx.currentPlayer) as '0' | '1';
  const oppKey = myKey === '0' ? '1' : '0';
  const me = G.players[myKey], opp = G.players[oppKey];
  const isMyTurn = review < 0 && liveCtx.currentPlayer === playerID && !liveCtx.gameover;
  const isZh = i18n.language === 'zh';
  const fields: FieldName[] = ['Presentations', 'Assignments', 'Exams'];
  const toggleLang = () => i18n.changeLanguage(isZh ? 'en' : 'zh');

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 surface-high">
      <h1 className="font-display text-2xl font-black uppercase tracking-tighter">{t('app.title')}</h1>
      <div className="flex flex-wrap items-center gap-4 label text-sm">
        <span>{t('round.semester')} {G.round}</span>
        <span>{t('game.player', { player: Number(myKey) + 1 })}</span>
        <button onClick={toggleLang}>{isZh ? 'EN' : '中文'}</button>
      </div>
    </header>
  );

  if (ctx.phase === 'traitAnimation' && review < 0) {
    return <main>{header}<section className="p-6 md:p-12 max-w-5xl mx-auto">
      <h2 className="font-display text-4xl font-black uppercase mb-8">{t('trait.assigning')}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {(['0', '1'] as const).map(key => <div key={key} className="surface-low p-6">
          <h3 className="font-bold mb-4">{t('game.player', { player: Number(key) + 1 })}</h3>
          {G.players[key].traits.map(trait => <div className="surface-lowest p-4 mb-3" key={trait.id}>
            <h4 className="font-bold">{isZh ? trait.nameZh : trait.name}</h4>
            <p>{isZh ? trait.descriptionZh : trait.description}</p>
          </div>)}
          <p>{t('game.stamina')}: {G.players[key].stamina}</p>
        </div>)}
      </div>
      <button className="bg-primary text-on-primary px-8 py-3 mt-8 font-bold"
        disabled={liveCtx.currentPlayer !== playerID} onClick={() => moves.confirmTraits()}>
        {t('trait.continue')}
      </button>
    </section></main>;
  }
  if (hotseat && !ready && review < 0 && !ctx.gameover) {
    return <main>{header}<section className="p-12">
      <h2 className="text-3xl font-black mb-6">{t('game.handoff', { player: Number(liveCtx.currentPlayer) + 1 })}</h2>
      <button className="bg-primary text-on-primary px-8 py-3 font-bold" onClick={() => setReady(true)}>
        {t('game.ready')}
      </button>
    </section></main>;
  }

  const traits = (key: '0' | '1') => <div className="flex flex-wrap gap-2 mb-3">
    {G.players[key].traits.map(trait => <span key={trait.id}
      className="surface-high px-2 py-1 text-xs" title={isZh ? trait.descriptionZh : trait.description}>
      {isZh ? trait.nameZh : trait.name}
    </span>)}
  </div>;
  const stats = (key: '0' | '1') => <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 label text-sm">
    <strong>{t('game.player', { player: Number(key) + 1 })}</strong>
    <span>{t('game.score')}: {G.players[key].score.total}</span>
    <span>{t('game.semestersWon')}: {G.players[key].roundsWon}</span>
    <span className="flex items-center gap-2" title={`${t('game.stamina')}: ${G.players[key].stamina}`}>
      {t('game.stamina')}
      <span aria-label={`${t('game.stamina')}: ${G.players[key].stamina}`} role="img"
        className="flex gap-0.5">
        {Array.from({ length: 8 }, (_, i) => <span key={i}
          className={cn('stamina-segment', i < G.players[key].stamina ? 'filled' : 'empty')} />)}
      </span>
    </span>
  </div>;
  return <main>{header}
    <div className="flex flex-wrap gap-4 p-4 surface-low label text-sm items-center">
      <label htmlFor="replay">{t('game.replay')}</label>
      <select id="replay" value={review} onChange={event => {
        setReview(Number(event.target.value)); setSelected(null);
      }} className="surface-lowest p-2">
        <option value={-1}>{t('game.live')}</option>
        {history.map((_, i) => <option key={i} value={i}>{t('game.step', { step: i })}</option>)}
      </select>
      {review >= 0 && <strong role="status">{t('game.reviewOnly')}</strong>}
      <button onClick={() => { undo(); setUndone(u => u + 1); setSelected(null); }}
        disabled={!isMyTurn || liveCtx.numMoves === 0}>{t('game.undo')}</button>
      <button onClick={() => { redo(); setUndone(u => Math.max(0, u - 1)); setSelected(null); }}
        disabled={!isMyTurn || undone === 0}>{t('game.redo')}</button>
    </div>
    {ctx.gameover && <section className="bg-primary text-on-primary p-6" role="status">
      <h2 className="font-display text-4xl font-black">{t('gameOver.title')}</h2>
      <p>{ctx.gameover.draw ? t('gameOver.draw') : t('gameOver.winnerFull', { player: Number(ctx.gameover.winner) + 1 })}</p>
      <button className="surface-lowest text-on-surface mt-4 px-6 py-2 font-bold" onClick={() => window.location.reload()}>
        {t('gameOver.playAgain')}
      </button>
    </section>}
    <div className="flex flex-col xl:flex-row">
      <div className="flex-1 min-w-0 p-4 md:p-6">
        <section aria-label={t('game.opponentField')} className="surface-low p-4">
          {stats(oppKey)}{traits(oppKey)}
          <div className="grid md:grid-cols-3 gap-2">
            {fields.map(field => <Lane key={field} fieldName={field}
              cards={opp.field[field]} score={opp.score[field]} isOpponent />)}
          </div>
          <p className="label text-xs mt-3">{t('game.opponentHand')}: {opp.hand.length}</p>
        </section>
        <div className="my-4 bg-primary text-on-primary p-3 font-bold label" role="status">
          {liveCtx.gameover ? t('gameOver.title')
            : review >= 0 ? t('game.reviewOnly')
              : isMyTurn
                ? t(me.playedThisTurn ? 'game.commitOrUndo' : 'game.selectCard')
                : t('game.opponentTurn')}
        </div>
        <section aria-label={t('game.yourField')} className="surface-low p-4">
          {stats(myKey)}{traits(myKey)}
          <div className="grid md:grid-cols-3 gap-2">
            {fields.map(field => <Lane key={field} fieldName={field} cards={me.field[field]} score={me.score[field]}
              droppable={isMyTurn && selected !== null && !me.playedThisTurn}
              onClick={() => {
                if (!isMyTurn || selected === null || me.playedThisTurn) return;
                moves.playCard({ handIndex: selected, fieldName: field }); setSelected(null);
              }} />)}
          </div>
          <h2 className="label font-bold text-sm mt-5 mb-3">{t('game.yourHand')} ({me.hand.length})</h2>
          <div className="flex flex-wrap gap-3">
            {me.hand.map((card, i) => <Card key={card.instanceId} card={card} selected={selected === i}
              onClick={isMyTurn && !me.playedThisTurn ? () => setSelected(selected === i ? null : i) : undefined} />)}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <button className="bg-primary text-on-primary px-6 py-3 font-bold disabled:opacity-40"
              disabled={!isMyTurn} onClick={() => {
                if (me.playedThisTurn) moves.finishTurn(); else moves.pass(); setSelected(null);
              }}>{t(me.playedThisTurn ? 'game.finishTurn' : 'game.pass')}</button>
            {me.traits.map((trait, index) => trait.activeAbility && <button key={trait.id}
              className="surface-high px-3 py-2 disabled:opacity-40"
              disabled={!isMyTurn || !me.hand.length || (me.traitUses[trait.id] || 0) >= trait.limitPerRound!}
              onClick={() => { moves.useTraitSkill({ traitIndex: index }); setSelected(null); }}>
              {isZh ? trait.nameZh : trait.name} ({me.traitUses[trait.id] || 0}/{trait.limitPerRound})
            </button>)}
            <StaminaAction stamina={me.stamina} disabled={!isMyTurn} lockActive={me.probabilityLockActive}
              overrideActive={me.statusOverrideActive} deckEmpty={!me.deck.length}
              onAction={action => { moves.useStamina({ action }); setSelected(null); }} />
          </div>
          <p className="mt-3 label text-xs">{t('game.deck')}: {me.deck.length} · {t('game.discard')}: {me.discard.length}</p>
        </section>
      </div>
      <aside className="xl:w-72 p-4 surface-high"><GameLog log={G.log} /></aside>
    </div>
  </main>;
}
