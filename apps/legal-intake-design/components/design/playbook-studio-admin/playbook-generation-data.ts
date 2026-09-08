/**
 * Mock dataset + shared types for the "generate a playbook from a document"
 * demo flow. When the user attaches a document to the Playbook Assistant and
 * asks it to build a playbook, the editor streams these templates into the
 * left-hand panel card-by-card. Playground-only — no backend, no real
 * extraction; the content is canned so the demo reads convincingly for any
 * uploaded document.
 */

import type { PlaybookRule } from './playbook-studio-data';

/** A generated rule without an `id` — the editor assigns one on append. */
export type GeneratedRuleTemplate = Omit<PlaybookRule, 'id'>;

export type GenerationPhase =
  | 'idle'
  | 'reading'
  | 'extracting'
  | 'building'
  | 'done';

/**
 * Shared generation state. Owned by the editor (which drives the card stream)
 * and read by the assistant panel so the chat and left panel stay in sync.
 */
export interface GenerationState {
  phase: GenerationPhase;
  documentName?: string;
  totalRules: number;
  builtRules: number;
  currentRuleTitle?: string;
}

export const IDLE_GENERATION: GenerationState = {
  phase: 'idle',
  totalRules: 0,
  builtRules: 0,
};

/**
 * ~13 recipient-favorable commercial-agreement rules used for the demo stream.
 * Each carries a preferred position (with language + comment), one or two
 * fallbacks, and an internal guidance note so every card renders a full set of
 * fields as it reveals.
 */
