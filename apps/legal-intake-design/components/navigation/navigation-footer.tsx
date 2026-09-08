'use client';

import type { AuthUser } from '@/lib/types';
import { cn } from '@repo/ui/lib/utils';
import { useNavigation } from './navigation-context';
import { useTranslations } from 'next-intl';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@repo/ui/components/avatar';
import { getInitials } from '@/lib/utils';
import { LogOut } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { toast } from 'sonner';

type Props = {
  user: AuthUser;
};

export function NavigationFooter({ user }: Props) {
  const { isCollapsed, isMobileOpen } = useNavigation();
  const t = useTranslations('common');

  const handleSignOut = () => {
    toast.info('Sign-out is mocked in the design playground.');
  };

  return (
    <div
      className={cn(
        'mt-auto hidden border-t pb-4 pt-4 sm:block',
        isCollapsed && 'sm:flex sm:flex-col sm:items-center sm:gap-4',
        isMobileOpen && 'block',
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image || undefined} alt={user.display_name} />
          <AvatarFallback className="sm:bg-background bg-muted">
            {getInitials(user.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className={cn('min-w-0 flex-1', isCollapsed && 'sm:hidden')}>
          <div className="mt-2 truncate text-lg font-medium">
            {user.display_name}
          </div>
          <div className="truncate text-sm">{user.company?.name}</div>
        </div>
      </div>

      <Tooltip open={isCollapsed ? undefined : false}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            aria-label={t('signOut')}
            className={cn(
              'hover:bg-muted-foreground/10 mt-6 w-full justify-start rounded-lg',
              isCollapsed && 'sm:mt-0 sm:size-9 sm:justify-center sm:p-0',
            )}
          >
            <LogOut size={16} />
            <span className={cn(isCollapsed && 'sm:hidden')}>
              {t('signOut')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="hidden sm:block">
          {t('signOut')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
