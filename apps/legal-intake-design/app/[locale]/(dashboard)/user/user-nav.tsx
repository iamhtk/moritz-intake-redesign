'use client';

import { Button } from '@/components/design/design-system/button';
import {
  User,
  Building,
  Users,
  Bell,
  ShieldCheck,
  Activity,
  FlaskConical,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRuntimeConfig } from '@/components/runtime-config-context';

type UserNavProps = {
  isCompanyOwner: boolean;
  hasCompany: boolean;
};

export function UserNav({ isCompanyOwner, hasCompany }: UserNavProps) {
  const [activeFragment, setActiveFragment] = useState<string>('#personal');
  const tReg = useTranslations('registration.sections');
  const tTeam = useTranslations('registration.team');
  const tSec = useTranslations('settings.security');
  const tActivity = useTranslations('settings.activity');
  const { authProviders, featureFlags } = useRuntimeConfig();

  const navItems = [
    {
      href: '#personal',
      icon: User,
      label: tReg('yourDetails'),
    },
    {
      href: '#company',
      icon: Building,
      label: tReg('companyDetails'),
    },
    {
      href: '#team',
      icon: Users,
      label: tTeam('title'),
    },
    {
      href: '#notifications',
      icon: Bell,
      label: tReg('notificationsShort'),
    },
    ...(authProviders.passkey
      ? [
          {
            href: '#security',
            icon: ShieldCheck,
            label: tSec('navLabel'),
          },
        ]
      : []),
    ...(featureFlags.auditLogExport && isCompanyOwner && hasCompany
      ? [
          {
            href: '#audit-log-export',
            icon: Activity,
            label: tActivity('auditLogNavLabel'),
          },
        ]
      : []),
    {
      href: '#design-playground',
      icon: FlaskConical,
      label: 'Design playground',
    },
  ];

  return (
    <nav className="flex flex-col gap-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeFragment === item.href;

        return (
          <Button
            key={item.href}
            variant="link"
            className={cn('justify-start', {
              'bg-muted': isActive,
            })}
            asChild
          >
            <a href={item.href} onClick={() => setActiveFragment(item.href)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          </Button>
        );
      })}
    </nav>
  );
}
