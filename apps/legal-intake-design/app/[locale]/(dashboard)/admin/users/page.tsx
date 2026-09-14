import type { Metadata } from 'next';
import { UsersTableClient } from '@/components/admin/users-table-client';
import { H3, Muted } from '@/components/design/design-system/typography';

export const metadata: Metadata = { title: 'Users' };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <H3 asChild>
          <h1>Users</h1>
        </H3>
        <Muted>
          Manage users across all companies. Toggle access and edit roles in
          place.
        </Muted>
      </header>
      <UsersTableClient currentUserId="usr_admin_001" />
    </div>
  );
}
