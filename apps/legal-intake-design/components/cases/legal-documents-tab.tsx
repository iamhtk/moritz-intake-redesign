'use client';

import { useState } from 'react';
import { DocumentList } from '@/components/cases/document-list';
import { Input } from '@repo/ui/components/input';
import { Text } from '@repo/ui/components/text';
import { Search } from '@repo/ui/icons';
import type { LegalCase } from '@/lib/types';

export function LegalDocumentsTab({ legalCase }: { legalCase: LegalCase }) {
  const [search, setSearch] = useState('');

  const filteredDocs = legalCase.documents.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (legalCase.documents.length === 0) {
    return <Text>No attachments have been added to this case.</Text>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text asChild className="font-medium">
          <span>
            {filteredDocs.length}{' '}
            {filteredDocs.length === 1 ? 'document' : 'documents'}
          </span>
        </Text>
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Search documents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <DocumentList documents={filteredDocs} />
    </div>
  );
}
