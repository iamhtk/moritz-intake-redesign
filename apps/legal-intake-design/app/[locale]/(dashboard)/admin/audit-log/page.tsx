import { AuditLogTable } from '@/components/audit-log/audit-log-table';
import { H3, Muted } from '@/components/design/design-system/typography';

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Audit log</h1>
        </H3>
        <Muted>Cross-tenant activity stream. Filter and export below.</Muted>
      </header>
      <AuditLogTable />
    </div>
  );
}
