'use client';

import { useMemo, useState } from 'react';

import {
  ClipboardList,
  Copy,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Share2,
  Trash2,
} from '@repo/ui/icons';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { H3, Muted } from '@/components/design/design-system/typography';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/design/foundations/components/input-group';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';

import { ShareCaseDialog } from '@/components/cases/share-case-dialog';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import {
  addPlaybook,
  createEmptyPlaybook,
  deletePlaybook,
  updatePlaybook,
  type PlaybookStudioPlaybook,
} from './playbook-studio-data';
import { usePlaybooks } from './use-playbooks';

type TabValue = 'all' | 'mine' | 'shared';

interface PlaybookLibraryProps {
  /** Role-prefixed base, e.g. "/client/playbooks" or "/legal/playbooks". */
  basePath: string;
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export function PlaybookLibrary({ basePath }: PlaybookLibraryProps) {
  const router = useRouter();
  const { playbooks, refresh } = usePlaybooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [renameTarget, setRenameTarget] =
    useState<PlaybookStudioPlaybook | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameDescription, setRenameDescription] = useState('');
  const [deleteTarget, setDeleteTarget] =
    useState<PlaybookStudioPlaybook | null>(null);
  const [shareTarget, setShareTarget] = useState<PlaybookStudioPlaybook | null>(
    null,
  );

  const counts = useMemo(
    () => ({
      all: playbooks.length,
      mine: playbooks.filter((p) => p.owner === 'You').length,
      shared: playbooks.filter((p) => p.owner !== 'You').length,
    }),
    [playbooks],
  );

  const filteredPlaybooks = useMemo(() => {
    let filtered = playbooks;
    if (activeTab === 'mine') {
      filtered = filtered.filter((p) => p.owner === 'You');
    } else if (activeTab === 'shared') {
      filtered = filtered.filter((p) => p.owner !== 'You');
    }
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [playbooks, activeTab, searchTerm]);

  const openEditor = (id: string) => router.push(`${basePath}/${id}`);

  const handleCreate = () => {
    const playbook = createEmptyPlaybook();
    playbook.name = 'Untitled playbook';
    addPlaybook(playbook);
    refresh();
    router.push(`${basePath}/${playbook.id}?new=true`);
  };

  const handleDuplicate = (playbook: PlaybookStudioPlaybook) => {
    const copy: PlaybookStudioPlaybook = {
      ...playbook,
      id: `playbook-${Date.now()}-${randomSuffix()}`,
      name: `${playbook.name} (copy)`,
      owner: 'You',
      updatedLabel: 'Just now',
      rules: playbook.rules.map((rule) => ({
        ...rule,
        fallbacks: rule.fallbacks.map((fallback) => ({ ...fallback })),
      })),
    };
    addPlaybook(copy);
    refresh();
  };

  const openRename = (playbook: PlaybookStudioPlaybook) => {
    setRenameTarget(playbook);
    setRenameName(playbook.name);
    setRenameDescription(playbook.description);
  };

  const saveRename = () => {
    if (!renameTarget) return;
    updatePlaybook({
      ...renameTarget,
      name: renameName.trim() || 'Untitled playbook',
      description: renameDescription,
      updatedLabel: 'Just now',
    });
    refresh();
    setRenameTarget(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <H3 asChild>
            <h1>Playbook Studio</h1>
          </H3>
          <Muted>
            Create and manage playbooks to review contracts against your
            negotiation standards.
          </Muted>
        </div>
        <Button onClick={handleCreate}>
          <Plus data-icon="inline-start" aria-hidden />
          New playbook
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
        >
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="mine">My playbooks ({counts.mine})</TabsTrigger>
            <TabsTrigger value="shared">
              Shared with me ({counts.shared})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-full sm:w-64">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search playbooks…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {filteredPlaybooks.length > 0 ? (
        <TooltipProvider delayDuration={300}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlaybooks.map((playbook) => (
                <TableRow
                  key={playbook.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${playbook.name || 'Untitled playbook'}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring cursor-pointer focus-visible:outline-none focus-visible:ring-2"
                  onClick={() => openEditor(playbook.id)}
                  onKeyDown={(event) => {
                    // Only act when the row itself is focused, so Enter/Space on
                    // inner controls (e.g. the actions menu) isn't hijacked.
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEditor(playbook.id);
                    }
                  }}
                >
                  <TableCell className="max-w-[420px]">
                    <p className="text-foreground truncate font-medium">
                      {playbook.name || 'Untitled playbook'}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-muted-foreground truncate text-sm">
                          {playbook.description || 'No description'}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        className="max-w-md"
                      >
                        {playbook.description || 'No description'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="truncate">{playbook.owner}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {playbook.rules.length}{' '}
                    {playbook.rules.length === 1 ? 'rule' : 'rules'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {playbook.updatedLabel}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label="Playbook actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditor(playbook.id)}
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRename(playbook)}
                          >
                            <PencilLine className="size-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(playbook)}
                          >
                            <Copy className="size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShareTarget(playbook)}
                          >
                            <Share2 className="size-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(playbook)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      ) : (
        <div className="border-field flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="bg-muted mb-3 rounded-full p-3">
            <ClipboardList className="text-muted-foreground size-5" />
          </div>
          <h3 className="text-foreground mb-1 text-base font-medium">
            {searchTerm ? 'No matching playbooks' : 'No playbooks yet'}
          </h3>
          <Muted className="mb-4 max-w-md">
            {searchTerm
              ? 'Try adjusting your search terms or filters.'
              : 'Create your first playbook to start reviewing contracts against your negotiation standards.'}
          </Muted>
          {!searchTerm && (
            <Button onClick={handleCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              Create playbook
            </Button>
          )}
        </div>
      )}

      {/* Rename / edit details dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Edit playbook</DialogTitle>
            <DialogDescription>
              Update your playbook name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="playbook-rename-name"
                className="text-foreground text-sm font-medium"
              >
                Playbook name
              </label>
              <Input
                id="playbook-rename-name"
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                placeholder="e.g. NDA - Recipient Favorable"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="playbook-rename-description"
                className="text-foreground text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="playbook-rename-description"
                value={renameDescription}
                onChange={(event) => setRenameDescription(event.target.value)}
                placeholder="Describe the purpose and scope of this playbook…"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveRename} disabled={!renameName.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deletePlaybook(deleteTarget.id);
            refresh();
          }
        }}
        itemName={deleteTarget?.name || 'Untitled playbook'}
        itemType="playbook"
      />

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
    </div>
  );
}
