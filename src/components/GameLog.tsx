// =============================================================================
// GameLog.tsx — Brutalist activity log
// =============================================================================
import { useTranslation } from 'react-i18next';
import type { GameLogEntry } from '../game/types';

interface GameLogProps {
  log: GameLogEntry[];
}

export function GameLog({ log }: GameLogProps) {
  const { t } = useTranslation();

  return (
    <div className="surface-high p-3">
      <div className="label text-xs font-bold uppercase tracking-widest mb-2 text-on-surface/60">
        {t('gameLog.title')}
      </div>
      <div className="game-log max-h-[200px] overflow-y-auto space-y-1">
        {log.length === 0 ? (
          <div className="text-xs text-on-surface/30 italic">{t('gameLog.empty')}</div>
        ) : (
          log.slice(-20).map((entry, i) => (
            <div key={i} className="label text-[10px] leading-relaxed">
              <span className="text-on-surface/30">
                [{entry.round}] P{entry.player + 1}
              </span>{' '}
              <span
                className={
                  entry.action === 'synergy'
                    ? 'text-primary font-bold'
                    : entry.action === 'stamina'
                      ? 'text-on-surface/60'
                      : 'text-on-surface/80'
                }
              >
                {entry.detail}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
