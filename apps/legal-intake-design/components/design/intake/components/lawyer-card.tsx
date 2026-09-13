'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Muted } from '@/components/design/design-system/typography';
import type { Lawyer } from '../intake-types';

type LawyerCardProps = {
  lawyer: Lawyer;
  variant?: 'full' | 'compact';
  eyebrow?: string;
};

export function LawyerCard({
  lawyer,
  variant = 'full',
  eyebrow,
}: LawyerCardProps) {
  const compact = variant === 'compact';

  return (
    <Card>
      <CardContent className={cn('space-y-3', compact && 'space-y-2')}>
        {eyebrow ? (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <Avatar className={cn(compact ? 'h-10 w-10' : 'h-12 w-12')}>
            <AvatarImage src={lawyer.imageUrl} alt={lawyer.name} />
            <AvatarFallback>{lawyer.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-sm font-semibold">{lawyer.name}</div>
            <div className="text-muted-foreground text-xs">{lawyer.title}</div>
          </div>
        </div>
        {!compact ? (
          <>
            <Muted>{lawyer.bio}</Muted>
            <div className="flex flex-wrap gap-1.5">
              {lawyer.credentials.map((credential) => (
                <Badge key={credential} variant="secondary">
                  {credential}
                </Badge>
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
