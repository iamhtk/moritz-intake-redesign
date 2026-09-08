import { SignInPage } from '@/components/sign-in-page';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = typeof sp.error === 'string' ? sp.error : null;
  return <SignInPage error={error} />;
}
