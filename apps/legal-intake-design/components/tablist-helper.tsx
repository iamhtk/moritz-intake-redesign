'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { cn } from '@repo/ui/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

const TAB_QUERY_PARAM = 'tab';

type ItemProps = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  isFillHeight?: boolean;
  children: ReactNode;
};

export function TablistHelperItem({ children }: ItemProps) {
  return <>{children}</>;
}

type Props = {
  children: ReactNode;
  defaultTab?: string;
  className?: string;
  isPreserveTabState?: boolean;
};

export function TablistHelper({
  children,
  defaultTab,
  className,
  isPreserveTabState = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<ItemProps> => isValidElement(child),
  );

  if (tabs.length === 0) {
    console.warn('No tabs provided to TablistHelper');
    return null;
  }

  const fallback = defaultTab ?? tabs[0]!.props.id;
  const requestedTab = searchParams.get(TAB_QUERY_PARAM);
  const activeTab = tabs.some((t) => t.props.id === requestedTab)
    ? requestedTab!
    : fallback;

  const isActiveFillHeight = tabs.find((t) => t.props.id === activeTab)?.props
    .isFillHeight;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(TAB_QUERY_PARAM, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleChange}
      className={isActiveFillHeight ? 'h-full min-h-0' : undefined}
    >
      <TabsList className={`sticky top-0 z-10 ${className ?? ''}`}>
        {tabs.map(({ props: { id, label, icon } }) => (
          <TabsTrigger key={id} value={id}>
            {icon && <span>{icon}</span>}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ props: { id, children } }) => (
        <TabsContent
          key={id}
          value={id}
          forceMount={isPreserveTabState ? true : undefined}
          className={cn(
            'mt-4 min-h-0',
            isPreserveTabState && 'data-[state=inactive]:hidden',
          )}
        >
          {children}
        </TabsContent>
      ))}
    </Tabs>
  );
}
