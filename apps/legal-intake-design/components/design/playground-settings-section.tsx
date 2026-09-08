'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { Label } from '@repo/ui/components/label';
import { usePlayground } from '@/components/playground/role-context';
import {
  H4,
  InlineCode,
  Muted,
} from '@/components/design/design-system/typography';
import type { Role } from '@/lib/types';
import { FeatureFlagsList } from './feature-flags/feature-flags-list';
import { OpenAiKeySetting } from './intake/components/openai-key-setting';

const ROLES: { value: Role; label: string }[] = [
  { value: 'NON_LEGAL', label: 'Client' },
  { value: 'LEGAL', label: 'Lawyer' },
  { value: 'INTERNAL_ADMIN', label: 'Admin' },
  { value: 'INTERNAL_ASSISTANT', label: 'Assistant' },
];

const ROLE_HOMES: Record<Role, string> = {
  NON_LEGAL: '/client',
  LEGAL: '/legal',
  INTERNAL_ADMIN: '/admin',
  INTERNAL_ASSISTANT: '/user',
};

type PlaygroundSettingsSectionProps = {
  hideHeader?: boolean;
};

export function PlaygroundSettingsSection({
  hideHeader = false,
}: PlaygroundSettingsSectionProps = {}) {
  const { role, setRole } = usePlayground();

  const handleRoleChange = (next: string) => {
    const nextRole = next as Role;
    setRole(nextRole);
    // Full navigation (not router.push) so the server re-resolves the mock user
    // from the freshly written cookie. This guarantees the whole app reflects
    // the new persona immediately, without needing a manual page refresh.
    window.location.assign(ROLE_HOMES[nextRole]);
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <H4 asChild>
            <h2>Design playground</h2>
          </H4>
          <Muted>
            Controls that exist only inside this app, never in production. Use
            them to preview the experience across roles and to toggle
            in-progress design proposals.
          </Muted>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="design-playground-role" className="text-sm font-medium">
          Role
        </Label>
        <Muted>
          Switches the mock user. Changing this redirects to the new role&apos;s
          home so role-scoped routes resolve.
        </Muted>
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger
            id="design-playground-role"
            className="w-full max-w-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="text-base font-medium">Feature flags</h3>
          <Muted>
            Toggle proposed design iterations. Changes persist across reloads
            via <InlineCode>localStorage</InlineCode>.
          </Muted>
        </div>
        <FeatureFlagsList />
      </div>

      <OpenAiKeySetting />
    </div>
  );
}
