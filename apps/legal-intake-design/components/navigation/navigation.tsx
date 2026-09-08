import NavigationContent from './navigation-content';
import { NavigationWrapper } from './navigation-wrapper';
import type { AuthUser, CompanyType } from '@/lib/types';

const urlMapping: Record<CompanyType, string> = {
  INTERNAL_ADMIN: '/admin',
  INTERNAL_ASSISTANT: '/user',
  LEGAL: '/legal',
  NON_LEGAL: '/client',
};

type Props = {
  user: AuthUser;
};

export default function Navigation({ user }: Props) {
  const type = user.company?.type;
  if (!type) {
    throw new Error('User is not associated with a company');
  }

  const homePath = urlMapping[type];

  return (
    <NavigationWrapper>
      <NavigationContent companyType={type} homePath={homePath} user={user} />
    </NavigationWrapper>
  );
}
