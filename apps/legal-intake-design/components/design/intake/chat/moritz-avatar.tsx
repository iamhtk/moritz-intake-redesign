import {
  Avatar,
  AvatarFallback,
} from '@/components/design/foundations/components/avatar';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { cn } from '@repo/ui/lib/utils';

/**
 * Small Moritz avatar shown beside assistant turns and the typing indicator.
 * The bare Moritz logo — the "M" mark inside its original ring — drawn in black
 * on no background, so the mark's own ring reads as the medallion. The mark is
 * inset a touch below the avatar footprint so its ring keeps a little breathing
 * room instead of touching (and appearing cropped at) the top edge.
 */
export function MoritzAvatar({ className }: { className?: string }) {
  return (
    <Avatar size="sm" className={cn('size-7 outline-none', className)}>
      <AvatarFallback className="text-foreground bg-transparent">
        <MoritzSymbol className="size-6" />
      </AvatarFallback>
    </Avatar>
  );
}
