import { cn } from '@repo/ui/lib/utils';

interface CaseTitleProps {
  title: string;
  className?: string;
  titleClassName?: string;
}

export function CaseTitle({
  title,
  className,
  titleClassName,
}: CaseTitleProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <h1
        className={cn('text-2xl font-semibold leading-tight', titleClassName)}
      >
        {title || 'Untitled case'}
      </h1>
    </div>
  );
}
