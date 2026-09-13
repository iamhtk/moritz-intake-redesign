/**
 * Turns a scope into the grounding block the model actually reads (task N2).
 *
 * This is the artefact the privacy boundary is judged on. `buildAskScope` can
 * be perfectly correct and still leak if the serialiser reaches past it for one
 * field, so `scope.test.ts` asserts against **this string**, not against the
 * projection: string containment is the right assertion because the string is
 * what crosses the wire.
 *
 * Shape borrowed from the source's `buildChatContext`: flat labelled lines,
 * real numbers, no prose. The reason is not aesthetics. A grounding block
 * written as sentences invites the model to continue the sentences — to smooth,
 * to summarise, to infer a connection between two lines that happen to sit
 * together. A block written as records reads as data, and a model quoting a
 * record back is quoting rather than composing.
 *
 * **Every section is present even when empty**, printed as `(0)` with `none`.
 * That is deliberate and it is what makes the quiet state possible: a section
 * that is simply absent leaves the model free to assume the data was withheld
 * and to hedge, or worse, to fill the gap. A section that says `CASES (0)` and
 * `none` is a fact it can report.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO BLOCKS, NOT ONE: THE CLIENT'S IS NOT THE INTERNAL ONE WITH ZEROES IN IT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There used to be a single serialiser for all four roles, and on paper it was
 * safe: the sections a client may not see were projected to `[]` upstream, so
 * they printed as `CLAIMABLE (0)`, `PEOPLE (0)`, `AUDIT LOG (0)`. Nothing
 * leaked. It was still the wrong block to hand a client, for two reasons that
 * the emptiness hid.
 *
 * First, **an empty section still teaches the model the concept.** The rule
 * above — always print the heading — is there so the model can *report* a zero
 * instead of filling a gap. That is right when the reader could have had rows
 * there. A client never can: no client is ever offered claimable work or an
 * audit log. So `CLAIMABLE (0)` is not a reportable fact about their account,
 * it is Moritz's internal pipeline vocabulary sitting in the prompt, and the
 * model will reach for it when a question comes near. The same block was
 * telling Nora that claiming, benchmarking and audit trails are things this
 * conversation is about.
 *
 * Second, **the fields that did carry rows were labelled from the firm's
 * seat.** `claim deadline` is the window in which firms may claim a matter.
 * `type: ct_commercial_review` is a primary key. `client: Alex Morgan` is the
 * reader's own name, read back to them. Each one is a small thing and together
 * they are why the panel read as somebody else's tool.
 *
 * So the client gets `buildClientContext`: their cases, their documents, the
 * services on offer, and nothing whose name only makes sense inside Moritz.
 * The internal roles keep `buildInternalContext` unchanged, because for them
 * every one of those sections is real.
 */

import { caseStatusLabels } from '@/lib/cases/status-labels';
import type { AskScope } from './scope';
import type { CaseType, LegalCase, Role } from '@/lib/types';

/** `2026-09-12`, from an ISO timestamp. Time of day is noise here. */
function day(iso: string | null): string {
  if (!iso) return 'unknown';
  return iso.slice(0, 10);
}

