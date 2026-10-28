// =============================================================================
// GameLog.tsx — Brutalist activity log with replay support
// =============================================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n';
import type { GameLogEntry } from '../game/types';
import { cardLibrary } from '../data/entities';
import { cn } from '../lib/utils';

interface GameLogProps {
  log: GameLogEntry[];
}

export function GameLog({ log }: GameLogProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const displayLog = expanded ? log : log.slice(-20);
  const firstIndex = log.length - displayLog.length;

  const actionColor = (action: string) => {
    switch (action) {
      case 'synergy': return 'text-primary font-bold';
      case 'stamina': return 'text-on-surface/60 italic';
      case 'trait': return 'text-primary/70';
      case 'round': return 'text-on-surface font-bold';
      case 'effect': return 'text-on-surface/70';
      default: return 'text-on-surface/80';
    }
  };

  return (
    <div className="surface-high p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="label text-xs font-bold uppercase tracking-widest text-on-surface/60">
          {t('gameLog.title')}
        </div>
        {log.length > 20 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="label text-[9px] uppercase tracking-wider text-on-surface/40 hover:text-on-surface transition-colors"
          >
            {expanded ? t('gameLog.collapse') : `${t('gameLog.showAll')} (${log.length})`}
          </button>
        )}
      </div>
      <div className="game-log flex-1 overflow-y-auto space-y-1">
        {displayLog.length === 0 ? (
          <div className="text-xs text-on-surface/30 italic">{t('gameLog.empty')}</div>
        ) : (
          displayLog.map((entry, i) => (
            <div key={i} className="label text-[10px] leading-relaxed">
              <span className="text-on-surface/20">
                #{firstIndex + i + 1}
              </span>{' '}
              <span className="text-on-surface/30">
                [{entry.round}] {entry.player >= 0 ? t('game.player', { player: entry.player + 1 }) : ''}
              </span>{' '}
              <span className={cn(actionColor(entry.action))}>
                {t(entry.detail as TranslationKey, Object.fromEntries(Object.entries(entry.values).map(([key, value]) => {
                  const card = key === 'card' ? cardLibrary.find(c => c.id === value) : undefined;
                  return [key, card ? (i18n.language === 'zh' ? card.nameZh : card.name)
                    : key === 'field' ? t(`field.${value}` as TranslationKey) : value];
                })))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
