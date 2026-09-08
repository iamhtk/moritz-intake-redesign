'use client';

import * as React from 'react';

import { Switch } from '@/components/design/foundations/components/switch';

/**
 * Stateful switch demo used by the foundation showcase page. This lives in a
 * client component because it tracks the checked state with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledSwitchExample() {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="Toggle setting"
      />
      <span className="text-muted-foreground text-sm">
        {checked ? 'On' : 'Off'}
      </span>
    </div>
  );
}
