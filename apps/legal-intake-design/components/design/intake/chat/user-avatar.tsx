import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@repo/ui/lib/utils';

/**
 * Small avatar for the person in the chat (the client). Defaults to the shared
 * playground portrait used by the top-nav account menu so the chat reads as the
 * same signed-in user, with initials as the fallback. Grayscaled to keep the
 * conversation calm and consistent with the nav treatment.
 */
const DEFAULT_USER_IMAGE = '/onboarding-lawyers/sofia-marchetti.jpg';

export function UserAvatar({
  name = 'You',
  src = DEFAULT_USER_IMAGE,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  return (
    <Avatar size="sm" className={cn('size-7 grayscale', className)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
