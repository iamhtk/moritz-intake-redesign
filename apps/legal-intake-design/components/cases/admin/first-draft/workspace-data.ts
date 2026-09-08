import {
  DRAFT_DOCUMENT_SECTIONS,
  getDraftRunForCase,
  type DraftDocumentSection,
} from '@/components/design/first-drafts-admin/first-drafts-data';

/**
 * The first-draft workspace a case owns: one drafting conversation, the
 * documents it has produced or been given, and the handoff that ends it.
 *
 * There is exactly one of these per case. It is internal to ops — nothing here
 * is readable by the client or the lawyer until ops approves a set of document
 * versions, at which point only those versions cross over.
 */

export type DraftDocumentKind = 'generated' | 'uploaded';

/** How a document can be shown in the workspace. */
export type DraftPreviewKind =
  /** Rendered clause by clause from the draft's own sections. */
  | 'clauses'
  /** Rendered as plain paragraphs extracted from the file. */
  | 'text'
  /** No renderer for this format — offer the download instead. */
  | 'unsupported';

/** One clause rewritten between two versions, kept so changes stay visible. */
export type DraftSectionChange = {
  /** Unique across the document, so a comment and a revert can name one edit. */
  id: string;
  sectionId: string;
  /** Body as of this version. */
  body: string;
  /** Body as of the version before it. */
  previousBody: string;
  /** Why the agent made it — its comment in the margin. */
  note: string;
};

export type DraftDocumentVersion = {
  id: string;
  /** 1-based within its document. */
  version: number;
  createdAt: string;
  createdBy: string;
  source: 'Generated' | 'Agent revision' | 'Upload';
  /** Plain-language description of what this version changed. */
  summary: string;
  /** Clause rewrites against the previous version. Empty for a first version. */
  changes: DraftSectionChange[];
};

export type DraftDocument = {
  id: string;
  name: string;
  kind: DraftDocumentKind;
  previewKind: DraftPreviewKind;
  /** Paragraphs to render for a `text` preview. */
  textPreview?: string[];
  sizeLabel: string;
  /** Oldest first, so the last entry is the current version. */
  versions: DraftDocumentVersion[];
};

export type DraftChatMessage = {
  id: string;
  role: 'ops' | 'agent';
  body: string;
  createdAt: string;
  attachments?: string[];
  /** The version this message cut, so a change can be traced to its prompt. */
  revision?: {
    documentId: string;
    versionId: string;
  };
  /** Workspace events (the handoff) rather than conversation. */
  system?: boolean;
};

export type DraftHandoff = {
  approvedBy: string;
  approvedAt: string;
  lawyerName: string;
  items: {
    documentId: string;
    documentName: string;
    versionId: string;
    versionLabel: string;
  }[];
  notifiedAt: string;
};

export type FirstDraftWorkspace = {
  caseId: string;
  documents: DraftDocument[];
  messages: DraftChatMessage[];
  handoff?: DraftHandoff;
};

const STORAGE_PREFIX = 'playground:first-draft:';

/**
 * The shipping slice being shown.
 *
 * `chat` is v0.1, where the drafting conversation is the whole feature and the
 * case's main column stays on the case's own thread. The two keep separate
 * workspaces so switching between them is switching demos, not walking into a
 * conversation that refers to a document column that is not there.
 */
export type DraftVariant = 'chat' | 'workspace';

export function storageKey(
  caseId: string,
  variant: DraftVariant = 'workspace',
) {
  return `${STORAGE_PREFIX}${variant === 'chat' ? 'v0:' : ''}${caseId}`;
}

/** The clauses of a generated document as of a given version. */
export function sectionsForVersion(
  document: DraftDocument,
  versionId?: string,
): DraftDocumentSection[] {
  const index = versionIndex(document, versionId);
  const bodies = new Map<string, string>();
  document.versions.slice(0, index + 1).forEach((version) => {
    version.changes.forEach((change) =>
      bodies.set(change.sectionId, change.body),
    );
  });

  return DRAFT_DOCUMENT_SECTIONS.map((section) => {
    const body = bodies.get(section.id);
    return body ? { ...section, body } : section;
  });
}

