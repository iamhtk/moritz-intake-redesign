import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { CreateEnterpriseForm } from '@/components/companies/create-enterprise-form';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function NewEnterprisePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <H3 asChild>
          <h1>New enterprise</h1>
        </H3>
        <Muted>
          Spin up an enterprise account ready for SCIM, WorkOS SSO, and SIEM
          logs.
        </Muted>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Enterprise details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEnterpriseForm />
        </CardContent>
      </Card>
    </div>
  );
}
