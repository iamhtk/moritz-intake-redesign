import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Calendar } from '@repo/ui/icons';

export async function MeetingCard() {
  const t = await getTranslations('dashboard.client');

  return (
    <Card className="h-full w-80">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-40 w-40">
          <img
            src="/schedule-meeting.svg"
            alt="Schedule meeting"
            width="100%"
            height="100%"
          />
        </div>
        <CardTitle className="text-lg">{t('meetingCard.title')}</CardTitle>
        <CardDescription className="min-h-10 text-base">
          {t('meetingCard.description')}
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="flex-col items-start gap-2">
        <Button asChild>
          <a
            href="https://moritz.legal/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Calendar />
            {t('meetingCard.cta')}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