export function versionIndex(document: DraftDocument, versionId?: string) {
  const index = document.versions.findIndex((v) => v.id === versionId);
  return index === -1 ? document.versions.length - 1 : index;
}

export function currentVersion(document: DraftDocument) {
  return document.versions[document.versions.length - 1]!;
}

export function findVersion(document: DraftDocument, versionId?: string) {
  return document.versions[versionIndex(document, versionId)]!;
}

/**
 * How the agent signs off a change it has just made.
 *
 * Where the version can be read is part of the answer, so the sentence only
 * points at the document column when there is one to point at.
 */
export function savedAs(version: number, variant: DraftVariant) {
  return variant === 'chat'
    ? `Saved as v${version}.`
    : `Saved as v${version}, open on the left.`;
}

/**
 * A workspace as ops would find it after the agent's first pass: the generated
 * draft with one revision behind it, the counterparty's paper, and a
 * spreadsheet no viewer can render.
 */
export function seedWorkspace(
  caseId: string,
  variant: DraftVariant = 'workspace',
): FirstDraftWorkspace {
  const run = getDraftRunForCase(caseId);
  if (!run) return { caseId, documents: [], messages: [] };

  const draft: DraftDocument = {
    id: `${run.id}-draft`,
    name: run.document,
    kind: 'generated',
    previewKind: 'clauses',
    sizeLabel: `${run.pages} pages`,
    versions: [
      {
        id: `${run.id}-v1`,
        version: 1,
        createdAt: '2026-08-09T09:12:00.000Z',
        createdBy: 'Moritz AI',
        source: 'Generated',
        summary: `First pass from the ${run.paperSource.toLowerCase()} using the customer playbook.`,
        changes: [],
      },
      {
        id: `${run.id}-v2`,
        version: 2,
        createdAt: '2026-08-09T14:40:00.000Z',
        createdBy: 'Moritz AI',
        source: 'Agent revision',
        summary:
          'Cut the renewal notice to thirty days and added a deletion obligation for Customer Data — both approved fallback positions.',
        changes: [
          {
            id: `${run.id}-v2-term`,
            sectionId: 'term',
            previousBody:
              'The Agreement renews automatically unless either party gives forty-five (45) days’ written notice.',
            body: 'The Agreement renews automatically unless either party gives thirty (30) days’ written notice.',
            note: 'Forty-five days is outside the playbook range. Thirty days is the approved fallback and matches the notice period the client uses everywhere else.',
          },
          {
            id: `${run.id}-v2-privacy`,
            sectionId: 'privacy',
            previousBody:
              'Supplier will process Personal Data only as necessary to provide the Services and in accordance with Customer’s documented instructions. Supplier will not sell Customer Data or use it for advertising, profiling, or unrelated product development.',
            body: 'Supplier will process Personal Data only as necessary to provide the Services and in accordance with Customer’s documented instructions. Supplier will not sell Customer Data or use it for advertising, profiling, or unrelated product development, and will delete or return Customer Data within thirty (30) days of termination.',
            note: 'The clause said nothing about what happens to the data at the end. The playbook requires deletion or return within thirty days of termination.',
          },
        ],
      },
    ],
  };

  const counterpartyPaper: DraftDocument = {
    id: `${run.id}-paper`,
    name: `${run.client} counterparty paper.docx`,
    kind: 'uploaded',
    previewKind: 'text',
    sizeLabel: '412 KB',
    textPreview: [
      `${run.client} standard terms — received 7 Aug 2026`,
      'Supplier shall indemnify and hold harmless the Customer against any and all claims arising from the Services, without limitation.',
      'Confidential Information shall be held in confidence for a period of three (3) years following expiry of this Agreement.',
      'Either party may terminate for convenience on ninety (90) days’ written notice to the other party.',
      'Governing law shall be the laws of the State of New York, and the parties submit to the exclusive jurisdiction of its courts.',
    ],
    versions: [
      {
        id: `${run.id}-paper-v1`,
        version: 1,
        createdAt: '2026-08-08T16:05:00.000Z',
        createdBy: 'Jordan Pierce',
        source: 'Upload',
        summary: 'Counterparty paper supplied by the client.',
        changes: [],
      },
    ],
  };

  const feeSchedule: DraftDocument = {
    id: `${run.id}-fees`,
    name: 'Fee schedule and rate card.xlsx',
    kind: 'uploaded',
    previewKind: 'unsupported',
    sizeLabel: '38 KB',
    versions: [
      {
        id: `${run.id}-fees-v1`,
        version: 1,
        createdAt: '2026-08-08T16:06:00.000Z',
        createdBy: 'Jordan Pierce',
        source: 'Upload',
        summary: 'Rate card to be attached as Schedule B.',
        changes: [],
      },
    ],
  };

  return {
    caseId,
    documents: [draft, counterpartyPaper, feeSchedule],
    messages: [
      {
        id: 'seed-1',
        role: 'agent',
        createdAt: '2026-08-09T09:12:00.000Z',
        body: `I drafted ${run.document} from the ${run.paperSource.toLowerCase()} using the ${run.client} playbook, the case brief and the two documents in this workspace. Ask me to change any clause, or upload more context.`,
        revision: {
          documentId: draft.id,
          versionId: `${run.id}-v1`,
        },
      },
      {
        id: 'seed-2',
        role: 'ops',
        createdAt: '2026-08-09T14:38:00.000Z',
        body: 'The renewal notice is too long and there is nothing about deleting our data at the end. Pull both back to our fallbacks.',
      },
      {
        id: 'seed-3',
        role: 'agent',
        createdAt: '2026-08-09T14:40:00.000Z',
        body: `Done. The renewal notice is now thirty days and Supplier must delete or return Customer Data within thirty days of termination — both are approved fallback positions in the playbook. ${savedAs(2, variant)}`,
        revision: {
          documentId: draft.id,
          versionId: `${run.id}-v2`,
        },
      },
    ],
  };
}

