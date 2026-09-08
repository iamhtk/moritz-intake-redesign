import { Check, FileText, CreditCard, User, Scale } from '@repo/ui/icons';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/design/design-system/button';
import {
  Heading,
  Subheading,
} from '@/components/design/foundations/components/heading';
import { Text } from '@/components/design/foundations/components/text';
import { CaseConfirmationCheck } from '@/components/cases/case-confirmation-check';
import { Link } from '@/i18n/navigation';

interface CaseConfirmationProps {
  /** Created case id, used to deep-link into the case detail view. */
  caseId?: string;
}

export default async function CaseConfirmation({
  caseId,
}: CaseConfirmationProps) {
  const t = await getTranslations('cases.confirmation');
  const detailHref = caseId ? `/client/cases/${caseId}` : '/client/cases';

  return (
    <div className="mz-animate-step mx-auto flex w-full max-w-md flex-col items-center gap-12 text-center sm:gap-14">
      <div className="flex flex-col items-center gap-4">
        <CaseConfirmationCheck />
        <Heading level={2}>{t('successTitle')}</Heading>
        <Text className="text-balance">{t('successDescription')}</Text>
      </div>

      <div className="w-full text-left">
        <Subheading variant="sans" level={2} className="mb-6">
          {t('whatHappensNext')}
        </Subheading>

        <ol className="space-y-0">
          {/* Step 1: Submit case (done) */}
          <li className="relative flex gap-4 pb-8">
            <span
              aria-hidden="true"
              className="bg-success/30 absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px"
            />
            <span className="bg-success z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-white">
              <Check className="size-3.5" />
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <FileText className="text-muted-foreground size-4" />
              <span className="text-base/6 font-medium sm:text-sm/6">
                {t('steps.submit.title')}
              </span>
            </div>
          </li>

          {/* Step 2: Payment */}
          <li className="relative flex gap-4 pb-8">
            <span
              aria-hidden="true"
              className="bg-border absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px"
            />
            <span className="border-border bg-background z-10 size-6 shrink-0 rounded-full border" />
            <div className="flex items-center gap-2 pt-0.5">
              <CreditCard className="text-muted-foreground size-4" />
              <span className="text-base/6 font-medium sm:text-sm/6">
                {t('steps.payment.title')}
              </span>
            </div>
          </li>

          {/* Step 3: Assigning Lawyer */}
          <li className="relative flex gap-4 pb-8">
            <span
              aria-hidden="true"
              className="bg-border absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px"
            />
            <span className="border-border bg-background z-10 size-6 shrink-0 rounded-full border" />
            <div className="flex items-center gap-2 pt-0.5">
              <User className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-base/6 font-medium sm:text-sm/6">
                {t('steps.assignment.title')}
              </span>
            </div>
          </li>

          {/* Step 4: Legal Review */}
          <li className="relative flex gap-4">
            <span className="border-border bg-background z-10 size-6 shrink-0 rounded-full border" />
            <div className="flex items-center gap-2 pt-0.5">
              <Scale className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-base/6 font-medium sm:text-sm/6">
                {t('steps.review.title')}
              </span>
            </div>
          </li>
        </ol>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button asChild className="w-full">
          <Link href={detailHref}>{t('seeDetails')}</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-full"
        >
          <Link href="/client/cases">{t('goToCases')}</Link>
        </Button>
      </div>
    </div>
  );
}
