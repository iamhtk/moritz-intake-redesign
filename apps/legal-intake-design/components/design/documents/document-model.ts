import type { Document, DocumentUploaderActor } from '@/lib/types';
import { MOCK_CASES } from '@/lib/mocks/cases';
import { newId } from '@/components/design/new-case/file-utils';

/**
 * Name -> headshot lookup built from every case's participants, so a document
 * can resolve its uploader's photo from just the `uploadedBy` name (documents
 * don't carry an image of their own). Built once at module load.
 */
const uploaderImageByName: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const legalCase of MOCK_CASES) {
    for (const participant of legalCase.participants) {
      if (participant.image && !map.has(participant.name)) {
        map.set(participant.name, participant.image);
      }
    }
  }
  return map;
})();

/** The uploader's headshot, if one is known for their name. */
export function uploaderImage(doc: Document): string | undefined {
  return uploaderImageByName.get(doc.uploadedBy);
}

/**
 * Which side of the engagement a document came from. The prod app derives this
 * from the uploading message author's company type; here we collapse the actor
 * enum down to the three sources a reader distinguishes: the client's own
 * files, the reviewing lawyer's work, and what Moritz drafted or supplied.
 */
export type UploaderSide = 'client' | 'counsel' | 'moritz';

export function uploaderSide(actor: DocumentUploaderActor): UploaderSide {
  switch (actor) {
    case 'client':
      return 'client';
    case 'legal':
      return 'counsel';
    default:
      return 'moritz';
  }
}

const SIDE_LABELS: Record<UploaderSide, string> = {
  client: 'Client',
  counsel: 'Counsel',
  moritz: 'Moritz',
};

/** Short, reader-facing label for the side a version came from. */
export function uploaderSideLabel(actor: DocumentUploaderActor): string {
  return SIDE_LABELS[uploaderSide(actor)];
}

/**
 * Turn freshly-attached chat files into `Document` records, applying version
 * families: a file whose name already exists joins that family as the next
 * version; a new name starts its own family at v1. Same-named files within one
 * batch version up in order. Returns only the created records (the caller
 * appends them to the existing list). Mock defaults fill the fields the design
 * app doesn't surface (size/mime/status/type).
 */
export function createUploadedDocuments(
  existing: Document[],
  fileNames: string[],
  uploaderActor: DocumentUploaderActor,
): Document[] {
  const uploadedAt = new Date().toISOString();
  const working = [...existing];
  const created: Document[] = [];

  for (const name of fileNames) {
    const family = working.filter((doc) => doc.name === name);
    const familyId = family[0]?.familyId ?? newId();
    const version =
      family.reduce((max, doc) => Math.max(max, doc.version), 0) + 1;
    const doc: Document = {
      id: newId(),
      familyId,
      version,
      name,
      size: 0,
      mimeType: '',
      uploadedAt,
      uploadedBy: 'You',
      uploaderActor,
      docType: 'other',
      status: 'final',
      isDraft: false,
    };
    working.push(doc);
    created.push(doc);
  }

  return created;
}

/**
 * Creates the next counsel-authored version in an existing document family.
 * The visible family name stays stable even when Word adds a suffix to the
 * uploaded filename, so review history remains grouped in one place.
 */
export function createReviewedDocumentVersion(
  existing: Document[],
  source: Document,
  file: File,
  reviewNote?: string,
): Document {
  const family = existing.filter((doc) => doc.familyId === source.familyId);
  const version =
    family.reduce((max, doc) => Math.max(max, doc.version), 0) + 1;
  return {
    id: newId(),
    familyId: source.familyId,
    version,
    name: source.name,
    size: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'You',
    uploaderActor: 'legal',
    docType: source.docType === 'memo' ? 'memo' : 'redline',
    status: 'in_review',
    isDraft: true,
    ...(reviewNote?.trim() ? { reviewNote: reviewNote.trim() } : {}),
  };
}

/**
 * A logical document and all of its versions, ordered newest-first. Everything
 * the Documents tab renders is derived from this shape so the UI never has to
 * re-scan the raw list.
 */
export type DocumentFamily = {
  familyId: string;
  /** Canonical family name (shared by every version). */
  name: string;
  versions: Document[];
  /** Highest version number — what the collapsed row summarises. */
  latest: Document;
};

/**
 * Group a flat document list into version families, newest family first. Within
 * a family, versions are sorted highest-version-first so index 0 is always the
 * latest.
 */
export function groupIntoFamilies(documents: Document[]): DocumentFamily[] {
  const byFamily = new Map<string, Document[]>();
  for (const doc of documents) {
    const existing = byFamily.get(doc.familyId);
    if (existing) existing.push(doc);
    else byFamily.set(doc.familyId, [doc]);
  }

  const families = [...byFamily.values()].map<DocumentFamily>((docs) => {
    const versions = [...docs].sort((a, b) => b.version - a.version);
    const latest = versions[0]!;
    return {
      familyId: latest.familyId,
      name: latest.name,
      versions,
      latest,
    };
  });

  return families.sort(
    (a, b) =>
      new Date(b.latest.uploadedAt).getTime() -
      new Date(a.latest.uploadedAt).getTime(),
  );
}

export type DocumentFilter = 'all' | 'client' | 'counsel' | 'moritz';

/** Whether any version of a family matches the active filter. */
export function familyMatchesFilter(
  family: DocumentFamily,
  filter: DocumentFilter,
): boolean {
  if (filter === 'all') return true;
  return family.versions.some(
    (doc) => uploaderSide(doc.uploaderActor) === filter,
  );
}
