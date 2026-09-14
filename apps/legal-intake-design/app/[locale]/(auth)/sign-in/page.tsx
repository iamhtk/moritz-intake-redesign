import type { Metadata } from 'next';
import { SignInPage } from '@/components/sign-in-page';

export const metadata: Metadata = { title: 'Sign in' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = typeof sp.error === 'string' ? sp.error : null;
  return <SignInPage error={error} />;
}
