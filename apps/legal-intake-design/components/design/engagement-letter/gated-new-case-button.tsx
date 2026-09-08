'use client';

import { ArrowRight, Plus } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { useClientEngagement } from './engagement-letter-context';

type GatedNewCaseButtonProps = {
  label: string;
  icon?: 'arrow' | 'plus';
  size?: 'default' | 'lg';
  className?: string;
};

export function GatedNewCaseButton({
  label,
  icon = 'plus',
  size = 'default',
  className,
}: GatedNewCaseButtonProps) {
  const { enabled, isPending, openSigning } = useClientEngagement();
  const Icon = icon === 'arrow' ? ArrowRight : Plus;
  const content = (
    <>
      {icon === 'plus' ? (
        <Icon data-icon="inline-start" aria-hidden="true" />
      ) : null}
      {label}
      {icon === 'arrow' ? (
        <Icon
          data-icon="inline-end"
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  );

  if (enabled && isPending) {
    return (
      <Button
        type="button"
        size={size}
        className={cn('group', className)}
        onClick={openSigning}
      >
        {content}
      </Button>
    );
  }

  return (
    <Button asChild size={size} className={cn('group', className)}>
      <Link href="/client/new">{content}</Link>
    </Button>
  );
}
