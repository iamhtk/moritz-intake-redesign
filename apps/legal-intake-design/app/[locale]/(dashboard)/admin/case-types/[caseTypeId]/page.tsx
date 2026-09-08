import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { ArrowLeft, Plus } from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import {
  Large,
  Muted,
  Small,
} from '@/components/design/design-system/typography';
import {
  getCaseTypeById,
  getTemplatesForCaseType,
} from '@/lib/mocks/case-types';

interface PageProps {
  params: Promise<{ caseTypeId: string }>;
}

export default async function CaseTypeDetailPage({ params }: PageProps) {
  const { caseTypeId } = await params;
  const caseType = getCaseTypeById(caseTypeId);
  if (!caseType) notFound();
  const templates = getTemplatesForCaseType(caseType.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/admin/case-types">
          <ArrowLeft className="h-4 w-4" /> Back to case types
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{caseType.name}</CardTitle>
          <CardDescription>{caseType.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Small asChild className="font-semibold">
            <h3>Required information</h3>
          </Small>
          <ul className="text-muted-foreground list-inside list-disc text-sm">
            {caseType.requiredInformation.map((ri) => (
              <li key={ri}>{ri}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Large asChild>
          <h2>Templates</h2>
        </Large>
        <Button asChild>
          <Link
            href={`/admin/case-types/${caseType.id}/templates/new`}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New template
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.length === 0 ? (
          <Muted>No templates yet.</Muted>
        ) : (
          templates.map((t) => (
            <Link
              key={t.id}
              href={`/admin/case-types/${caseType.id}/templates/${t.id}`}
              className="block"
            >
              <Card className="hover:bg-accent/40 h-full transition">
                <CardHeader>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-xs">
                  Updated <FormattedDate date={t.updatedAt} />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
