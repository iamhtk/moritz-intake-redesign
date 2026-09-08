/**
 * Pylon Provider Playbook seed data.
 *
 * Generated from the Quick export CSV (37 negotiation positions).
 * Do not hand-edit cell values — regenerate from the CSV if the source changes.
 */

export interface PylonPlaybookRow {
  id: string;
  name: string;
  benefitToPylon: string;
  category: string;
  contractType: string;
  severity: string;
  standardMsaGuidelineSummary: string;
  firstPosition: string;
  fallback1: string;
  fallback2: string;
  fallback3: string;
  walkAwayTrigger: string;
  precedent: string;
  rationale: string;
  openQuestions: string;
}

export interface PylonPlaybookColumn {
  key: string;
  label: string;
  type: string;
  enumOptions?: string[];
}

export interface PylonPlaybookSchema {
  id: string;
  name: string;
  description: string;
  columns: PylonPlaybookColumn[];
}

export const pylonPlaybookRows: PylonPlaybookRow[] = [
  {
    id: 'pp-001',
    name: 'Non-Solicitation Covenants',
    benefitToPylon:
      "Protects Pylon's freedom to develop and market products and to hire.",
    category: 'Boilerplate',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      'The standard form contains no non-solicitation covenants. Not addressed in the written playbook; Pylon Legal reverted customer-added customer- and employee-non-solicitation clauses in the Retell deal.',
    firstPosition:
      "No non-solicitation covenants in the services agreement\n\nPosition (Pylon Legal): 'Pylon cannot agree to customer non-solicitation restrictions that could limit ordinary business development or independent product activity'; and 'Pylon does not agree to employee non-solicitation covenants in the ToS. General hiring restrictions are not appropriate for this services agreement.'",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Reject non-solicitation of customers/end users and of employees; escalate to legal if made a deal-blocker (no pre-approved fallback). If any customer-non-solicit is entertained, it must include the independent-development carve-out shown in precedent.',
    precedent:
      "Retell cumulative redline: customer added a 'NON-SOLICITATION' article (customers: 3-year restriction on using Customer data to solicit/divert Customer's customers/end users, with an 'Independent Development Carve-Out'; and employees: 12-month mutual no-solicit with general-solicitation exceptions). Pylon Legal reverted both: 'Pylon cannot agree to customer non-solicitation restrictions that could limit ordinary business development or independent product activity'; 'Pylon does not agree to employee non-solicitation covenants in the ToS.'",
    rationale:
      "Customer non-solicit could constrain Pylon's independent product and go-to-market activity; employee non-solicit is inappropriate for a SaaS services contract.",
    openQuestions:
      'Non-solicitation is not covered in the written Legal Playbook; the reject-position is sourced only from Retell deal comments. Confirm it should be codified as policy.',
  },
  {
    id: 'pp-002',
    name: 'Governing Law & Venue',
    benefitToPylon: 'Removes a low-substance blocker in large deals.',
    category: 'Boilerplate',
    contractType: 'MSA/ToS',
    severity: 'Acceptable',
    standardMsaGuidelineSummary:
      "Standard §9.8 sets Delaware law and exclusive venue in New Castle County, Delaware. Not addressed in the written playbook; in the Modern Treasury enterprise deal Pylon accepted the customer's California / San Francisco governing law and venue.",
    firstPosition:
      "Delaware law; New Castle County, Delaware venue\n\nStandard §9.8: 'This Agreement shall be governed by the laws of the State of Delaware without regard to its conflict of laws provisions. All claims … will be brought exclusively in the federal or state courts located in New Castle County, Delaware.'",
    fallback1:
      "Accept customer's home-state governing law/venue (enterprise)\n\nModern Treasury (accepted): governing law changed from Delaware to 'California' and venue from 'New Castle County, Delaware' to 'San Francisco, California.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "No internal guidance recorded (inference): governing-law changes are a customary enterprise concession; confirm with legal before agreeing to a customer's home jurisdiction, especially non-US venues.",
    precedent:
      "Standard §9.8 (Delaware). Modern Treasury cumulative redline: 'Delaware' → 'California'; 'New Castle County, Delaware' → 'San Francisco, California.'",
    rationale:
      'Governing law/venue is a common enterprise ask with limited substantive risk when moving between US commercial jurisdictions.',
    openQuestions:
      "The Legal Playbook records no position on governing law/venue; the only evidence is the Modern Treasury concession to California/San Francisco. Confirm whether a standard fallback (e.g., customer's US home state only) should be codified.",
  },
  {
    id: 'pp-003',
    name: 'BAA (HIPAA)',
    benefitToPylon: 'Ensures HIPAA compliance with minimal negotiation risk.',
    category: 'Data / Security',
    contractType: 'BAA',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "Pylon offers a standard BAA for customers handling PHI. Redline Thresholds: sign standard Pylon BAA, no redlines / no customer paper below Enterprise; Enterprise BAA redlines 'considered case-by-case.' Customers may ask to attach the BAA for review.",
    firstPosition:
      "Sign the standard Pylon BAA where PHI is involved\n\nRedline Thresholds — BAA: SMB 'No redlines. Confirm & send to Customers who handle[] PHI.'; Mid-Market 'Sign Pylon BAA. No redlines. No customer paper.'; Enterprise 'Redlines considered case-by-case. No customer paper.' Trigger: 'Required if customer is a Covered Entity or Business Associate under HIPAA.' The standard BAA is the HIPAA contract 'defining how Pylon, the business associate (BA) safeguards, uses, and discloses protected health information (PHI) when working with a covered entity (CE).'",
    fallback1:
      "Case-by-case BAA redlines for Enterprise\n\nRedline Thresholds — BAA, Enterprise: 'Redlines considered case-by-case. No customer paper.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'No BAA redlines below Enterprise, and never on customer paper; Enterprise BAA changes require case-by-case legal review.',
    precedent:
      "Redline Thresholds (BAA column). Retell comment (customer): 'Also attach your BAA for review.' Standard BAA (12/11/2025) present in the record.",
    rationale:
      'The standard BAA is calibrated to HIPAA; bespoke edits create compliance risk and should be tightly controlled.',
    openQuestions:
      'The BAA on file is dated 12/11/2025 while other templates are June 2026 — confirm the BAA is the current version and consistent with the June 2026 DPA/ToS.',
  },
  {
    id: 'pp-004',
    name: 'Bespoke Security & Data-Privacy Obligations in the ToS',
    benefitToPylon:
      'Keeps a single, consistent, operationally workable security regime and avoids pre-investigation commitments.',
    category: 'Data / Security',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      'The standard ToS keeps security/privacy detail in the DPA; guidance and every deal show Pylon reverting customer-added information-security, breach-notification, data-return and audit clauses in the ToS and pointing to the DPA. A short cross-reference/compliance clause (as in Modern Treasury §1.8/§1.9) is acceptable.',
    firstPosition:
      "Security/privacy handled in the DPA, not duplicated in the ToS\n\nPosition (per Pylon Legal): 'Security commitments are addressed in the DPA and Pylon's security materials. This level of operational detail does not belong in the ToS.' Acceptable ToS cross-reference (Modern Treasury, accepted): new §1.8 'Security … the Data Processing Agreement entered into by the parties (the \"DPA\")' and §1.9 'Data Privacy. Pylon will at all times comply with … the Data Processing [Agreement].'",
    fallback1:
      "Add a DPA cross-reference / compliance clause in the ToS\n\nModern Treasury (accepted): §1.8 Security referencing the DPA and §1.9 'Pylon will at all times comply with the Data Processing [Agreement].' Erebor/Port added: 'In the event of any conflict between this Section and the Data Processing Agreement between the parties, the Data Processing Agreement will control with respect to the processing of personal data.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Do not accept bespoke ToS security programs, fixed breach-notification timelines (e.g., 24-hour hard deadlines), or ToS-level data-return clauses — revert to the DPA. Escalate to legal if a regulated customer conditions signing on a ToS-level information-security addendum (e.g., GLBA program with pen-test results to customer).',
    precedent:
      "Retell comments (Pylon Legal): 'Reverted. Security commitments are addressed in the DPA …'; 'Reverted. The DPA already covers breach notification. Pylon cannot commit to fixed notice and remediation obligations before completing a reasonable investigation.'; 'Reverted. Return and deletion obligations are addressed in the DPA and termination provisions.' Erebor (bank/OCC) added full 'Data Security'/'Security Incident'/'Regulatory Cooperation' sections; Pylon reverted and countered with the 3x supercap. Port comment: 'Subprocessor engagement is handled under the DPA … We removed \"approved\" to avoid a separate per-subcontractor approval regime.'",
    rationale:
      'The DPA already provides scoped, investigated, multi-tenant-appropriate security and breach commitments; duplicative ToS obligations create conflicts and unworkable fixed deadlines.',
    openQuestions:
      'Regulated financial customers (e.g., Erebor, an OCC-supervised bank) repeatedly demand GLBA-grade security, regulator-examination cooperation, and on-site audit in the ToS. Confirm the approved response package (DPA + SOC 2 report + supercap) is sufficient for bank customers, or whether a bank-specific addendum should be created.',
  },
  {
    id: 'pp-005',
    name: 'AUP Incorporation — By URL vs. Attached Text',
    benefitToPylon:
      "URL model preserves Pylon's ability to update policies platform-wide; the attach-and-freeze fallback closes deals with change-control-sensitive customers.",
    category: 'Data / Security',
    contractType: 'AUP / MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "The standard ToS §2.1(x) incorporates the AUP by reference to a URL (currently a '[URL]' placeholder), and the AUP itself states it 'may be updated periodically … Continued use … constitutes acceptance of revised terms.' Customers (e.g., Retell) object to URL incorporation because linked content can change unilaterally, and ask for the full AUP text pasted into an exhibit fixed as of the Effective Date.",
    firstPosition:
      "Incorporate the AUP by reference (URL)\n\nStandard §2.1(x): customer will not 'violate the Pylon Acceptable Use Policy available at [URL].' AUP: 'This AUP may be updated periodically to reflect changes in Services functionality, legal requirements, or industry standards. Continued use of the Services after AUP updates constitutes acceptance of revised terms.'",
    fallback1:
      "Attach the current AUP text as an exhibit fixed at the Effective Date\n\nPer customer request (Retell): 'paste the full current text of the Acceptable Use Policy into this Exhibit … so the AUP in effect as of the Effective Date is fixed to the Agreement.'\n\nComment: Concession trades away Pylon's ability to update the AUP unilaterally for that customer; weigh against operational need to update policies.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "No internal guidance recorded (inference): agreeing to freeze the AUP as of the Effective Date removes Pylon's unilateral-update right for that customer — escalate to legal/product before conceding for customers with heightened change-control needs.",
    precedent:
      "Standard §2.1(x) with '[URL]' placeholder; AUP update clause. Retell comment (customer, Kanishk Joshi): 'Per our standard practice we do not accept policies incorporated by URL, since the linked content can be changed unilaterally after signing. Please paste the full current text … so the AUP … is fixed to the Agreement.'",
    rationale:
      'URL incorporation lets Pylon keep the AUP current; some customers require certainty of the terms in force at signing.',
    openQuestions:
      "Standard ToS §2.1(x) still contains an unfilled '[URL]' placeholder for the AUP link — this must be populated before use.\n\nNo internal guidance addresses the URL-vs-attached AUP question; only the Retell customer comment is on record.",
  },
  {
    id: 'pp-006',
    name: 'DPA — Audit Rights',
    benefitToPylon:
      'Meets audit/compliance needs while protecting multi-tenant security and limiting operational burden.',
    category: 'Data / Security',
    contractType: 'DPA',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard DPA §9 satisfies audits via annual third-party Audit Reports (SOC 2-type), provided once per year on request, with a limited mutually-agreed on-site audit only where Data Protection Laws require, at Customer cost, once annually, 30 days' notice. Pylon resists direct customer on-site audit rights, citing multi-tenant risk.",
    firstPosition:
      "Audit via annual third-party Audit Reports; limited audit only as law requires\n\nStandard DPA §9.1: 'Upon Customer's written request, Pylon will provide Customer with a copy of its latest Audit Report at no cost to Customer, up to once per year.' §9.2: any further audit must be 'mutually agree[d]' and: '(a) ensures the use of an independent third party; (b) provides … at a minimum 30 days' notice; (c) requests access only during business hours; (d) is performed at Customer's sole cost and expense; (e) occurs no more than once annually; and (f) restricts findings to only Customer Personal Data relevant to Customer.'\n\nTalktrack: Pylon provides third-party audit reports. Direct audit rights create security and operational risk in a multi-tenant environment.",
    fallback1:
      "Allow a scoped on-site/virtual audit as a fallback to the report\n\nAs reflected in customer asks Pylon negotiated against (Erebor/Retell), an on-site or virtual audit may be permitted where the SOC 2 report 'does not adequately address Customer's reasonable concerns,' subject to notice, confidentiality, third-party auditor, once-per-year, and Customer-cost limits per DPA §9.2.\n\nComment: Elevated audit frequency/scope for regulated customers (e.g., following a Security Incident or on regulator request) is a customer ask to escalate, not pre-approved.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Resist unrestricted or regulator-triggered on-site audit rights in a multi-tenant environment; escalate bank/regulator examination-cooperation demands to legal.',
    precedent:
      "Standard DPA §9. Retell comment (Pylon Legal): 'Reverted. Pylon provides third-party audit reports. Direct audit rights create security and operational risk in a multi-tenant environment.' Erebor customer sought audit + 'Regulatory Cooperation' with OCC examination access 'at no additional cost'; Pylon reverted in favor of SOC 2 + supercap.",
    rationale:
      "Third-party audit reports give assurance without exposing other tenants' data or Pylon operations to each customer's auditors.",
    openQuestions: '',
  },
  {
    id: 'pp-007',
    name: 'DPA — Data Return & Deletion',
    benefitToPylon:
      'Predictable data-lifecycle obligations aligned with backup realities.',
    category: 'Data / Security',
    contractType: 'DPA',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard DPA §11.2 and ToS §5.4 require deletion or return within 30 days of request, with a carve-out for ordinary-course archival backups under a retention policy; deletion certification provided only on request. Pylon resists ToS-level duplicative return/deletion clauses and standalone certification obligations.',
    firstPosition:
      "Delete/return within 30 days of request; backups retained under policy\n\nStandard DPA §11.2: 'within 30 days of Customer's request, Pylon will securely delete or destroy or, if directed in writing by Customer, return … Customer Personal Data … Pylon may retain Customer Personal Data in its ordinary course archival backups provided that: (i) Pylon operates and complies with a reasonable data archive and retention policy … and (ii) this DPA will continue to apply … until it is so deleted.' ToS §5.4(b): delete 'within 30 days of written request,' subject to standard back-up/retention or legal requirements. Deletion certification 'provided by Pylon to Customer only upon Customer's request.'",
    fallback1:
      "Provide written deletion certification on request\n\nStandard DPA §11.2 already provides certification 'only upon Customer's request'; agreeing to certify deletion in writing upon request is within the standard.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not accept a duplicative ToS return/deletion clause or automatic (non-request-based) certification; keep the backup-retention carve-out. 'Return and deletion obligations are addressed in the DPA and termination provisions. Duplicative ToS language is unnecessary.'",
    precedent:
      "Standard DPA §11; ToS §5.4. Retell comment (Pylon Legal): 'Reverted. Return and deletion obligations are addressed in the DPA and termination provisions. Duplicative ToS language is unnecessary.' Port streamlined deletion to '30 days.'",
    rationale:
      'A single 30-day, request-triggered deletion right with a backup carve-out is operationally clean; duplicative clauses invite conflict.',
    openQuestions: '',
  },
  {
    id: 'pp-008',
    name: 'DPA — Personal Data Breach Notification',
    benefitToPylon:
      'Allows accurate, investigated notifications while meeting legal obligations.',
    category: 'Data / Security',
    contractType: 'DPA',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard DPA §7 requires notice 'without undue delay' upon becoming aware of a Personal Data Breach, with information to help the customer meet its obligations, and reasonable cooperation — no fixed-hour deadline and no admission of fault. Pylon resists hard 24-hour deadlines and pre-investigation commitments.",
    firstPosition:
      "Notice 'without undue delay'; cooperation; no admission of fault\n\nStandard DPA §7.1: 'Pylon shall notify Customer without undue delay upon Pylon becoming aware of a Personal Data Breach … providing Customer with information to allow the Customer to meet any obligations to report or inform Data Subjects or regulatory authorities … Pylon's notification of or response to a Personal Data Breach will not be construed as Pylon's acknowledgement of any fault or liability …' §7.2 requires reasonable cooperation and remediation steps. (Definition excludes 'unsuccessful log-in attempts, pings, port scans, denial of service attacks …')\n\nTalktrack: The DPA already covers breach notification. Pylon cannot commit to fixed notice and remediation obligations before completing a reasonable investigation.",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not accept fixed-hour breach-notice deadlines (e.g., 24 or 48 hours) or predefined remediation commitments before investigation — 'Pylon cannot commit to fixed notice and remediation obligations before completing a reasonable investigation.' Escalate to legal if a customer insists.",
    precedent:
      "Standard DPA §7. Retell comment (Pylon Legal): 'Reverted. The DPA already covers breach notification. Pylon cannot commit to fixed notice and remediation obligations before completing a reasonable investigation.' Erebor/Retell customers demanded 24-hour notice + 48-hour supplemental reports; reverted.",
    rationale:
      "'Without undue delay' is the GDPR-aligned standard; rigid clocks force premature, potentially inaccurate disclosures.",
    openQuestions: '',
  },
  {
    id: 'pp-009',
    name: 'DPA — Subprocessors',
    benefitToPylon:
      'Operational continuity plus contractual transparency; avoids veto rights over essential subprocessors.',
    category: 'Data / Security',
    contractType: 'DPA',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard DPA §5 gives general subprocessor authorization with a 10-day advance notice/objection mechanism, flow-down obligations, and Pylon liability for subprocessors; termination is the sole remedy for an unresolved objection. Guidance: keep this model; reject bespoke per-subprocessor approval regimes. Note: the internal playbook's dedicated 'DPA – Subprocessor' row is blank.",
    firstPosition:
      "General authorization with notice/objection; termination as sole remedy\n\nStandard DPA §5.2: 'at least ten (10) days before allowing new third-party Subprocessors … add such third party to the List and notify Customer … Customer may object … within ten (10) days … based on reasonable grounds relating to data protection.' §5.3: if unresolved within 30 days 'either party may terminate the Agreement with respect to the Services that cannot be provided without the … new Subprocessor … Such termination right is Customer's sole and exclusive remedy.' §5.4: 'Pylon agrees to be liable for the acts and omissions of its Subprocessors to the same extent Pylon would be liable … if it performed such acts or omissions itself.'\n\nTalktrack: Pylon's DPA already provides subprocessor transparency, notice, objection rights, and remedies. A bespoke approval process is not operationally workable.",
    fallback1:
      "Longer notice window (up to ~30 days)\n\nCustomers commonly seek 15 business days'–30 days' prior notice and a good-faith objection process with pro-rata refund on unresolved objection (Erebor/Retell asks). Pylon's standard 10-day list-based notice with termination-as-sole-remedy is preferred; a longer notice period is the negotiable dimension.\n\nComment: Do not accept a per-subprocessor prior-written-approval regime — 'We removed \"approved\" to avoid a separate per-subcontractor approval regime that conflicts with that model.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Do not agree to prior-approval for each subprocessor or to remedies beyond the scoped termination right; reject bespoke ToS-level subprocessor clauses (handle in DPA).',
    precedent:
      "Standard DPA §5. Retell comment (Pylon Legal): 'Reverted. Pylon's DPA already provides subprocessor transparency, notice, objection rights, and remedies. A bespoke approval process is not operationally workable.' Port comment: 'Subprocessor engagement is handled under the DPA … We removed \"approved\" to avoid a separate per-subcontractor approval regime.'",
    rationale:
      'A list-based general authorization keeps the Services operable while giving customers real notice/objection/termination rights; per-subprocessor approval is unworkable at scale.',
    openQuestions:
      "The Legal Playbook's dedicated 'DPA – Subprocessor' row (row 27) is blank — no internal guidance, talktrack, or sample language is recorded where a position would be expected. Confirm the intended subprocessor guidance.",
  },
  {
    id: 'pp-010',
    name: 'Usage Data',
    benefitToPylon:
      'Preserves analytics needed to operate and improve the Services.',
    category: 'Data / Security',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §3.5 lets Pylon collect anonymized/aggregated Usage Data that excludes Customer Data. Guidance: deletion is 'likely not ok unless Pylon can disable such Usage Data collection'; adding 'or Customer Confidential Information' to the exclusion list is OK.",
    firstPosition:
      'Retain Usage Data right (anonymized, excludes Customer Data)\n\nStandard §3.5: \'Pylon shall have the right to collect and use Usage Data … "Usage Data" means analytics, statistics or performance data about the use of the Services. For clarity, Usage Data: (a) will not include any Customer Data and (b) will be anonymized, de-identified, and/or aggregated such that it could no longer directly or indirectly identify Customer, its Authorized Users or any natural person.\'\n\nTalktrack: This provision allows Pylon to collect standard usage data, which is very common in the SaaS industry and enables us to understand how customers are using our services so we can improve our offerings. Usage Data could include things like uptime and availability information, system error logs and health metrics, product feature usage, or other statistical information. It does not include your Customer Data.',
    fallback1:
      "Add 'or Customer Confidential Information' to the exclusion\n\nPlaybook item 2: 'Customer adds \"or Customer Confidential Information\" to the list of things that Usage Data will not include. … Okay to accept.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Deletion is 'likely not ok unless Pylon can disable such Usage Data collection' — escalate to product/legal to confirm whether collection can be disabled for that customer before agreeing to delete.",
    precedent:
      "Legal Playbook §3.5: '1. Likely not ok unless Pylon can disable such Usage Data collection - see talktrack. [Pylon to confirm talktrack accuracy] 2. Okay to accept.'",
    rationale:
      'Aggregated usage telemetry is standard and drives product improvement; the anonymization carve-out already protects the customer.',
    openQuestions:
      "Playbook flags '[Pylon to confirm talktrack accuracy]' on the Usage Data talktrack — verify Pylon can technically disable Usage Data collection before relying on the deletion talktrack.",
  },
  {
    id: 'pp-011',
    name: "Customer's Own Paper (Templates)",
    benefitToPylon:
      "Preserves Pylon's standard risk posture and negotiation leverage; avoids hidden obligations in third-party forms.",
    category: 'Deal Process',
    contractType: 'All (NDA / MSA-ToS / DPA / BAA)',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "No standard clause; the Redline Thresholds guidance repeatedly instructs 'No customer paper' across NDA, MSA/ToS, DPA and BAA at every band, and 'Sign standard Pylon DPA/BAA only' below Enterprise.",
    firstPosition:
      "Transact on Pylon paper\n\nRedline Thresholds: 'No customer paper.' appears in the NDA, DPA and BAA cells for SMB, Mid-Market and Enterprise, and 'Pylon paper only.' / 'Pylon paper preferred.' in the MSA/ToS cells. For NDAs below Mid-Market: 'No customer paper.'",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not sign on customer paper without legal approval; the guidance states 'No customer paper' at every tier shown (Enterprise MSA is 'preferred,' not mandated — inference that customer MSA paper at Enterprise is an escalation, not an automatic no).",
    precedent:
      "Redline Thresholds (Update May 2026), NDA/DPA/BAA columns: 'No customer paper.' at SMB, Mid-Market, Enterprise. MSA/ToS: 'Pylon paper only' (SMB, Mid-Market), 'Pylon paper preferred' (Enterprise).",
    rationale:
      "Pylon's risk allocations (IP-only indemnity, caps, DPA structure) are built into its own templates; customer paper reintroduces every negotiated risk from scratch.",
    openQuestions:
      "Enterprise MSA is 'preferred' not 'only' — confirm whether customer-paper MSA is ever acceptable at Enterprise and, if so, the approval path.",
  },
  {
    id: 'pp-012',
    name: 'Redline Authority & Signing Thresholds by Deal Size',
    benefitToPylon:
      "Operational efficiency and consistent risk posture; low-value deals stay on standard terms, protecting Pylon's low-price economics.",
    category: 'Deal Process',
    contractType: 'All (NDA / MSA-ToS / DPA / BAA)',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "The 'Customer Agreement Guidelines (updated May 2026)' set what may be redlined by deal size. There is no standard-form clause here; this is internal process guidance that gates every other rule in this playbook. It pre-approves specific concession bands and forbids customer paper below Enterprise.",
    firstPosition:
      "Pylon paper only; redline scope scales with ARR\n\nPer the Redline Thresholds matrix: Monthly customers — 'No redlines. Use as upsell opportunity to annual terms.' SMB <$20k ARR — 'Pylon paper only. No redlines to ToS. Up to 3 pre-approved fallback positions only (e.g. no publicity, no autorenewal) on the Order form.' Mid-Market $20k–$40k ARR — 'Pylon paper only. Up to 3 pre-approved fallback positions only (liability cap, auto-renewal, termination). No customer paper.' Enterprise >$40k ARR — 'Pylon paper preferred. Redlines allowed.' For NDA: Monthly/SMB use Pylon mutual NDA, no redlines; Mid-Market/Enterprise 'Pylon NDA preferred / pre-ferred,' minor redlines considered.\n\nComment: Thresholds are ARR bands: Monthly, SMB <$20k, Mid-Market $20k–$40k, Enterprise >$40k. 'No customer paper' applies at every band except that Enterprise still says 'No customer paper' for DPA/BAA.",
    fallback1:
      'SMB / Mid-Market: cap at 3 pre-approved fallbacks\n\nFor SMB <$20k and Mid-Market $20k–$40k, offer only up to three pre-approved fallback positions (e.g., no publicity, no autorenewal on the Order Form for SMB; liability cap, auto-renewal, termination for Mid-Market). No customer paper.',
    fallback2:
      "Enterprise: full redlines on Pylon paper\n\nFor Enterprise >$40k ARR, redlines are allowed on Pylon paper; DPA and BAA redlines 'considered case-by-case,' still 'No customer paper.'",
    fallback3: '',
    walkAwayTrigger:
      'Escalate to legal/Finance if the counterparty insists on its own paper (customer paper is disallowed at every band shown), or seeks redlines beyond the pre-approved fallback count for its ARR tier. The matrix does not state an explicit walk-away point (inference: below Enterprise, anything beyond the 3 pre-approved fallbacks requires escalation).',
    precedent:
      "Redline Thresholds (Update May 2026): 'Monthly customers … No redlines'; 'SMB <$20k ARR … Pylon paper only. No redlines to ToS. Up to 3 pre-approved fallback positions only'; 'Mid-Market … Up to 3 pre-approved fallback positions only (liability cap, auto-renewal, termination)'; 'Enterprise >$40k ARR … Pylon paper preferred. Redlines allowed.' The four enterprise deals in the record (Modern Treasury, Erebor, Retell, Port) were all handled as heavily-redlined enterprise negotiations, consistent with the Enterprise band.",
    rationale:
      'Concentrates negotiation effort where deal value justifies it and keeps small deals on standard paper to preserve margin and velocity.',
    openQuestions:
      "The matrix uses ARR bands but does not define whether 'ARR' is committed vs. billed, nor how multi-year TCV maps to the bands — confirm with Finance.\n\nThe 'Enterprise' cell allows redlines but does not enumerate which positions require legal sign-off; cross-reference the material-severity rules below.",
  },
  {
    id: 'pp-013',
    name: 'Customer Indemnification',
    benefitToPylon:
      'Shifts end-client and data-sourcing claim risk to the party that controls it.',
    category: 'IP / Indemnity',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "Standard §8.2 has Customer indemnify Pylon for third-party claims from Customer's violation of the Agreement and from Customer Data. Guidance: push back hard on deletion; if prong (i) is challenged, narrow it to §§1.6, 2.1, 2.2 rather than delete.",
    firstPosition:
      "Retain the Customer indemnity (violation of Agreement + Customer Data)\n\nStandard §8.2: 'Customer agrees to indemnify, defend, and hold Pylon and its Affiliates and licensors harmless against any liabilities, damages, and costs (including reasonable attorneys' fees) arising out of a third-party claim related to (i) Customer's violation of this Agreement, (ii) any Customer Data or use thereof (except to the extent such a claim arises from Pylon's use of Customer Data in violation of this Agreement).'\n\nTalktrack: Unfortunately we are not able to remove the Customer indemnity, as this provides important protections for Pylon given the customer's important role in the context of our services. In our platform, customers will be providing support and information to their own end clients … The customer exclusively controls how they source information, use our platform, interact with end clients, and any terms and conditions they enter into with end clients. So, our customers are uniquely positioned to manage risk of third party claims -- especially from your end clients -- and Pylon needs to be protected from such claims since our pricing does not contemplate taking on such liability.",
    fallback1:
      "Narrow prong (i) to specified sections\n\nPlaybook sample (Fallback 2): '… (i) Customer's violation of Sections 1.6 (Third Party Services), 2.1 (Restrictions) or 2.2 (Customer Equipment) of this Agreement …'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not delete the Customer indemnity altogether — 'Push back. This indemnity provides very important protections for Pylon.'",
    precedent:
      "Legal Playbook §8.2. Port MSA (accepted narrowing): prong (i) limited to 'Sections 1.6 (Third Party Services), 2.1 (Restrictions), or 2.2 (Customer Equipment).' Port comment (Pylon Legal): 'The Customer indemnity needs to cover Customer Data and Customer's use of the Services generally … We restored the original scope and are open to narrowing prong (i) to specific sections.'",
    rationale:
      "The customer controls how it sources data and deals with its end clients; Pylon's pricing does not fund that third-party risk.",
    openQuestions: '',
  },
  {
    id: 'pp-014',
    name: 'Pylon Indemnification — IP-Only Scope',
    benefitToPylon:
      "Confines Pylon's affirmative indemnity exposure to controllable IP risk.",
    category: 'IP / Indemnity',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "Standard §8.1 indemnifies Customer only for third-party claims that the Services infringe a US patent or a copyright/trade secret, with standard exclusions and repair/replace/license/refund remedies. Guidance: company policy is to indemnify only for third-party IP claims; push back on any indemnity for Pylon's breach of the Agreement; consult legal if Pylon's indemnity is revised.",
    firstPosition:
      "Third-party IP infringement indemnity only\n\nStandard §8.1: 'Pylon shall indemnify, defend, and hold Customer harmless from liability to third parties resulting from a third-party claim against Customer alleging infringement or misappropriation by the Services of any United States patent or any copyright or trade secret of a third party.' (with exclusions for combinations, modifications, out-of-scope use, Customer designs, and continued use after notice; remedies: modify/replace, procure a license, or terminate + refund.)\n\nTalktrack: It is company policy to only indemnify for IP infringement claims regarding our Services. In our view, direct claims are the appropriate remedy for customers to seek for our violation of the Agreement, since Customers are uniquely positioned to manage and mitigate third party risk in the context of our services.",
    fallback1:
      "Broaden covered IP rights (patent/trademark/copyright/trade secret)\n\nPort MSA (accepted): indemnity for infringement 'of any intellectual property rights, including any patent, trademark or any copyright or misappropriation of any trade secret.'\n\nComment: Broadening the categories of covered IP is distinct from adding non-IP indemnities, which remain rejected.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not add indemnities for Pylon's breach of the Agreement, data/security breaches, or applicable-law violations. 'If a customer revises Pylon's indemnity obligations, consult with legal counsel.'",
    precedent:
      "Legal Playbook §8.1: 'It is company policy to only indemnify for IP infringement claims regarding our Services.' Retell struck a customer-added 'Additional Indemnification by Pylon' (confidentiality/data/security/law/GN/personal injury) — Pylon Legal: 'Reverted. Pylon's indemnity is limited to third-party IP claims. Expanding indemnity would duplicate contract remedies and materially increase exposure.' Erebor struck the same. Port comment: 'Pylon does not warrant non-infringement. If we can't provide you the Services in accordance with the performance warranty in section 6, that's a separate matter.'",
    rationale:
      'IP infringement is the one third-party risk Pylon controls; other harms are better addressed by direct contract claims subject to the caps.',
    openQuestions:
      "Standard §8.1 covers 'United States patent'; Port broadened to patents generally plus trademark. Confirm whether broadening beyond US patents / to trademarks is a pre-approved deviation or requires legal sign-off per deal.",
  },
  {
    id: 'pp-015',
    name: 'AI Features — Output Ownership & No-Training Commitment',
    benefitToPylon:
      "Customer trust on AI/IP without surrendering Pylon's ability to deliver and secure the Services.",
    category: 'IP / Indemnity',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §3.3 treats Output as Customer Data, makes Customer responsible for evaluating Output, and commits Pylon not to use Customer Data to train the models or improve the Services (except fine-tuning solely for Customer). Guidance: keep the provision; may add an assignment of Pylon's rights in Output; strengthen no-training only if it doesn't block Pylon's own delivery.",
    firstPosition:
      "Output is Customer Data; no training on Customer Data\n\nStandard §3.3: 'the Output that Customer generates using AI Features forms part of Customer Data. Customer is solely responsible for evaluating the accuracy, completeness, and suitability of any Output … Pylon will not use, or permit its subcontractors to use, Customer Data to (i) train artificial intelligence models underlying the Services; or (ii) improve or develop the Services or other products or services of Pylon (except for fine tuning and similar activities conducted exclusively for the benefit and use of Customer).'\n\nTalktrack: As with any AI tool, we do not claim that the Outputs will be perfectly accurate, or that they are appropriate for every use case, so it is up to the Customer to assess whether they are appropriate for your particular use. Regarding fine tuning and similar activities, note that this is only for your benefit and use, not for other customers or our own benefit. The results will also be part of the normal data deletion flow after contract termination.",
    fallback1:
      "Assign Pylon's rights in Output to Customer\n\nPlaybook sample: 'As between Pylon and Customer, the Output that Customer generates using AI Features forms part of Customer Data, and Pylon hereby assigns Customer all Pylon's right, title, and interest, if any, in and to Output.'\n\nComment: OK 'if language is not otherwise revised.'",
    fallback2:
      "Strengthen no-other-model-training language\n\nPlaybook: 'Seems ok in concept, but review the language to ensure Pylon is not blocked from doing things it needs to do (e.g., to provide the Services to the Customer).'\n\nComment: Fine-tuning solely for Customer's benefit must not be gated on prior written consent; and Pylon cannot commit on behalf of third-party AI providers who may retain input for abuse monitoring.",
    fallback3: '',
    walkAwayTrigger:
      "Do not accept deletion of §3.3 in its entirety — 'Not ok. Re-insert and share the comment.' Consult drafting review before accepting a no-training rewrite that could block Pylon's provision of the Services.",
    precedent:
      "Legal Playbook §3.3. Port MSA comment (Pylon Legal): 'Fine tuning conducted solely for Customer's benefit is part of delivering the Services, so it cannot be gated on prior written consent; Pylon's no-training commitment stands. … Pylon cannot commit on behalf of third-party AI providers (input retained for abuse monitoring as we saw with Fable is likely to come back / stay).'",
    rationale:
      "Confirms customer ownership of Output and protects Pylon's data-use posture while keeping fine-tuning and third-party abuse-monitoring realities intact.",
    openQuestions:
      "Playbook standard-language column for §3.3 is only the heading 'AI Features.' — confirm the quoted operative text tracks the current template (it does in June 2026 ToS §3.3).",
  },
  {
    id: 'pp-016',
    name: 'Feedback License',
    benefitToPylon:
      'Unencumbered ability to improve the product from customer input.',
    category: 'IP / Indemnity',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §3.6 grants Pylon a perpetual, irrevocable, royalty-free license to use Feedback. Guidance: do not delete; pre-approved to add that Feedback excludes Customer Confidential Information / is not attributed, and an 'AS IS' disclaimer for Feedback.",
    firstPosition:
      "Keep the perpetual Feedback license\n\nStandard §3.6: 'Customer hereby grants Pylon a perpetual, irrevocable, transferable (with right to sublicense), worldwide, royalty-free, fully-paid up license to use and exploit all Feedback for any purpose, including, without limitation, the testing, development, maintenance and improvement of the Services.'\n\nTalktrack: Customers may, if they choose to, provide feedback about our services in the normal course of receiving support or discussing our products. If you provide feedback, Pylon needs to be able to act on that feedback (e.g., to improve our service). In case your concern is confidentiality, we can clarify that feedback won't include Customer Confidential Information.",
    fallback1:
      "Clarify Feedback excludes Confidential Information / no attribution\n\nPlaybook sample: 'For clarity, Feedback does not include Customer Confidential Information and will not be attributed to Customer.'",
    fallback2:
      "Add 'AS IS' disclaimer for Feedback\n\nPlaybook sample: 'Pylon acknowledges that all Feedback is provided \"AS IS\" without warranty of any kind.' (As accepted in Modern Treasury: 'Feedback is provided by Customer \"AS IS\" and Customer will have no liability with respect to Feedback' and 'Feedback does not include Customer Data or materials marked as Customer's Confidential Information.')",
    fallback3: '',
    walkAwayTrigger:
      "Do not accept deletion of §3.6 — 'Not ok. Re-insert and share talktrack.'",
    precedent:
      "Legal Playbook §3.6. Modern Treasury cumulative redline accepted: 'Feedback is provided by Customer \"AS IS\" and Customer will have no liability with respect to Feedback'; '(c) Feedback does not include Customer Data or materials marked as Customer's Confidential Information.'",
    rationale:
      "Pylon must be free to act on product feedback; the confidentiality/attribution and 'AS IS' clarifications remove the customer's usual concern without giving up the license.",
    openQuestions: '',
  },
  {
    id: 'pp-017',
    name: 'Indemnity as Sole Remedy for IP',
    benefitToPylon:
      'Channels IP claims into the bounded indemnity while conceding gracefully if pressed.',
    category: 'IP / Indemnity',
    contractType: 'MSA/ToS',
    severity: 'Acceptable',
    standardMsaGuidelineSummary:
      "Standard §8.3 makes the IP indemnity the customer's only remedy for third-party IP violation by the Services. Guidance: push back if the customer removes it; accept removal only as a fallback.",
    firstPosition:
      "IP indemnity is the sole remedy for IP infringement\n\nStandard §8.3: 'THE INDEMNITIES ARE CUSTOMER'S ONLY REMEDY UNDER THIS AGREEMENT FOR VIOLATION BY THE SERVICES OF A THIRD PARTY'S INTELLECTUAL PROPERTY RIGHTS.'\n\nTalktrack: The indemnity is intended as the sole remedy for third party IP claims about our software. We would protect you from covered third party claims, and beyond that there would be nothing else that a customer would need. If we fail to provide the services you've purchased, that could lead to other claims, and this does not impact such claims.",
    fallback1:
      "Accept removal of the sole-remedy line\n\nPlaybook Fallback 2: 'Accept.' (Customer removes the sentence making the indemnities their sole remedy.)",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "None material — removal is a pre-approved final fallback ('2. Fallback 2. Accept.').",
    precedent:
      "Legal Playbook §8.3: 'Fallback 1. Push back using talktrack. Fallback 2. Accept.'",
    rationale:
      'The sole-remedy line prevents double recovery for IP claims but is not worth blocking a deal over.',
    openQuestions: '',
  },
  {
    id: 'pp-018',
    name: 'DPA — Liability Subject to Agreement Cap',
    benefitToPylon:
      'Prevents DPA obligations from becoming an uncapped liability backdoor.',
    category: 'Liability',
    contractType: 'DPA',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "Standard DPA §12.2 subjects Pylon's DPA/SCC liability to the Agreement's exclusions and caps (without limiting data subjects' statutory rights). This ties DPA exposure back to the negotiated liability tier (typically the supercap).",
    firstPosition:
      "DPA liability rolls up into the Agreement's limitations\n\nStandard DPA §12.2: 'To the maximum extent permitted by law, Pylon's liability under or in connection with this DPA (including under the SCCs) is subject to the exclusions and limitations on liability contained in the Agreement. The foregoing shall not limit the rights of data subjects pursuant to Data Protection Laws.'",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Do not agree to uncapped DPA liability; DPA breaches belong in the data-privacy/security supercap tier, not the unlimited tier — see Limitation of Liability rules. Escalate any attempt to make DPA breaches wholly uncapped.',
    precedent:
      "Standard DPA §12.2. Port comment (Pylon Legal): confidentiality/security/privacy 'stay within the enhanced (supercap) tier rather than being excluded from all limits'; Modern Treasury/Erebor tied DPA/security breach to the 3x supercap.",
    rationale:
      "Keeps data-protection exposure tied to contract value via the supercap while preserving data subjects' statutory rights.",
    openQuestions: '',
  },
  {
    id: 'pp-019',
    name: 'Limitation of Liability — Uncapped Items & Indemnity Carve-Out',
    benefitToPylon:
      "Keeps 'unlimited' liability confined to the IP indemnity and legally non-limitable items.",
    category: 'Liability',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      "Standard §7.2 excludes Customer's indemnity obligations and payment obligations from the cap. Guidance: making the cap carve-out for indemnities mutual is OK if Pylon's §8.1 indemnities are unrevised; if Pylon's indemnities were revised, consult legal. Resist expanding uncapped/'unlimited' categories beyond indemnity and non-limitable-at-law items.",
    firstPosition:
      "Cap carve-out limited to indemnity + payment (and non-limitable-at-law)\n\nStandard §7.2: 'NOTHING IN THIS SECTION 7 SHALL LIMIT CUSTOMER'S OBLIGATIONS WITH RESPECT TO INDEMNIFICATION IN SECTION 8 OR CUSTOMER'S OBLIGATIONS TO PAY FEES.'",
    fallback1:
      "Make the indemnity carve-out mutual\n\nPlaybook sample: 'NOTHING IN THIS AGREEMENT SHALL LIMIT [//CUSTOMER'S//] EITHER PARTY'S OBLIGATIONS WITH RESPECT TO INDEMNIFICATION IN SECTION 8 OR CUSTOMER'S OBLIGATIONS OF PAYMENT.'\n\nComment: OK 'Assuming the customer has not revised Pylon's indemnities in Section 8.1 or added any other indemnities.' IF THE CUSTOMER HAS REVISED PYLON'S INDEMNITIES, CONSULT LEGAL COUNSEL PRIOR TO MAKING THIS EDIT.",
    fallback2:
      "Add 'liability that cannot be limited or excluded at law' as uncapped\n\nModern Treasury (accepted) excluded from the cap: 'Excluded Claims and Special Claims,' defined to include Section 7.4 (Indemnification) and '(2) liability that cannot be limited or excluded at law.'",
    fallback3: '',
    walkAwayTrigger:
      "If the customer revises Pylon's indemnity obligations or adds new indemnities, consult legal before making the cap carve-out mutual. Do not move data/security/confidentiality/IP into a fully uncapped tier — 'these stay within the enhanced (supercap) tier rather than being excluded from all limits.'",
    precedent:
      "Legal Playbook §7.2 (cont.): mutual indemnity carve-out OK unless Pylon's indemnities were revised. Port comment (Pylon Legal): 'Pylon cannot accept unlimited liability for confidentiality or IP matters; these stay within the enhanced (supercap) tier rather than being excluded from all limits.' Modern Treasury accepted uncapped 'Excluded Claims and Special Claims' framing tied to indemnity and non-limitable-at-law liability.",
    rationale:
      'Unlimited indemnity exposure is standard for IP indemnity; broadening uncapped categories (confidentiality/IP/data) breaks the negotiated cap structure.',
    openQuestions: '',
  },
  {
    id: 'pp-020',
    name: 'Limitation of Liability — Exclusions from the Indirect-Damages Waiver',
    benefitToPylon:
      "Caps tail risk from consequential-damage theories that Pylon's pricing does not fund.",
    category: 'Liability',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      'Standard §7.1 mutually waives indirect/consequential damages and lost profits/data. Guidance: push back on adding exclusions; then accept gross negligence/willful misconduct only; then accept a defined list (GN/WM, confidentiality, DPA) but only subject to a reasonable cap. Uncapped indirect-damages carve-outs are not acceptable.',
    firstPosition:
      "Full mutual waiver of indirect/consequential damages\n\nStandard §7.1: 'IN NO EVENT SHALL EITHER PARTY BE LIABLE … FOR ANY LOSS OF USE, REVENUE, OR PROFIT OR LOSS OF DATA OR DIMINUTION IN VALUE, OR FOR ANY CONSEQUENTIAL, INCIDENTAL, INDIRECT, EXEMPLARY, SPECIAL, OR PUNITIVE DAMAGES … NOTWITHSTANDING THE FAILURE OF ANY AGREED OR OTHER REMEDY OF ITS ESSENTIAL PURPOSE.'\n\nTalktrack: We appreciate the intent here is to seek protection wherever possible, but from our perspective indirect damages are unpredictable and high in proportion to the value of this deal. The risk involved with high damages translates into a cost of doing business and Pylon's services are not priced for such broad damages.",
    fallback1:
      "Carve out gross negligence / willful misconduct only\n\nPlaybook sample (Fallback 2): 'EXCEPT FOR LIABILITIES ARISING FROM A PARTY'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT, IN NO EVENT SHALL EITHER PARTY …'\n\nTalktrack: We can agree to carve out liabilities arising from either party's gross negligence or willful misconduct, but given the speculative nature of the other damages (and the fact that the customer controls the risk based on the data they choose to submit), we do need to limit exposure to such unpredictable items.",
    fallback2:
      "Defined list, but only subject to a reasonable cap\n\nPlaybook sample (Fallback 3): 'EXCEPT FOR LIABILITIES ARISING FROM (A) A PARTY'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT; (B) BREACH OF CONFIDENTIALITY OBLIGATIONS; OR (C) BREACH OF THE DATA PROCESSING ADDENDUM, IN NO EVENT SHALL EITHER PARTY …'\n\nTalktrack: As long as these are subject to a reasonable cap, we can accept the exclusions as revised in Section 7.1.\n\nComment: Only 'As long as these are subject to a reasonable cap.' Fraud was added alongside GN/WM in the Retell deal.",
    fallback3: '',
    walkAwayTrigger:
      "'Uncapped indirect-damages carve-outs are not acceptable.' Any carve-out of the indirect-damages waiver must remain subject to a cap (the supercap tier).",
    precedent:
      "Legal Playbook §7.1. Retell return redline (accepted): 'EXCEPT FOR LIABILITIES ARISING FROM (A) A PARTY'S GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR FRAUD; (B) A PARTY'S BREACH OF ITS CONFIDENTIALITY OBLIGATIONS; OR (C) PYLON'S BREACH OF ITS DATA PRIVACY OR SECURITY OBLIGATIONS UNDER THIS AGREEMENT (INCLUDING THE DPA) …' Retell comment (Pylon Legal): 'Pylon can consider defined carve-outs only within a negotiated cap. Uncapped indirect-damages carve-outs are not acceptable.'",
    rationale:
      'Indirect damages are unpredictable and disproportionate to deal value; if carved out at all they must stay tied to the enhanced (super)cap.',
    openQuestions: '',
  },
  {
    id: 'pp-021',
    name: 'Limitation of Liability — General Liability Cap',
    benefitToPylon: 'Keeps maximum exposure proportional to contract value.',
    category: 'Liability',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §7.2 caps aggregate liability at 12 months' fees paid or payable. Guidance: hold at 1x; only if it is one of the last deal-blockers, consider increasing to 1.5–2x.",
    firstPosition:
      "1x trailing 12-month fees\n\nStandard §7.2: 'IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY … EXCEED THE AGGREGATE AMOUNTS PAID OR PAYABLE TO PYLON IN THE TWELVE-MONTH PERIOD PRECEDING THE EVENT GIVING RISE TO THE CLAIM.'\n\nTalktrack: Tying the general liability cap to the annual fees 'paid or payable' is industry standard and appropriate, and Pylon's low pricing assumes industry standard caps.",
    fallback1:
      "Increase general cap to 1.5x–2x (last-issue only)\n\nPlaybook sample: '… EXCEED ONE AND ONE HALF TIMES (1.5X) THE AGGREGATE AMOUNTS PAID OR PAYABLE TO PYLON IN THE TWELVE-MONTH PERIOD PRECEDING …'\n\nComment: Only 'If this is one of the last issues blocking a deal, consider increasing standard cap to 1.5-2x annual fees paid or payable.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Hold at 1x by default; 1.5–2x only as a last-issue deal-closer. Beyond 2x on the general cap is an escalation (inference from the 1.5–2x ceiling).',
    precedent:
      "Legal Playbook §7.2 (cont.). Retell return redline (accepted) set the general cap at 'ONE AND ONE HALF TIMES (1.5X)' trailing 12-month fees. Port MSA used a general cap of 'THE GREATER OF (I) [multiple of fees] OR (II) US$ 700,000.'",
    rationale:
      "A fees-based cap is the industry norm and is priced into Pylon's low pricing; raising it should extract deal-closing value.",
    openQuestions:
      "Port final (07-08) used a general/super cap floor of 'US$ 700,000' while the v3 draft (07-01) showed 'US$ 2,000,000' — confirm which figure is final and whether fixed-dollar floors are approved (the written playbook contemplates only fee-multiple caps).",
  },
  {
    id: 'pp-022',
    name: 'Limitation of Liability — Enhanced Supercap for Data/Security/Confidentiality',
    benefitToPylon:
      'Signals accountability on the highest-sensitivity obligations while keeping exposure tied to deal value.',
    category: 'Liability',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard form has no supercap. Guidance: when a customer wants more liabilities unlimited, push back and offer a 3x-fees supercap for data privacy/security and confidentiality breaches; escalate the multiple to 4x then 5x as further fallbacks. Do not accept unlimited.',
    firstPosition:
      "3x-fees supercap for data privacy/security & confidentiality\n\nPlaybook sample: 'NOTWITHSTANDING THE LIABILITY CAP SET FORTH IN [SECTION 7.2], EACH PARTY'S AGGREGATE LIABILITY FOR A BREACH OF [(A) ITS DATA PRIVACY OR SECURITY OBLIGATIONS UNDER THIS AGREEMENT OR (B) ITS CONFIDENTIALITY OBLIGATIONS IN SECTION 3.1] WILL NOT EXCEED THREE TIMES (3X) THE AGGREGATE AMOUNTS PAID OR PAYABLE BY CUSTOMER TO PYLON IN THE TWELVE MONTHS IMMEDIATELY PRIOR TO THE EVENT GIVING RISE TO LIABILITY.'\n\nTalktrack: While Pylon is not able to accept unlimited liability, we stand behind our commitments and are able to offer an enhanced liability cap for certain liabilities.\n\nComment: 'Don't include ones the customer didn't request.' Categories: breach of data privacy obligations (DPA/BAA), security obligations, confidentiality.",
    fallback1:
      "Increase supercap to 4x\n\nPlaybook Fallback 2: 'increase supercap to 4x.'",
    fallback2:
      "Increase supercap to 5x\n\nPlaybook Fallback 3: 'increase supercap to 5x.'",
    fallback3: '',
    walkAwayTrigger:
      "Do not accept unlimited liability for these categories — 'Fallback 1: Push back on unlimited liabilities and add a supercap.' Beyond 5x, escalate to legal.",
    precedent:
      "Legal Playbook §7.2. Modern Treasury and Erebor both landed on '3X' supercaps for data privacy/security and §3.1 confidentiality. Retell: 3x supercap layered over a 1.5x general cap. Port comment (Pylon Legal): 'We … restored the supercap as a multiple of fees rather than a fixed dollar figure, so exposure stays tied to contract value' (customer pushed for an absolute-dollar ceiling).",
    rationale:
      'An enhanced cap acknowledges data/security/confidentiality sensitivity without exposing Pylon to unlimited, unpriced liability.',
    openQuestions:
      'Sample language brackets the covered categories; select only those the customer requested. Confirm whether fixed-dollar supercap floors (as in Port) are approved deviations from the fee-multiple structure.',
  },
  {
    id: 'pp-023',
    name: 'Payment Terms',
    benefitToPylon:
      'Closes deals on common payment asks while protecting cash flow via the Net 45 ceiling.',
    category: 'Pricing / Fees',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard §4.2 is net 30 from receipt of invoice, with a 1.5%/month late charge and suspension 10 days after notice of overdue payment. Guidance: net 45 pre-approved (beyond that needs Finance); deleting the late-payment penalty is OK; extending the pre-suspension grace period to 30 days is OK.',
    firstPosition:
      "Net 30 from receipt; 1.5%/mo late charge; 10-day suspension notice\n\nStandard §4.2: 'full payment for invoices issued must be received by Pylon thirty (30) days after the date of receipt of the invoice … Unpaid undisputed amounts are subject to a finance charge of 1.5% per month … Pylon may suspend Services if overdue Fees not disputed in good faith remain unpaid 10 days after written notice of overdue payment.'",
    fallback1:
      "Extend to Net 45; bill undisputed amounts from receipt\n\nPlaybook sample: 'Pylon will [//may choose to bill//] through an invoice, in which case, full payment of undisputed amounts for invoices issued must be received by Pylon thirty (30) days after Customer's receipt of [//the mailing date of//] the invoice, unless otherwise agreed in an Order Form.' Guidance: 'Ok to accept up to Net 45.'",
    fallback2:
      "Delete the late-payment finance charge\n\nPlaybook item 2: 'Customer deletes the late payment penalty language … Ok to accept.'",
    fallback3:
      "Extend pre-suspension grace period to 30 days\n\nPlaybook item 3: 'Customer wants to extend grace period before suspension occurs for overdue payments … Ok to extend to 30 days.'",
    walkAwayTrigger: "Payment terms beyond Net 45 'require Finance approval.'",
    precedent:
      "Legal Playbook §4.2: '1. Ok to accept up to Net 45. Other payment terms require Finance approval. 2. Ok to accept [delete late penalty]. 3. Ok to extend to 30 days.'",
    rationale:
      'Modest payment-term flexibility is low-risk and commonly requested; longer terms hit cash flow and need Finance ownership.',
    openQuestions:
      "Playbook 'Standard Language' quotes 'thirty (30) days after the mailing date of the invoice' (12/23/2025 version); the current June 2026 template already reads 'after the date of receipt of the invoice.' Confirm the playbook is being read against the current template so the redline doesn't re-introduce 'mailing date.'",
  },
  {
    id: 'pp-024',
    name: 'Renewal Price Cap',
    benefitToPylon:
      'Protects renewal revenue and pricing flexibility; steers customers toward longer commitments.',
    category: 'Pricing / Fees',
    contractType: 'Order Form',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard §4.1 makes Fees nonrefundable/non-cancelable and is silent on renewal caps. Guidance: a renewal price cap is a commercial decision for Pylon; push back first (offer longer term for price security), then if given, limit to the first renewal, same/greater quantity, and put it on the Order Form.',
    firstPosition:
      "No price cap; offer longer term instead\n\nStandard §4.1: 'All Fees are nonrefundable and all payment obligations are non-cancelable except as expressly provided herein.' No renewal cap in the standard form.\n\nTalktrack: The way customers can obtain price security is by purchasing a longer term. Are you interested in hearing about those options?",
    fallback1:
      "First-renewal cap, same/greater quantity, on the Order Form\n\nPlaybook sample: 'For the first renewal of Customer's order immediately following the preceding Subscription Term, Pylon will not increase pricing by more than [X%] on a yearly basis. This pricing cap applies only to the same Pylon Services that are in the expiring Subscription Term and provided the renewal Order Form has the same or greater quantity of licensed subscriptions as accumulated in the expiring Subscription Term.'\n\nTalktrack: For this deal, we are able to extend a price cap of X% for the first renewal.\n\nComment: Ideally goes on the Order Form, not the ToS — 'if in the TOS, it would apply to every order.' Cap only the first year and to orders of similar or greater size.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "The cap percentage and whether to grant it at all are Pylon commercial/Finance decisions — 'This is a decision for Pylon to make based on the commercials of the deal.' Escalate the specific % to the deal owner/Finance.",
    precedent:
      "Legal Playbook §4.1: 'Fallback 1: Push back … Fallback 2: If you are okay giving it, consider making the cap only for the first year and to orders of similar or greater size. Ideally this language goes on the order form instead of the TOS.'",
    rationale:
      "Uncapped renewal pricing preserves Pylon's ability to reprice; a longer term is the intended lever for customers wanting certainty.",
    openQuestions:
      "Sample language contains an unfilled '[X%]' placeholder and the talktrack an unfilled 'X%' — the actual cap must be set per deal by Finance.",
  },
  {
    id: 'pp-025',
    name: 'Publicity',
    benefitToPylon:
      'Easy goodwill/trade concession; protects already-published marketing when consent is required.',
    category: 'Publicity',
    contractType: 'Order Form',
    severity: 'Acceptable',
    standardMsaGuidelineSummary:
      "Standard ToS §9.10 grants Pylon the right to use Customer's name/logo in marketing unless prohibited on the Order Form. Guidance treats 'no publicity' as a pre-approved Order-Form fallback; prior consent is acceptable but revocation rights are resisted.",
    firstPosition:
      "Pylon may name Customer in marketing unless the Order Form prohibits\n\nStandard §9.10: 'Except to the extent prohibited on the applicable Order Form, Customer grants Pylon the right to use Customer's name, logo, trademarks and/or trade names in Pylon press releases, product brochures, marketing materials and websites, social media, and financial reports indicating that Customer is a customer of Pylon. All other public statements or releases shall require the mutual consent of the parties.'",
    fallback1:
      "Opt out of publicity on the Order Form\n\nRedline Thresholds lists 'no publicity' as a pre-approved SMB Order-Form fallback. Erebor removed the publicity grant entirely, replacing it with a mutual restriction: 'Neither party shall use the other party's [name, logo], client list, case study … or other public communication [without consent].'",
    fallback2:
      "Require prior consent (no post-approval revocation)\n\nPylon Legal position: 'Prior consent is appropriate, but revocation rights create uncertainty after approved materials are published.'",
    fallback3: '',
    walkAwayTrigger:
      'Publicity is fully tradeable (a pre-approved fallback); resist only customer rights to revoke consent for already-published materials.',
    precedent:
      "Standard §9.10. Redline Thresholds: 'no publicity' pre-approved SMB Order-Form fallback. Erebor comprehensive redline flipped to mutual no-publicity/no-solicitation-of-references. Retell comment (Pylon Legal): 'Prior consent is appropriate, but revocation rights create uncertainty after approved materials are published.'",
    rationale:
      'Reference/logo rights are marketing upside, not core protection, so they are cheap to concede; only revocation after publication creates real problems.',
    openQuestions: '',
  },
  {
    id: 'pp-026',
    name: 'Suspension of Service',
    benefitToPylon:
      'Preserves the ability to protect the platform, its IP, and third parties quickly.',
    category: 'Scope / Access',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §2.3 permits suspension when required by law or for material violation / credible security or harm risk, with reasonable narrow tailoring, notice where possible, and prompt reinstatement. Guidance: resist demands for advance notice in all cases; keep 'commercially reasonable' (not 'best') efforts.",
    firstPosition:
      "Suspend on law/material-violation/security risk; reasonable-efforts notice\n\nStandard §2.3: 'Pylon may suspend … if (i) required by law … or (ii) if Pylon believes, acting reasonably and in good faith, that the use … materially violates this Agreement or poses a credible security risk or risk of harm … Pylon will use reasonable efforts to narrowly tailor the suspension and to give Customer notice before suspending … unless prohibited by law … Access … will be reinstated promptly once the issue causing the suspension has been resolved.'\n\nTalktrack: We appreciate the desire for advance notice, but there are reasons that would warrant immediate suspension beyond security emergencies (e.g., violation of license restrictions jeopardizing Pylon's IP or relationships with our licensors, causing harm to a third party, etc). Of course, on a practical level, Pylon is very much disincentivized from shutting off access to a paying customer and especially without notice, so would use reasonable efforts to notify you in advance. It's also worth mentioning that Pylon's service aggregates customers' multiple communication channels into one platform. So, while Pylon going down is less than ideal and we don't plan on it, customers would be able to switch back to directly using email/slack etc.",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not commit to mandatory advance notice for all suspensions, and do not accept a 'best efforts' standard for notice — Pylon changed the customer's 'best' to 'commercially reasonable' efforts in Retell (inference: 'best efforts' notice is an escalation).",
    precedent:
      "Legal Playbook (Suspension talktrack). Retell return redline: changed suspension-notice standard from 'best' to 'commercially reasonable' and deleted a customer-added 'and revoked on reasonable prior notice.'",
    rationale:
      'Some abuses (license/IP violations, third-party harm) require immediate suspension; a hard advance-notice duty could force Pylon to keep harmful use running.',
    openQuestions: '',
  },
  {
    id: 'pp-027',
    name: 'Authorized Users & End Users',
    benefitToPylon:
      'Keeps liability for downstream use with the party that controls it.',
    category: 'Scope / Access',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard §1.4 defines Customer Users and End Users and makes Customer responsible for all Authorized Users. Internal guidance: keep the End User provisions; explain rather than delete. Adding affiliates to the definition is fine if Customer stays responsible (§1.5).',
    firstPosition:
      'Retain End User construct; Customer responsible for all Authorized Users\n\nStandard §1.4: \'an "Authorized User" means (i) a Customer employee or contractor authorized by Customer to access or use the Services on Customer\'s behalf (each a "Customer User"); and (ii) any individual authorized by Customer, including via Customer Users, to access certain features of the Services … (each an "End User"). … Customer is responsible for acts or omissions by Authorized Users in connection with their use of the Services as if made by Customer itself.\'\n\nTalktrack: End Users refer to your end customers and users who you are interacting with through Pylon. Usually these are your B2B customers submitting support tickets that are processed through Pylon. Your End Users may also access your Customer Portal in Pylon to view and manage their support tickets.',
    fallback1:
      "Add affiliates as Customer Users\n\nPlaybook: 'It is fine to add your Affiliates as Customer Users if Customer remains responsible for their use.'\n\nComment: Confirm the §1.5 responsibility provision remains.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Keep the End User provisions; guidance is to 'Keep the TOS provisions, but share an explanation.' No explicit walk-away stated (inference: deletion of Customer's responsibility for Authorized Users is an escalation point).",
    precedent:
      "Legal Playbook §1.4: '1. This is fine as long as the customer remains responsible per Section 1.5 … 2. Keep the TOS provisions, but share an explanation.'",
    rationale:
      'The End User model reflects how the platform actually works (customers serve their own end clients through Pylon); Customer is best placed to control and answer for that use.',
    openQuestions: '',
  },
  {
    id: 'pp-028',
    name: 'Third-Party Services',
    benefitToPylon:
      "Bounds Pylon's responsibility to its own Services and subprocessors.",
    category: 'Scope / Access',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §1.6 disclaims responsibility for Third-Party Services (Slack, email, integrations) while preserving Pylon's responsibility for its subprocessors. Internal guidance: do not remove the provision; optionally accept a duty to identify Pylon-provided Third-Party Services and flag additional terms.",
    firstPosition:
      "Keep §1.6 Third-Party Services disclaimer\n\nStandard §1.6: 'Pylon does not provide any aspect of the Third-Party Services, and Third-Party Services are not \"Services.\" Pylon makes no representations or warranties regarding Third-Party Services. … For avoidance of doubt, Pylon remains responsible for the acts and omissions of its subprocessors providing portions of the Services as if made by Pylon.'\n\nTalktrack: We are not able to remove this provision because it clarifies where Pylon's scope of responsibility ends. This provision addresses third party services you might use in connection with our Services, such as integrations with Slack, email, or other tools. We do not provide such tools and are not responsible for them.",
    fallback1:
      "Agree to identify Pylon-made Third-Party Services\n\nPlaybook sample: 'Third Party Services, other than those obtained or provided by Customer, will be identifiable as such, and Pylon will give notice in a reasonable form (including in the user interface) that additional terms may be applicable to the Third Party Service.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not delete §1.6. Guidance: 'Not ok. Pylon is not providing these services and is not responsible for them.'",
    precedent:
      "Legal Playbook §1.6: 'Not ok … it clarifies where Pylon's scope of responsibility ends.' Identification fallback marked '[Pylon to confirm this is ok].' Port MSA comment (Pylon Legal): 'we removed the open-ended commitment to resolve interoperability issues, which would extend Pylon's responsibility to third-party behavior outside its control.'",
    rationale:
      'Pylon cannot warrant or control tools it does not provide; the carve-out matches the subprocessor responsibility it does accept.',
    openQuestions:
      "The identification fallback is marked '[Pylon to confirm this is ok]' in the playbook — confirm before offering.",
  },
  {
    id: 'pp-029',
    name: "Definition of 'Customer' — Named Entity & Affiliates",
    benefitToPylon:
      'Clear enforcement rights against one counterparty; avoids diluting license limits.',
    category: 'Scope / Access',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard ToS binds 'the organization identified in the applicable Order Form or that otherwise accesses the Services (\"Customer\")' and handles affiliates via §1.5 (affiliates may sign Order Forms; Customer stays responsible). Internal guidance: naming the customer's legal entity is fine to accept; naming entity + affiliates as 'Customer' should be rejected with a talktrack.",
    firstPosition:
      "One named Customer; affiliates use Services under §1.5\n\nStandard umbrella language: Terms apply 'to the organization identified in the applicable Order Form or that otherwise accesses the Services (\"Customer\").' §1.5: 'Customer's Affiliates may enter Order Forms with Pylon under this Agreement … Customer will be responsible and liable for all acts and omissions of its Affiliates that access the Services under this Agreement as if made by Customer itself.'\n\nTalktrack: We prefer to have one named customer. Please note that your affiliates can use the services provided that Customer remains responsible, per Section 1.5.",
    fallback1:
      "Accept naming the customer's legal entity\n\nPlaybook item 1: 'Customer wants to name their legal entity as \"Customer\". … Fine, accept.'",
    fallback2:
      "Affiliates as Authorized Users if Customer stays responsible\n\nPlaybook §1.4 item 1: 'It is fine to add your Affiliates as Customer Users if Customer remains responsible for their use.' Sample: 'an \"Authorized User\" means (i) a Customer (or Customer Affiliate) employee or contractor authorized by Customer to access or use the Services on Customer's behalf (each a \"Customer User\")…'\n\nComment: Only if the §1.5 responsibility provision is NOT deleted — 'Confirm they have not deleted that responsibility provision.'",
    fallback3: '',
    walkAwayTrigger:
      "Do not accept adding a named entity 'and their affiliates' as co-'Customer' if the §1.5 responsibility-and-liability provision has been removed (inference — guidance ties acceptability to retention of §1.5).",
    precedent:
      "Legal Playbook (Umbrella): '1. Fine, accept. 2. Reject and share talktrack.' Playbook §1.4: affiliates as Customer Users fine 'as long as the customer remains responsible per Section 1.5.'",
    rationale:
      'A single responsible counterparty keeps privity clear and prevents unbounded expansion of licensed users; §1.5 already lets affiliates transact.',
    openQuestions: '',
  },
  {
    id: 'pp-030',
    name: 'SLA — Availability, Credits & Termination Right',
    benefitToPylon:
      'Caps availability exposure to credits while offering enterprises a fair exit for sustained failure.',
    category: 'Service Levels',
    contractType: 'MSA/ToS (Exhibit B)',
    severity: 'Material',
    standardMsaGuidelineSummary:
      'Standard SLA (Exhibit B) commits to 99.9% monthly availability with defined exclusions; sole remedy is service credits (5% per 30-min downtime block, max 25%/month) requiring 24-hour notice. Internal DPA guidance and deals add a for-cause termination right if availability falls below 95% for 3 consecutive months; deals also softened maintenance and breach-exclusion wording.',
    firstPosition:
      "99.9% availability; service credits as sole remedy\n\nStandard SLA: 'Pylon shall use all commercially reasonable efforts to ensure that the Services are available … 99.9% of the time in any calendar month.' Exclusions include scheduled/emergency maintenance, Customer breach/acts, Third-Party Services, and third-party connection/utility outages. 'Customer's sole and exclusive remedy … shall be that for each period of downtime lasting longer than one hour, Pylon will credit Customer 5% of monthly Service fees for each period of 30 or more consecutive minutes of downtime … aggregate maximum service credit … 25% of the monthly Services fees.' Notice required 'within 24 hours from the time of downtime.'",
    fallback1:
      "Add SLA termination right below 95% for 3 consecutive months\n\nInternal guidance / DPA row sample: 'If the Services availability … falls below 95.0% for three (3) or more consecutive calendar months, Customer may terminate the applicable Order Form for cause upon written notice to Pylon and receive a pro-rated refund of any prepaid unused fees; provided that Customer's termination notice must be received by Pylon within 30 days of the unavailability event triggering such termination right.'\n\nComment: Adopted in Modern Treasury as the 'SLA Termination Right' (availability below 95.0% during any three consecutive calendar months → terminate + refund for the terminated portion of the Term).",
    fallback2:
      "Extend downtime-credit notice window (24 hours → 30 days)\n\nModern Treasury (accepted): downtime-credit notice changed from '24 hours' to '30 days.'",
    fallback3:
      "Qualify the Customer-breach exclusion to breaches that directly cause downtime\n\nPort (accepted): downtime exclusion for Customer breach qualified so it applies to a breach 'that directly causes or results in such downtime,' and utility/connection exclusion (v) qualified by 'reasonable control.'\n\nComment: Pylon added 'or emergency' to the maintenance exclusion in Modern Treasury; deleted 'its policies' from the blocking carve-out.",
    walkAwayTrigger:
      "Keep service credits as the sole remedy for availability; a for-cause termination right below the 95%/3-month threshold (or a lower threshold) is an escalation. Do not warrant uptime as an absolute obligation — 'Pylon does not guarantee the uptime. The remedy [for] SLA failures is set out below.'",
    precedent:
      "Standard ToS Exhibit B. Legal Playbook 'DPA' row 26 provides the 95%/3-consecutive-month opt-out sample. Modern Treasury adopted the 'SLA Termination Right' and moved credit notice to 30 days and added 'or emergency' maintenance. Port comments (Pylon Legal): 'Pylon does not guarantee the uptime'; qualified the breach exclusion to downtime the breach 'directly causes,' and re-inserted the utility exclusion with 'reasonable control.'",
    rationale:
      'Credits are the standard, bounded remedy for availability; a high-threshold termination right (95%/3 months) is a reasonable enterprise concession without turning uptime into a guarantee.',
    openQuestions:
      'The 95%/3-month termination right appears in the DPA tab of the Legal Playbook but concerns an Exhibit B (ToS SLA) matter — confirm intended placement. The playbook row for this item has no internal-guidance/talktrack/severity fields populated.',
  },
  {
    id: 'pp-031',
    name: 'Termination for Convenience',
    benefitToPylon: 'Protects contracted revenue and term certainty.',
    category: 'Termination / Exit',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      'Standard form has no customer termination-for-convenience right (only termination for cause, §5.3, and the no-active-Order-Forms exit in §5.1). Not addressed in the written playbook, but Pylon Legal reverted it as company policy in a live deal.',
    firstPosition:
      "No termination for convenience\n\nStandard §5.3 provides only mutual termination for cause (uncured 30-day material breach, or insolvency). Pylon Legal position: 'As company policy, Pylon does not agree to termination for convenience.'",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      'Reject as company policy; escalate to legal if the customer makes it a deal-blocker (no pre-approved fallback exists).',
    precedent:
      "Retell cumulative redline: customer added 'Termination for Convenience. Customer may terminate … for any reason or no reason, upon thirty (30) days' prior written notice …' Pylon Legal comment: 'Reverted. As company policy, Pylon does not agree to termination for convenience.'",
    rationale:
      'Convenience termination undercuts committed-term revenue and the minimum-commitment structure.',
    openQuestions:
      "Termination for convenience is not covered in the written Legal Playbook; the 'company policy' position is sourced only from the Retell deal comment. Confirm it should be codified as policy.",
  },
  {
    id: 'pp-032',
    name: 'Effect of Termination — Data Deletion, Refunds & Minimum-Commitment Acceleration',
    benefitToPylon:
      'Protects committed revenue while offering fair refunds where Pylon is the cause.',
    category: 'Termination / Exit',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §5.4: on termination, rights cease; Pylon deletes Customer Data within 30 days of request; refund of prepaid unused fees only on Customer's termination for Pylon's uncured breach; and, except on Customer termination for cause, unpaid minimum commitments accelerate. Negotiated in Port to broaden refund scenarios while Pylon restored the acceleration balance.",
    firstPosition:
      "Delete within 30 days of request; minimum commitment accelerates except on Customer cause termination\n\nStandard §5.4: 'within 30 days of written request, Pylon will delete Customer Data from its systems … if Customer terminates for Pylon's uncured material breach, Pylon will provide Customer a refund of any prepaid, unused fees … except for a termination by Customer for cause, if this Agreement terminates any unpaid minimum commitment amounts set forth on the Order Form will become immediately due.'",
    fallback1:
      "Expand refunds to Pylon's without-cause termination and insolvency\n\nPort MSA (accepted): '30 days' deletion timeline retained and refund protection expanded to cover Pylon's termination without cause and insolvency, with pro-rata calculations.'\n\nComment: Pylon Legal held the line that 'the minimum commitment should accelerate on any early termination except where Customer terminates for Pylon's uncured breach … so a customer cannot walk away from a committed term without the commitment surviving.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not let the minimum-commitment acceleration be limited to Pylon's breach only — Pylon restored acceleration on 'any early termination except where Customer terminates for Pylon's uncured breach.'",
    precedent:
      "Port MSA comments — customer (Royi Podhorzer): 'We've streamlined the data deletion timeline to 30 days and expanded refund protection … limiting acceleration to cases where we actually breach.' Pylon Legal: 'The minimum commitment should accelerate on any early termination except where Customer terminates for Pylon's uncured breach. We restored that balance.'",
    rationale:
      'Refund symmetry for Pylon-side terminations is reasonable, but committed spend must survive customer-driven early exits.',
    openQuestions: '',
  },
  {
    id: 'pp-033',
    name: 'Auto-Renewal',
    benefitToPylon: 'Easy goodwill concession that can be traded for value.',
    category: 'Termination / Exit',
    contractType: 'MSA/ToS / Order Form',
    severity: 'Acceptable',
    standardMsaGuidelineSummary:
      "Standard §5.2 auto-renews Order Forms for the period indicated on the Order Form unless either party gives ≥30 days' notice of non-renewal. Guidance: OK to strike auto-renewal. It is a listed pre-approved fallback for SMB (on the Order Form) and Mid-Market.",
    firstPosition:
      "Auto-renewal with 30-day non-renewal notice\n\nStandard §5.2: 'Unless otherwise agreed in the Order Form, after the applicable Subscription Term, Customer's Order Forms shall automatically renew for the period indicated in the Order Form unless either party provides written notice of its intention not to renew at least 30 days before the end of the then-current Subscription Term.'",
    fallback1:
      "Strike auto-renewal\n\nPlaybook §5.2: 'Customer wants to remove automatic renewal. Ok to strike.'\n\nComment: Listed among the pre-approved SMB Order-Form fallbacks ('no autorenewal') and Mid-Market fallbacks ('auto-renewal') in the Redline Thresholds.",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger: 'None — striking auto-renewal is fully pre-approved.',
    precedent:
      "Legal Playbook §5.2: 'Ok to strike.' Redline Thresholds lists 'no autorenewal' as a pre-approved SMB fallback and 'auto-renewal' as a Mid-Market fallback.",
    rationale:
      'Auto-renewal is a convenience, not a core protection; conceding it is cheap and expected.',
    openQuestions:
      "Playbook 'Standard Language' quotes 'successive one-year Subscription Terms' (12/23/2025 version); current June 2026 template reads 'for the period indicated in the Order Form.' Note the drift when redlining.",
  },
  {
    id: 'pp-034',
    name: 'Non-Infringement Warranty / Disclaimer',
    benefitToPylon:
      'Avoids open-ended IP liability outside the negotiated indemnity framework.',
    category: 'Warranties',
    contractType: 'MSA/ToS',
    severity: 'Critical',
    standardMsaGuidelineSummary:
      'Standard §6.2 disclaims all implied warranties including title and non-infringement. Guidance: push back on any customer-added non-infringement warranty or deletion of the disclaimer, using the talktrack; if that fails, consult legal counsel.',
    firstPosition:
      "Keep the non-infringement disclaimer; rely on the IP indemnity\n\nStandard §6.2: 'PYLON DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING … IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT …'\n\nTalktrack: Non-infringement is a third-party IP risk that no SaaS vendor can warrant away with certainty (e.g., patent assertions or claims based on customer configurations or combined use with other systems). A warranty could effectively create strict liability and expand exposure beyond what's controllable or insurable. Instead, the right protection is the IP indemnity that we offer (as is industry standard): it allocates this third party risk to Pylon on agreed terms (notice/control of defense, exclusions, limits) and gives practical remedies (defense, settlement, and replacement/modification or refund if needed). Keeping the non-infringement warranty disclaimer aligns the contract with that indemnity framework and avoids duplicative or conflicting obligations.",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "'Push back using talktrack. If that doesn't work, consult legal counsel.' Do not accept a non-infringement warranty without legal sign-off.",
    precedent:
      "Legal Playbook §6: 'Push back using talktrack. If that doesn't work, consult legal counsel.' Consistent with the IP-only indemnity in §8.1.",
    rationale:
      'A non-infringement warranty creates strict, uninsurable liability; the IP indemnity is the intended, bounded remedy.',
    openQuestions: '',
  },
  {
    id: 'pp-035',
    name: 'Mutual Corporate-Authority / Performance Warranty',
    benefitToPylon:
      'Meets reasonable mutual-warranty asks while keeping remedies bounded to repair/replace/refund.',
    category: 'Warranties',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "The standard form's only warranty is the §6.1 Documentation-conformance warranty. In negotiated deals Pylon accepted a mutual authority/legal-compliance warranty but rejected broad 'professional and workmanlike'/absolute-performance warranties and expanded remedies, keeping the sole-remedy structure.",
    firstPosition:
      "Documentation-conformance warranty with sole remedy\n\nStandard §6.1: 'Pylon warrants that, during the Subscription Term, the Services will materially comply with the Documentation … Pylon's sole obligation for material non-conformity … shall be, in Pylon's sole discretion, to use commercially reasonable efforts (i) … error-correction or workaround; (ii) … replace the non-conforming portions …; or (iii) … terminate this Agreement and provide … a refund of any prepaid, unused fees.'",
    fallback1:
      "Add a mutual authority + legal-compliance warranty\n\nModern Treasury (accepted, new §6.1(b) 'Mutual Warranties'): 'Each party represents and warrants to the other that (i) it has full corporate right and authority to enter into and perform this Agreement; (ii) its performance of the Agreement will comply with all applicable laws; (iii) [it will not knowingly] cause the Services to contain viruses, malware, ransomware … or similar harmful code.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not accept 'professional and workmanlike'/absolute performance warranties or expanded/uncapped warranty remedies, and do not delete 'sole' from the sole-remedy provision or drop the Customer-Data exclusion — 'Pylon can warrant performance against the Documentation and industry-standard virus scanning, but cannot accept broad absolute warranties or expanded remedies.'",
    precedent:
      "Modern Treasury cumulative redline restructured §6.1 into 'Pylon Warranties' + 'Mutual Warranties' (accepted). Retell return redline struck customer's 'perform its obligations in a professional and workmanlike manner' and unqualified 'comply with all applicable laws.' Port MSA comment: 'Restored \"sole\" so the stated remedy remains the exclusive remedy for warranty non-conformity, and restored Customer Data as a warranty exclusion, since Pylon cannot warrant results driven by Customer's own data.'",
    rationale:
      'Mutual authority/legality warranties are low-risk and mutual; open-ended performance warranties create liability Pylon cannot control or scope.',
    openQuestions:
      "Confirm the exact virus/harmful-code prong wording (whether qualified by 'knowingly') to keep it consistent with the standalone virus-scanning warranty.",
  },
  {
    id: 'pp-036',
    name: 'Compliance-with-Laws Warranty',
    benefitToPylon:
      "Limits regulatory-compliance exposure to Pylon's own conduct.",
    category: 'Warranties',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard form contains no affirmative compliance-with-laws warranty. Guidance: if the customer requests one, qualify it by Pylon's knowledge and clarify Pylon isn't responsible for laws applicable to Customer; drop the knowledge qualifier only as a further fallback.",
    firstPosition:
      "Knowledge-qualified compliance with laws applicable to Pylon only\n\nPlaybook sample (Fallback 1): 'To the best of Pylon's knowledge, Pylon warrants that it complies with laws applicable to Pylon. For avoidance of doubt, Pylon is not responsible for determining the laws that apply to Customer.'",
    fallback1:
      "Remove the knowledge qualifier\n\nPlaybook Fallback 2: 'Remove the knowledge qualifier (\"To the best of Pylon's knowledge\").' Resulting warranty: 'Pylon warrants that it complies with laws applicable to Pylon. For avoidance of doubt, Pylon is not responsible for determining the laws that apply to Customer.'",
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Keep the 'laws applicable to Pylon' scope and the disclaimer that Pylon is not responsible for laws applicable to Customer; further expansion is an escalation (inference).",
    precedent:
      "Legal Playbook §6.1 (cont.). Retell return redline (accepted): 'Pylon complies with laws applicable to Pylon; provided that Pylon is not responsible for determining the laws that apply to Customer.' Port MSA comments repeatedly: 'This is about Customer's use of the Services. Customer is responsible for ensuring its use is compliant.'",
    rationale:
      "Pylon can stand behind its own legal compliance but cannot police the laws governing each customer's particular use.",
    openQuestions: '',
  },
  {
    id: 'pp-037',
    name: 'Virus / Malicious Code Warranty',
    benefitToPylon:
      'Protects against breach claims for viruses that defeat reasonable, industry-standard defenses.',
    category: 'Warranties',
    contractType: 'MSA/ToS',
    severity: 'Material',
    standardMsaGuidelineSummary:
      "Standard §6.1 warrants only that the Services will materially comply with Documentation. Guidance: don't promise the Services will never contain viruses; instead warrant industry-standard virus scanning/testing.",
    firstPosition:
      "Warrant industry-standard virus scanning, not virus-free Services\n\nPlaybook sample: 'Pylon warrants that it will conduct industry standard virus scans and testing on the Services intended to protect the Services from any viruses or malicious code.'\n\nTalktrack: Pylon should not be in breach of warranty if a virus breaks through despite us doing everything a reasonable software provider would do to prevent a virus. We use industry best practices to screen for and eliminate viruses.",
    fallback1: 'No pre-approved fallback recorded in the sources.',
    fallback2: '',
    fallback3: '',
    walkAwayTrigger:
      "Do not accept an absolute 'no viruses/malicious code' warranty; offer the scanning-warranty instead. No further fallback stated.",
    precedent:
      "Legal Playbook §6.1: 'Instead of a promise that Pylon's services will never contain these things, agree to a warranty that Pylon uses industry standard scanning technologies to prevent them.' Modern Treasury (accepted, mutual warranties): warrants party will not '[knowingly] cause the Services to contain viruses, malware, ransomware, or similar harmful code.' Retell return redline: 'conduct industry standard virus scans and testing on [the Services] intended to protect [them] from viruses.'",
    rationale:
      'An absolute virus warranty is effectively strict liability; a diligence-based warranty matches what a reasonable provider can control.',
    openQuestions: '',
  },
];

