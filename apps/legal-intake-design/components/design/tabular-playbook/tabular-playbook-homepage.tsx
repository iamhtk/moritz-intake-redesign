'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createEmptyTabularPlaybook,
  mockTabularPlaybooks,
  TABULAR_PLAYBOOK_CLIENTS,
  UNASSIGNED_CLIENT,
  type TabularPlaybookItem,
  type TabValue,
} from './tabular-playbook-data';
import {
  setPlaybookArchived,
  useTabularPlaybooksByArchiveState,
} from './tabular-playbook-archive';
import { Button } from '@/components/design/foundations/components/button';
import { Input } from '@/components/design/foundations/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
import {
  Archive,
  ArchiveRestore,
  Search,
  Plus,
  Table2,
  MoreHorizontal,
  PencilLine,
  Share2,
  Copy,
} from '@repo/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/design/foundations/components/table';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { Textarea } from '@/components/design/foundations/components/textarea';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { ShareCaseDialog } from '@/components/cases/share-case-dialog';

export function TabularPlaybooksHomepage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDescription, setNewTableDescription] = useState('');
  const [newTableClient, setNewTableClient] = useState('');

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTableId, setRenameTableId] = useState<string | null>(null);
  const [renameTableName, setRenameTableName] = useState('');

  // Share modal state
  const [shareTarget, setShareTarget] = useState<TabularPlaybookItem | null>(
    null,
  );

  // Duplicate success state
  const [duplicatedTableName, setDuplicatedTableName] = useState<string | null>(
    null,
  );

  // Clear duplicate notification after 3 seconds
  useEffect(() => {
    if (duplicatedTableName) {
      const timer = setTimeout(() => setDuplicatedTableName(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [duplicatedTableName]);

  // Archived playbooks are out of the way rather than gone: they keep their own
  // tab and stay out of the other three.
  const { active: activePlaybooks, archived: archivedPlaybooks } =
    useTabularPlaybooksByArchiveState();
  const isArchivedTab = activeTab === 'archived';

  // Filter tabular playbooks based on search and tab
  const filteredTabularPlaybooks = useMemo(() => {
    let filtered = isArchivedTab ? archivedPlaybooks : activePlaybooks;

    // Filter by tab
    if (activeTab === 'mine') {
      filtered = filtered.filter((dt) => dt.owner === 'You');
    } else if (activeTab === 'shared') {
      filtered = filtered.filter((dt) => dt.owner !== 'You');
    }

    // Filter by search term
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((dt) => {
        return (
          dt.name.toLowerCase().includes(query) ||
          dt.description.toLowerCase().includes(query) ||
          dt.client.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [
    activePlaybooks,
    archivedPlaybooks,
    isArchivedTab,
    searchTerm,
    activeTab,
  ]);

  // Count tabular playbooks by tab
  const tabularPlaybookCounts = useMemo(
    () => ({
      all: activePlaybooks.length,
      mine: activePlaybooks.filter((dt) => dt.owner === 'You').length,
      shared: activePlaybooks.filter((dt) => dt.owner !== 'You').length,
      archived: archivedPlaybooks.length,
    }),
    [activePlaybooks, archivedPlaybooks],
  );

  const handleCreateTabularPlaybook = () => {
    setNewTableName('');
    setNewTableDescription('');
    setNewTableClient('');
    setShowCreateModal(true);
  };

  const handleCreateTabularPlaybookSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!newTableName.trim()) return;

    const newTable = createEmptyTabularPlaybook();
    newTable.name = newTableName;
    newTable.description = newTableDescription;
    newTable.client = newTableClient;
    setShowCreateModal(false);
    // Navigate to the new tabular playbook
    router.push(`/admin/tabular-playbook/${newTable.id}`);
  };

  const handleRowClick = (tabularPlaybookId: string) => {
    router.push(`/admin/tabular-playbook/${tabularPlaybookId}`);
  };

  // Rename handlers
  const handleRenameClick = (tabularPlaybook: TabularPlaybookItem) => {
    setRenameTableId(tabularPlaybook.id);
    setRenameTableName(tabularPlaybook.name);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameTableId || !renameTableName.trim()) return;

    // In a real app, this would update the backend
    console.log(
      'Renaming tabular playbook:',
      renameTableId,
      'to:',
      renameTableName,
    );
    setShowRenameModal(false);
    setRenameTableId(null);
    setRenameTableName('');
  };

  // Share handler
  const handleShareClick = (tabularPlaybook: TabularPlaybookItem) => {
    setShareTarget(tabularPlaybook);
  };

  // Duplicate handler
  const handleDuplicateClick = (tabularPlaybook: TabularPlaybookItem) => {
    // In a real app, this would call the API to duplicate
    const duplicatedName = `${tabularPlaybook.name} (Copy)`;
    console.log(
      'Duplicating tabular playbook:',
      tabularPlaybook.id,
      'as:',
      duplicatedName,
    );
    setDuplicatedTableName(duplicatedName);
  };

  /*
   * Archiving asks nothing and shows no dialog. Nothing is destroyed — the
   * playbook moves to a tab it can be brought back from — so a confirmation
   * would be friction in front of a reversible act. The toast carries the undo
   * for the case where the wrong row's menu was open.
   */
  const handleArchiveClick = (tabularPlaybook: TabularPlaybookItem) => {
    setPlaybookArchived(tabularPlaybook.id, true);
    toast(`"${tabularPlaybook.name}" archived`, {
      action: {
        label: 'Undo',
        onClick: () => setPlaybookArchived(tabularPlaybook.id, false),
      },
    });
  };

  const handleUnarchiveClick = (tabularPlaybook: TabularPlaybookItem) => {
    setPlaybookArchived(tabularPlaybook.id, false);
    toast(`"${tabularPlaybook.name}" restored`, {
      action: {
        label: 'Undo',
        onClick: () => setPlaybookArchived(tabularPlaybook.id, true),
      },
    });
  };

  return (
    <div className="bg-dt-bg-primary flex h-full w-full flex-col">
      {/* Sticky Header Bar */}
      <div className="addin-header-safe bg-dt-bg-primary sticky top-0 z-10 flex min-h-[48px] shrink-0 items-center justify-between p-2">
        <div>
          <h1 className="text-dt-fg-primary text-lg font-semibold">
            Playbooks
          </h1>
          <p className="text-dt-fg-tertiary text-sm">
            Create and manage playbooks to extract key terms from your
            contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateTabularPlaybook}>
            <Plus className="size-4" />
            New Playbook
          </Button>
        </div>
      </div>

      {/* Control Bar with Tabs and Search */}
      <div className="px-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <div className="flex items-center justify-between">
            <TabsList className="h-auto rounded-none bg-transparent p-0">
              <TabsTrigger value="all" className="px-4 py-2">
                All ({tabularPlaybookCounts.all})
              </TabsTrigger>
              <TabsTrigger value="mine" className="px-4 py-2">
                My Playbooks ({tabularPlaybookCounts.mine})
              </TabsTrigger>
              <TabsTrigger value="shared" className="px-4 py-2">
                Shared with Me ({tabularPlaybookCounts.shared})
              </TabsTrigger>
              <TabsTrigger value="archived" className="px-4 py-2">
                Archived ({tabularPlaybookCounts.archived})
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="w-64">
                <InputGroup className="w-full">
                  <InputGroupAddon>
                    <Search className="text-dt-fg-tertiary h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search playbooks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Table Content */}
      <div className="min-h-0 w-full flex-1 p-2">
        {/*
         * The foundation table only pads its first and last cells by 4px,
         * assuming the surrounding page supplies the gutter. Inside a frame there
         * is no such gutter, so the frame carries it: 12px here lands the Name
         * column on the same vertical as the tab labels above it.
         */}
        <div className="border-dt-line-tertiary bg-dt-bg-primary text-dt-fg-primary h-full overflow-auto rounded border px-3">
          <TooltipProvider>
            {/* The "create your first" state belongs to an empty account, not
                to an empty tab — the Archived tab keeps its table so its own
                message can explain itself. */}
            {mockTabularPlaybooks.length === 0 ? (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="ring">
                    <Table2 aria-hidden strokeWidth={1.75} />
                  </EmptyMedia>
                  <EmptyTitle>No playbooks yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first playbook to start extracting key terms
                    from your contracts.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleCreateTabularPlaybook}>
                    <Plus className="size-4" />
                    Create Playbook
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-16">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTabularPlaybooks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground py-10 text-center"
                      >
                        {isArchivedTab && !searchTerm
                          ? 'No archived playbooks. Archiving one puts it here, where it can be restored.'
                          : 'No playbooks match your search or filters.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredTabularPlaybooks.map((tabularPlaybook) => (
                    <TableRow
                      key={tabularPlaybook.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${tabularPlaybook.name}`}
                      className="hover:bg-muted/50 focus-visible:ring-ring group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      onClick={() => handleRowClick(tabularPlaybook.id)}
                      onKeyDown={(event) => {
                        // Only act when the row itself is focused, so Enter/Space on
                        // inner controls (e.g. the actions menu) isn't hijacked.
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleRowClick(tabularPlaybook.id);
                        }
                      }}
                    >
                      <TableCell className="max-w-[400px]">
                        <p className="text-foreground truncate font-medium">
                          {tabularPlaybook.name}
                        </p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-muted-foreground truncate text-sm">
                              {tabularPlaybook.description || 'No description'}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="start"
                            className="max-w-md"
                          >
                            <p className="text-sm">
                              {tabularPlaybook.description || 'No description'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] text-sm">
                        <span className="block truncate">
                          {tabularPlaybook.client || 'Unassigned'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <span className="block truncate">
                          {tabularPlaybook.owner}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tabularPlaybook.ruleCount}{' '}
                        {tabularPlaybook.ruleCount === 1 ? 'rule' : 'rules'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tabularPlaybook.updatedLabel}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                aria-label={`Actions for ${tabularPlaybook.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* An archived playbook is out of circulation:
                                  the only thing to do with it is bring it
                                  back. */}
                              {isArchivedTab ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUnarchiveClick(tabularPlaybook)
                                  }
                                >
                                  <ArchiveRestore className="size-4" />
                                  Unarchive
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRenameClick(tabularPlaybook)
                                    }
                                  >
                                    <PencilLine className="size-4" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDuplicateClick(tabularPlaybook)
                                    }
                                  >
                                    <Copy className="size-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleShareClick(tabularPlaybook)
                                    }
                                  >
                                    <Share2 className="size-4" />
                                    Share
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveClick(tabularPlaybook)
                                    }
                                  >
                                    <Archive className="size-4" />
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Create New Tabular Playbook Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Create New Playbook</DialogTitle>
            <DialogDescription>
              Name your playbook and choose the client it runs for.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTabularPlaybookSubmit}>
            <DialogBody className="space-y-5">
              <Field>
                <FieldLabel htmlFor="table-name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="table-name"
                  placeholder="e.g., Vendor Contracts Analysis"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="table-client">Client</FieldLabel>
                <Select
                  value={newTableClient}
                  onValueChange={(value) =>
                    setNewTableClient(value === UNASSIGNED_CLIENT ? '' : value)
                  }
                >
                  <SelectTrigger id="table-client" className="w-full">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Radix reserves the empty string, so clearing the field
                        goes through a sentinel value. */}
                    <SelectItem value={UNASSIGNED_CLIENT}>
                      Unassigned
                    </SelectItem>
                    <SelectSeparator />
                    {TABULAR_PLAYBOOK_CLIENTS.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="table-description">Description</FieldLabel>
                <Textarea
                  id="table-description"
                  placeholder="Describe the purpose and scope of this playbook..."
                  value={newTableDescription}
                  onChange={(e) => setNewTableDescription(e.target.value)}
                  rows={3}
                  className="[&_textarea]:resize-none"
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!newTableName.trim()}>
                Create Playbook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Tabular Playbook Modal */}
      <Dialog
        open={showRenameModal}
        onOpenChange={(open) => {
          setShowRenameModal(open);
          // Also covers Escape and backdrop dismissal, not just Cancel.
          if (!open) {
            setRenameTableId(null);
            setRenameTableName('');
          }
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Rename Playbook</DialogTitle>
            <DialogDescription>
              Enter a new name for this playbook.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit}>
            <DialogBody>
              <Field>
                <FieldLabel htmlFor="rename-table-name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="rename-table-name"
                  placeholder="e.g., Vendor Contracts Analysis"
                  value={renameTableName}
                  onChange={(e) => setRenameTableName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!renameTableName.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Modal - the same roster dialog cases and Playbook Studio use. */}
      <ShareCaseDialog
        open={shareTarget !== null}
        onOpenChange={(open) => {
          if (!open) setShareTarget(null);
        }}
        title="Share playbook"
        description="Share this playbook with people on your team so they can view and edit it."
        resourceLabel="playbook"
        shareLink={
          shareTarget
            ? `https://app.moritz.legal/playbooks/${shareTarget.id}`
            : undefined
        }
      />

      {/* Duplicate Success Notification */}
      {duplicatedTableName && (
        <div className="animate-in slide-in-from-bottom-2 fade-in fixed bottom-4 right-4 z-50 duration-200">
          <div className="border-dt-line-tertiary bg-dt-bg-primary flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg">
            <div className="bg-success/20 flex h-5 w-5 items-center justify-center rounded-full">
              <svg
                className="text-success h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-dt-fg-primary text-sm">
              Created &quot;{duplicatedTableName}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
