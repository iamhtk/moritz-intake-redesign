'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Field, FieldError, FieldLabel } from '@repo/ui/components/field';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';

// Playground-only gate. Submits the password to /api/gate, which verifies it
// server-side and sets the unlock cookie; on success we refresh so the server
// layout re-reads the cookie and renders the app.
export function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }
    } catch {
      // fall through to error state
    }

    setError(true);
    setPassword('');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Moritz Design Playground</CardTitle>
          <CardDescription>
            Enter the password to access the playground.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <Field data-invalid={error || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error || undefined}
                disabled={submitting}
              />
              {error && <FieldError>Incorrect password.</FieldError>}
            </Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
