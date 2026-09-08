import { Link } from '@/i18n/navigation';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Badge } from '@repo/ui/components/badge';
import { Plus } from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import { H3, Muted } from '@/components/design/design-system/typography';
import { MOCK_CASE_TYPES } from '@/lib/mocks/case-types';

export default function AdminCaseTypesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H3 asChild>
            <h1>Case types</h1>
          </H3>
          <Muted>
            Templates and required information for each kind of case.
          </Muted>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New case type
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_CASE_TYPES.map((ct) => (
          <Link
            key={ct.id}
            href={`/admin/case-types/${ct.id}`}
            className="block"
          >
            <Card className="hover:bg-accent/40 h-full transition">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{ct.name}</CardTitle>
                  <Badge variant="secondary">
                    {ct.templateCount} templates
                  </Badge>
                </div>
                <CardDescription>{ct.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                Updated <FormattedDate date={ct.updatedAt} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
