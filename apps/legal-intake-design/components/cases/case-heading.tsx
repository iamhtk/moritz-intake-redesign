import { H4 } from '@/components/design/design-system/typography';

interface CaseHeadingProps {
  caseNumber: string | null;
  title: string | null;
  className?: string;
}

export function CaseHeading({
  caseNumber,
  title,
  className,
}: CaseHeadingProps) {
  return (
    <H4 asChild className={className}>
      <h1>
        {caseNumber && (
          <>
            <span className="font-medium">{caseNumber}</span>{' '}
          </>
        )}
        {title}
      </h1>
    </H4>
  );
}
