'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { raisePortalNotification } from '@/lib/mocks/portal-notifications';
import type { LegalCase } from '@/lib/types';

import {
  findVersion,
  loadWorkspace,
  savedAs,
  saveWorkspace,
  seedWorkspace,
  sectionsForVersion,
  type DraftChatMessage,
  type DraftDocument,
  type DraftDocumentVersion,
  type DraftVariant,
  type FirstDraftWorkspace,
} from './workspace-data';

const OPS_USER = 'Jordan Pierce';
const AGENT_USER = 'Moritz AI';
const AGENT_LATENCY_MS = 1200;

/** Rewrites the agent falls back to when a prompt is not about a new document. */
const CANNED_REVISIONS = [
  {
    sectionId: 'indemnity',
    rationale:
      'The playbook only accepts an uncapped indemnity for IP and confidentiality claims. Everything else is capped at the fees paid.',
    replacement:
      'Supplier will defend and indemnify Customer against third-party claims arising from Supplier’s gross negligence, wilful misconduct, or infringement of intellectual property rights. Supplier’s aggregate liability under this Section is capped at the fees paid in the twelve (12) months preceding the claim, except for claims arising from breach of confidentiality.',
    summary:
      'Capped the indemnity at twelve months of fees and carved out IP and confidentiality claims, matching the playbook position.',
  },
  {
    sectionId: 'fees',
    rationale:
      'Net forty-five sits outside the approved range, and there is no window for Customer to dispute an invoice.',
    replacement:
      'Customer will pay undisputed invoices within thirty (30) days after receipt. Customer may dispute an invoice in good faith within fifteen (15) days of receipt, and the parties will resolve the dispute before payment becomes due.',
    summary:
      'Shortened payment to net thirty and added a fifteen-day window for Customer to dispute an invoice.',
  },
  {
    sectionId: 'security',
    rationale:
      '“Without undue delay” is unenforceable in practice; the playbook asks for seventy-two hours.',
    replacement:
      'Supplier will maintain administrative, physical, and technical safeguards appropriate to the nature of Customer Data and will notify Customer within seventy-two (72) hours after discovering a Security Incident, including the scope of the affected data and the remediation underway.',
    summary:
      'Replaced “without undue delay” with a seventy-two hour breach notification deadline, including scope and remediation detail.',
  },
] as const;

const NEW_DOCUMENT_PROMPT =
  /signature|packet|cover letter|nda|side letter|schedule|second document|another document/i;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * The one drafting workspace a case has: its conversation with the first-draft
 * agent, the documents that conversation produced, and the set ops has chosen
 * to hand to the lawyer.
 *
 * State lives above the view because the documents sit in the case's main
 * column while the chat sits in the rail, and both read and write them. It is
 * persisted per case, so a reload resumes the same workspace rather than
 * starting a second conversation.
 *
 * In v0.1 there is no document column, only the conversation, so the agent
 * stops telling ops where to look and the workspace is kept apart from the one
 * the full version uses.
 */
