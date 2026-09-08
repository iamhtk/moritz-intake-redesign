import { OtpVerifyForm } from '@/components/auth/otp-verify-form';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function SignInVerifyPage() {
  return (
    <main className="container mx-auto flex justify-center px-4 pt-32">
      <div className="w-full max-w-md space-y-4">
        <H3 asChild>
          <h1>Enter the code we sent you</h1>
        </H3>
        <Muted>
          We sent a six-digit code to your email. Enter it below to sign in.
        </Muted>
        <OtpVerifyForm />
        <p className="text-muted-foreground text-center text-xs">
          Did not receive a code?{' '}
          <button className="underline" type="button">
            Resend
          </button>
        </p>
      </div>
    </main>
  );
}
