// =============================================================================
// StaminaAction.tsx — Stamina spending interface
// =============================================================================
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface StaminaActionProps {
  stamina: number;
  onAction: (action: 'probabilityLock' | 'statusOverride' | 'drawCard') => void;
  disabled?: boolean;
}

export function StaminaAction({ stamina, onAction, disabled }: StaminaActionProps) {
  const { t } = useTranslation();

  const actions = [
    { key: 'probabilityLock' as const, cost: 2, label: t('stamina.probabilityLock'), desc: t('stamina.probabilityLockDesc') },
    { key: 'statusOverride' as const, cost: 1, label: t('stamina.statusOverride'), desc: t('stamina.statusOverrideDesc') },
    { key: 'drawCard' as const, cost: 3, label: t('stamina.drawCard'), desc: t('stamina.drawCardDesc') },
  ];

  return (
    <div className="flex gap-2">
      {actions.map(({ key, cost, label, desc }) => {
        const canAfford = stamina >= cost;
        return (
          <button
            key={key}
            onClick={() => onAction(key)}
            disabled={disabled || !canAfford}
            title={desc}
            className={cn(
              'label text-[10px] uppercase tracking-wider px-3 py-2',
              'border border-outline-variant/30',
              'transition-colors duration-150',
              canAfford && !disabled
                ? 'bg-surface hover:bg-surface-dim text-on-surface cursor-pointer'
                : 'bg-surface-dim text-on-surface/30 cursor-not-allowed'
            )}
          >
            <div className="font-bold">{label}</div>
            <div className="text-on-surface/40 mt-0.5">{t('stamina.cost')}: {cost}</div>
          </button>
        );
      })}
    </div>
  );
}
