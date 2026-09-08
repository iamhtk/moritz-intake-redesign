import { AlertCircle } from '@repo/ui/icons';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@repo/ui/components/banner';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { H3, InlineCode } from '@/components/design/design-system/typography';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignInErrorPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = typeof sp.error === 'string' ? sp.error : 'Unknown';
  const supportCode = typeof sp.code === 'string' ? sp.code : null;

  return (
    <main className="container mx-auto flex justify-center px-4 pt-32">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-8 w-8" />
        </div>
        <H3 asChild>
          <h1>Sign-in failed</h1>
        </H3>
        <Banner variant="destructive" className="text-left">
          <BannerTitle>We couldn&apos;t sign you in</BannerTitle>
          <BannerDescription>
            Error code: <InlineCode>{error}</InlineCode>
          </BannerDescription>
        </Banner>
        {supportCode && (
          <p className="text-muted-foreground text-xs">
            Support code: <InlineCode>{supportCode}</InlineCode>
          </p>
        )}
        <Button asChild>
          <Link href="/sign-in">Back to sign-in</Link>
        </Button>
      </div>
    </main>
  );
}
