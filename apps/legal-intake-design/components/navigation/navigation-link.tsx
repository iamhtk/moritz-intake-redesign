'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useNavigation } from './navigation-context';
import {
  FileText,
  Upload,
  MessageCircle,
  Settings,
  CheckCircle,
  Briefcase,
  Building2,
  ShieldCheck,
  FilePlus,
  Home,
  Clock,
  Users,
  Files,
  FlaskConical,
  Earth,
  Scale,
  BookText,
  Table2,
} from '@repo/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { cn } from '@repo/ui/lib/utils';

const iconMap = {
  briefcase: Briefcase,
  upload: Upload,
  'message-circle': MessageCircle,
  'file-template': MessageCircle,
  settings: Settings,
  'check-circle': CheckCircle,
  'file-text': FileText,
  'building-2': Building2,
  'shield-check': ShieldCheck,
  'file-plus': FilePlus,
  home: Home,
  clock: Clock,
  users: Users,
  files: Files,
  flask: FlaskConical,
  earth: Earth,
  scale: Scale,
  'book-text': BookText,
  table: Table2,
};

type NavigationLinkProps = {
  label: string;
  iconName?: keyof typeof iconMap;
  customIcon?: React.ReactNode;
  exact?: boolean;
  activePrefix?: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export default function NavigationLink({
  href,
  label,
  iconName,
  customIcon,
  exact,
  activePrefix,
  onClick,
}: NavigationLinkProps) {
  const pathname = usePathname();
  const { isCollapsed } = useNavigation();
  const isActive =
    href &&
    (activePrefix
      ? pathname.startsWith(activePrefix)
      : exact
        ? pathname === href
        : pathname.startsWith(href));
  const Icon = iconName ? iconMap[iconName] : undefined;

  const sharedClassName = cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer',
    isCollapsed && 'sm:justify-center sm:gap-0',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-foreground hover:bg-muted-foreground/10 hover:text-foreground',
  );

  const innerContent = (
    <>
      {customIcon
        ? customIcon
        : Icon && <Icon size={20} className="shrink-0" />}
      <span className={cn('text-lg sm:text-sm', isCollapsed && 'sm:hidden')}>
        {label}
      </span>
    </>
  );

  const linkContent = onClick ? (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {innerContent}
    </button>
  ) : (
    <Link href={href} className={sharedClassName}>
      {innerContent}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="hidden sm:block">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
