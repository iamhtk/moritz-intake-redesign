'use client';

import * as React from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import { Button } from '@/components/design/foundations/components/button';

/**
 * Stateful tabs demo used by the foundation showcase page. Lives in a client
 * component because it drives the active tab with React state (value /
 * onValueChange), while the showcase page itself stays a server component.
 */

const TABS = ['overview', 'activity', 'settings'] as const;
type TabValue = (typeof TABS)[number];

export function ControlledTabsExample() {
  const [value, setValue] = React.useState<TabValue>('overview');

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={value === tab ? 'default' : 'outline'}
            onClick={() => setValue(tab)}
          >
            Go to {tab}
          </Button>
        ))}
      </div>

      <Tabs value={value} onValueChange={(next) => setValue(next as TabValue)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          className="text-muted-foreground mt-4 text-sm"
        >
          The active tab is driven from React state, so the buttons above and
          the tab list stay in sync.
        </TabsContent>
        <TabsContent
          value="activity"
          className="text-muted-foreground mt-4 text-sm"
        >
          Activity feed would render here.
        </TabsContent>
        <TabsContent
          value="settings"
          className="text-muted-foreground mt-4 text-sm"
        >
          Settings form would render here.
        </TabsContent>
      </Tabs>
    </div>
  );
}