export function useFirstDraftWorkspace(
  legalCase: LegalCase,
  variant: DraftVariant = 'workspace',
) {
  const caseId = legalCase.id;
  const [workspace, setWorkspace] = useState<FirstDraftWorkspace>(() =>
    seedWorkspace(caseId, variant),
  );
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Which document, which of its versions, and whether its changes are marked
  // up: the reading position, not part of the saved workspace.
  const [activeDocumentId, setActiveDocumentId] = useState<string>();
  const [viewingVersionId, setViewingVersionId] = useState<string>();
  const [compare, setCompare] = useState(false);
  const openDocumentRef = useRef<DraftDocument>(undefined);
  const openVersionRef = useRef<string>(undefined);

  useEffect(() => {
    setWorkspace(loadWorkspace(caseId, variant));
    setHydrated(true);
  }, [caseId, variant]);

  useEffect(() => {
    if (hydrated) saveWorkspace(workspace, variant);
  }, [hydrated, variant, workspace]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const later = useCallback((run: () => void, delay: number) => {
    const timer = setTimeout(run, delay);
    timers.current.push(timer);
  }, []);

  const appendMessages = useCallback((...messages: DraftChatMessage[]) => {
    setWorkspace((current) => ({
      ...current,
      messages: [...current.messages, ...messages],
    }));
  }, []);

  const openVersion = useCallback(
    (documentId: string, versionId: string, withChanges = true) => {
      setActiveDocumentId(documentId);
      setViewingVersionId(versionId);
      setCompare(withChanges);
    },
    [],
  );

  /**
   * Adds files as uploaded documents, versioning a file uploaded twice. They
   * are context for the agent rather than something to read here, so they never
   * take the document column: the case's Documents tab is where files are read.
   */
  const addUploads = useCallback((fileNames: string[]) => {
    setWorkspace((current) => {
      const documents = [...current.documents];
      fileNames.forEach((name) => {
        const at = new Date().toISOString();
        const existing = documents.findIndex((doc) => doc.name === name);
        if (existing !== -1) {
          const doc = documents[existing]!;
          documents[existing] = {
            ...doc,
            versions: [
              ...doc.versions,
              {
                id: newId('ver'),
                version: doc.versions.length + 1,
                createdAt: at,
                createdBy: OPS_USER,
                source: 'Upload',
                summary: 'Replaced by a newer upload.',
                changes: [],
              },
            ],
          };
          return;
        }
        const id = newId('doc');
        const previewKind = previewKindFor(name);
        documents.push({
          id,
          name,
          kind: 'uploaded',
          previewKind,
          sizeLabel: 'Uploaded just now',
          textPreview:
            previewKind === 'text'
              ? [
                  name.replace(/\.[^.]+$/, ''),
                  `Uploaded by ${OPS_USER}. This preview is a read-only rendering of the stored file; the file itself is untouched.`,
                  'Ask the agent to take this document into account and it will use it alongside the playbook and the case brief.',
                ]
              : undefined,
          versions: [
            {
              id: newId('ver'),
              version: 1,
              createdAt: at,
              createdBy: OPS_USER,
              source: 'Upload',
              summary: 'Uploaded to the workspace as agent context.',
              changes: [],
            },
          ],
        });
      });
      return { ...current, documents };
    });
  }, []);

  /** A second, separate document — never a revision of an existing one. */
  const generateDocument = useCallback(
    (prompt: string) => {
      const name = documentNameFor(prompt);
      const documentId = newId('doc');
      const versionId = newId('ver');
      const createdAt = new Date().toISOString();

      setWorkspace((current) => ({
        ...current,
        documents: [
          ...current.documents,
          {
            id: documentId,
            name,
            kind: 'generated',
            previewKind: 'text',
            sizeLabel: '2 pages',
            textPreview: [
              name.replace(/\.docx$/, ''),
              `Prepared for ${legalCase.title} on the basis of the master agreement in this workspace.`,
              'The signatories below confirm that they are authorised to execute this document on behalf of their respective entities, and that the terms of the master agreement apply in full.',
              'Customer: ______________________     Supplier: ______________________',
            ],
            versions: [
              {
                id: versionId,
                version: 1,
                createdAt,
                createdBy: AGENT_USER,
                source: 'Generated',
                summary: 'First version generated from the master agreement.',
                changes: [],
              },
            ],
          },
        ],
        messages: [
          ...current.messages,
          {
            id: newId('msg'),
            role: 'agent',
            createdAt,
            body: `I generated ${name} as a separate document, so it keeps its own version history. It follows the parties and defined terms in the master agreement.`,
            revision: { documentId, versionId },
          },
        ],
      }));
      openVersion(documentId, versionId, false);
    },
    [legalCase.title, openVersion],
  );

  /**
   * The agent makes the change rather than offering it: asking for one is the
   * approval. It cuts a new version of the draft and says what moved, and the
   * clause it replaced stays readable in the version before it.
   */
  const reviseDraft = useCallback(() => {
    const draftId = workspace.documents.find(
      (doc) => doc.previewKind === 'clauses',
    )?.id;
    const versionId = newId('ver');
    const messageId = newId('msg');
    const createdAt = new Date().toISOString();

    setWorkspace((current) => {
      const draft = current.documents.find((doc) => doc.id === draftId);
      if (!draft) {
        return {
          ...current,
          messages: [
            ...current.messages,
            {
              id: messageId,
              role: 'agent',
              createdAt,
              body: 'There is no generated draft in this workspace yet. Generate one and I can revise it clause by clause.',
            },
          ],
        };
      }

      // Each prompt takes the next playbook position the draft has not taken.
      const taken = draft.versions.filter((item) =>
        item.changes.some((change) =>
          CANNED_REVISIONS.some(
            (revision) => revision.sectionId === change.sectionId,
          ),
        ),
      ).length;
      const canned = CANNED_REVISIONS[taken % CANNED_REVISIONS.length]!;
      const previousBody =
        sectionsForVersion(draft).find(
          (section) => section.id === canned.sectionId,
        )?.body ?? '';

      const version: DraftDocumentVersion = {
        id: versionId,
        version: draft.versions.length + 1,
        createdAt,
        createdBy: AGENT_USER,
        source: 'Agent revision',
        summary: canned.summary,
        changes: [
          {
            id: newId('chg'),
            sectionId: canned.sectionId,
            previousBody,
            body: canned.replacement,
            note: canned.rationale,
          },
        ],
      };

      return {
        ...current,
        documents: current.documents.map((doc) =>
          doc.id === draft.id
            ? { ...doc, versions: [...doc.versions, version] }
            : doc,
        ),
        messages: [
          ...current.messages,
          {
            id: messageId,
            role: 'agent',
            createdAt,
            body: `${canned.rationale} ${canned.summary} ${savedAs(version.version, variant)}`,
            revision: { documentId: draft.id, versionId },
          },
        ],
      };
    });

    // A revision arrives marked up: the point of asking for one is to see what
    // it did to the clause.
    if (draftId) openVersion(draftId, versionId, true);
  }, [openVersion, variant, workspace.documents]);

  /**
   * Puts a clause back to the wording it had before a change.
   *
   * History is immutable, so this is a step forward rather than an undo: it
   * cuts a version whose change runs from the clause as it currently reads to
   * the wording being restored. That holds even when ops is reading an older
   * version's redline, because the document only ever moves from its latest
   * version — and the revert is itself a change, so it arrives marked up.
   */
  const revertChange = useCallback(
    (changeId: string) => {
      const draft = workspace.documents.find(
        (doc) => doc.previewKind === 'clauses',
      );
      const source = draft?.versions
        .flatMap((version) => version.changes)
        .find((change) => change.id === changeId);
      if (!draft || !source) return;

      const createdAt = new Date().toISOString();
      const current =
        sectionsForVersion(draft).find(
          (section) => section.id === source.sectionId,
        )?.body ?? '';

      if (current === source.previousBody) {
        appendMessages({
          id: newId('msg'),
          role: 'agent',
          createdAt,
          body: 'That clause already reads the way it did before the change, so there is nothing to put back.',
        });
        return;
      }

      const versionId = newId('ver');
      const version: DraftDocumentVersion = {
        id: versionId,
        version: draft.versions.length + 1,
        createdAt,
        createdBy: AGENT_USER,
        source: 'Agent revision',
        summary: 'Restored the previous wording of one clause.',
        changes: [
          {
            id: newId('chg'),
            sectionId: source.sectionId,
            previousBody: current,
            body: source.previousBody,
            note: `Reverted at ${OPS_USER}’s request. This puts the clause back to the wording it had before the change, so the playbook position it was moved to no longer applies here.`,
          },
        ],
      };

      setWorkspace((state) => ({
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === draft.id
            ? { ...doc, versions: [...doc.versions, version] }
            : doc,
        ),
        messages: [
          ...state.messages,
          {
            id: newId('msg'),
            role: 'agent',
            createdAt,
            body: `Put the previous wording back. ${savedAs(version.version, variant)}`,
            revision: { documentId: draft.id, versionId },
          },
        ],
      }));

      openVersion(draft.id, versionId, true);
    },
    [appendMessages, openVersion, variant, workspace.documents],
  );

  const sendPrompt = useCallback(
    (text: string, fileNames: string[] = []) => {
      const prompt = text.trim();
      if (!prompt && fileNames.length === 0) return;

      if (fileNames.length > 0) addUploads(fileNames);

      // Every ops prompt lands in the transcript, which is what the existing
      // prompt-capture pipeline reads.
      appendMessages({
        id: newId('msg'),
        role: 'ops',
        body: prompt,
        createdAt: new Date().toISOString(),
        attachments: fileNames.length > 0 ? fileNames : undefined,
      });

      setBusy(true);
      later(() => {
        setBusy(false);
        if (fileNames.length > 0) {
          appendMessages({
            id: newId('msg'),
            role: 'agent',
            createdAt: new Date().toISOString(),
            body: `Added ${fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`} to the workspace. I will use ${fileNames.length === 1 ? 'it' : 'them'} alongside the playbook and the case brief from here on.`,
          });
          return;
        }
        if (NEW_DOCUMENT_PROMPT.test(prompt)) generateDocument(prompt);
        else reviseDraft();
      }, AGENT_LATENCY_MS);
    },
    [addUploads, appendMessages, generateDocument, later, reviseDraft],
  );

  /** Generates the very first draft for a case that has none yet. */
  const generateFirstDraft = useCallback(() => {
    if (generating) return;
    setGenerating(true);
    const documentId = newId('doc');
    const versionId = newId('ver');
    const name = `${legalCase.title} - first draft.docx`;

    later(() => {
      setGenerating(false);
      setWorkspace((current) => {
        if (current.documents.length > 0) return current;
        const createdAt = new Date().toISOString();
        return {
          ...current,
          documents: [
            {
              id: documentId,
              name,
              kind: 'generated',
              previewKind: 'clauses',
              sizeLabel: '20 pages',
              versions: [
                {
                  id: versionId,
                  version: 1,
                  createdAt,
                  createdBy: AGENT_USER,
                  source: 'Generated',
                  summary:
                    'First pass from the case brief, the customer playbook and the documents on the case.',
                  changes: [],
                },
              ],
            },
          ],
          messages: [
            ...current.messages,
            {
              id: newId('msg'),
              role: 'agent',
              createdAt,
              body: `I drafted ${name} from the case brief, the customer playbook and the documents on this case. Ask me to change any clause, or upload more context.`,
              revision: { documentId, versionId },
            },
          ],
        };
      });
      openVersion(documentId, versionId, false);
      toast.success('First draft generated');
    }, 1600);
  }, [generating, later, legalCase.title, openVersion]);

  /**
   * The draft on screen, at the version on screen, goes to the lawyer. What ops
   * is reading is what it sends — there is nothing else to pick from here.
   */
  const approve = useCallback(() => {
    const lawyer = legalCase.assignedLawyer;
    let notification: { count: number; at: string } | undefined;

    setWorkspace((current) => {
      // Approving twice must not create a second handoff or notification.
      if (current.handoff || !lawyer) return current;

      const document = current.documents.find(
        (doc) => doc.id === openDocumentRef.current?.id,
      );
      if (!document) return current;

      const version = findVersion(document, openVersionRef.current);
      const items = [
        {
          documentId: document.id,
          documentName: document.name,
          versionId: version.id,
          versionLabel: `v${version.version}`,
        },
      ];

      const approvedAt = new Date().toISOString();
      notification = { count: items.length, at: approvedAt };
      return {
        ...current,
        handoff: {
          approvedBy: OPS_USER,
          approvedAt,
          lawyerName: lawyer.name,
          items,
          notifiedAt: approvedAt,
        },
        messages: [
          ...current.messages,
          {
            id: newId('msg'),
            role: 'agent',
            createdAt: approvedAt,
            system: true,
            body: `${OPS_USER} approved ${items.length} document${items.length === 1 ? '' : 's'} and sent ${items.length === 1 ? 'it' : 'them'} to ${lawyer.name}. This conversation stays internal to ops.`,
          },
        ],
      };
    });

    // The lawyer learns about it the way they learn about everything else on a
    // case: a row in their portal inbox.
    if (notification) {
      raisePortalNotification('LEGAL', {
        id: `ntf_first_draft_${caseId}`,
        type: 'FIRST_DRAFT_HANDED_OFF',
        title: 'First draft ready for review',
        content: `${OPS_USER} approved ${notification.count} document${notification.count === 1 ? '' : 's'} for your review.`,
        read: false,
        createdAt: notification.at,
        caseNumber: legalCase.caseNumber,
        caseTitle: legalCase.title,
        triggeredBy: { name: OPS_USER, image: null },
        href: `/legal/cases/${caseId}`,
      });
    }
  }, [caseId, legalCase.assignedLawyer, legalCase.caseNumber, legalCase.title]);

  // The column shows what the agent wrote, newest draft first; the material ops
  // uploaded for context is read in the case's Documents tab, not here.
  const drafts = workspace.documents.filter((doc) => doc.kind === 'generated');
  const activeDocument =
    drafts.find((doc) => doc.id === activeDocumentId) ??
    drafts[drafts.length - 1];
  const openVersionId =
    activeDocument && activeDocument.id === activeDocumentId
      ? viewingVersionId
      : undefined;

  // `approve` is built once but has to read wherever the draft has got to.
  openDocumentRef.current = activeDocument;
  openVersionRef.current = openVersionId;

  return {
    documents: workspace.documents,
    messages: workspace.messages,
    handoff: workspace.handoff,
    hasWorkspace: Boolean(activeDocument),
    activeDocument,
    viewingVersionId: openVersionId,
    compare,
    busy,
    generating,
    openVersion,
    setCompare,
    sendPrompt,
    stop: useCallback(() => setBusy(false), []),
    addUploads,
    generateFirstDraft,
    revertChange,
    approve,
  };
}

export type FirstDraftWorkspaceState = ReturnType<
  typeof useFirstDraftWorkspace
>;

/** Formats it can render read-only; anything else falls back to download. */
function previewKindFor(name: string): DraftDocument['previewKind'] {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return ['docx', 'doc', 'pdf', 'txt', 'md', 'rtf'].includes(extension)
    ? 'text'
    : 'unsupported';
}

function documentNameFor(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('nda')) return 'Mutual NDA.docx';
  if (lower.includes('cover letter')) return 'Cover letter.docx';
  if (lower.includes('side letter')) return 'Side letter.docx';
  if (lower.includes('schedule')) return 'Schedule B - service levels.docx';
  return 'Signature packet.docx';
}