/** `$3,800`, or `none` where no number has been set yet. */
function money(amount: number | null, currency: string): string {
  if (amount === null) return 'none';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * One case as one line, for a lawyer or an internal reader.
 *
 * `summary` is `anonDescription`, the one-sentence version, rather than the
 * full `description`. Two reasons: nine full descriptions are three paragraphs
 * each and would dominate the request for no gain, and nothing Ask is for —
 * status, ownership, what is waiting, which document is where — is answerable
 * only from the long version. Where a reader genuinely wants the full text, the
 * case page has it, which is also the surface where it belongs.
 *
 * Not for clients: see `clientCaseLine`, and the note at the top of the file.
 */
function internalCaseLine(legalCase: LegalCase): string {
  const parts = [
    legalCase.caseNumber,
    `title: ${legalCase.title}`,
    `status: ${legalCase.status}`,
    `type: ${legalCase.caseTypeId}`,
    `client: ${legalCase.client.name}`,
    `company: ${legalCase.ownerCompanyName}`,
    `lawyer: ${legalCase.assignedLawyer?.name ?? 'unassigned'}`,
    `opposing: ${legalCase.opposingParty?.name ?? 'none'}`,
    `quote: ${money(legalCase.quoteAmount, legalCase.currency)}`,
    `documents: ${legalCase.documents.length}`,
    `drafts: ${legalCase.draftDocuments.length}`,
    `unread: ${legalCase.unreadCount}`,
    `opened: ${day(legalCase.receivedAt ?? legalCase.createdAt)}`,
    `updated: ${day(legalCase.updatedAt)}`,
  ];
  if (legalCase.claimDeadline) {
    parts.push(`claim deadline: ${day(legalCase.claimDeadline)}`);
  }
  if (legalCase.anonDescription) {
    parts.push(`summary: ${legalCase.anonDescription}`);
  }
  return `- ${parts.join(' | ')}`;
}

/**
 * One case as one line, for the client whose case it is.
 *
 * Every label is written from the reader's seat, and the differences from
 * `internalCaseLine` are all deliberate:
 *
 * - **`status` is the badge's own words**, not the enum. The client is very
 *   likely looking at "In progress" on a badge while they ask; Nora saying
 *   `IN_PROGRESS`, or inventing a gloss for it, is the defect `notes/NOTE.md`
 *   §7 already caught once.
 * - **`type` is the service name**, not `ct_commercial_review`. A primary key
 *   in a prompt is something the model will eventually quote at the reader.
 * - **`your lawyer` rather than `lawyer`**, and `not assigned yet` rather than
 *   `unassigned` — the client's question is "who is working on this", and
 *   "unassigned" describes Moritz's queue rather than their matter.
 * - **`your price` rather than `quote`**, and it comes from `quoteAmount`,
 *   which is the figure on their own screen. This is the field that replaced
 *   the whole QUOTE ROUNDS section; see the note in `scope.ts`.
 * - **`claim deadline` is dropped.** It is the window in which firms may claim
 *   the matter: Moritz's internal clock, not a date the client acts on, and a
 *   deadline in front of a client reads as one they are about to miss.
 * - **`company` is dropped.** It is their own, and the header already says it.
 * - **`opened by` appears only when somebody else opened it.** A client's cases
 *   include ones a colleague at their company raised, and "who raised this" is
 *   a fair question. On their own cases the line was `opened by: Alex Morgan`
 *   read back to Alex Morgan, which is the thing rule 6 of the client prompt
 *   forbids: the block should not hand the model the reader's own name as a
 *   third party and then be told not to use it.
 * - **`summary` is dropped, and this one is not a matter of taste.**
 *   `anonDescription` is documented in `lib/mocks/submitted-cases.ts` as "the
 *   line the firm's lawyers see before a case is claimed" — the anonymised
 *   blurb written for the bidding view. It reads "A non-legal company wants
 *   advice on exiting a warehousing and distribution MSA early", so putting it
 *   in the client's block makes Nora describe the reader to themselves as an
 *   anonymous category of counterparty. The client's own narrative is
 *   `description`, which is three paragraphs and would dominate the request;
 *   `title` and `type` already say what the matter is, and the case page has
 *   the full text.
 */
function clientCaseLine(
  legalCase: LegalCase,
  serviceNames: Map<string, string>,
  askingUserId: string,
): string {
  const parts = [
    legalCase.caseNumber,
    `title: ${legalCase.title}`,
    `status: ${caseStatusLabels[legalCase.status]}`,
    `type: ${serviceNames.get(legalCase.caseTypeId) ?? legalCase.caseTypeId}`,
    `your lawyer: ${legalCase.assignedLawyer?.name ?? 'not assigned yet'}`,
    `other side: ${legalCase.opposingParty?.name ?? 'none'}`,
    `your price: ${
      legalCase.quoteAmount === null
        ? 'not quoted yet'
        : money(legalCase.quoteAmount, legalCase.currency)
    }`,
    `documents: ${legalCase.documents.length}`,
    `drafts: ${legalCase.draftDocuments.length}`,
    `unread messages: ${legalCase.unreadCount}`,
    `opened: ${day(legalCase.receivedAt ?? legalCase.createdAt)}`,
    `last update: ${day(legalCase.updatedAt)}`,
  ];
  if (legalCase.client.id !== askingUserId) {
    parts.push(`opened by a colleague: ${legalCase.client.name}`);
  }
  return `- ${parts.join(' | ')}`;
}

/** A labelled section with its count, and `none` rather than nothing. */
function section(heading: string, lines: string[]): string {
  const body = lines.length > 0 ? lines.join('\n') : 'none';
  return `${heading} (${lines.length})\n${body}`;
}

/** `ct_commercial_review` -> `Commercial contract review`. */
function serviceNamesOf(caseTypes: CaseType[]): Map<string, string> {
  return new Map(caseTypes.map((caseType) => [caseType.id, caseType.name]));
}

/**
 * The grounding block for one request.
 *
 * Dispatches on the role rather than parameterising one serialiser, because the
 * client block and the internal block differ in which sections exist at all and
 * not merely in what they contain. See the note at the top of the file.
 *
 * @param now injected rather than read from the clock so the serialiser is
 *   deterministic and `scope.test.ts` can assert the whole string. The route
 *   passes `new Date()`.
 */
export function buildAskContext(scope: AskScope, now: Date): string {
  return scope.role === 'NON_LEGAL'
    ? buildClientContext(scope, now)
    : buildInternalContext(scope, now);
}

/**
 * What a client is told about: their own matters, and nothing named after a
 * Moritz process.
 *
 * Three sections, and the count is the point. There is no CLAIMABLE, no QUOTE
 * ROUNDS, no COMPANIES, no PEOPLE and no AUDIT LOG — not projected to empty,
 * *absent* — because a client can never have rows in any of them, so printing
 * the heading only puts the vocabulary in reach. The "always print the heading"
 * rule still holds for the three that are here: a client with no cases yet gets
 * `YOUR CASES (0)` and `none`, which is a fact Nora can report.
 */
function buildClientContext(scope: AskScope, now: Date): string {
  const sections: string[] = [];
  const serviceNames = serviceNamesOf(scope.caseTypes);

  /*
   * Same generated-at reasoning as the internal block: the model has no clock,
   * and without a date "last week" and "recently" are guesses.
   *
   * `role:` is deliberately not here. `NON_LEGAL` is our own taxonomy — it
   * describes the reader by what they are not — and there is nothing for the
   * model to do with it that the client prompt does not already say.
   */
  sections.push(
    [
      'MORITZ CONTEXT',
      `generated at: ${now.toISOString()}`,
      `asking: ${scope.user.name}`,
      `company: ${scope.user.company.name}`,
    ].join('\n'),
  );

  sections.push(
    section(
      'YOUR CASES',
      scope.cases.map((legalCase) =>
        clientCaseLine(legalCase, serviceNames, scope.user.id),
      ),
    ),
  );

  /*
   * Metadata only, exactly as for the internal roles: name, type, size, when.
   * A client asking "did you get the lease I sent" needs the filename and the
   * date, not the text.
   */
  sections.push(
    section(
      'YOUR DOCUMENTS',
      scope.documents.map((document) =>
        [
          `- ${document.name}`,
          `type: ${document.docType}`,
          `status: ${document.status}`,
          `draft: ${document.isDraft}`,
          `version: ${document.version}`,
          `uploaded: ${day(document.uploadedAt)}`,
        ].join(' | '),
      ),
    ),
  );

  /*
   * The services Moritz offers, with what each one needs from the client.
   * Framed as an offer rather than as reference data, because for a client this
   * is the one forward-looking thing in the block: it is what lets "can you
   * help with an NDA" be answered with the service that covers it and what to
   * have ready, rather than with a shrug.
   */
  sections.push(
    section(
      'SERVICES MORITZ OFFERS',
      scope.caseTypes.map((caseType) =>
        [
          `- ${caseType.name}`,
          `about: ${caseType.description}`,
          `what we need from you: ${
            caseType.requiredInformation.length > 0
              ? caseType.requiredInformation.join('; ')
              : 'nothing specific'
          }`,
        ].join(' | '),
      ),
    ),
  );

  return sections.join('\n\n');
}

/**
 * What a lawyer, admin or assistant is told about. Unchanged: for these readers
 * claimable work, quote rounds, the directory and the audit log are all real
 * parts of the job, and the projection in `scope.ts` is what decides which of
 * them carry rows.
 */
function buildInternalContext(scope: AskScope, now: Date): string {
  const sections: string[] = [];

  /*
   * The generated-at line, without which "today", "this week" and every
   * deadline in the block are unresolvable — the model has no clock, and a
   * model guessing the date will answer "overdue" and "due next week" about the
   * same deadline on two different days.
   */
  sections.push(
    [
      'MORITZ CONTEXT',
      `generated at: ${now.toISOString()}`,
      `asking: ${scope.user.name}`,
      `role: ${scope.role}`,
      `company: ${scope.user.company.name}`,
    ].join('\n'),
  );

  sections.push(section('CASES', scope.cases.map(internalCaseLine)));

  /*
   * Kept as its own section rather than folded into `CASES`. A lawyer's
   * unclaimed work is offered, not owned, and a single list would let "how many
   * matters do I have" be answered with a number that includes work that is
   * not theirs.
   */
  sections.push(section('CLAIMABLE', scope.claimable.map(internalCaseLine)));

  sections.push(
    section(
      'QUOTE ROUNDS',
      scope.quoteRounds.map((round) =>
        [
          `- ${round.caseNumber}`,
          `title: ${round.caseTitle}`,
          `your quote: ${money(round.yourQuoteAmount, round.currency)}`,
          `status: ${round.yourQuoteStatus}`,
          `benchmark: ${money(round.benchmarkAmount, round.currency)}`,
          `expires: ${day(round.expiresAt)}`,
          `conflict reported: ${round.conflictReported}`,
        ].join(' | '),
      ),
    ),
  );

  /*
   * Metadata only — name, type, size, when. No document *contents*, which is
   * both the V40 confidentiality stance and the practical answer: the model is
   * being asked which document is where, not what clause 14 says.
   */
  sections.push(
    section(
      'DOCUMENTS',
      scope.documents.map((document) =>
        [
          `- ${document.name}`,
          `type: ${document.docType}`,
          `status: ${document.status}`,
          `draft: ${document.isDraft}`,
          `version: ${document.version}`,
          `uploaded: ${day(document.uploadedAt)}`,
        ].join(' | '),
      ),
    ),
  );

  sections.push(
    section(
      'CASE TYPES',
      scope.caseTypes.map(
        (caseType) => `- ${caseType.id} | name: ${caseType.name}`,
      ),
    ),
  );

  sections.push(
    section(
      'COMPANIES',
      scope.companies.map((company) =>
        [
          `- ${company.name}`,
          `type: ${company.type}`,
          `country: ${company.country}`,
          `plan: ${company.paymentPlan}`,
        ].join(' | '),
      ),
    ),
  );

  /*
   * Names, roles and companies. Deliberately not phone numbers or verification
   * timestamps: §8.3 withholds "client contact details beyond the case" even
   * from a lawyer, and an internal directory is a place that rule is easy to
   * lose track of.
   */
  sections.push(
    section(
      'PEOPLE',
      scope.people.map((person) =>
        [
          `- ${person.name}`,
          `company: ${person.company.name}`,
          `type: ${person.company.type}`,
          `membership: ${person.role}`,
        ].join(' | '),
      ),
    ),
  );

  sections.push(
    section(
      'AUDIT LOG',
      scope.auditLog.map((entry) =>
        [
          `- ${day(entry.createdAt)}`,
          `actor: ${entry.actorName}`,
          `role: ${entry.actorRole}`,
          `action: ${entry.action}`,
          `target: ${entry.targetEntityLabel}`,
          `outcome: ${entry.outcome}`,
        ].join(' | '),
      ),
    ),
  );

  return sections.join('\n\n');
}

/**
 * The system prompt a **client** gets on the "Your cases" tab.
 *
 * Same eight rules of answering as the internal prompt, because those are about
 * *how* to answer and are right for anyone. What is added is the half that only
 * applies to a client, and each line of it is there to stop a specific way the
 * old shared prompt talked past them:
 *
 * - **Say who the reader is.** The block is their own account, so "your case"
 *   and "your lawyer" are the accurate words. The internal prompt is written
 *   about third parties, and a model given a case with `client: Alex Morgan`
 *   will happily describe Alex to Alex.
 * - **No internal process.** Claiming, assignment queues, price benchmarks and
 *   how many firms were invited are all things Nora used to have sight of one
 *   way or another. None of it is the client's business and none of it helps
 *   them; it just makes the answer sound like a status report from inside a
 *   supplier.
 * - **Information, not advice.** This is the one rule the general-legal tab
 *   already had and the grounded tab did not, and the asymmetry was backwards:
 *   the grounded tab is the one where Nora is holding the client's actual
 *   contract, which is exactly where "you should probably accept this" would do
 *   damage. Reading their file back to them is fine. Telling them what to do
 *   about it is a lawyer's job, and there is a real one on the case.
 *
 * Scoping is still **not** in here, for the same reason as ever: it lives in
 * `buildAskScope`, because a boundary a model is asked to respect holds most of
 * the time, and most of the time is not a boundary.
 *
 * Not cached, for the reason given on `ASK_SYSTEM_PROMPT`.
 */
export const ASK_CLIENT_SYSTEM_PROMPT = `You are Nora, the assistant inside Moritz, a legal service where companies get contract work done by real lawyers.

You are speaking to the client themselves, about their own matters. The MORITZ CONTEXT block in the user's message is their account: their cases, their documents, and the services Moritz offers. You answer from that block and from nothing else. If it is not in the block, it does not exist for this conversation.

How to answer:

1. Be short. Three sentences is usually plenty. A reader who wants more will ask.
2. Name your basis. When an answer rests on a case, give its number, e.g. M-2026-0126. Never give a case number that is not in the context block.
3. If the context does not answer the question, say so plainly and stop. Do not guess, do not reason from what is usually true of legal matters, and do not offer a general answer dressed as a specific one. "There is nothing on your side about that" is a complete and useful reply.
4. Never say you have done something. You cannot change anything, send anything or file anything. You describe what is there and, where it helps, point at the screen where they can act.
5. Use the numbers in the block rather than words like "several" or "a few". If there are four cases, say four.
6. Write to them about their own case. Say "your case", "your lawyer", "your documents". Never describe them to themselves in the third person, and never read their own name back to them as the client on a case.
7. Say what their price is only from the price in the block. Never estimate one, never explain how Moritz arrives at a price, and never mention benchmarks, other firms' fees or what similar work costs.
8. Do not explain Moritz's internal process. Claiming, assignment, review queues and how work is shared between firms are not their concern. Describe where their case has got to and what happens next for them.
9. Give information, not advice. You may say what a document is, what stage a case is at and what a clause is called. You must not say what they should do, predict how a matter will turn out, or judge whether a price or a term is good. Their lawyer at Moritz is the person for that, and you can say so.
10. Plain sentences. No headings, no bullet lists unless you are genuinely listing more than three things, and no bold.
11. Never use dashes as punctuation. Write in full sentences instead.
12. Do not mention the context block, the words "provided", "based on the data", or how you were given this information. Just answer.`;

/**
 * The system prompt for a lawyer, admin or assistant.
 *
 * The five rules carried over from the source's AI discipline (§8.6) are here
 * as instructions because four of them are about *how to answer*, which is the
 * only thing a prompt can be trusted with. The fifth — scoping — is
 * deliberately **not** in here: it lives in `buildAskScope`, because a boundary
 * a model is asked to respect is a boundary that holds most of the time, and
 * most of the time is not a boundary. There is nothing in this prompt saying
 * "only discuss the user's own cases", because there is nothing else in the
 * request to discuss.
 *
 * Not cached. §8.11 left this open and the answer is no: a `cache_control`
 * breakpoint below a model's minimum cacheable prefix is silently ignored —
 * no error, no warning, nothing in the response — and `EXTRACTION_MODEL`'s
 * floor is well above this prompt's length. Padding it to reach the floor would
 * be spending tokens to look thrifty, which §8.11 rules out by name. The
 * context block changes every request in any case, so there is no stable prefix
 * worth caching.
 */
export const ASK_SYSTEM_PROMPT = `You are Nora, the assistant inside Moritz, a legal service where companies get contract work done by real lawyers.

You answer from the MORITZ CONTEXT block in the user's message and from nothing else. That block is everything you know. It has already been filtered to what this person is allowed to see, so you never need to decide whether something is private: if it is not in the block, it does not exist for this conversation.

How to answer:

1. Be short. Three sentences is usually plenty. A reader who wants more will ask.
2. Name your basis. When an answer rests on a case, give its number, e.g. M-2026-0126. Never give a case number that is not in the context block.
3. If the context does not answer the question, say so plainly and stop. Do not guess, do not reason from what is usually true of legal matters, and do not offer a general answer dressed as a specific one. "There is nothing on your side about that" is a complete and useful reply.
4. Never say you have done something. You cannot change anything, send anything or file anything. You describe what is there and, where it helps, point at the screen where a person can act.
5. Use the numbers in the block rather than words like "several" or "a few". If there are four cases, say four.
6. Plain sentences. No headings, no bullet lists unless you are genuinely listing more than three things, and no bold.
7. Never use dashes as punctuation. Write in full sentences instead.
8. Do not mention the context block, the words "provided", "based on the data", or how you were given this information. Just answer.`;

/**
 * The general-legal-information prompt, for the second mode.
 *
 * A separate prompt *and* a separate history, per §8.6. The histories must not
 * share a transcript, because a general-information sentence sitting in the
 * same thread as a firm answer becomes citable as the basis for it — and this
 * app is client-facing, where that confusion is not an inconvenience but a
 * client believing they have been advised.
 */
export const ASK_GENERAL_SYSTEM_PROMPT = `You are Nora, answering general questions about how commercial legal work usually goes. You are inside Moritz, a legal service where companies get contract work done by real lawyers.

You have no access to this person's cases, documents or quotes in this mode. If they ask about their own matter, tell them to switch to the mode that reads their cases, and do not attempt an answer.

How to answer:

1. Be short. Three sentences is usually plenty.
2. Answer in general terms only. Explain what a term means, what a clause usually does, what a process normally involves.
3. Never give advice on a specific situation, never predict an outcome, and never tell someone what they should do about their own contract. Say that a lawyer at Moritz can look at it.
4. If you are not confident, say so. A wrong explanation of a legal term is worse than no explanation.
5. Plain sentences. No headings, no bold.
6. Never use dashes as punctuation. Write in full sentences instead.`;

/**
 * The grounded-tab prompt for a role.
 *
 * A function rather than a ternary in the route, so that the pairing of block
 * and prompt lives next to both of them. The client block drops five sections
 * and renames the labels in the two it keeps; a route that picked the internal
 * prompt for a client would be describing a block that is not there.
 *
 * Exhaustive over the four roles by way of the `NON_LEGAL` test plus a default,
 * because the three internal roles genuinely do share one prompt and listing
 * them separately would suggest a difference that does not exist.
 */
export function askSystemPrompt(role: Role): string {
  return role === 'NON_LEGAL' ? ASK_CLIENT_SYSTEM_PROMPT : ASK_SYSTEM_PROMPT;
}
