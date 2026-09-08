'use client';

import * as React from 'react';
import { Italic } from '@repo/ui/icons';

import { Toggle } from '@/components/design/foundations/components/toggle';

/**
 * Stateful toggle demos used by the foundation showcase page. These live in a
 * client component because they track the pressed state with React state, while
 * the showcase page itself stays a server component.
 */

export function ControlledToggleExample() {
  const [pressed, setPressed] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <Toggle
        variant="outline"
        pressed={pressed}
        onPressedChange={setPressed}
        aria-label="Toggle italic"
      >
        <Italic aria-hidden="true" />
        Italic
      </Toggle>
      <span className="text-muted-foreground text-sm">
        {pressed ? 'On' : 'Off'}
      </span>
    </div>
  );
}
