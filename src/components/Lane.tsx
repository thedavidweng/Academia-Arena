// =============================================================================
// Lane.tsx — Academic field lane (Presentations / Assignments / Exams)
// =============================================================================
import { useTranslation } from 'react-i18next';
import type { CardInstance, FieldName } from '../game/types';
import { Card } from './Card';
import { cn } from '../lib/utils';

interface LaneProps {
  fieldName: FieldName;
  cards: CardInstance[];
  score: number;
  droppable?: boolean;
  onClick?: () => void;
  isOpponent?: boolean;
}

export function Lane({ fieldName, cards, score, droppable, onClick, isOpponent }: LaneProps) {
  const { t } = useTranslation();

  const zoneColors: Record<FieldName, string> = {
    Presentations: 'bg-secondary-container',
    Assignments: 'bg-surface-dim',
    Exams: 'exam-gradient text-on-primary',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'min-h-[160px] p-3 flex flex-col transition-all duration-200',
        'surface-low',
        droppable && 'lane-droppable',
        isOpponent && 'opacity-90'
      )}
    >
      {/* Zone marker */}
      <div
        className={cn(
          'label text-xs font-bold uppercase tracking-widest px-2 py-1 mb-2 self-start',
          zoneColors[fieldName]
        )}
      >
        {t(`field.${fieldName}`)}{' '}
        <span className={cn(fieldName === 'Exams' ? 'text-on-primary/70' : 'text-on-surface/50')}>
          ({score})
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-1.5 flex-1 items-start">
        {cards.length === 0 ? (
          <div className="text-xs text-on-surface/30 italic label mt-4">{t('lane.empty')}</div>
        ) : (
          cards.map((card) => (
            <Card key={card.instanceId} card={card} compact />
          ))
        )}
      </div>
    </div>
  );
}
