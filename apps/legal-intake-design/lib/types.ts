// Local copies of the shapes consumed by the UI. Mirrors the prod
// types from @repo/db-legal-intake / @repo/temporal-shared so engineers
// can swap mock data for real tRPC outputs with minimal changes.

export type CompanyType =
  | 'INTERNAL_ADMIN'
  | 'INTERNAL_ASSISTANT'
  | 'LEGAL'
  | 'NON_LEGAL';

export type CompanySize = 'PRE_INCORPORATION' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type PaymentPlan = 'TRIAL' | 'STANDARD' | 'ENTERPRISE';
export type CompanyLocation = 'USA' | 'NORWAY' | 'OTHER';

export type LegalCaseStatus =
  | 'READY_FOR_SUBMISSION_REVIEW'
  | 'READY_FOR_ASSIGNMENT'
  | 'READY_FOR_CLAIM'
  | 'IN_PROGRESS'
  | 'CLOSED';

export type MembershipRole = 'OWNER' | 'MEMBER';

/**
 * Functional role of a firm member. The platform historically only tracked
 * OWNER/MEMBER (see {@link MembershipRole}); admins additionally need to tell
 * lawyers apart from assistants and other support staff.
 */
export type FirmMemberType = 'LAWYER' | 'ASSISTANT' | 'OTHER';

export type Role = CompanyType;

export type CompanyInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REVOKED'
  | 'EXPIRED';

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'COMPANY_CREATED'
  | 'CASE_READY_FOR_CLAIM'
  | 'CASE_COLLABORATOR_ADDED'
  | 'QUOTE_CREATED'
  | 'CASE_CLOSED'
  | 'QUOTE_ROUND_INVITATION'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_ROUND_CLOSED'
  | 'LAWYER_DIRECTLY_ASSIGNED'
  | 'INVOICE_CREATED';

export type Country = {
  code: string;
  name: string;
  timezone: string;
  stripeMarket: string | null;
  legalAutoApprove: boolean;
  nonLegalAutoApprove: boolean;
};

export type Company = {
  id: string;
  name: string;
  type: CompanyType;
  description: string | null;
  orgNumber: string | null;
  companyUrl: string | null;
  whitelisted: boolean;
  size: CompanySize;
  paymentPlan: PaymentPlan;
  country: string;
  /** Primary contact email for the firm (admin-facing). */
  email: string | null;
  /** Primary contact phone for the firm (admin-facing). */
  phone: string | null;
  /** Practice areas / specialties, if known. */
  specialties: string[];
  workosOrganizationId: string | null;
  scimDomains: string[];
  auditLogSiemEnabled: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: MembershipRole;
  /** Lawyer vs. assistant vs. other support staff. */
  memberType: FirmMemberType;
  /** Whether this member is the firm's main point of contact. */
  isPrimaryContact: boolean;
  /** Free-text job title, e.g. "Partner" or "Paralegal". */
  title: string | null;
  enabled: boolean;
  image: string | null;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  display_name: string;
  email: string;
  image: string | null;
  enabled: boolean;
  emailVerified: string | null;
  phone: string | null;
  phoneVerified: string | null;
  description: string | null;
  company: {
    id: string;
    name: string;
    type: CompanyType;
    whitelisted: boolean;
  };
  role: MembershipRole;
};

/**
 * Business classification of an uploaded document, independent of its MIME type.
 * Drives the type badge in the Documents tab so users can tell at a glance what
 * a file is (e.g. a redline vs. a signed contract vs. a supporting exhibit).
 */
export type DocumentType =
  | 'contract'
  | 'agreement'
  | 'redline'
  | 'exhibit'
  | 'memo'
  | 'signed'
  | 'other';

/**
 * Lifecycle status of a specific document version. `delivered` marks the final
 * work product handed to the client; `final` is a finished, non-delivered
 * version; `draft`/`in_review` are work-in-progress.
 */
export type DocumentStatus = 'draft' | 'in_review' | 'final' | 'delivered';

