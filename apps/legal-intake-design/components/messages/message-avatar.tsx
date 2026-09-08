import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { actorColorClass, getInitials } from '@/lib/utils';
import type { ParticipantRef } from '@/lib/types';
import { cn } from '@repo/ui/lib/utils';

type Props = {
  participant: ParticipantRef;
  className?: string;
};

export function MessageAvatar({ participant, className }: Props) {
  // The intake AI turns render as the bare Moritz mark (no photo/initials), so
  // the chatbot reads distinctly from human counsel/ops in the transcript.
  if (participant.actor === 'ai') {
    return (
      <Avatar className={cn('h-8 w-8', className)}>
        <AvatarFallback className="text-foreground bg-transparent">
          <MoritzSymbol className="size-[85%]" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      {/* TODO(@repo/ui): AvatarImage should include `object-cover` by default so
          non-square source photos aren't stretched. */}
      <AvatarImage
        src={participant.image ?? undefined}
        alt={participant.name}
        className="object-cover"
      />
      <AvatarFallback
        className={cn(
          'text-[10px] font-medium',
          actorColorClass(participant.actor),
        )}
      >
        {getInitials(participant.name)}
      </AvatarFallback>
    </Avatar>
  );
}
