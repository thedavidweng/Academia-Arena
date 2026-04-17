// =============================================================================
// GameLog.tsx — Brutalist activity log with replay support
// =============================================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameLogEntry } from '../game/types';
import { cn } from '../lib/utils';

interface GameLogProps {
  log: GameLogEntry[];
}

export function GameLog({ log }: GameLogProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const displayLog = expanded ? log : log.slice(-20);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
                {formatTime(entry.timestamp)}
              </span>{' '}
              <span className="text-on-surface/30">
                [{entry.round}] P{entry.player + 1}
              </span>{' '}
              <span className={cn(actionColor(entry.action))}>
                {entry.detail}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