/**
 * Which side uploaded a document. Mirrors the actor distinction the prod app
 * derives from the uploading message author's company type (client vs. Moritz
 * counsel), plus `ai` for AI-generated first drafts.
 */
export type DocumentUploaderActor = 'client' | 'legal' | 'ai' | 'admin';

export type Document = {
  id: string;
  /** Groups every version of the same logical document together. */
  familyId: string;
  /** 1-based version number within the family; highest is the latest. */
  version: number;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  uploaderActor: DocumentUploaderActor;
  docType: DocumentType;
  status: DocumentStatus;
  isDraft: boolean;
  /** Optional counsel-only note attached to this version in the playground. */
  reviewNote?: string;
};

export type IroncladDocumentKind =
  | 'Executed contract'
  | 'Amendment'
  | 'Template'
  | 'Policy';

export type IroncladDocument = {
  id: string;
  name: string;
  kind: IroncladDocumentKind;
  counterparty: string | null; // null for internal templates/policies
  effectiveDate: string; // ISO - when the source doc was executed/effective
  syncedAt: string; // ISO - when Ironclad pulled it into the case
  summary: string; // one line on why it is relevant
};

export type ParticipantRef = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  actor: 'client' | 'opposing' | 'legal' | 'admin' | 'ai';
  companyName: string | null;
};

/**
 * Payment milestones surfaced inline in the case chat as centered system pills
 * (mirrors the main app's `SystemEventItem`). These are not authored messages —
 * they mark a payment moment in the transcript.
 */
export type PaymentEventKind =
  | 'requested'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'voided';

export type Message = {
  id: string;
  caseId: string;
  body: string;
  createdAt: string;
  author: ParticipantRef;
  attachments?: Document[];
  editedAt?: string | null;
  readAt?: string | null;
  deletedAt?: string | null;
  /**
   * Which phase of the case timeline this message belongs to. Intake messages
   * are the original AI chatbot conversation captured before counsel joined;
   * everything else is the counsel conversation. Undefined is treated as
   * `'counsel'`.
   */
  phase?: 'intake' | 'counsel';
  /**
   * When set, this timeline entry renders as a centered, actionable payment
   * event card instead of a chat bubble. `body` is ignored for rendering; the
   * card copy/CTA is derived from the event kind and (optional) linked invoice.
   */
  paymentEvent?: {
    kind: PaymentEventKind;
    amount: number;
    currency: string;
    /** Links to a mock invoice for description, hosted URL, and CTA context. */
    invoiceId?: string;
    /** A follow-up request on top of an earlier payment ("Additional payment requested"). */
    additional?: boolean;
  } | null;
  /**
   * When set, this timeline entry renders as a centered "Counsel assigned" card
   * marking the intake -> counsel handoff, showing the assigned lawyer.
   */
  lawyerAssignedEvent?: {
    lawyer: ParticipantRef;
  } | null;
};

export type CaseType = {
  id: string;
  name: string;
  description: string;
  requiredInformation: string[];
  templateCount: number;
  updatedAt: string;
};

export type CaseTemplate = {
  id: string;
  caseTypeId: string;
  title: string;
  description: string;
  previewText: string;
  dataRequirements: string[];
  updatedAt: string;
};

// Deliverable in-app notification types — the ones production actually creates
// as rows in the notifications inbox (mirrors the `notification_type` pg enum in
// packages/db-legal-intake). Excludes email-only / unwired enum members
// (COMPANY_CREATED, QUOTE_CREATED, QUOTE_ACCEPTED) that never surface here.
export type InboxNotificationType =
  | 'NEW_MESSAGE'
  | 'CASE_READY_FOR_CLAIM'
  | 'CASE_COLLABORATOR_ADDED'
  | 'CASE_COLLABORATOR_REMOVED'
  | 'CASE_OWNER_CHANGED'
  | 'CASE_CLOSED'
  | 'QUOTE_ROUND_INVITATION'
  | 'QUOTE_ROUND_CLOSED'
  | 'LAWYER_DIRECTLY_ASSIGNED'
  | 'FIRST_DRAFT_HANDED_OFF'
  | 'QA_REVIEW_COMPLETE'
  | 'DRAFT_REVISION_READY'
  | 'INVOICE_CREATED';

