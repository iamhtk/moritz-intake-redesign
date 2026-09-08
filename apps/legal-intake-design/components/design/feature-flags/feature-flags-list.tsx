'use client';

import { Button } from '@/components/design/design-system/button';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@/components/design/design-system/switch';
import {
  InlineCode,
  Muted,
} from '@/components/design/design-system/typography';
import { DESIGN_FLAGS } from './design-flags-registry';
import { useDesignFlags } from './design-flags-context';

export function FeatureFlagsList() {
  const { flags, setFlag, resetAll } = useDesignFlags();

  if (DESIGN_FLAGS.length === 0) {
    return (
      <div className="border-muted-foreground/30 text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        <p className="font-medium">No design feature flags registered yet.</p>
        <p className="mt-1">
          Add an entry to{' '}
          <InlineCode className="text-xs">
            components/design/feature-flags/design-flags-registry.ts
          </InlineCode>{' '}
          to surface a toggle here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-md border">
        {DESIGN_FLAGS.map((flag) => {
          const checked = flags[flag.key] ?? flag.defaultValue;
          const id = `design-flag-${flag.key}`;
          return (
            <li
              key={flag.key}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="space-y-1">
                <Label htmlFor={id} className="text-sm font-medium">
                  {flag.label}
                </Label>
                <Muted>{flag.description}</Muted>
              </div>
              <Switch
                id={id}
                checked={checked}
                onCheckedChange={(value) => setFlag(flag.key, value)}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={resetAll}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
