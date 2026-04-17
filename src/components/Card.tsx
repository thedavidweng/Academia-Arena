// =============================================================================
// Card.tsx — Brutalist card component
// =============================================================================
import { useTranslation } from 'react-i18next';
import type { CardInstance } from '../game/types';
import { cn } from '../lib/utils';

interface CardProps {
  card: CardInstance;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function Card({ card, selected, onClick, compact }: CardProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const name = isZh && card.nameZh ? card.nameZh : card.name;
  const desc = isZh && card.descriptionZh ? card.descriptionZh : card.description;

  return (
    <div
      onClick={onClick}
      className={cn(
        'game-card surface-lowest ghost-border p-3 cursor-pointer select-none',
        'flex flex-col justify-between',
        compact ? 'w-[110px] h-[130px]' : 'w-[140px] h-[170px]',
        selected && 'selected',
        card.type === 'Event' && 'border-l-4 border-l-primary',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      <div>
        <div className={cn('font-bold leading-tight', compact ? 'text-xs' : 'text-sm')}>
          {name}
        </div>
        <div className="label text-[10px] text-on-surface/50 uppercase tracking-wider mt-0.5">
          {card.type === 'Character' ? t('card.char') : t('card.event')}
        </div>

        {card.type === 'Character' && (
          <div className="label text-[10px] mt-1 space-y-0.5">
            <div>
              <span className="text-on-surface/40">{t('card.credits.p')}</span> {card.credits.Presentations}
              <span className="text-on-surface/20 mx-1">|</span>
              <span className="text-on-surface/40">{t('card.credits.a')}</span> {card.credits.Assignments}
              <span className="text-on-surface/20 mx-1">|</span>
              <span className="text-on-surface/40">{t('card.credits.e')}</span> {card.credits.Exams}
            </div>
          </div>
        )}

        {!compact && (
          <div className="text-[10px] text-on-surface/60 mt-1 line-clamp-2 leading-snug">
            {desc}
          </div>
        )}
      </div>

      <div className="mt-auto space-y-0.5">
        {card.deployEffect && (
          <div className="label text-[9px] text-primary font-medium uppercase">
            {t('card.deploy')}: {card.deployEffect}
          </div>
        )}
        {card.synergy && (
          <div className="label text-[9px] text-on-surface/50 font-medium uppercase">
            {t('card.synergy')}: {t(`synergy.${card.synergy.type.toLowerCase().replace(/\s/g, '')}`, card.synergy.type)}
          </div>
        )}
        {card.stayOnField && (
          <div className="label text-[9px] text-green-700 font-medium uppercase">
            {t('card.stayOnField')}
          </div>
        )}
      </div>
    </div>
  );
}