export type Notification = {
  id: string;
  type: InboxNotificationType;
  title: string;
  // Optional body snippet (production `notifications.content`).
  content?: string | null;
  read: boolean;
  createdAt: string;
  // Case context shown as a `Case {caseNumber}: {caseTitle}` subtitle.
  caseNumber: string;
  caseTitle: string;
  // Actor who triggered the notification; when an image is present the row
  // shows their avatar instead of the type icon.
  triggeredBy?: { name: string; image: string | null } | null;
  // Only for INVOICE_CREATED: drives the Pay button vs. "Invoice paid" state.
  invoice?: { id: string; status: 'PAID' | 'PENDING' } | null;
  href?: string;
};

export type InvoiceStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PROCESSING'
  | 'PAID'
  | 'VOID'
  | 'REFUNDED'
  | 'UNCOLLECTIBLE';

export type Invoice = {
  id: string;
  number: string;
  caseId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  hostedUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  /** Optional line-item context shown to the client on the payment card. */
  description?: string | null;
  /** Tax collected at checkout, shown on completed payments when known. */
  taxAmount?: number | null;
  /** Amount refunded back to the client (partial or full) on a paid invoice. */
  refundedAmount?: number | null;
  refundedAt?: string | null;
  /** The most recent failed payment attempt on an otherwise open invoice. */
  failure?: { reason: string; attemptedAt: string } | null;
};

export type Payment = {
  id: string;
  caseId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: string;
};

export type ClientEngagementLetter = {
  id: string;
  companyId: string;
  status: 'PENDING' | 'SIGNED';
  requestedAt: string;
  signedAt: string | null;
  signedBy: string | null;
  signedTitle: string | null;
  signatureMethod: 'typed' | 'drawn' | null;
};

export type QuoteRound = {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  clientName: string;
  clientCompany: string;
  opposingPartyName: string;
  opposingPartyCompany: string;
  benchmarkAmount: number | null;
  yourQuoteAmount: number | null;
  yourQuoteStatus:
    | 'NONE'
    | 'SUBMITTED'
    | 'WITHDRAWN'
    | 'CONFLICT'
    | 'WON'
    | 'LOST';
  expiresAt: string;
  anonymised: boolean;
  conflictReported: boolean;
  currency: string;
  description: string;
  adminNotes: string | null;
  documents: Document[];
};

export type LegalCase = {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  anonDescription: string | null;
  status: LegalCaseStatus;
  unreadCount: number;
  quoteAmount: number | null;
  currency: string;
  caseTypeId: string;
  country: string;
  client: ParticipantRef;
  opposingParty: ParticipantRef | null;
  assignedLawyer: ParticipantRef | null;
  ownerCompanyId: string;
  ownerCompanyName: string;
  legalCompanyId: string | null;
  legalCompanyName: string | null;
  claimableCompanyIds: string[];
  participants: ParticipantRef[];
  documents: Document[];
  draftDocuments: Document[];
  draftResponseMarkdown: string | null;
  claimDeadline: string | null;
  receivedAt: string | null;
  sentToFirmsAt: string | null;
  lawyerAssignedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WaitlistEntry = {
  id: string;
  email: string;
  country: string;
  companyName: string;
  status: 'PENDING' | 'CONVERTED' | 'REJECTED';
  createdAt: string;
};

export type AuditLogCategory =
  | 'case'
  | 'company'
  | 'user'
  | 'document'
  | 'billing'
  | 'auth'
  | 'admin';

export type AuditLogEntry = {
  id: string;
  actorName: string;
  actorCompany: string;
  actorRole: CompanyType;
  category: AuditLogCategory;
  operationType: 'read' | 'create' | 'update' | 'delete';
  outcome: 'success' | 'failure';
  action: string;
  targetEntityLabel: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
