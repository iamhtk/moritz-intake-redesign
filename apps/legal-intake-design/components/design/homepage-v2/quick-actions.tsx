import { getTranslations } from 'next-intl/server';
import { Chip } from '@/components/design/foundations/components/chip';
import { Calendar, Folder } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import { EmailCaseChip } from './email-case-chip';
import { IroncladCaseChip } from './ironclad-case-chip';

const BOOK_A_CALL_URL = 'https://cal.com/marissa-chung/moritz20min';

export async function QuickActions() {
  const t = await getTranslations('dashboard.client.homepageV2.quickActions');

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Chip asChild>
        <Link href="/client/cases">
          <Folder aria-hidden="true" />
          {t('browseCases')}
        </Link>
      </Chip>
      <EmailCaseChip />
      <Chip asChild>
        <a href={BOOK_A_CALL_URL} target="_blank" rel="noopener noreferrer">
          <Calendar aria-hidden="true" />
          {t('scheduleMeeting')}
        </a>
      </Chip>
      <IroncladCaseChip />
    </div>
  );
}
