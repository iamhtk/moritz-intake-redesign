'use client';

import { type ReactNode } from 'react';
import { useNavigation } from './navigation-context';
import { cn } from '@repo/ui/lib/utils';

type NavigationWrapperProps = {
  children: ReactNode;
};

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const { isCollapsed } = useNavigation();

  return (
    <div
      className={cn(
        'sm:bg-muted bg-background w-full',
        isCollapsed ? 'sm:w-16' : 'sm:w-[200px]',
      )}
    >
      {children}
    </div>
  );
}