export const demoGeneratedRules: GeneratedRuleTemplate[] = [
  {
    title: 'Confidentiality Term - 2 Years Maximum',
    preferredPosition:
      'Confidentiality obligations should expire no later than two (2) years after disclosure or termination, except for trade secrets which remain protected only as long as they qualify as trade secrets under applicable law.',
    preferredLanguage:
      'The obligations of confidentiality with respect to Confidential Information will terminate two (2) years following the date of disclosure, except that trade secrets will remain protected for so long as they qualify as trade secrets under applicable law.',
    preferredComment:
      'A two-year term is market standard for mutual NDAs. Longer periods create unnecessary exposure for the recipient; trade secret protection under applicable law covers truly sensitive information beyond the general term.',
    guidanceNote:
      'This is a hard line for most clients. Do NOT accept terms longer than 3 years. If the counterparty pushes past 2 years, escalate to the partner before agreeing to 3. Only accept the 3-year fallback when deal value exceeds $5M or the client has explicitly approved flexibility.',
    fallbacks: [
      {
        position:
          'A three (3) year term is acceptable if limited to specifically identified Confidential Information and trade secrets remain protected under applicable law.',
        language:
          'The confidentiality obligations will terminate three (3) years after disclosure for all Confidential Information except trade secrets, which remain protected under applicable law.',
        comment:
          'A common compromise most counterparties accept without further negotiation.',
      },
    ],
  },
  {
    title: 'Definition of Confidential Information - Marking Required',
    preferredPosition:
      'Information should only qualify as Confidential Information if it is marked confidential in writing, or, when disclosed orally, identified as confidential and summarized in writing within thirty (30) days.',
    preferredLanguage:
      'Confidential Information means information disclosed in tangible form and marked "Confidential", or disclosed orally and identified as confidential at the time of disclosure and confirmed in a written summary within thirty (30) days.',
    preferredComment:
      'A marking requirement gives the recipient a clear, auditable boundary of what is actually protected and avoids open-ended obligations over everything exchanged.',
    guidanceNote:
      'Prefer a marking requirement wherever the client is primarily the recipient of information. If the counterparty insists on protecting all disclosed information regardless of marking, accept only with the reasonable-person fallback and flag the broadened scope to the deal lead.',
    fallbacks: [
      {
        position:
          'Unmarked information is acceptable as Confidential Information only where a reasonable person would understand it to be confidential given its nature and the circumstances of disclosure.',
        comment:
          'Keeps scope objective while removing the strict written-marking requirement.',
      },
    ],
  },
  {
    title: 'Exception for Independently Developed Information',
    preferredPosition:
      "Confidential Information should exclude information independently developed by the recipient or its representatives without use of the disclosing party's Confidential Information.",
    preferredLanguage:
      'Confidential Information does not include information independently developed by the Receiving Party or its Representatives without use of or reference to the Confidential Information.',
    preferredComment:
      "The independent development carve-out protects the client's ongoing R&D from claims that internally developed technology infringes the discloser's confidential information.",
    guidanceNote:
      'Essential for technology clients with active R&D programs. If the counterparty insists on removing it, flag to the partner immediately — it can expose the client to IP infringement claims on their own independent work. The written-records fallback is acceptable; advise the client to maintain development logs.',
    fallbacks: [
      {
        position:
          'Independent development exception is acceptable if limited to development without use of the Confidential Information and supported by written records.',
      },
    ],
  },
  {
    title: 'Exception for Prior Possession',
    preferredPosition:
      "Confidential Information should exclude information already in the recipient's possession from a source other than the disclosing party, provided it was not acquired in breach of a confidentiality obligation.",
    preferredLanguage:
      'Confidential Information does not include information already known to the Receiving Party from a source other than the Disclosing Party, so long as such information was not acquired in breach of any confidentiality obligation.',
    guidanceNote:
      'Prior-possession claims are hard to prove after the fact. Advise the client to keep dated records showing the information was already held before disclosure — without documentation this exception is difficult to rely on if challenged.',
    fallbacks: [
      {
        position:
          'Prior possession exception is acceptable if limited to documented possession and not derived from the disclosing party.',
      },
    ],
  },
  {
    title: 'Exception for Third Party Sources',
    preferredPosition:
      'Confidential Information should exclude information received from a third party without restriction and without breach of any confidentiality obligation.',
    preferredLanguage:
      'Confidential Information does not include information rightfully received from a third party without restriction and without breach of any confidentiality obligation.',
    guidanceNote:
      "This carve-out is only as strong as the client's diligence. If the client has reason to believe a third-party source is itself bound by confidentiality, the exception won't apply — flag any sources that look like they originate from the disclosing party's ecosystem.",
    fallbacks: [
      {
        position:
          'Third party exception is acceptable if the recipient has no reason to know the third party was bound by confidentiality.',
      },
    ],
  },
  {
    title: 'Standard of Care - Commercially Reasonable',
    preferredPosition:
      'Recipient must protect Confidential Information using commercially reasonable measures, but not less than the care used to protect its own information of similar sensitivity.',
    preferredLanguage:
      'Receiving Party will protect Confidential Information using commercially reasonable measures, and in no event less than the care it uses to protect its own Confidential Information of similar sensitivity.',
    preferredComment:
      "A 'commercially reasonable' standard with a floor tied to the recipient's own practices is market standard. Avoid 'best efforts' or 'highest degree of care' — these create an unreasonably high, uninsurable bar.",
    guidanceNote:
      "If the counterparty proposes 'best efforts' or 'highest degree of care', reject immediately — these standards are uninsurable and expose the client to disproportionate liability. Accept the reasonable-care fallback only if the floor provision is preserved.",
    fallbacks: [
      {
        position:
          "A reasonable care standard is acceptable if it includes a floor tied to the recipient's own confidential information practices.",
        comment:
          "The floor tied to the recipient's own practices provides objective benchmarking.",
      },
    ],
  },
  {
    title: 'Compelled Disclosure - Notice and Cooperation',
    preferredPosition:
      'The recipient may disclose Confidential Information to the extent required by law or court order, provided it gives prompt written notice (where legally permitted) and reasonable cooperation to allow the disclosing party to seek protective treatment.',
    preferredLanguage:
      'If the Receiving Party is required by law, regulation, or legal process to disclose Confidential Information, it may do so provided that, where legally permitted, it gives the Disclosing Party prompt written notice and reasonable cooperation, at the Disclosing Party\u2019s expense, to seek a protective order or other appropriate remedy.',
    preferredComment:
      'Notice-and-cooperation preserves the disclosing party\u2019s remedies without exposing the recipient to breach for complying with the law.',
    guidanceNote:
      'Ensure the notice obligation is qualified by "where legally permitted" — some regulators and law-enforcement processes prohibit tipping off. Cooperation should be at the disclosing party\u2019s expense.',
    fallbacks: [
      {
        position:
          'Acceptable to narrow notice to circumstances where it is legally permitted and practicable, with cooperation limited to the disclosing party\u2019s reasonable expense.',
      },
    ],
  },
  {
    title: 'Retention of Electronic Backup Copies',
    preferredPosition:
      'Return and destruction obligations must allow retention of routine electronic backup copies, subject to ongoing confidentiality obligations.',
    preferredLanguage:
      'Notwithstanding return or destruction obligations, the Receiving Party may retain copies in routine electronic backup systems, which will remain subject to confidentiality obligations until deleted in the ordinary course.',
    guidanceNote:
      "Nearly always accepted. Confirm IT can actually honor deletion 'in the ordinary course' so the client isn't promising manual purges of backup systems it can't practically perform.",
    fallbacks: [
      {
        position:
          'Backup retention is acceptable if access is restricted and confidentiality obligations survive.',
      },
    ],
  },
  {
    title: 'Retention for Legal and Compliance Purposes',
    preferredPosition:
      'The recipient may retain one archival copy of Confidential Information as required by law, regulation, or bona fide internal compliance and record-retention policies, subject to continuing confidentiality obligations.',
    preferredLanguage:
      'The Receiving Party may retain one (1) copy of Confidential Information to the extent required by applicable law, regulation, or its bona fide document-retention or compliance policies, which copy will remain subject to the confidentiality obligations of this Agreement for so long as it is retained.',
    preferredComment:
      'Regulated clients (financial services, healthcare) cannot certify full destruction; a compliance-retention carve-out avoids putting the client in immediate breach.',
    guidanceNote:
      'Mandatory for regulated clients. Confirm the retained copy stays subject to confidentiality "for so long as retained" rather than the general term, so protection does not lapse while the archival copy still exists.',
    fallbacks: [
      {
        position:
          'Acceptable to limit retention to legal-hold and regulatory requirements only, excluding general internal policy retention.',
      },
    ],
  },
  {
    title: 'Use of General Concepts Permitted',
    preferredPosition:
      'A residual knowledge carve-out should permit use of general ideas, concepts, and know-how retained in unaided memory, provided there is no intentional memorization.',
    preferredLanguage:
      'Nothing in this Agreement restricts the use of Residual Knowledge retained in the unaided memory of Representatives who have had access to Confidential Information, provided there was no intentional memorization.',
    guidanceNote:
      "Residual-knowledge clauses are contentious — many disclosing parties reject them outright. Treat this as a nice-to-have rather than a hard line; drop it before escalating if the counterparty pushes back, unless the client's team routinely works on competing products.",
    fallbacks: [
      {
        position:
          'Residual knowledge carve-out is acceptable if limited to non-confidential concepts and unaided memory.',
      },
    ],
  },
  {
    title: 'No License or Proprietary Rights Grant',
    preferredPosition:
      'Disclosure does not grant any license or rights to use, commercialize, or exploit Confidential Information.',
    preferredLanguage:
      'No rights or licenses are granted by disclosure of Confidential Information, whether by implication, estoppel, or otherwise.',
    guidanceNote:
      'Standard boilerplate; rarely negotiated. Just make sure it disclaims both express and implied licenses so disclosure can\u2019t be argued as an implied grant of rights.',
    fallbacks: [
      {
        position:
          'No-license language is acceptable if it covers both express and implied rights.',
      },
    ],
  },
  {
    title: 'No Warranty on Confidential Information',
    preferredPosition:
      'Confidential Information should be provided "as is", with the disclosing party disclaiming all warranties as to its accuracy or completeness and disclaiming liability for the recipient\u2019s reliance on it.',
    preferredLanguage:
      'All Confidential Information is provided "AS IS". The Disclosing Party makes no representations or warranties, express or implied, as to the accuracy or completeness of the Confidential Information, and will have no liability arising from the Receiving Party\u2019s use of or reliance on it.',
    preferredComment:
      'A mutual "as is" disclaimer is standard and protects whichever party is disclosing at a given time from downstream reliance claims.',
    guidanceNote:
      'Keep this mutual. If the counterparty seeks to carve out warranties on their disclosures while binding the client to an "as is" standard, push back — the disclaimer should apply symmetrically to both parties.',
    fallbacks: [
      {
        position:
          'Acceptable to acknowledge that nothing limits liability for fraud or willful misrepresentation.',
      },
    ],
  },
  {
    title: 'Remedies - Injunctive Relief Without Waiver of Damages',
    preferredPosition:
      'Either party may seek injunctive relief for breach of confidentiality, but only in addition to (not in lieu of) other available remedies, and without any agreed waiver of the requirement to prove irreparable harm.',
    preferredLanguage:
      'Each party acknowledges that a breach of this Agreement may cause harm for which monetary damages are an inadequate remedy, and that the non-breaching party may seek injunctive relief in addition to any other remedies available at law or in equity.',
    preferredComment:
      '"May cause" and "may seek" preserve the recipient\u2019s ability to contest irreparable harm, rather than conceding it up front as many aggressive drafts require.',
    guidanceNote:
      'Resist language stating breach "will cause irreparable harm" or that the disclosing party "shall be entitled" to an injunction — that concedes the standard for injunctive relief. Keep it permissive ("may cause", "may seek") and avoid any waiver of the bond requirement.',
    fallbacks: [
      {
        position:
          'Acceptable to acknowledge that damages may be inadequate, provided the clause does not waive the requirement to prove entitlement to equitable relief or the posting of a bond.',
      },
      {
        position:
          'Acceptable to state each party retains all remedies at law and equity without a stipulation as to irreparable harm.',
      },
    ],
  },
];