export const pylonPlaybookSchema: PylonPlaybookSchema = {
  id: 'pylon-provider-playbook',
  name: 'Pylon Provider Playbook',
  description:
    'Provider-side negotiation positions, fallbacks, and walk-away triggers for Pylon commercial contracts.',
  columns: [
    {
      key: 'category',
      label: 'Category',
      type: 'enum',
      enumOptions: [
        'Boilerplate',
        'Data / Security',
        'Deal Process',
        'IP / Indemnity',
        'Liability',
        'Pricing / Fees',
        'Publicity',
        'Scope / Access',
        'Service Levels',
        'Termination / Exit',
        'Warranties',
      ],
    },
    {
      key: 'severity',
      label: 'Severity',
      type: 'enum',
      enumOptions: ['Critical', 'Material', 'Acceptable'],
    },
    {
      key: 'standardMsaGuidelineSummary',
      label: 'Standard MSA / Guideline Summary',
      type: 'text',
    },
    { key: 'firstPosition', label: 'First Position', type: 'text' },
    { key: 'fallback1', label: 'Fallback 1', type: 'text' },
    { key: 'fallback2', label: 'Fallback 2', type: 'text' },
    { key: 'fallback3', label: 'Fallback 3', type: 'text' },
    { key: 'walkAwayTrigger', label: 'Walk-away Trigger', type: 'text' },
    { key: 'precedent', label: 'Precedent', type: 'text' },
    { key: 'rationale', label: 'Rationale', type: 'text' },
    { key: 'openQuestions', label: 'Open Questions', type: 'text' },
  ],
};
