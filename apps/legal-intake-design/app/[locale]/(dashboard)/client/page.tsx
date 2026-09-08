import { HomepageV2 } from '@/components/design/homepage-v2/homepage-v2';
import { getMockUser } from '@/components/playground/auth-stubs';

export default async function ClientDashboard() {
  const user = await getMockUser();

  return <HomepageV2 userName={user.display_name || user.name} />;
}
