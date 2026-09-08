import { getMockUser } from '@/components/playground/auth-stubs';
import { DashboardShell } from '@/components/navigation/dashboard-shell';
import { buildMockRegistrationState } from '@/lib/mocks/registration-state';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getMockUser();
  const registration = buildMockRegistrationState(user);

  return (
    <DashboardShell user={user} registration={registration}>
      {children}
    </DashboardShell>
  );
}
