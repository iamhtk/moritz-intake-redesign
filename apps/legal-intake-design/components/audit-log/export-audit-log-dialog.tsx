'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/design/design-system/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@/components/design/design-system/input';
import { Label } from '@repo/ui/components/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type Props = {
  userEmail: string;
};

export function ExportAuditLogDialog({ userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(userEmail);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('auditLog.exportDialog');

  const handleSubmit = () => {
    startTransition(() => {
      setTimeout(() => {
        toast.success(t('success'));
        setOpen(false);
      }, 400);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('trigger')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-2">
          <Label htmlFor="export-email">{t('emailLabel')}</Label>
          <Input
            id="export-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || !email}>
            {isPending ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
