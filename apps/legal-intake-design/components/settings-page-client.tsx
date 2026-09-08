'use client';

import type { RegistrationState } from './registration-types';
import { SettingsPageContent } from './settings-page-content';

type SettingsPageProps = {
  refreshPath?: string;
  initialData: { registration: RegistrationState };
};

/**
 * Thin client wrapper. In production this hydrates from
 * `trpc.registration.onboardingState.useQuery`; in the playground the
 * registration state is built server-side from the mock user and passed in as
 * `initialData`, so there's no query to subscribe to.
 */
export default function SettingsPage({
  refreshPath,
  initialData,
}: SettingsPageProps) {
  return (
    <SettingsPageContent
      {...initialData.registration}
      refreshPath={refreshPath}
      updateCompany={true}
    />
  );
}
