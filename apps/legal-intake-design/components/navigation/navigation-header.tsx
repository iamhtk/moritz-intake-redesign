'use client';

import { Button } from '@/components/design/design-system/button';

import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { NavigationCollapseButton } from './navigation-collapse-button';
import { useNavigation } from './navigation-context';
import { NotificationBellLink } from '../notifications/notification-bell-link';
import { Menu, X } from '@repo/ui/icons';
import { useTranslations } from 'next-intl';

type Props = {
  collapseLabel: string;
  expandLabel: string;
};

export function NavigationHeader({ collapseLabel, expandLabel }: Props) {
  const { isCollapsed, toggleMobileOpen, isMobileOpen } = useNavigation();
  const t = useTranslations('navigation');

  return (
    <div className="-mx-4 flex flex-wrap justify-between gap-4 border-b px-4 max-sm:pb-3 sm:mx-0 sm:mb-4 sm:border-b-0 sm:px-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileOpen}
          aria-label={isMobileOpen ? t('closeMenu') : t('openMenu')}
          className="hover:bg-muted-foreground/10 rounded-lg sm:hidden"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>

        <Link href="/">
          <img
            src="/icon.svg"
            alt="Moritz"
            width="32"
            className={isCollapsed ? 'hidden sm:block' : 'hidden'}
          />
          <span className={isCollapsed ? 'sm:hidden' : undefined}>
            <Logo />
          </span>
        </Link>
      </div>

      <div className="sm:hidden">
        <NotificationBellLink />
      </div>

      <div className="hidden sm:block">
        <NavigationCollapseButton
          collapseLabel={collapseLabel}
          expandLabel={expandLabel}
        />
      </div>
    </div>
  );
}
