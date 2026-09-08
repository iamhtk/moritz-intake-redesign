import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  companyTypeToPath,
  getMockUser,
} from '@/components/playground/auth-stubs';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getMockUser();
  const path = companyTypeToPath(user.company.type);
  redirect({ href: `/${path}`, locale });
}
