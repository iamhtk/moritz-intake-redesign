'use client';

import { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@repo/ui/components/input-otp';
import { Button } from '@/components/design/design-system/button';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';

export function OtpVerifyForm() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length !== 6) return;
    toast.success('OTP accepted (mock). Redirecting…');
    setTimeout(() => router.push('/'), 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <Button type="submit" className="w-full" disabled={value.length !== 6}>
        Verify
      </Button>
    </form>
  );
}
