import type { Metadata } from 'next';
import { getMockUser } from '@/components/playground/auth-stubs';
import { OnboardingWalkthrough } from '@/components/design/onboarding/onboarding-walkthrough';

export const metadata: Metadata = {
  title: 'User onboarding',
};

export default async function OnboardingPage() {
  const user = await getMockUser();

  return (
    <OnboardingWalkthrough
      userName={user.name}
      userEmail={user.email}
      companyName={user.company.name}
      userImage={user.image}
    />
  );
}
