import type { Metadata } from 'next';
import { CheckCircle, AlertCircle, Mail } from '@repo/ui/icons';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { H4, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Verify your email' };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { status } = await searchParams;

  if (status === 'verified') {
    return (
      <CenteredCard
        icon={<CheckCircle className="text-success h-12 w-12" />}
        heading="Email verified"
        description="Thanks — your email is confirmed. You can continue using Moritz."
        actionHref="/"
        actionLabel="Continue"
      />
    );
  }

  if (status === 'invalid' || status === 'expired') {
    return (
      <CenteredCard
        icon={<AlertCircle className="text-destructive h-12 w-12" />}
        heading={status === 'expired' ? 'Link expired' : 'Invalid link'}
        description="Request a new verification email and try again."
        actionHref="/verify-email"
        actionLabel="Resend email"
      />
    );
  }

  if (status === 'sent') {
    return (
      <CenteredCard
        icon={<Mail className="text-info h-12 w-12" />}
        heading="Check your inbox"
        description="We just sent you a new link. It may take a moment to arrive."
        actionHref="/"
        actionLabel="Back to home"
      />
    );
  }

  return (
    <CenteredCard
      icon={<Mail className="text-info h-12 w-12" />}
      heading="Verify your email"
      description="To finish setting up your account, please verify your email address."
      actionHref="/verify-email?status=sent"
      actionLabel="Resend verification email"
    />
  );
}

function CenteredCard({
  icon,
  heading,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  heading: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {icon}
          <H4 asChild>
            <h1>{heading}</h1>
          </H4>
          <Muted>{description}</Muted>
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
