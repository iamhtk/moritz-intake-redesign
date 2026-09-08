'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/design/design-system/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';

export default function ArchiveMyCompanyButton() {
  const [open, setOpen] = useState(false);
  const [confirmAccess, setConfirmAccess] = useState(false);
  const [confirmMatters, setConfirmMatters] = useState(false);
  const [confirmRetention, setConfirmRetention] = useState(false);
  const [isPending, startTransition] = useTransition();

  const t = useTranslations('registration.sections.company.archive');
  const common = useTranslations('common');
  const router = useRouter();

  const allConfirmed = confirmAccess && confirmMatters && confirmRetention;

  const resetCheckboxes = () => {
    setConfirmAccess(false);
    setConfirmMatters(false);
    setConfirmRetention(false);
  };

  const handleConfirm = useCallback(() => {
    if (!allConfirmed) return;
    startTransition(() => {
      setTimeout(() => {
        toast.success(common('success.title'), {
          description: t('success'),
        });
        setOpen(false);
        resetCheckboxes();
        router.push('/');
      }, 500);
    });
  }, [allConfirmed, common, router, t]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetCheckboxes();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? t('deleting') : t('label')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('title')}</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-access"
              checked={confirmAccess}
              onCheckedChange={(checked) => setConfirmAccess(checked === true)}
              disabled={isPending}
              className="mt-0.5"
            />
            <Label
              htmlFor="confirm-access"
              className="cursor-pointer text-sm font-normal leading-relaxed"
            >
              {t('confirmAccess')}
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-matters"
              checked={confirmMatters}
              onCheckedChange={(checked) => setConfirmMatters(checked === true)}
              disabled={isPending}
              className="mt-0.5"
            />
            <Label
              htmlFor="confirm-matters"
              className="cursor-pointer text-sm font-normal leading-relaxed"
            >
              {t('confirmMatters')}
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirm-retention"
              checked={confirmRetention}
              onCheckedChange={(checked) =>
                setConfirmRetention(checked === true)
              }
              disabled={isPending}
              className="mt-0.5"
            />
            <Label
              htmlFor="confirm-retention"
              className="cursor-pointer text-sm font-normal leading-relaxed"
            >
              {t('confirmRetention')}
            </Label>
          </div>
        </div>

        <div className="text-muted-foreground border-t pt-4 text-sm">
          {t('teamWarning')}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !allConfirmed}
          >
            {isPending ? t('deleting') : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
