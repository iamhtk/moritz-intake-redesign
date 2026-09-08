'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, LifeBuoy, Scale } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { OnboardingActions } from '@/components/design/onboarding/onboarding-actions';

type CustomerType = 'NON_LEGAL' | 'LEGAL';

interface CustomerTypeFormProps {
  onContinue?: (type: CustomerType) => void;
  onBack?: () => void;
  onSelectType?: (type: CustomerType) => void;
  /** Previously chosen type, so the selection survives navigating away and back. */
  selectedType?: CustomerType | null;
  progressCurrent?: number;
  progressTotal?: number;
}

export function CustomerTypeForm({
  onContinue,
  onBack,
  onSelectType,
  selectedType: initialSelectedType = null,
  progressCurrent,
  progressTotal,
}: CustomerTypeFormProps) {
  const t = useTranslations('onboarding.customerType');
  const tReg = useTranslations('registration');
  const [selectedType, setSelectedType] = useState<CustomerType | null>(
    initialSelectedType,
  );
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = () => {
    if (!selectedType) return;
    // Design playground: simulate the createCompany mutation.
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onContinue?.(selectedType);
    }, 400);
  };

  const customerTypes = [
    {
      type: 'NON_LEGAL' as CustomerType,
      icon: LifeBuoy,
      title: t('client.title'),
      description: t('client.description'),
    },
    {
      type: 'LEGAL' as CustomerType,
      icon: Scale,
      title: t('attorney.title'),
      description: t('attorney.description'),
    },
  ];

  return (
    <div className="space-y-8">
      <div
        role="radiogroup"
        aria-label={t('subtitle')}
        className="divide-border border-border divide-y rounded-2xl border"
      >
        {customerTypes.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedType === item.type;

          return (
            <button
              key={item.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                setSelectedType(item.type);
                onSelectType?.(item.type);
              }}
              className={cn(
                'group relative flex w-full cursor-pointer items-center gap-5 p-5 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl sm:px-6 sm:py-7',
                'focus-visible:ring-ring focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2',
                isSelected ? 'bg-muted/60' : 'hover:bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isSelected
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground group-hover:bg-background border-border border',
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-serif text-xl leading-tight tracking-tight">
                  {item.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm leading-snug">
                  {item.description}
                </span>
              </span>

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border group-hover:border-foreground/40',
                )}
                aria-hidden
              >
                <Check
                  className={cn(
                    'size-3.5 transition-opacity',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                  strokeWidth={2.5}
                />
              </span>
            </button>
          );
        })}
      </div>

      <OnboardingActions
        continueLabel={t('continue')}
        continueType="button"
        onContinue={handleSubmit}
        continueDisabled={!selectedType}
        isPending={isPending}
        backLabel={tReg('actions.back')}
        onBack={onBack}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    </div>
  );
}
