import SettingsPage from '@/components/settings-page-client';
import { getMockUser } from '@/components/playground/auth-stubs';
import { buildMockRegistrationState } from '@/lib/mocks/registration-state';

export default async function UserSettingsPage() {
  const user = await getMockUser();
  const registration = buildMockRegistrationState(user);
  return <SettingsPage initialData={{ registration }} />;
}
