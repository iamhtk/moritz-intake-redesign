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
import { Files } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';

export async function CreateCaseCard() {
  const t = await getTranslations('dashboard.client');

  return (
    <Card className="h-full w-80">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-40 w-40 justify-center">
          <img src="/new-case.svg" alt="new case" width="100%" height="100%" />
        </div>
        <CardTitle className="text-lg">{t('createCard.title')}</CardTitle>
        <CardDescription className="min-h-10 text-base">
          {t('createCard.description')}
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="flex-col items-start gap-2">
        <Button asChild>
          <Link href="/client/new">
            <Files />
            {t('createCard.cta')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