export function loadWorkspace(
  caseId: string,
  variant: DraftVariant = 'workspace',
): FirstDraftWorkspace {
  if (typeof window === 'undefined') return seedWorkspace(caseId, variant);
  try {
    const raw = window.localStorage.getItem(storageKey(caseId, variant));
    if (raw) {
      const parsed = JSON.parse(raw) as FirstDraftWorkspace;
      if (parsed && Array.isArray(parsed.documents)) return normalise(parsed);
    }
  } catch {
    // localStorage may be unavailable; fall back to the seed.
  }
  return seedWorkspace(caseId, variant);
}

/**
 * Brings a saved workspace up to the shape the app now reads.
 *
 * Anyone who used the workspace before changes carried an identity and a
 * reason has versions without either, and their comments would come up blank.
 * The version's own summary is the closest thing it has to the agent's
 * reasoning, so it stands in.
 */
function normalise(workspace: FirstDraftWorkspace): FirstDraftWorkspace {
  return {
    ...workspace,
    documents: workspace.documents.map((document) => ({
      ...document,
      versions: (document.versions ?? []).map((version) => ({
        ...version,
        changes: (version.changes ?? []).map((change, index) => ({
          ...change,
          id: change.id ?? `${version.id}-${change.sectionId}-${index}`,
          note: change.note ?? version.summary,
        })),
      })),
    })),
  };
}

export function saveWorkspace(
  workspace: FirstDraftWorkspace,
  variant: DraftVariant = 'workspace',
) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey(workspace.caseId, variant),
      JSON.stringify(workspace),
    );
  } catch {
    // Quota or private mode; the session keeps working in memory.
  }
}
