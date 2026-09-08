import { LegalHomepage } from '@/components/design/legal-homepage/legal-homepage';
import { getMockUser } from '@/components/playground/auth-stubs';

export default async function LegalHome() {
  const user = await getMockUser();

  return (
    <LegalHomepage
      userName={user.display_name || user.name}
      firmName={user.company.name}
      firmCompanyId={user.company.id}
    />
  );
}
