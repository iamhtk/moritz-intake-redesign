/**
 * Generated seed data for the Playbook Studio design proposal.
 *
 * Derived from the anonymized Moritz / Voce AI MSA playbook export (47 clauses),
 * split into four themed playbooks by clause category. Do not edit by hand;
 * regenerate from the source CSV if the underlying playbook changes.
 */

import type { PlaybookStudioPlaybook } from './playbook-studio-data';

const voceMsaCommercialServiceRules: PlaybookStudioPlaybook['rules'] = [
  {
    id: 'rule-section-2-1-acceptable-use-pup-flow-down',
    title: 'Section 2.1 - Acceptable Use / PUP flow-down',
    category: 'Scope/Access',
    severity: 'Material',
    benefit:
      "Protects against downstream misuse; preserves Voce AI's contractual basis for suspension and termination.",
    preferredPosition:
      'Hold standard MSA 2.1 verbatim. PUP incorporated by URL; customer ensures End User compliance through End User Terms in OEM scenarios.',
    rationale:
      "Voce AI GC Guidance (mid-2026) requires customers to agree to the PUP, or to a substantially similar acceptable-use policy that is identifiable and can be pointed to, and to bind their End Users. First Position holds standard 2.1 (PUP incorporated by URL; End User compliance through End User Terms in OEM scenarios). Round 2 accepts a customer's own acceptable-use policy in place of the PUP only where it is substantially similar, identifiable, and referenced in the agreement, and the customer still binds its End Users - exactly the GC-sanctioned flex. Cross-deal pattern: sophisticated platform customers prefer their own AUP; accept it only when substantively equivalent and enforceable against End Users. Walk away if the customer rejects PUP flow-down entirely, refuses to bind End Users, or proposes a PUP omitting material categories (non-consensual voice cloning, deepfakes, illegal content).",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed customers MUST agree to the Prohibited Use Policy, or to a substantially similar PUP that they can point to. A customer's own equivalent acceptable-use policy is acceptable only if it is substantially similar and identifiable. Do not accept removal of the PUP flow-down or End User binding.",
    standardSummary:
      'Standard MSA 2.1 requires customer and End Users to comply with the Prohibited Use Policy at http://voce.ai/use-policy. Guideline email priority: customer must agree to PUP or substantially similar PUP.',
    walkAwayTrigger:
      'Customer rejects PUP flow-down entirely, refuses to bind End Users, or proposes a PUP omitting material categories (voice cloning without consent, deepfakes, illegal content).',
    fallbacks: [
      {
        position:
          "Accept a customer's own acceptable-use policy in place of the PUP only where it is substantially similar, identifiable, and pointed to in the agreement, and the customer still binds its End Users.",
      },
    ],
  },
  {
    id: 'rule-section-2-5-no-phi-sensitive-data',
    title: 'Section 2.5 - No PHI / Sensitive Data',
    category: 'Scope/Access',
    severity: 'Material',
    benefit:
      "Aligns customer expectations with Voce AI's actual compliance posture; protects against regulator complaints.",
    preferredPosition:
      'Hold standard MSA 2.5 verbatim. No PHI except under an executed HIPAA BAA, and no GDPR Art. 9 sensitive data except as permitted by applicable law.',
    rationale:
      "Standard MSA 2.5 prohibits PHI except under an executed HIPAA BAA and GDPR Article 9 sensitive data except as permitted by law; this is a Material protection because sensitive-data processing materially changes Voce AI's regulatory exposure. First Position holds 2.5 verbatim. Round 2 routes genuine PHI needs to Voce AI's standard BAA for HIPAA Eligible Services (http://compliance.voce.ai/), or takes an express acknowledgment that the use case does not involve PHI / sensitive data plus a customer indemnity for breach of the prohibition. The Last Fallback (Orbit signed 2026) deleted the entire No PHI / Sensitive Data prohibition, relying on zero data retention and the broad Customer Content indemnity - a removal of a Material protection that was flagged for escalation and should be confined to customers with BOTH ZDR and a broad Customer Content indemnity. Cross-deal pattern: platform customers operating ZDR will push to delete the PHI bar entirely; default to the BAA route and concede deletion only with ZDR plus a full Customer Content indemnity. Walk away if the customer's use case requires PHI or Article 9 data through the Services without an executed BAA or legal basis.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION]: Voce AI accepted Orbit's deletion of the entire No PHI / Sensitive Data section (Section 2.5 in the older form). Orbit's stated rationale: given the breadth of the data categories and the nature of Orbit's platform and anticipated developer use cases, it could not make the warranty or practically ensure End Users never submit such inputs; it relied on zero data retention (ZDR) and its full Customer Content indemnity. This is a Material concession contrary to the standard hold-verbatim position; recorded as Last Fallback and flagged.",
    standardSummary:
      'Standard MSA 2.5 (No PHI or other Sensitive Personal Data): Customer must not submit Input containing (i) PHI as defined by HIPAA, except as permitted by an executed HIPAA BAA; or (ii) GDPR Art. 9 special-category data (racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data for unique identification, health data, or data concerning sex life or sexual orientation), except as permitted by applicable law. FAQ (non-contractual): Voce AI will sign its standard BAA but not customer-specific terms; HIPAA Eligible Services are listed at http://compliance.voce.ai/.',
    walkAwayTrigger:
      "Customer's product or use case requires processing PHI or GDPR Art. 9 sensitive data through the Services without an executed BAA or legal basis.",
    fallbacks: [
      {
        position:
          "If Customer needs PHI processing, route to Voce AI's standard BAA for HIPAA Eligible Services (http://compliance.voce.ai/). Otherwise accept an express acknowledgment that the use case does not involve PHI or sensitive data, with customer indemnity for breach of the prohibition.",
      },
      {
        position:
          "Orbit floor (signed 2026): for a strategic platform customer operating zero data retention with a full Customer Content indemnity, accept deletion of the entire No PHI / Sensitive Data prohibition, relying instead on ZDR and the customer's indemnity for all Customer Content. Escalate; this removes a Material protection and should be confined to customers with both ZDR and a broad Customer Content indemnity.",
      },
    ],
  },
  {
    id: 'rule-section-2-2-sanctions-restricted-countries',
    title: 'Section 2.2 - Sanctions / Restricted Countries',
    category: 'Scope/Access',
    severity: 'Material',
    benefit:
      'Compliance with sanctions law; consistent application across customer base.',
    preferredPosition:
      'Hold standard MSA 2.2 country list verbatim. No additions, no removals.',
    rationale:
      "Voce AI GC Guidance (mid-2026) is a hard line: do not agree to add any countries to the sanctions / restricted list, and by extension do not bilaterally remove them. Export compliance is a regulatory obligation, not a commercial term, so Round 2 holds the list and concedes only a mechanism (incorporation by reference to the published policy) that keeps it current with the law. First Position holds the list verbatim. Walk away from any demand to remove a listed country or add jurisdictions inconsistent with Voce AI's export-compliance program.",
    precedent:
      'Voce AI GC Guidance (mid-2026): GC confirmed Voce AI should NOT agree to add any additional countries to the sanctions list. Hold the standard restricted-country list; additions or removals inconsistent with the export-compliance program are off the table.',
    standardSummary:
      'Standard MSA 2.2 prohibits use in or for the benefit of Belarus, Cuba, Iran, North Korea, Russia, Syria, and annexed regions of Ukraine. Guideline email priority: no additional countries on sanctions list.',
    walkAwayTrigger:
      "Customer demands removal of any listed country or addition of jurisdictions inconsistent with Voce AI's export compliance program.",
    fallbacks: [
      {
        position:
          "Hold the standard 2.2 restricted-country list. At most, accept incorporating the list by reference to Voce AI's published export-compliance policy so it automatically tracks changes in applicable sanctions law - never adding or removing specific countries through bilateral negotiation.",
      },
    ],
  },
  {
    id: 'rule-exhibit-a-oem-bundled-solution-terms',
    title: 'Exhibit A - OEM / Bundled Solution Terms',
    category: 'Scope/Access',
    severity: 'Material',
    benefit:
      'Allocates End User risk to the OEM customer with privity; preserves brand protection through co-branding.',
    preferredPosition:
      'Hold standard MSA Exhibit A wording. Customer responsibility for End Users via End User Agreement; co-branding required only for competitive AI; Government Entity restrictions intact; 1-year wind-down.',
    rationale:
      "Voce AI GC Guidance (mid-2026) confirms Exhibit A OEM terms are REQUIRED whenever a customer bundles the Services into its own offering, and Voce AI can accept substantial editing of Exhibit A provided the customer remains responsible for its end customers. First Position holds standard Exhibit A (End User responsibility via End User Agreement; co-branding for competitive AI; Government Entity restrictions; one-year wind-down). Round 2 accepts reasonable Exhibit A edits so long as the customer stays contractually responsible for End Users and binds them through End User Terms. The Last Fallback accepts significant Exhibit A edits for strategic OEM customers provided End User responsibility, Government Entity restrictions, and brand protection survive (escalate before conceding any of these). Orbit signed 2026 confirmed OEM terms are required where the customer bundles: Orbit restored the bundling language, made Exhibit A apply 'where applicable,' and left it '[To be inserted when finalized],' with End User responsibility flowing through the End User Agreement. Cross-deal pattern: bundling customers will heavily edit Exhibit A; the non-negotiables are End User responsibility, Government Entity restrictions, and brand protection. Walk away from removal of End User responsibility, removal of Government Entity restrictions, or no co-branding even for directly competitive AI.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed Exhibit A OEM terms are REQUIRED whenever a customer bundles the Services into a product or service it offers to its own end customers. Voce AI can accept a fair amount of editing to Exhibit A, provided the customer remains responsible for its end customers.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): The Orbit deal confirmed OEM terms are required where the customer bundles the Services. Orbit restored the bundling language and made Exhibit A (OEM Terms and Conditions) apply 'where applicable' (Section 1.3), and the parties left Exhibit A as '[To be inserted when finalized]' to be finalized concurrently with related pending items (DPA/security/SLA). Voce AI accepted that OEM/bundling terms would govern Orbit's downstream distribution to End Users, with End User responsibility to flow through the End User Agreement/End User Terms. Recorded as supporting precedent; existing fallback ladder retained.",
    standardSummary:
      "Standard MSA Exhibit A 'Customer Solution Terms' applies when customer bundles Services into a customer product offered to End Users. Includes End User Agreement minimum terms, customer responsibility for End Users, co-branding required for competitive AI, Government Entity restrictions, 1-year wind-down. Guideline email: significant flex available provided customer remains responsible for End Users.",
    walkAwayTrigger:
      'Customer demands removal of End User responsibility, removal of Government Entity restrictions, or no co-branding even for directly competitive AI.',
    fallbacks: [
      {
        position:
          'Accept reasonable edits to Exhibit A wording, provided the customer stays contractually responsible for its End Users and binds them through End User Terms.',
      },
      {
        position:
          'Accept significant Exhibit A edits for strategic OEM customers as long as customer responsibility for End Users, Government Entity restrictions, and brand protection survive. Escalate before conceding any of these.',
      },
    ],
  },
  {
    id: 'rule-section-1-1-service-obligations-affiliate-flow-down',
    title: 'Section 1.1 - Service Obligations / Affiliate flow-down',
    category: 'Scope/Access',
    severity: 'Standard',
    benefit:
      'Preserves subprocessor program flexibility; centralizes data obligations in the DPA where Voce AI has tested language.',
    preferredPosition:
      'Hold standard MSA 1.1 and 11.9. Voce AI remains responsible for its Affiliates and subcontractors under 11.9; subprocessor data obligations live in the DPA. No new flow-down language in 1.1.',
    rationale:
      'Standard MSA 1.1 / 11.9 already makes Voce AI responsible for its Affiliates and subcontractors, with subprocessor data obligations living in the DPA, so First Position adds no new flow-down to 1.1. The Round 2 give restates that responsibility as an express, summary flow-down (protective terms plus responsibility for acts / omissions) - confirming existing substance without operational detail. The Last Fallback (Orbit signed 2026) added granular requirements (access limited to what is strictly necessary, mandatory deletion, training restrictions binding all downstream parties). Walk away if the customer demands direct privity with Affiliates / Subprocessors or audit rights against them.',
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; counterparty OrbitLens Inc.; older MSA form v.2025-07-14): In Section 1.1, Voce AI accepted Orbit's added subprocessor and affiliate flow-down language. Voce AI agreed that any Affiliate, subcontractor, or subprocessor used to perform the Services must be bound by written agreements providing at least the same level of protection for Customer Content and Confidential Information (including restrictions on training and mandatory deletion) as the Agreement; that such parties may access Customer Content only to the extent strictly necessary to (i) provide the Services, (ii) comply with law, (iii) enforce the Agreement, or (iv) prevent abuse; and that Voce AI is responsible for their acts and omissions that cause a breach of the Agreement. Recorded as Last Fallback. Extracted from an older MSA form and mapped by point of law.",
    standardSummary:
      'Standard MSA 1.1: Voce AI will, itself or through its Affiliates or subcontractors, provide the Services per the Order Form. Separately, Section 11.9 (Affiliates and Subcontractors) makes Voce AI responsible for the acts and omissions of its Affiliates and subcontractors. Subprocessor data obligations live in the DPA. The standard form has no broader privity or flow-down language inside 1.1 itself.',
    walkAwayTrigger:
      'Customer demands direct privity with Affiliates or Subprocessors or seeks audit rights against them.',
    fallbacks: [
      {
        position:
          "Accept a general flow-down stating that Voce AI binds its Affiliates, subcontractors, and Subprocessors to confidentiality and data-protection terms at least as protective as the Agreement and remains responsible for their acts and omissions - without the granular 'access strictly necessary' limitation and mandatory-deletion specifics.",
      },
      {
        position:
          'Orbit floor (signed 2026): accept an express flow-down requiring all Affiliates, subcontractors, and Subprocessors to be bound by written agreements giving Customer Content and Confidential Information at least the same protection as the Agreement (including training restrictions and mandatory deletion); limiting their access to Customer Content to what is strictly necessary to provide the Services, comply with law, enforce the Agreement, or prevent abuse; and making Voce AI responsible for their acts and omissions that cause a breach.',
      },
    ],
  },
  {
    id: 'rule-section-1-5-suspension-procedure',
    title: 'Section 1.5 - Suspension procedure',
    category: 'Scope/Access',
    severity: 'Standard',
    benefit: 'Preserves rapid response to abuse without judicial gating.',
    preferredPosition:
      'Hold standard MSA 1.5 verbatim, including the three triggers (legal requirement; material breach tied to a High-Risk Emergency; non-payment) and the at-least-10-day notice and cure unless immediate action is required.',
    rationale:
      "Standard MSA 1.5 already includes the three triggers and a 10-day notice / cure unless immediate action is required. The Round 2 give adds a 'commercially reasonable efforts to notify' and 'minimum scope' tailoring commitment - reasonable customer protection that preserves Voce AI's enforcement tools. The Last Fallback (Orbit signed 2026) narrowed PUP-violation suspension to circumstances necessary to prevent or mitigate a High-Risk Emergency, which materially constrains Voce AI's ability to suspend for ordinary PUP breaches. Walk away if the customer demands removal of all suspension rights or requires a court order before suspension.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 1.5, Voce AI accepted Orbit's narrowing of the suspension right. The trigger moved from 'materially breaches' to 'fails to cure a material breach of the Agreement or violates the Prohibited Use Policy and such action is necessary to prevent or mitigate a High-Risk Emergency.' Voce AI also committed to commercially reasonable efforts to provide at least 10 days' prior notice and an opportunity to cure before suspension (unless immediate action is required), to tailor any suspension to the scope necessary, and to cooperate to restore access. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 1.5 (Suspension): Voce AI may limit or suspend access if (a) required by law; (b) Customer, an Authorized User, or an End User materially breaches the Agreement or the Prohibited Use Policy AND action is necessary to prevent or mitigate a High-Risk Emergency; or (c) Customer fails to pay on time. Voce AI will give at least 10 days' prior notice and cure opportunity unless immediate action is required, and will tailor the suspension to the issue. 'High-Risk Emergency' covers a security risk, credible risk of harm, third-party infringement, or liability.",
    walkAwayTrigger:
      'Customer demands removal of all suspension rights or requires court order before suspension.',
    fallbacks: [
      {
        position:
          "Retain the three suspension triggers (legal requirement; material breach tied to a High-Risk Emergency; non-payment) but accept a commitment to use commercially reasonable efforts to give at least 10 days' notice and an opportunity to cure (unless immediate action is required) and to tailor any suspension to the minimum scope necessary - before narrowing the PUP-violation trigger to High-Risk Emergencies only.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept a narrowed suspension right under which a Prohibited Use Policy-violation suspension is permitted only where necessary to prevent or mitigate a High-Risk Emergency, with commercially reasonable efforts to give at least 10 days' prior notice and an opportunity to cure (unless immediate action is required), and with any suspension tailored to the scope necessary to address the issue. Payment-related suspension on notice after the cure period is retained.",
      },
    ],
  },
  {
    id: 'rule-sla-service-level-agreement-not-in-standard-msa-body',
    title: 'SLA - Service Level Agreement (not in standard MSA body)',
    category: 'Scope/Access',
    severity: 'Standard',
    benefit: 'Single authoritative SLA template; clean MSA.',
    preferredPosition:
      'No SLA in the MSA body. If Customer requires an SLA, attach the standard Voce AI Enterprise SLA as an Order Form addendum or exhibit using standard Voce AI phrasing.',
    rationale:
      "The standard MSA body carries no SLA; First Position routes any SLA to a standard Order Form addendum. Offering Voce AI's standard Enterprise SLA with service-credit remedies is a clean Round 2 that meets most enterprise availability requirements while containing remedy exposure. The Last Fallback (Orbit signed 2026) accepted a committed SLA as Exhibit C plus an MSA-body performance commitment (with the SLA terms left to be finalized). Walk away if the customer demands SLA-level commitments inside the MSA body or remedies beyond service credits.",
    precedent:
      'Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI accepted a new Section 1.12 committing it to provide the Services in accordance with a Service Level Agreement attached as Exhibit C. This moved Voce AI from no-SLA-in-the-body to a contractual SLA commitment, although the Exhibit C SLA terms themselves were left to be finalized. Recorded as Last Fallback.',
    standardSummary:
      'The standard MSA has no SLA in the body (Section 1 ends at 1.10 Beta Services; there is no 1.12). Guideline email: SLA added separately following standard MSA phrasing.',
    walkAwayTrigger:
      'Customer demands SLA-level commitments inside the MSA body or remedies beyond service credits.',
    fallbacks: [
      {
        position:
          "Accept attaching Voce AI's standard Enterprise SLA (with service credits as the sole and exclusive remedy) as an Order Form addendum, before committing to a bespoke customer SLA exhibit and an MSA-body covenant to perform in accordance with it.",
      },
      {
        position:
          'Orbit floor (signed 2026): accept a committed Service Level Agreement attached as an exhibit (Exhibit C) and an MSA-body commitment to provide the Services in accordance with that SLA, rather than refusing any SLA. The SLA exhibit terms themselves remained to be populated/finalized.',
      },
    ],
  },
  {
    id: 'rule-section-2-3-customer-responsibilities',
    title: 'Section 2.3 - Customer Responsibilities',
    category: 'Scope/Access',
    severity: 'Standard',
    benefit:
      'Clear allocation of responsibility for credentialed access; supports investigations.',
    preferredPosition:
      'Hold standard MSA 2.3 wording including (c) account-activity attribution and (d) cooperation duty.',
    rationale:
      "Standard MSA 2.3 includes account-activity attribution (c) and a cooperation / media-provision duty (d). The cooperation duty supports delivery, but platform customers may have little media to provide, so softening it to 'as applicable' is a reasonable Round 2 that preserves the obligation in substance. The Last Fallback (Orbit signed 2026) deleted the media / cooperation duty outright, keeping only Equipment provisioning and account / Equipment security. Walk away if the customer seeks a carve-out from responsibility for End User actions in non-OEM deployments.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 2.3, Voce AI accepted Orbit's deletion of subsection (c) (providing media and content and otherwise reasonably assisting and cooperating with Voce AI to perform the Services). The retained customer responsibilities are limited to obtaining/maintaining Equipment and maintaining the security of Equipment, accounts, and passwords. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 2.3 makes customer responsible for (a) Authorized User compliance, (b) credential security, (c) all account activity including uses with or without customer's knowledge or consent, (d) cooperation with Voce AI investigations.",
    walkAwayTrigger:
      'Customer demands carve-out from responsibility for End User actions in non-OEM deployments.',
    fallbacks: [
      {
        position:
          "Retain the customer's cooperation and media / content-provision duty but soften it to 'reasonable cooperation and provision of materials as applicable to the use case,' before deleting it. Keep the (c) account-activity attribution and the Equipment / account-security responsibilities.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept deletion of the customer obligation to provide media and content and to reasonably assist and cooperate with Voce AI as necessary to perform the Services (the old Section 2.3(c)), retaining only the customer's Equipment-provisioning and account/Equipment-security responsibilities.",
      },
    ],
  },
  {
    id: 'rule-section-1-10-beta-services',
    title: 'Section 1.10 - Beta Services',
    category: 'Scope/Access',
    severity: 'Standard',
    benefit:
      'Lets Voce AI offer early features with no warranty or liability exposure and retire them freely.',
    preferredPosition:
      "Hold standard MSA 1.10. Beta Services are optional, for evaluation only and not for production, provided as-is, may carry additional terms, are not 'Services' under the Agreement, and Voce AI has no liability for harm arising from Beta Services. Trial expires at the earlier of one year or general availability; Voce AI may discontinue at any time.",
    rationale:
      "Standard MSA 1.10 keeps Beta Services as-is, evaluation-only, not 'Services,' with no liability and discretionary discontinuation. Extending the customer's data-protection expectations (confidentiality, no training) to Beta data is low-risk because it concerns data handling, not performance, and is a reasonable Round 2 for customers piloting new features. Walk away from any demand for production-grade warranties, an SLA, or liability for Beta Services.",
    standardSummary:
      "Standard MSA 1.10: Beta Services are evaluation-only, provided as-is, not considered 'Services' under the Agreement, carry no Voce AI liability, and may be discontinued at any time. All Service restrictions and Voce AI reservations of rights still apply. Trial expires at the earlier of one year from start or general availability.",
    walkAwayTrigger:
      'Customer demands production-grade warranties, an SLA, or liability for Beta Services.',
    fallbacks: [
      {
        position:
          "Hold Beta Services as optional, evaluation-only, as-is, and outside the definition of 'Services' with no Voce AI liability, but accept a clarification that any data the customer submits to Beta Services receives the same confidentiality and no-training protections as production Customer Content.",
      },
    ],
  },
  {
    id: 'rule-section-1-2-affiliates-as-customers',
    title: 'Section 1.2 - Affiliates as customers',
    category: 'Scope/Access',
    severity: 'Nice-to-have',
    benefit:
      'Clean Order Form architecture; isolates Affiliate-level disputes.',
    preferredPosition:
      'Hold standard MSA 1.2 wording. No cross-termination cascade across Affiliate Order Forms.',
    rationale:
      'Standard MSA 1.2 allows Affiliate use without a cross-termination cascade. Permitting Affiliates to purchase under the master MSA while keeping each Order Form independent is a low-risk commercial convenience and a natural Round 2 - it isolates default / termination risk to the transacting entity. Walk away from a master MSA with global cross-default across all Affiliates.',
    standardSummary:
      'Standard MSA 1.2 permits customer Affiliates to use Services under separate Order Forms but does not address cross-termination cascade across Affiliate Order Forms.',
    walkAwayTrigger:
      'Customer demands master MSA with global cross-default across all Affiliates.',
    fallbacks: [
      {
        position:
          'Accept Affiliate purchasing under the master MSA with each Affiliate Order Form standing alone (no cross-default or cross-termination across Affiliates), and Voce AI contracting with and invoicing the named customer entity.',
      },
    ],
  },
  {
    id: 'rule-section-1-9-service-updates',
    title: 'Section 1.9 - Service Updates',
    category: 'Scope/Access',
    severity: 'Nice-to-have',
    benefit: 'Preserves continuous product development and security patching.',
    preferredPosition:
      'Hold standard MSA 1.9 verbatim, including the existing no-material-degradation limit and the 90-day API transition notice.',
    rationale:
      'Standard MSA 1.9 already carries a no-material-degradation limit and a 90-day API transition notice. Making the no-degradation commitment explicit (including for security / privacy protections) is a low-risk Round 2 that reassures customers their configuration will not be quietly downgraded. The Last Fallback (Orbit signed 2026) added an express material-breach termination right if a change violates the section. Walk away if the customer demands prior written consent for any update or seeks to freeze the Services as configured on the Effective Date.',
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 1.9, Voce AI accepted Orbit's additions constraining Service updates. Modifications must not materially diminish security or privacy protections for Customer Content or otherwise materially degrade features or functionality during the term; API-version transitions require at least 90 days' prior written notice (deprecation of older versions to follow); and any material change in violation of the section entitles the customer to seek termination for material breach under Section 6. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 1.9 (Updates): Voce AI may modify the Services at any time, PROVIDED updates do not result in a material degradation of the overall functionality or performance of the Services used by Customer. Voce AI may require transition to the most current API version on at least 90 days' prior notice, after which it may deprecate older API versions. The no-degradation limit and the 90-day API notice are already standard, not concessions.",
    walkAwayTrigger:
      'Customer demands prior written consent for any update or freezes the Services as configured on the Effective Date.',
    fallbacks: [
      {
        position:
          'Accept a no-material-degradation commitment (modifications will not materially diminish the security / privacy protections for Customer Content or materially degrade core features during the term) together with the existing 90-day API transition notice - without tying a violation to a separate material-breach termination hook.',
      },
      {
        position:
          "Orbit floor (signed 2026): accept that Service modifications may not materially diminish the security or privacy protections afforded to Customer Content or otherwise materially degrade the features or functionalities of the Services during the subscription term; that Voce AI may require transition to the current API version only on at least 90 days' prior written notice; and that material changes made in violation of this section give the customer a material-breach termination right under Section 6.",
      },
    ],
  },
  {
    id: 'rule-no-work-for-hire-custom-development',
    title: 'No Work-for-Hire / Custom Development',
    category: 'Scope/Access',
    severity: 'Nice-to-have',
    benefit:
      'Keeps the engagement productized and protects Model and Service IP from work-for-hire assignment claims.',
    preferredPosition:
      'No work-for-hire or custom development obligations in the MSA or Order Form. Any additional or professional services are optional and governed by a separate agreement; Voce AI retains ownership of all IP, including anything developed to deliver the Services.',
    rationale:
      'Protecting the SaaS and IP-ownership model is core to Voce AI: custom development and work-for-hire create IP leakage, support burden, and precedent for bespoke builds that do not scale. First Position is that the MSA and Order Form carry no work-for-hire or custom-development obligations, with any additional / professional services handled under a separate, scoped agreement and Voce AI retaining ownership of all IP, including anything developed to deliver the Services. Round 2 accepts a separate, scoped statement of work for professional services with its own fees, while preserving Voce AI ownership of the underlying Services and Models. The Last Fallback accepts, for strategic deals, a limited license to customer-specific configurations only - never assignment of the Models or core IP - and should be escalated. Cross-deal pattern: enterprise customers occasionally seek bespoke build commitments; isolate them in a separate SOW and never let IP ownership of the Models or core Services migrate to the customer. Walk away from work-for-hire ownership of deliverables, custom model development with IP assignment, or bespoke build commitments inside the standard MSA.',
    precedent:
      'Voce AI FAQ (v.2025-12-01 contract set). No deal-specific precedent yet.',
    standardSummary:
      'FAQ (non-contractual): Voce AI provides SaaS Services on a subscription model, includes certain support and maintenance for the term, and does NOT offer work-for-hire or custom development. Optional additional services, if purchased, are governed by a separate agreement. This aligns with MSA 3.1 (Voce AI owns the Models and Services) and the Order Form structure.',
    walkAwayTrigger:
      'Customer demands work-for-hire ownership of deliverables, custom model development with IP assignment, or bespoke build commitments inside the standard MSA.',
    fallbacks: [
      {
        position:
          'Accept a separate, scoped statement of work for professional services with its own fees, while keeping Voce AI ownership of the underlying Services and Models.',
      },
      {
        position:
          'For strategic deals, accept a limited license to customer-specific configurations only, never assignment of the Models or core IP. Escalate.',
      },
    ],
  },
  {
    id: 'rule-section-5-2-payment-terms',
    title: 'Section 5.2 - Payment Terms',
    category: 'Pricing/Fees',
    severity: 'Standard',
    benefit: 'Predictable revenue recognition and cash flow.',
    preferredPosition: 'Net 30 per standard MSA 5.2.',
    rationale:
      "Standard MSA 5.2 is Net 30. Payment timing is a cash-flow lever; a brief grace period, or Net 45 conditioned on prepayment / auto-pay / committed spend, is a measured Round 2 that accommodates enterprise procurement without unconditionally extending terms. The Last Fallback (Orbit signed 2026) accepted Net 45 outright (retaining the late charge and gross-up), though the customer marked it 'pending re-approval by Orbit finance,' so treat unconditional Net 45 as the floor rather than a settled standard. Walk away from Net 90 or longer, or pay-on-use without minimum commitment.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 5.2, the payment term moved from 30 to 45 days (Net 45). The late charge of 1.5% per month and the tax responsibility/gross-up language were retained. Caveat: Orbit's comment flagged the change as 'pending re-approval by Orbit finance,' so the Net 45 term should be confirmed as finalized. Recorded as Last Fallback with that caveat.",
    standardSummary:
      "Standard MSA 5.2 (Payment): Customer pays all invoices within 30 days of the invoice date. Unpaid amounts accrue a finance charge of 1.5% per month (or the legal maximum if lower), and Customer reimburses Voce AI's collection costs (including reasonable attorneys' fees and arbitration or court costs). Customer bears all taxes other than Voce AI's net-income tax, pays without deduction or set-off, grosses up for any withholding taxes, and indemnifies Voce AI for taxes, interest, or penalties from its non-compliance with 5.2. This row covers the Net 30 term; the finance charge and the tax provisions are tracked as separate positions.",
    walkAwayTrigger:
      'Customer demands Net 90 or longer, or pay-on-use without minimum commitment.',
    fallbacks: [
      {
        position:
          'Hold Net 30 with a short grace period (e.g., 10 days) before late charges accrue, or accept Net 45 only where the customer commits to annual prepayment, auto-pay, or a minimum committed spend - retaining the 1.5% per month late charge and the tax gross-up.',
      },
      {
        position:
          "Orbit floor (signed 2026): accept Net 45 payment terms (from the standard Net 30), retaining the 1.5% per month late charge (or maximum permitted by law) and the tax gross-up. Confirm Net 45 was finalized; the customer comment marked it 'pending re-approval by Orbit finance,' so treat as the latest-version position rather than a fully settled precedent.",
      },
    ],
  },
  {
    id: 'rule-section-5-2-late-payment-interest-collection-costs',
    title: 'Section 5.2 - Late Payment Interest / Collection Costs',
    category: 'Pricing/Fees',
    severity: 'Standard',
    benefit:
      'Compensates for delayed collections and shifts collection costs to the defaulting customer.',
    preferredPosition:
      "Hold standard MSA 5.2: 1.5% per month finance charge on overdue amounts (or legal maximum if lower), plus reimbursement of Voce AI's collection costs including reasonable attorneys' fees and arbitration or court costs.",
    rationale:
      "Standard MSA 5.2 sets a 1.5% per month finance charge (or legal max if lower) plus recovery of collection costs including reasonable attorneys' fees and arbitration / court costs. The late charge deters slow payment and the cost-recovery right protects Voce AI in collection. A modest rate reduction and a 'reasonable, actually incurred' qualifier on costs is an easy Round 2. Walk away from removing all late-payment interest and collection-cost recovery.",
    standardSummary:
      "Standard MSA 5.2: unpaid amounts are subject to a 1.5% per month finance charge (or the legal maximum if lower); Customer reimburses collection costs, including collection agency fees, reasonable attorneys' fees, and arbitration or court costs.",
    walkAwayTrigger:
      'Customer demands removal of all late-payment interest and collection-cost recovery.',
    fallbacks: [
      {
        position:
          "Accept reducing the finance charge to 1.0% per month (or the legal maximum if lower) and limiting collection-cost recovery to reasonable attorneys' fees and costs actually incurred, while retaining the late-charge and collection-cost right itself.",
      },
    ],
  },
  {
    id: 'rule-section-5-2-taxes-gross-up-tax-indemnity',
    title: 'Section 5.2 - Taxes / Gross-Up / Tax Indemnity',
    category: 'Pricing/Fees',
    severity: 'Standard',
    benefit:
      'Protects net revenue from withholding and shifts tax compliance risk to Customer.',
    preferredPosition:
      "Hold standard MSA 5.2 tax terms: Customer bears all taxes except Voce AI's net-income tax; pays without deduction or set-off; grosses up for any required withholding; and indemnifies Voce AI for additional taxes, interest, or penalties from Customer's non-compliance with 5.2.",
    rationale:
      "Standard MSA 5.2 puts all taxes except Voce AI's net-income tax on the customer, requires payment without deduction or set-off, grosses up for required withholding, and indemnifies Voce AI for taxes / interest / penalties from the customer's non-compliance. Carving out Voce AI-caused taxes (its nexus / net income) and conditioning gross-up on Voce AI supplying available exemption documentation is fair and a clean Round 2 that preserves the core net-consideration protection. Walk away if the customer demands Voce AI bear withholding taxes or refuses any gross-up.",
    standardSummary:
      "Standard MSA 5.2: Customer is responsible for all taxes other than Voce AI's net-income tax; pays without deduction or set-off; grosses up for any required withholding so Voce AI receives the full amount owed; and indemnifies Voce AI for additional taxes, interest, or penalties from Customer's non-compliance with 5.2. FAQ (non-contractual): for Alabama customers, Voce AI collects the Simplified Sellers Use Tax on taxable transactions and remits it to the Alabama Department of Revenue.",
    walkAwayTrigger:
      'Customer demands Voce AI bear withholding taxes or refuses any gross-up.',
    fallbacks: [
      {
        position:
          "Accept that the customer's gross-up and tax indemnity exclude taxes arising from Voce AI's own nexus or net income, and apply only where Voce AI has provided valid exemption / withholding documentation when reasonably available - while retaining customer responsibility for transaction taxes and any required withholding gross-up.",
      },
    ],
  },
  {
    id: 'rule-section-5-1-billing-disputes-disputed-charges',
    title: 'Section 5.1 - Billing Disputes / Disputed Charges',
    category: 'Pricing/Fees',
    severity: 'Nice-to-have',
    benefit:
      'Reduces friction on routine billing disputes; preserves payment discipline on undisputed amounts.',
    preferredPosition:
      'Customer must pay in full and dispute in writing; Voce AI will credit any verified overcharge.',
    rationale:
      "First Position requires payment in full with disputes raised in writing and credits for verified overcharges. Allowing the customer to withhold only the disputed portion, while paying the undisputed balance on time, is a reasonable and common Round 2 that protects Voce AI's cash flow and discourages pretextual withholding. Walk away from any unilateral right to withhold amounts without a good-faith dispute basis.",
    standardSummary:
      'Standard MSA 5.1 (Fees) provides a billing-error mechanism: Customer must notify Voce AI within 30 days of the first invoice in which an error appeared to receive an adjustment or credit. The standard form has no standalone right to withhold disputed amounts. (Section 5 contains only 5.1 Fees and 5.2 Payment; there is no 5.3.)',
    walkAwayTrigger:
      'Customer demands unilateral right to withhold any amount without good-faith dispute basis.',
    fallbacks: [
      {
        position:
          'Accept that the customer may withhold only the specific good-faith-disputed amount (not the entire invoice) pending resolution, provided it pays the undisputed balance by the due date and raises the dispute in writing within a defined window; Voce AI credits any verified overcharge.',
      },
    ],
  },
];

const voceMsaDataSecurityConfidentialityRules: PlaybookStudioPlaybook['rules'] =
  [
    {
      id: 'rule-section-1-7-personal-data-dpa-incorporation',
      title: 'Section 1.7 - Personal Data / DPA incorporation',
      category: 'Data/Security',
      severity: 'Material',
      benefit:
        'Operational consistency across customer base; protects subprocessor flow-down; reduces DPA management overhead.',
      preferredPosition:
        'DPA incorporated by URL reference per standard MSA 1.7. No customer-specific DPA, no customer-edited DPA. Direct customer to http://voce.ai/dpa.',
      rationale:
        "First Position incorporates the Voce AI DPA by URL with no edits. Because the DPA is engineered for multi-tenant consistency, the Round 2 give is to edit the Voce AI DPA (counter-signature, SCC module selection, trimming secondary processing purposes) while keeping it as the controlling instrument - this satisfies most regulated customers without importing bespoke obligations. Swapping to the customer's own DPA (as accepted in the Orbit signed deal, conditioned on zero data retention and preservation of SCCs, breach notice, subprocessor flow-down, and minimum security) is the Last Fallback and should be escalated. Walk away from substantive edits that shorten breach notice, expand audit rights, or dictate data residency outside the DPA framework.",
      precedent:
        "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION]: Voce AI made a significant Personal Data concession. It (i) replaced its own URL-linked DPA with Orbit's DPA attached as Exhibit B (Orbit's paper, taken to balance the deal given Orbit's regulatory consent order and new STT/TTS/STS data flows introducing Orbit user data), and (ii) deleted 'data analysis, benchmarking' from the permitted Section 1.7 Personal Data processing purposes, leaving operation, support, provision, billing, account management, technical support, and legal compliance. Orbit's DPA incorporates zero data retention (ZDR) for Customer Content, EU/UK SCCs (Netherlands governing law and forum, Dutch supervisory authority), 72-hour breach notification, a subprocessor list at http://compliance.voce.ai/, and detailed Annex II minimum security requirements. Recorded as Last Fallback and flagged for deal-by-deal approval.",
      standardSummary:
        "Standard MSA 1.7 incorporates the Voce AI DPA by URL reference at http://voce.ai/dpa. FAQ (non-contractual): Voce AI will sign its standard DPA but not customer-specific terms; the DPA incorporates the Standard Contractual Clauses (SCCs) by reference and is automatically included in and forms part of the MSA. Subprocessor list is published at http://compliance.voce.ai/, and Voce AI remains responsible for its suppliers' performance.",
      walkAwayTrigger:
        'Customer demands substantive edits to DPA terms, e.g., shortened breach notification, expanded audit rights, or customer-dictated data residency.',
      fallbacks: [
        {
          position:
            "Keep the Voce AI DPA (http://voce.ai/dpa) as the operative document but accept negotiated edits to it - adding the customer as a counter-signing party, selecting the customer's preferred SCC module, and deleting secondary processing purposes such as data analysis and benchmarking - rather than replacing it with the customer's own DPA.",
        },
        {
          position:
            "Orbit floor (signed 2026): for a strategic, highly regulated customer, accept the customer's own DPA in place of the Voce AI DPA (attached as an exhibit), and delete secondary Personal Data processing purposes such as data analysis and benchmarking, provided zero data retention applies to Customer Content and core protections (SCCs, breach notice, subprocessor flow-down, minimum security) are preserved. Escalate; customer-paper DPA.",
        },
      ],
    },
    {
      id: 'rule-section-1-6-usage-data-performance-data',
      title: 'Section 1.6 - Usage Data (Performance Data)',
      category: 'Data/Security',
      severity: 'Material',
      benefit:
        'Preserves training and analytics capability on de-identified data; supports SOC 2 telemetry.',
      preferredPosition:
        'Hold standard MSA 1.6 verbatim. Usage Data is aggregate, anonymized, and excludes Personal Data and Customer Content. Voce AI retains rights to use for product improvement, analytics, and service operation.',
      rationale:
        "Voce AI GC Guidance (mid-2026) is explicit that Voce AI must retain rights to usage data; this is a hard requirement, so every fallback preserves the usage-data right itself. Standard MSA 1.6 already limits Usage Data to aggregate, anonymized data excluding Personal Data and Customer Content. The Round 2 give simply makes the Customer Content / voice exclusion express - a clarification, not a substantive loss. The Last Fallback (Orbit signed 2026) adopted the customer's defined 'Anonymized' standard and extended the exclusion across the customer's licensors and users. Walk away if the customer tries to strip the usage-data right entirely or require consent for each use.",
      precedent:
        "Voce AI GC Guidance (mid-2026): GC confirmed, as a huge-ticket item, that Voce AI MUST maintain its rights to usage data under Section 1.6. This is a hold position; do not trade away usage-data rights. Usage Data stays aggregate and anonymized and excludes Personal Data and Customer Content.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI kept its Section 1.6 usage-data rights (consistent with the GC hold) but accepted Orbit's narrowing edits. 'Aggregate and anonymized' became the defined term 'Anonymized' (data not relating to an identified or identifiable natural person), Performance Data was expressly stated not to include any Customer Content (including audio recordings, voice recordings, or voice characteristics), and a formal definition of 'Anonymized' was added. The usage-data right was preserved; the narrowing of scope is the recorded floor.",
      standardSummary:
        "Standard MSA 1.6 reserves Voce AI's rights to use aggregate, anonymized usage data for product improvement, analytics, and service operation. Excludes Personal Data and Customer Content. Guideline email priority: Voce AI MUST retain rights to usage data.",
      walkAwayTrigger:
        "Customer demands removal of Voce AI's usage data rights entirely or requires consent for each use.",
      fallbacks: [
        {
          position:
            "Retain Voce AI's Performance / Usage Data rights but accept an express exclusion of Customer Content (including audio and voice recordings and voice characteristics) and Personal Data from Performance Data, without yet adopting the customer's bespoke 'Anonymized' definition or extending the exclusion to its licensors, Authorized Users, and End Users.",
        },
        {
          position:
            "Orbit floor (signed 2026): retain Voce AI's Performance Data rights, but accept that Performance Data is limited to 'Anonymized' data (defined as data not relating to an identified or identifiable natural person) and expressly excludes all Customer Content, including any audio recordings, voice recordings, or voice characteristics of Customer, its licensors, Authorized Users, or End Users.",
        },
      ],
    },
    {
      id: 'rule-section-1-8-information-security',
      title: 'Section 1.8 - Information Security',
      category: 'Data/Security',
      severity: 'Standard',
      benefit:
        'Reduces redlining surface in the MSA; aligns commitments with the operational document.',
      preferredPosition:
        'Hold standard MSA 1.8 wording. Detailed security controls live in DPA Annex II; SOC 2 Type II report available under NDA.',
      rationale:
        "Standard MSA 1.8 keeps the detailed controls in DPA Annex II, with SOC 2 Type II available under NDA, so the program can evolve with Voce AI's security posture. The Round 2 give confirms the substance (encryption, access control, prompt breach notice) by reference, without freezing point-in-time specifics into the contract. The Last Fallback (Orbit signed 2026) hard-coded AES-256, MFA, pen-testing intervals, a 48-hour breach clock, and annual SOC 2 evidence into Section 1.8 itself. Walk away from demands for certifications beyond SOC 2 (ISO 27001, FedRAMP) or audit rights inconsistent with the DPA.",
      precedent:
        "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 1.8, Voce AI accepted Orbit's substantial expansion of the information-security obligations: a comprehensive security program with administrative, technical, and physical safeguards including, at a minimum, (i) encryption of all Customer Content at rest and in transit using industry-standard encryption (e.g., AES-256 or stronger), (ii) MFA for all personnel access to Voce AI's systems, and (iii) vulnerability scanning and penetration testing at commercially reasonable intervals; written Security Incident notification no later than 48 hours after discovery; and participation in an annual third-party SOC 2 Type II audit with evidence on request. Recorded as Last Fallback.",
      standardSummary:
        'Standard MSA 1.8 (Information Security): Voce AI uses industry-standard measures to protect Customer Content and participates in an annual third-party audit certification (such as SOC 2 Type II), with evidence provided to Customer on request. Detailed controls live in DPA Annex II. FAQ (non-contractual): data is hosted in a major cloud provider data centers; Voce AI holds SOC 2 Type 2, obtains annual independent SOC-2 reports, and engages reputable third parties for penetration tests, with reports and certifications available at http://compliance.voce.ai/.',
      walkAwayTrigger:
        'Customer demands certifications beyond SOC 2 (e.g., ISO 27001, FedRAMP) or audit rights inconsistent with the DPA.',
      fallbacks: [
        {
          position:
            'Accept a security-commitments addendum that references the controls in DPA Annex II and the SOC 2 Type II program - including encryption in transit and at rest, access controls, and breach notification without undue delay - without hard-coding specific tooling (AES-256, MFA), a fixed 48-hour breach clock, or a fixed pen-test cadence into the MSA body.',
        },
        {
          position:
            'Orbit floor (signed 2026): accept an expanded Section 1.8 security program including encryption of all Customer Content at rest and in transit using industry-standard protocols (e.g., AES-256 or stronger), multi-factor authentication for all personnel access, vulnerability scanning and penetration testing at commercially reasonable intervals, written breach notification no later than 48 hours after discovery, and annual SOC 2 Type II audit certification with evidence on request.',
        },
      ],
    },
    {
      id: 'rule-customer-audit-rights-compliance-reports-in-lieu-of-audit',
      title: 'Customer Audit Rights (compliance reports in lieu of audit)',
      category: 'Data/Security',
      severity: 'Standard',
      benefit:
        'Protects multi-tenant security and staff time while still satisfying enterprise security diligence through standardized reports.',
      preferredPosition:
        'No direct customer audit or on-site inspection rights. Provide SOC 2 Type II reports and penetration-test summaries on request via http://compliance.voce.ai/. Any customer-facing audit obligation runs the other way under Exhibit A for resale or Government Entity arrangements.',
      rationale:
        "A multi-tenant SaaS cannot grant individualized on-site audits without security and operational risk; SOC 2 Type II plus penetration-test evidence (via http://compliance.voce.ai/) satisfies most enterprise diligence and is consistent with Voce AI's FAQ posture. Round 2 offers a once-per-year remote questionnaire and the latest SOC 2 Type II report under NDA. The Last Fallback (Orbit signed 2026, via the customer DPA) conceded a virtual audit right triggered when the customer reasonably deems the SOC 2 report insufficient or reasonably believes a breach occurred, capped at three business days, at customer cost absent a material finding - a meaningful step beyond report-only, reserved for strategic or regulated customers. Cross-deal pattern: regulated and platform customers increasingly seek a contingent virtual-audit backstop; hold report-only as the default and concede the contingent virtual audit only under a SOC-2-first gate with tight scope, duration, and cost controls. Walk away from on-site audits, unlimited audits, or any access to source code or infrastructure.",
      precedent:
        "Standard MSA 1.8 and Voce AI FAQ (v.2025-12-01 contract set). No deal-specific precedent yet.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION via customer DPA]: Through Orbit's DPA (Section 1.13), Voce AI accepted customer audit rights beyond report-only. The customer reviews a current SOC 2 Type II report in the first instance; if it reasonably determines the report is insufficient, or reasonably believes a breach occurred, the customer or its designated internationally recognized auditor may conduct additional audits virtually, subject to: (a) confidentiality obligations; (b) no unreasonable interference and no third-party confidential information; (c) mutually agreed scope, timing, and duration not exceeding three business days; and (d) the customer bearing documented, reasonable costs unless the audit reveals a material breach. The DPA also gives the customer the right to take reasonable measures including termination to stop unauthorized data use. This departs from the report-only first position. Recorded as Last Fallback and flagged.",
      standardSummary:
        'The MSA grants no customer right to audit Voce AI. Section 1.8 commits Voce AI to an annual third-party SOC 2 Type II audit, with evidence provided on request. FAQ (non-contractual): Voce AI does not permit customer audits; it provides SOC-2 Type 2 reports and third-party penetration test results, plus subprocessor and certification details, via http://compliance.voce.ai/.',
      walkAwayTrigger:
        'Customer demands on-site audit rights, unlimited audits, or access to Voce AI source code or infrastructure.',
      fallbacks: [
        {
          position:
            'Offer a remote security questionnaire once per year and access to the latest SOC 2 Type II report under NDA.',
        },
        {
          position:
            "For strategic or regulated customers, accept a narrow, remote, once-per-year review limited to confirming SOC 2 scope, at customer expense and with reasonable notice. Escalate.\n\nOrbit floor (signed 2026): via the customer's DPA, accept that the customer reviews the SOC 2 Type II report in the first instance, and if it reasonably determines the report is insufficient or reasonably believes a breach occurred, the customer (or its designated internationally recognized auditing firm) may conduct additional audits virtually, subject to confidentiality, no unreasonable interference, mutually agreed scope and timing not exceeding three business days, with the customer bearing the audit costs unless a material breach is found.",
        },
      ],
    },
    {
      id: 'rule-section-1-11-zero-retention-mode',
      title: 'Section 1.11 - Zero-Retention Mode',
      category: 'Data/Security',
      severity: 'Material',
      benefit:
        'Keeps product-level commitments tied to product roadmap; avoids MSA-level promise of features not yet generally available.',
      preferredPosition:
        'No zero-retention mode language in MSA. If customer requests zero-retention mode, point to Order Form and the standard zero-retention mode offering for TTS API; do not add zero-retention mode language to the MSA body.',
      rationale:
        "zero-retention mode is a product configuration, not an MSA term; Voce AI's own standard insert (used in the Orbit deal as a Section 1.11 reference) keeps the MSA generic and points retention specifics to the Order Form and the standard zero-retention mode offering for the relevant API. Keeping bespoke zero-retention mode mechanics out of the MSA body avoids product-specific drafting drift across deals. Walk away if the customer demands zero-retention mode across all products (STS, STT, Agents) or zero-second retention with no operational tail, which is not technically supportable.",
      standardSummary:
        'No Section 1.11 in standard MSA. Guideline email: zero-retention mode is a product offering, not an MSA commitment; agreed in the Order Form only if requested by customer.',
      walkAwayTrigger:
        'Customer demands zero-retention mode across all products (STS, STT, Agents) or zero-second retention with no operational tail.',
      fallbacks: [
        {
          position:
            "If the customer insists on referencing zero-retention mode in the MSA, accept a cross-reference to Voce AI's standard zero-retention mode offering and the retention settings in the Order Form, rather than drafting bespoke zero-retention mode mechanics into the MSA body.",
        },
      ],
    },
    {
      id: 'rule-section-4-confidentiality',
      title: 'Section 4 - Confidentiality',
      category: 'Confidentiality',
      severity: 'Standard',
      benefit: 'Reciprocal protection; predictable tail.',
      preferredPosition:
        'Hold standard MSA 4 verbatim. Mutual confidentiality, customary exclusions, equitable relief under 4.3, and no fixed expiry (survives per 6.3).',
      rationale:
        'Standard MSA 4 is mutual, with customary exclusions, equitable relief, and survival per 6.3 (no fixed expiry). A fixed post-termination term for ordinary Confidential Information, paired with an indefinite tail for trade secrets, is market-standard and easier to administer than perpetual protection for all categories, so it is a clean Round 2. The walk-away is a demand for permanent confidentiality across all Confidential Information without a trade-secret distinction, which is operationally impractical.',
      standardSummary:
        'Standard MSA 4 is mutual. Confidential Information is information marked confidential or that reasonably should be understood to be confidential (expressly including, for Voce AI, the Agreement, its pricing, and non-public Service information, and for Customer, non-public Customer Content). Customary exclusions apply (publicly available, prior possession, independently developed, lawfully received). Permitted disclosure to personnel and advisors under similar obligations, and as required by law with prior notice. 4.3 adds equitable relief. NOTE: the standard form sets NO fixed confidentiality survival period; obligations survive per the 6.3 survival list.',
      walkAwayTrigger:
        'Customer demands permanent confidentiality for all Confidential Information without trade-secret distinction.',
      fallbacks: [
        {
          position:
            'Accept a fixed confidentiality term for general Confidential Information (e.g., the term plus three to five years), with trade secrets protected for as long as they remain trade secrets under applicable law, keeping the mutual obligations, customary exclusions, and equitable-relief provision.',
        },
      ],
    },
  ];

const voceMsaIpIndemnityLiabilityRules: PlaybookStudioPlaybook['rules'] = [
  {
    id: 'rule-section-3-2-customer-input-ownership-definition',
    title: 'Section 3.2 - Customer Input ownership / definition',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Pairs ownership with customer indemnity under 8.3; clarifies privity rationale.',
    preferredPosition:
      'Hold standard MSA 3.2 verbatim. Customer owns Input and Output as Customer Content; Voce AI owns the Models. Input includes text, audio, and prompts.',
    rationale:
      "Voce AI GC Guidance (mid-2026) confirms the customer owns its Inputs and must stand behind them (paired with the uncapped 8.3 indemnity); Voce AI never owns Inputs and owns only the Models. First Position holds standard 3.2 (customer owns Input / Output as Customer Content). Extending Input ownership to the customer's own Authorized Users and End Users is a natural clarification and a clean Round 2. The Last Fallback (Orbit signed 2026) extended ownership further to the customer's licensors and any other individual included in Customer Content. Walk away if the customer tries to claim ownership of the Models or other Voce AI IP through the Input definition.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed the customer owns its Inputs, meaning what the customer feeds into the Models once it uses the Services. The customer must stand behind its Inputs, which pairs directly with the uncapped Section 8.3 indemnity. Voce AI never owns the Inputs; Voce AI owns only the Models.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI accepted Orbit's expansion of Input ownership to include not just Customer but also its licensors, Authorized Users, End Users, and any other individual included in Customer Content. This is a clarifying concession that does not affect Voce AI's ownership of the Models. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 3.2 (Customer Rights): Customer is and remains the sole and exclusive owner of Input (text, audio, prompts, and other materials that Customer, its Authorized Users, or End Users provide to the Services) and Output (data or content generated by the Services for Customer, other than the Models); together 'Customer Content.' Voce AI disclaims ownership of Customer Content. Output may not be unique across users, and Outputs generated for other users are not Customer's. Input is defined in 3.2, not 3.3.",
    walkAwayTrigger:
      'Customer demands ownership of Models or Voce AI IP through Input definition.',
    fallbacks: [
      {
        position:
          "Accept that ownership of Input extends to the customer's Authorized Users and End Users (persons acting through the customer), without extending to the customer's 'licensors' or 'any other individual included in Customer Content.' Voce AI ownership of the Models is unaffected.",
      },
      {
        position:
          'Orbit floor (signed 2026): accept that ownership of Input extends beyond Customer to its licensors, Authorized Users, End Users, and any other individual included in Customer Content. Voce AI ownership of the Models is unaffected.',
      },
    ],
  },
  {
    id: 'rule-section-3-1-voce-ai-ip-models-feedback',
    title: 'Section 3.1 - Voce AI IP / Models / Feedback',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Preserves model ownership and improvement loop; foundational to business model.',
    preferredPosition:
      'Hold standard MSA 3.1 verbatim. Voce AI owns the Services, Models, and all IP. Feedback is freely usable by Voce AI with no payment or attribution; Customer waives moral rights in Feedback.',
    rationale:
      "Voce AI GC Guidance (mid-2026) frames the IP split as the concept customers most misunderstand: Voce AI's IP is the Models it provides plus Feedback that supports and improves them, and Voce AI stands behind the Models. First Position holds standard 3.1 (ownership of Services / Models / IP; broad Feedback license; moral-rights waiver). The Round 2 give narrows Feedback to exclude Customer Content and Customer Confidential Information - a clarification that does not touch ownership or the core Feedback right. The Last Fallback (Orbit signed 2026) additionally excluded the customer's material non-public information from Feedback. Walk away if the customer claims ownership in the Models, asserts joint ownership of Service IP, or refuses any Feedback license.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC stressed the IP split is the concept customers most often misunderstand. Voce AI's IP is the Models it provides to the customer, plus Feedback that can support and improve those Models. Voce AI stands behind the Models. Hold Section 3.1 ownership of the Services, Models, and all IP, plus the Feedback license with no payment or attribution.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI retained ownership of the Services, Models, and all IP and the no-payment/no-attribution Feedback license, but accepted Orbit's carve-out that Feedback does not include Customer Content submitted to or generated by the Services, Customer Confidential Information, or Customer's material non-public information. Ownership and the Feedback right were preserved; the Feedback-scope exclusion is the recorded floor.",
    standardSummary:
      'Standard MSA 3.1 (Voce AI Rights): Voce AI owns and retains all right, title and interest in the Services, the Models, and all IP Rights therein. Section 3.1 also grants Voce AI the right to use and exploit any Feedback with no payment or attribution obligation, and Customer waives moral rights in Feedback. Feedback sits in 3.1, not 3.2. (Customer ownership of Input and Output is in 3.2, tracked separately.) Guideline email: Voce AI owns Models and Feedback.',
    walkAwayTrigger:
      'Customer claims ownership in Models, asserts joint ownership of Service IP, or refuses any Feedback license.',
    fallbacks: [
      {
        position:
          "Retain Voce AI's ownership of the Services, Models, and all IP, and the no-payment / no-attribution Feedback license, but accept that 'Feedback' excludes Customer Content submitted to or generated by the Services and Customer Confidential Information - without yet extending the exclusion to the customer's 'material non-public information.'",
      },
      {
        position:
          "Orbit floor (signed 2026): retain Voce AI ownership of the Services, Models, and all IP, plus the Feedback license, but accept that 'Feedback' expressly excludes Customer Content submitted to or generated by the Services, Customer Confidential Information, and Customer's material non-public information.",
      },
    ],
  },
  {
    id: 'rule-section-3-2-output-rights',
    title: 'Section 3.2 - Output Rights',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Preserves Model ownership while honoring customer ownership of generated content.',
    preferredPosition:
      'Hold standard MSA 3.2 verbatim. Customer owns Output (excluding Models) via ownership acknowledgment and Voce AI disclaimer, not assignment.',
    rationale:
      "Voce AI GC Guidance (mid-2026) confirms the customer owns Customer-Derived Output (but not the Models) and must stand behind both its Inputs and its Output; the GC-preferred mechanism is an ownership acknowledgment plus an Voce AI disclaimer, not an assignment. First Position holds standard 3.2 on that basis. The Round 2 give simply strengthens the disclaimer, which satisfies most customers while preserving the preferred structure. The Last Fallback (Orbit signed 2026) accepted express assignment language ('Voce AI hereby assigns... all right, title and interest... excluding the Models'), in perpetuity, subject to payment of undisputed Fees, extended to the customer's licensors and users - a mechanism change (not a Models give) reserved for the deeper rung. Walk away if the customer claims ownership in the Models or asserts Output ownership without the Models exclusion.",
    precedent:
      'Voce AI GC Guidance (mid-2026): GC confirmed the customer owns Customer-Derived Output and Customer Content, meaning the output from the Models after the customer supplies its Inputs, but NOT the Models themselves. The customer must stand behind BOTH its Inputs and the Customer-Derived Output. This is the trickiest point for customers; be explicit that ownership of generated content does not extend to the underlying Models.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [minor deviation]: Voce AI accepted an assignment construct for Output rather than the GC-preferred ownership-acknowledgment-plus-disclaimer approach. The signed text has Voce AI assign to Customer (and its licensors, Authorized Users, and End Users) all right, title, and interest in the Output in perpetuity, to the fullest extent possible under law, subject to payment of all undisputed Fees, but expressly excluding the Models. The Models carve-out was preserved; the assignment mechanism (vs. ownership acknowledgment) is the recorded floor and a minor deviation to note.',
    standardSummary:
      "Standard MSA 3.2 (Customer Rights): Customer is and remains the sole and exclusive owner of Output (content generated by the Services for Customer), excluding the Models, and Voce AI disclaims ownership. The standard uses ownership-acknowledgment and disclaimer language, not assignment language. Output may not be unique across users; Outputs generated for other users are not Customer's. Output rights are in 3.2, not 3.4. Guideline email: customer owns Inputs and Output but NOT Models.",
    walkAwayTrigger:
      'Customer claims ownership in Models or asserts ownership of Output without exclusion for Models.',
    fallbacks: [
      {
        position:
          'Keep the ownership-acknowledgment-plus-disclaimer construct (the GC-preferred approach) but strengthen it with an express statement that Voce AI claims no right, title, or interest in Output other than the Models - before conceding the perpetual assignment language.',
      },
      {
        position:
          "Orbit floor (signed 2026): accept express assignment language for Output ('Voce AI hereby assigns to Customer all right, title and interest in and to such Output, excluding the Models'), in perpetuity and subject to payment of all undisputed Fees, extended to the customer's licensors, Authorized Users, and End Users. The Models remain excluded and owned by Voce AI.",
      },
    ],
  },
  {
    id: 'rule-section-3-4-customer-content-reps-consent',
    title: 'Section 3.4 - Customer Content reps / consent',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Allocates consent-of-natural-persons risk to the party with privity (customer or End User).',
    preferredPosition:
      'Hold standard MSA 3.4 verbatim, including the (a) rights rep and (b) natural-persons consent rep.',
    rationale:
      'Standard MSA 3.4 carries a direct rep that the customer has the rights to its Input and the consent of every natural person whose data or likeness appears in it. Platform customers capturing ambient audio cannot guarantee written consent for every incidentally recorded bystander, so the Round 2 give splits the obligation - direct consent rep for customer-supplied Input, End User Terms flow-down for End-User-supplied Input - preserving a consent obligation throughout. The Last Fallback (Orbit signed 2026) replaced the strict consent rep entirely with the End User Terms flow-down, relying on the Customer Content indemnity and ZDR. Walk away if the customer refuses both the direct consent rep and the flow-down obligation.',
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION]: Voce AI accepted Orbit's deletion of the strict consent representation (written consent, release, or permission of each and every natural person whose personal data or likeness appears in Input) and its replacement with an End User Terms flow-down requiring End Users to agree not to use the Services, or provide Input, in violation of applicable law. Orbit's rationale: End Users inevitably capture ambient audio and Orbit cannot guarantee written consent for every incidentally recorded bystander; it relied on its terms of service, the Customer Content indemnity, and ZDR. The (a) rights/ownership rep was retained. Recorded as Last Fallback and flagged as a weakening of the consent rep.",
    standardSummary:
      'Standard MSA 3.4 (Customer Content Representations and Warranties): Customer represents and warrants that (a) it owns or has the necessary rights and licenses to use and to authorize Voce AI to use the Input, and (b) it has the written consent, release, or permission of every natural person whose personal data or likeness (including voice or other audio likeness) appears in Input. Guideline email: customer stands behind Inputs. FAQ (non-contractual): Customer is responsible for any voices it clones, which reinforces the (a) rights and (b) consent reps.',
    walkAwayTrigger:
      'Customer refuses both the direct consent rep and the flow-down obligation.',
    fallbacks: [
      {
        position:
          "Retain both the (a) rights / ownership representation and the (b) consent representation, but accept that the consent rep is satisfied for End-User-supplied Input through the customer's End User Terms flow-down (requiring End Users not to provide Input in violation of law), while a direct consent rep continues to apply to Input the customer itself supplies.",
      },
      {
        position:
          'Orbit floor (signed 2026): accept replacement of the strict consent representation (written consent of each and every natural person appearing in Input) with an End User Terms flow-down under which the customer requires, through its End User Terms, that End Users not use the Services or provide Input in violation of applicable law. Retain the (a) rights/ownership representation.',
      },
    ],
  },
  {
    id: 'rule-section-8-2-voce-ai-indemnity',
    title: 'Section 8.2 - Voce AI Indemnity',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Preserves model indemnity (uncapped per guideline email) while limiting scope to IP; carve-outs honor customer control of Inputs and combined systems.',
    preferredPosition:
      'Hold standard MSA 8.2 verbatim. IP infringement indemnity only, with the four carve-outs (Input/Customer-Derived Output; modification or combination; use known to infringe; Customer Applications). May be uncapped per guideline email.',
    rationale:
      "Voce AI GC Guidance (mid-2026) sets two flex points: (i) Voce AI may fold confidentiality or security-breach claims into its own indemnity provided those added heads sit under a super-cap (typically 3x fees or $500K, calibrated to deal size); and (ii) the Model / IP indemnity may be uncapped. The four standard carve-outs (Input / Customer-Derived Output; modification or combination; use known to infringe; Customer Applications) are held in all cases. First Position holds standard 8.2 (IP-infringement indemnity only, four carve-outs). Round 2 adds confidentiality / security-breach claims under a 3x-or-$500K super-cap while keeping the Model indemnity uncapped and the carve-outs intact. The Last Fallback (Orbit signed 2026) expanded Voce AI's indemnity to gross negligence / willful misconduct, violation of law, and Data Breach, subject to the Section 9.3 enhanced cap, with the carve-outs retained - consistent with the GC flex point on adding security / confidentiality heads. Cross-deal pattern: enterprise and platform customers routinely seek security-breach indemnity; pre-approve it under a deal-sized super-cap, never uncapped and never at the cost of the four carve-outs. Walk away from uncapped indemnity for any Services-caused damages or removal of any carve-out.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed two flex points on Voce AI's own indemnity. (i) Voce AI may agree to include confidentiality or security-breach claims within its indemnity, provided those added heads sit under a super-cap, typically 3x fees or $500K depending on deal size. (ii) Voce AI's Model (IP) indemnity may be uncapped. Hold the four standard carve-outs in all cases.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 8.2, Voce AI accepted expansion of its indemnity beyond IP infringement to also cover (b) Voce AI's gross negligence or willful misconduct, (c) violation of applicable law, and (d) any Data Breach. 'Data Breach' was defined as any DPA Security Incident plus any unauthorized access to, acquisition of, disclosure of, or use of Customer Content (including Input and Output) or Customer Confidential Information in Voce AI's or its subprocessors' possession, whether or not it constitutes Personal Data. The four Excluded Claims carve-outs (Input, combination with non-Voce AI materials, unauthorized modification, failure to implement updates) were retained, and these indemnities are subject to the Section 9.3 enhanced cap. This matches the GC flex point on adding security/confidentiality heads. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 8.2 indemnifies Customer for third-party Claims to the extent arising from infringement, misappropriation, or violation of IP Rights resulting from Voce AI's provision of the Services. The indemnity does NOT apply to: (a) Input or Customer-Derived Output; (b) modifications to the Services or Output by anyone other than Voce AI, including combination with non-Voce AI technology or content; (c) use known, or that reasonably should have been known, to violate or infringe third-party rights; or (d) Customer Applications, where the claim would not have arisen but for the Customer Application. Per guideline email the model indemnity may be uncapped.",
    walkAwayTrigger:
      'Customer demands uncapped indemnity for any damages caused by the Services, or removal of any of the four carve-outs.',
    fallbacks: [
      {
        position:
          "Agree to add confidentiality or security-breach claims to Voce AI's indemnity, subject to a super-cap (typically 3x fees or $500K depending on deal size). Keep the Model/IP indemnity uncapped and retain the four carve-outs.",
      },
      {
        position:
          "For strategic deals, accept a higher super-cap on the confidentiality/security-breach indemnity calibrated to deal size, but never uncap those added heads and never remove the four IP carve-outs. Escalate.\n\nOrbit floor (signed 2026): accept expansion of Voce AI's indemnity beyond IP infringement to also cover (b) Voce AI's gross negligence or willful misconduct, (c) Voce AI's violation of applicable law, and (d) any Data Breach (defined as a DPA Security Incident plus any unauthorized access to, acquisition of, disclosure of, or use of Customer Content or Customer Confidential Information in Voce AI's or its subprocessors' possession), in each case subject to the Section 9.3 enhanced (super) cap and retaining the four Excluded Claims carve-outs (Input, combination, unauthorized modification, failure to implement updates).",
      },
    ],
  },
  {
    id: 'rule-section-8-3-customer-indemnity-inputs-customer-derived-outpu',
    title:
      'Section 8.3 - Customer Indemnity (Inputs / Customer-Derived Output)',
    category: 'IP/Indemnity',
    severity: 'Material',
    benefit:
      'Allocates risk to the party with control; protects against voice / IP / publicity claims arising from customer-supplied content.',
    preferredPosition:
      'Hold standard MSA 8.3 verbatim. Customer indemnifies for (a) Input and Customer-Derived Output, (b) use of Output by others, (c) use of the Services in violation of the Agreement, and (d) Customer Applications. Uncapped per guideline email.',
    rationale:
      "Voce AI GC Guidance (mid-2026) is emphatic that the customer MUST stand behind its Inputs and Customer-Derived Output with an uncapped indemnity, because Voce AI has no privity with what the customer or its end users feed into and generate from the Models. This is a hard requirement, not a negotiable rung, so Round 2 holds the line and concedes only cosmetic restructuring of the indemnity heads. First Position holds standard 8.3 (five heads, uncapped). The Last Fallback (Orbit signed 2026) carved the customer indemnity back for Voce AI's gross negligence / willful misconduct / violation of the Agreement and subjected it to the Section 9.3 super-cap - both of which depart from the GC hard line and were flagged for escalation. Walk away if the customer seeks to cap its indemnity in Round 1 or 2 or to delete any indemnity head.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC was emphatic that the customer MUST agree to uncapped indemnity for its Inputs and Customer-Derived Output. Rationale: Voce AI has no privity with what the customer or its end users put into the Models, so the customer must stand behind that content. This is a hard requirement, not a fallback; do not cap these heads at any round.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION conflicting with GC hard line]: In Section 8.3, the customer indemnity covers (a) Customer Content, (b) Customer's gross negligence or willful misconduct, and (c) violation of law or the PUP. Voce AI accepted Orbit's added carve-out so the customer indemnity does not apply to the extent a Claim arises from Voce AI's gross negligence, willful misconduct, or use of Customer Content in violation of the Agreement. The customer indemnity is also subject to the Section 9.3 super-cap rather than uncapped. Both points depart from the GC hard line (uncapped, unqualified customer indemnity for Inputs/Customer-Derived Output). Recorded as Last Fallback and flagged.",
    standardSummary:
      'Standard MSA 8.3 requires Customer to indemnify Voce AI for Claims to the extent arising from or related to: (a) Input and Customer-Derived Output; (b) use of Output by any party other than Voce AI or its Affiliates (or a third party at their direction); (c) use of the Services in violation of the Agreement; and (d) any Customer Applications. Guideline email priority: customer indemnity for Inputs and Customer-Derived Output MUST be uncapped on privity rationale.',
    walkAwayTrigger:
      'Customer demands removal of any of the five indemnity heads or caps customer indemnity in Round 1 or 2.',
    fallbacks: [
      {
        position:
          "Hold the customer indemnity uncapped and unqualified per the GC hard line. Accept only drafting clarifications - restating the heads as (a) Customer Content, (b) the customer's gross negligence or willful misconduct, and (c) violation of law or the PUP - WITHOUT the carve-back for Voce AI's fault and WITHOUT subjecting the customer indemnity to the Section 9.3 super-cap. Any cap or fault carve-back is escalation-only and belongs at the Last Fallback.",
      },
      {
        position:
          "Orbit floor (signed 2026) [CONCESSION vs GC hard line]: accept a customer indemnity covering (a) Customer Content, (b) Customer gross negligence/willful misconduct, and (c) violation of law or PUP, BUT carved back so it does not apply to the extent the Claim arises from Voce AI's gross negligence, willful misconduct, or use of Customer Content in violation of the Agreement, and subject to the Section 9.3 super-cap rather than uncapped. Escalate: this departs from the GC hard line that customer indemnity for Inputs and Customer-Derived Output must remain uncapped.",
      },
    ],
  },
  {
    id: 'rule-section-3-3-customer-license-to-voce-ai',
    title: 'Section 3.3 - Customer License to Voce AI',
    category: 'IP/Indemnity',
    severity: 'Standard',
    benefit:
      'Operational license preserved; explicit training restriction supports customer trust in voice / audio context.',
    preferredPosition:
      'Hold standard MSA 3.3 verbatim. License limited to providing the Services, legal compliance, enforcement, and abuse prevention, with the built-in no-training restriction.',
    rationale:
      "Standard MSA 3.3 grants a license limited to providing the Services, legal compliance, enforcement, and abuse prevention, with a built-in no-training restriction; Voce AI's public posture (FAQ) is already that it does not train on Customer Content. The Round 2 give makes the no-training commitment explicit - restating existing policy at low cost. The Last Fallback (Orbit signed 2026) additionally narrowed 'prevent abuse' to a closed list (fraud, security incidents, PUP violations, material breaches) and barred any product-development use, which constrains operational flexibility and is reserved for the deeper rung. Walk away if the customer demands consent for each use of Customer Content or denies the license for security and abuse-prevention purposes.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In the Customer License section, Voce AI accepted Orbit's narrowing edits. 'Prevent abuse' (including fraud prevention) was expressly limited to detecting, investigating, and preventing fraud, security incidents, PUP violations, or other material violations, and was stated not to permit use of Customer Content for product or service development or AI training/tuning/improvement. The signed text adds that Voce AI and all Models shall not use Customer Content for any AI training, tuning, improvement, or development (subject to Section 1.6) or validation other than as necessary to provide the Services solely to the customer, with the license terminating on expiration/termination except where continued processing is legally required. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 3.3 (Customer License): Customer grants Voce AI a limited, non-exclusive, non-transferable license to use Customer Content solely as necessary to perform Voce AI's obligations (including to provide the Services), comply with law, enforce the Agreement, and prevent abuse. The standard form ALREADY states Voce AI will not use Customer Content for any training purposes other than solely as necessary to provide the Services. That no-training restriction is the standard position, not a concession.",
    walkAwayTrigger:
      'Customer demands consent for each use of Customer Content or denies Voce AI license for security and abuse-prevention purposes.',
    fallbacks: [
      {
        position:
          "Accept an express statement that Voce AI and its Models will not use Customer Content for AI training, tuning, or improvement except as necessary to provide the Services to the customer (subject to Section 1.6), while keeping the standard 'prevent abuse' license wording - before narrowing 'prevent abuse' to the enumerated fraud / security / PUP / material-breach list.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept a narrowed Customer Content license in which 'prevent abuse' is expressly limited to detecting, investigating, and preventing fraud, security incidents, PUP violations, or other material violations of the Agreement, and does NOT permit product or service development or AI model training/tuning/improvement; plus an express statement that Voce AI and all Models will not use Customer Content for any AI training, tuning, improvement, development, or validation other than as necessary to provide the Services solely to the customer (subject to Section 1.6).",
      },
    ],
  },
  {
    id: 'rule-section-3-5-a-no-use-of-output-to-develop-competing-models',
    title: 'Section 3.5(a) - No use of Output to develop competing models',
    category: 'IP/Indemnity',
    severity: 'Standard',
    benefit:
      'Protects against use of Output as training corpus for competing models.',
    preferredPosition:
      'Hold standard MSA 3.5(a) verbatim, including both the no-compete-via-Output restriction and the no-reverse-engineering restriction.',
    rationale:
      "Standard MSA 3.5(a) bars both using Output to build competing models and reverse engineering. The commercial purpose is to stop customers from bootstrapping a competitor off Voce AI's Models, not to prohibit lawful independent development. The Round 2 give clarifies that boundary while preserving both core restrictions. The Last Fallback (Orbit signed 2026) added the fuller carve-out expressly permitting competing development so long as the customer does not otherwise breach the Agreement. Walk away from any demand to remove the no-use-of-Output-to-compete restriction itself.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In the Customer Requirements / no-compete section (3.7 in the older form), Voce AI accepted Orbit's added clarification that nothing in the section prevents the customer or third parties from developing its own, or using a third party's, AI model that competes with Voce AI's products and services, provided the customer does not violate the Agreement (including the no-use-of-Output-to-develop-competing-models and Reverse Engineering prohibitions). The underlying restrictions were retained; the clarifying carve-out is the recorded floor.",
    standardSummary:
      "Standard MSA 3.5(a) (Customer Requirements): Customer will not, and will not permit third parties to, (i) use Output to develop AI models that compete with Voce AI's products and services, or (ii) Reverse Engineer any aspect of the Services or the systems used to provide them. 'Reverse Engineer' is broadly defined and expressly includes model extraction or stealing attacks. There is no 3.7 in the standard form.",
    walkAwayTrigger:
      'Customer demands removal of the no-compete-via-Output restriction.',
    fallbacks: [
      {
        position:
          "Accept a clarification that the restriction bars only the use of Voce AI's Output or Models to develop or train a competing model (alongside the reverse-engineering prohibition), and does not by itself prohibit the customer's wholly independent development of, or use of a third party's, competing AI - before adopting the broader 'provided the customer does not otherwise breach the Agreement' carve-out language.",
      },
      {
        position:
          'Orbit floor (signed 2026): accept an express clarification that nothing in the no-compete section prevents the customer or third parties from developing or using a competing AI model, provided the customer does not otherwise breach the Agreement (including the no-use-of-Output-to-build-competing-models and reverse-engineering restrictions).',
      },
    ],
  },
  {
    id: 'rule-voce-ai-content-restrictions-prohibited-voice-use-no-standal',
    title:
      'Voce AI content restrictions / Prohibited Voice Use (no standalone clause; lives in 3.3)',
    category: 'IP/Indemnity',
    severity: 'Standard',
    benefit:
      'Existing protections preserved through 3.5 and DPA without duplicative MSA-level commitments.',
    preferredPosition:
      "Hold standard MSA scope. Voce AI's obligations on Customer Content live in 3.3 (license scope plus no-training), 1.6 (Usage Data exclusions), and the DPA.",
    rationale:
      "Voce AI's obligations on Customer Content already live across Sections 3.3 (license scope plus no-training), 1.6 (Usage Data exclusions), 1.11 (retention / zero-retention mode), and the DPA, so the First Position is to rely on those rather than a standalone clause. The Round 2 give consolidates the highest-value commitments (no misuse of voice, no training) into a short clause that restates existing posture. The Last Fallback (Orbit signed 2026) accepted a comprehensive five-part Restrictions section adding no-retention / no-reuse mechanics, a confidentiality / material-non-public-information regime, manual-review limitations, and survival. Walk away from operational restrictions inconsistent with service delivery (e.g., no human review even for fraud investigation).",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI accepted Orbit's addition of a comprehensive Voce AI Restrictions section (3.8 in the older form) with five subparts: (a) Prohibited Voice Use; (b) No Retention or Reuse of voice data beyond the retention period, including in backups/logs/DR; (c) Confidentiality and Material Non-Public Information, requiring all Customer Content to be treated as Confidential Information, processed by automated means only, with no manual review of Input/Output except for authorized technical support or to investigate fraud, security incidents, PUP violations, or material breaches, or to comply with law (minimized, access-controlled, and logged, and never for training); (d) No Training or Derivative Use; and (e) Survival. All subject to the Section 1.6 Performance Data carve-out. Recorded as Last Fallback.",
    standardSummary:
      "The standard MSA has no standalone 'Voce AI restrictions' section and no 3.8. Voce AI's use limits on Customer Content live in 3.3 (Customer License), which already includes the no-training restriction, supplemented by the 1.6 Usage Data limits and the DPA.",
    walkAwayTrigger:
      'Customer demands operational restrictions inconsistent with service delivery (e.g., no human review at all, even for fraud investigation).',
    fallbacks: [
      {
        position:
          'Accept a concise Voce AI Restrictions clause covering Prohibited Voice Use (no use of Customer voice recordings or characteristics to create, train, fine-tune, or maintain any voice model except to provide the Services, and no generating content for any party other than the customer) and No Training / Derivative Use, cross-referencing Sections 1.6 and 1.11 - before adding the full retention, confidentiality / MNPI, manual-review-limitation, and survival build-out.',
      },
      {
        position:
          'Orbit floor (signed 2026): accept a full Voce AI Restrictions section covering (a) Prohibited Voice Use (no use of Customer voice recordings/characteristics to create, train, fine-tune, improve, store, or maintain any voice model, embedding, or profile except to provide the Services, and no generating content for any party other than the customer), (b) No Retention or Reuse (no retention, storage, caching, or logging of voice recordings, characteristics, embeddings, or profiles beyond the Section 1.11/Order Form retention period, including in backups, logs, system memory, or disaster recovery), (c) Confidentiality / Material Non-Public Information (treat all Customer Content as Confidential Information; automated processing only; no manual review of Input or Output except for customer-authorized technical support or to investigate fraud/security/PUP/material breaches or comply with law, minimized, access-controlled, and logged), (d) No Training or Derivative Use, and (e) Survival of these obligations, all subject to the Section 1.6 Performance Data carve-out.',
      },
    ],
  },
  {
    id: 'rule-section-8-5-voce-ai-ip-infringement-options',
    title: 'Section 8.5 - Voce AI IP Infringement Options',
    category: 'IP/Indemnity',
    severity: 'Standard',
    benefit:
      'Preserves exit path on infringement; pro-rata refund honors paid-for value.',
    preferredPosition: 'Hold standard MSA 8.5 wording.',
    rationale:
      "Standard MSA 8.5 gives Voce AI the option, on an infringement issue, to procure rights, modify the Services, or cancel. Customers reasonably want continuity protection and a refund if cancellation is exercised. A 30-to-60-day wind-down plus pro-rata refund is a fair Round 2 that balances customer continuity against Voce AI's need to act on infringement. The Last Fallback (Orbit signed 2026) extended this to a three-month notice tied to the OEM wind-down, with the refund and a confirmation that 8.5 does not limit the 8.2 indemnity or Section 8 / 9 recovery. Walk away if the customer demands removal of the cancellation option or insists on specific performance / injunctive relief in its place.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 8.5, Voce AI accepted Orbit's addition of a three-month prior written notice before exercising the option to cancel the Services for an IP infringement issue (unless an earlier termination is court-mandated), with the customer to discontinue use and receive a pro-rata refund of prepaid, unused Fees. Orbit tied the buffer to the OEM wind-down period. The signed text preserves that 8.5 does not limit Voce AI's 8.2 indemnity and that the customer may still recover under Section 8 or damages under Section 9. Recorded as Last Fallback.",
    standardSummary:
      'Standard MSA 8.5 allows Voce AI, in response to an infringement claim, to (a) procure rights, (b) modify Services to be non-infringing, or (c) terminate the affected Services immediately with pro-rata refund.',
    walkAwayTrigger:
      'Customer demands removal of cancellation option or specific performance / injunctive relief in place of cancellation.',
    fallbacks: [
      {
        position:
          'Accept a shorter prior-written-notice wind-down (30 to 60 days) before Voce AI may cancel the Services for an IP infringement issue (after first attempting to procure rights or modify to non-infringing), with a pro-rata refund of prepaid, unused Fees - before conceding the full three-month notice period.',
      },
      {
        position:
          "Orbit floor (signed 2026): accept a three-month prior written notice (wind-down) before Voce AI may cancel the Services in response to an IP infringement issue (after first attempting to procure rights or modify the Services to make them non-infringing), with a pro-rata refund of prepaid, unused Fees, and preserving that this option does not limit Voce AI's Section 8.2 indemnity or the customer's right to recover under Section 8 or damages under Section 9.",
      },
    ],
  },
  {
    id: 'rule-section-7-5-exclusive-remedy-warranty-remedies',
    title: 'Section 7.5 - Exclusive Remedy / Warranty Remedies',
    category: 'Warranties',
    severity: 'Material',
    benefit:
      'Caps warranty exposure to repair / refund; predictable risk profile.',
    preferredPosition:
      "Hold standard MSA 7.5 verbatim. Exclusive remedy is repair or a Fee credit or offset, at Voce AI's discretion.",
    rationale:
      "Standard MSA 7.5 makes repair or a Fee credit / offset (at Voce AI's discretion) the exclusive remedy for warranty non-conformity. Confirming that this remedy does not override the customer's distinct SLA, confidentiality, and indemnity rights is reasonable and a clean Round 2. The Last Fallback (Orbit signed 2026) added the broad 'all remedies at law or in equity if unable to repair' escalation plus a Section 6 termination hook, which expands exposure beyond the contained remedy. Walk away from punitive or treble damages, or specific performance, for warranty breach in Round 1 or 2.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 7.5, Voce AI accepted Orbit's expansion of the exclusive remedy. The remedy remains repair or Fee offset as the sole and exclusive remedy for technical non-conformity, but the signed text preserves the customer's rights under the SLA and Sections 3.8, 4, 8, and 9, and adds that if Voce AI cannot repair, the customer may terminate for material breach under Section 6 and pursue all remedies available at law or in equity. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 7.5 (Exclusive Warranty Remedies): for Services that fail the 7.2 warranty, Voce AI will, at its expense and sole discretion, repair the affected Services or provide a Fee credit or offset as described in the Order Form. These are Customer's sole and exclusive remedies and Voce AI's sole and exclusive liability for breach of the 7.2 warranty. The standard remedy is repair or a Fee credit/offset, not replacement or pro-rata refund.",
    walkAwayTrigger:
      'Customer demands punitive damages, treble damages, or specific performance for warranty breach in Round 1 or 2.',
    fallbacks: [
      {
        position:
          "Accept an express statement that the repair-or-Fee-offset remedy does not limit the customer's separate rights under the SLA, Section 4 (Confidentiality), or Section 8 (Indemnification) - before adding the broader escalation that, if Voce AI is unable to repair, the customer may terminate for material breach and pursue all remedies at law or in equity.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept that the repair-or-Fee-offset warranty remedy is the sole and exclusive remedy for technical non-conformity, but with an express statement that it does not limit the customer's rights under the SLA or Sections 3.8, 4, 8, or 9, and that if Voce AI is unable to repair the Services, the customer may seek termination for material breach under Section 6 and pursue all remedies available at law or in equity.",
      },
    ],
  },
  {
    id: 'rule-section-7-2-service-warranties',
    title: 'Section 7.2 - Service Warranties',
    category: 'Warranties',
    severity: 'Standard',
    benefit: 'Preserves Documentation as the operational benchmark.',
    preferredPosition:
      'Hold standard MSA 7.2 verbatim. Warranty is material conformity to the Order Form Specifications, with the 7.4 exclusions intact.',
    rationale:
      "Standard MSA 7.2 warrants material conformity to the Order Form Specifications, with 7.4 exclusions. Adding material conformity to published Documentation is a modest, defensible Round 2 that Voce AI can stand behind. In the Orbit signed deal Voce AI reverted the customer's change to the 'materially' qualifier (AE16), so the material-conformity standard is a held position, not a concession - any softening below 'material conformity' should be a deliberate, controlled give, not a default rung. Walk away from uptime guarantees inside the warranty (those belong in the SLA) or a warranty of fitness for the customer's particular purpose.",
    standardSummary:
      "Standard MSA 7.2 (Voce AI's Warranties): during the Term, the Services will materially conform to the Specifications set forth in the applicable Order Form ('Specifications'). Section 7.4 excludes failures caused by misuse, mishandling, or by modification, alteration, or repair performed by anyone other than Voce AI. Benchmark is Specifications, not Documentation.",
    walkAwayTrigger:
      "Customer demands uptime guarantees inside the warranty (those belong in SLA) or warranty of fitness for customer's specific purpose.",
    fallbacks: [
      {
        position:
          "Accept extending the conformity warranty to cover material conformity to the published Documentation in addition to the Order Form Specifications, keeping the Section 7.4 exclusions intact. Note that Voce AI reverted the customer's attempt to delete 'materially' in the Orbit deal, so the material-conformity qualifier is held.",
      },
    ],
  },
  {
    id: 'rule-section-7-3-warranty-disclaimers',
    title: 'Section 7.3 - Warranty Disclaimers',
    category: 'Warranties',
    severity: 'Standard',
    benefit:
      'Protects against accuracy-of-Output claims, the highest-volume risk category for generative AI.',
    preferredPosition:
      'Hold standard MSA 7.3 verbatim, including the express disclaimer on accuracy of Output (which is generated, not deterministic).',
    rationale:
      "Standard MSA 7.3 disclaims warranties (including on Output accuracy, since Output is generated, not deterministic). Confirming that the disclaimer does not negate Voce AI's express covenants (indemnity, confidentiality, personal-data, and security obligations) is a logical, low-risk Round 2 - it harmonizes the disclaimer with commitments Voce AI already makes. The Last Fallback (Orbit signed 2026) further added subcontractor-performance responsibility and an express statement that Voce AI will not use Customer Input / Confidential Information to generate Output for other customers or to train / improve Models except as permitted. Walk away from a warranty of Output accuracy or removal of the implied-warranty disclaimer.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 7.3, Voce AI accepted Orbit's additions that the 'as is' disclaimer does not limit Voce AI's obligations under Section 8 (Indemnification), Section 4 (Confidentiality), Section 1.8 (Information Security), or Section 1.7 (Personal Data); that Voce AI remains responsible for the performance of its subcontractors; and that Voce AI will not use the customer's Input or Confidential Information to generate Output for other customers or to train or improve its Models except as expressly permitted. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 7.3 disclaims all other warranties express or implied, including merchantability, fitness for purpose, non-infringement (beyond the IP indemnity), and accuracy of Output. Disclaimer applies 'to the maximum extent permitted by law.'",
    walkAwayTrigger:
      'Customer demands warranty of Output accuracy or removal of the implied warranty disclaimer.',
    fallbacks: [
      {
        position:
          "Accept a carve-out clarifying that the 'as is' disclaimer does not limit Voce AI's express obligations under Sections 8 (Indemnification), 4 (Confidentiality), 1.7 (Personal Data), and 1.8 (Information Security) - before adding subcontractor-performance responsibility and the express no-Output-reuse / no-training-on-Customer-Confidential-Information statement.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept disclaimer carve-outs providing that nothing in the warranty disclaimer limits Voce AI's obligations under Section 8 (Indemnification), Section 4 (Confidentiality), Section 1.8 (Information Security), or Section 1.7 (Personal Data); that Voce AI remains responsible for the performance of its subcontractors used to provide the Services; and that Voce AI will not use the customer's Input or Confidential Information to generate Output for other customers or to train or improve its Models except as expressly permitted.",
      },
    ],
  },
  {
    id: 'rule-mutual-compliance-reps-anti-corruption-trade-control-not-in-',
    title:
      'Mutual compliance reps (anti-corruption / trade control) - not in standard MSA',
    category: 'Warranties',
    severity: 'Nice-to-have',
    benefit:
      'Mutuality limits unilateral exposure; reps align with existing compliance programs.',
    preferredPosition:
      'Hold standard MSA. Compliance with law is covered in general compliance covenants; no standalone reps.',
    rationale:
      'The standard MSA covers compliance with law through general covenants rather than standalone reps. Mutual anti-corruption and trade-control reps are low-risk, market-standard additions and a reasonable Round 2. The Last Fallback (Orbit signed 2026) added immediate, no-cure termination rights for breach of those reps and a new EO 14117 provision allocating bulk-sensitive-data and government-related-data responsibility to the customer while Voce AI commits to comply with the Final Rule - deeper, more operationally significant commitments reserved for the further rung. Walk away from one-sided reps placing all compliance risk on Voce AI.',
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI accepted Orbit's addition of mutual compliance reps in Sections 7.6 (Anti-Corruption), 7.7 (Trade Control / sanctions and Restricted Party Lists), each with an immediate, no-cure termination right for breach, and a new Section 7.8 (Compliance with EO 14117 / DOJ Final Rule on bulk sensitive U.S. personal data and government-related data) allocating data-restriction responsibility to the customer while Voce AI commits to comply with the Final Rule and may suspend or remove affected data as needed. Recorded as Last Fallback.",
    standardSummary:
      'The standard MSA has no standalone anti-corruption, trade-control, or EO 14117 reps (Section 7 ends at 7.5). Export controls and sanctions reps live in 2.2, and general compliance with law in 2.1. There are no 7.6, 7.7, or 7.8 sections.',
    walkAwayTrigger:
      'Customer demands one-sided reps placing all compliance risk on Voce AI.',
    fallbacks: [
      {
        position:
          'Accept mutual anti-corruption and trade-control / sanctions representations, each with a standard cure-or-terminate right, before adding immediate no-cure termination for their breach and the Compliance with EO 14117 / DOJ Final Rule provision.',
      },
      {
        position:
          'Orbit floor (signed 2026): accept added mutual compliance representations - anti-corruption (with immediate termination, no cure, for breach), trade control / sanctions and restricted-party representations (with immediate termination, no cure, for breach), and a Compliance with EO 14117 provision under which the Services are not intended for bulk sensitive U.S. personal data or government-related data, Voce AI complies with the Final Rule, and the customer is responsible for confirming whether its data implicates the Final Rule.',
      },
    ],
  },
  {
    id: 'rule-section-9-1-indirect-damages',
    title: 'Section 9.1 - Indirect Damages',
    category: 'Liability',
    severity: 'Material',
    benefit: 'Caps tail risk on speculative damage theories.',
    preferredPosition:
      'Hold standard MSA 9.1 verbatim. Mutual exclusion of indirect and consequential damages, with exceptions only for gross negligence, willful misconduct, and IP misappropriation or violation.',
    rationale:
      "Standard MSA 9.1 mutually excludes indirect and consequential damages, with exceptions for gross negligence, willful misconduct, and IP misappropriation / violation. Adding a bounded cross-reference to Section 4 is acceptable because it is tied to a defined clause. The Round 2 give does exactly that. The Last Fallback (Orbit signed 2026) used the broader phrase 'its confidentiality obligations,' which can sweep in confidentiality-type duties beyond Section 4 (e.g., in the DPA or Restrictions section) and is reserved for the deeper rung. Walk away from any demand to remove the indirect-damages exclusion entirely.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 9.1, Voce AI accepted Orbit's change from carving out 'breach of Section 4' to carving out 'its confidentiality obligations' from the indirect/consequential damages waiver, a slightly broader formulation, alongside the existing carve-outs for gross negligence, willful misconduct, and indemnification obligations. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 9.1 (Indirect Damages): mutual exclusion of indirect, exemplary, incidental, special, and consequential damages. The exclusion does NOT apply to either party's gross negligence or willful misconduct, or to a party's misappropriation or violation of the other party's IP Rights. The carve-outs are GN/WM and IP, not indemnity or confidentiality.",
    walkAwayTrigger:
      'Customer demands removal of the indirect-damages exclusion entirely.',
    fallbacks: [
      {
        position:
          "Accept carve-outs from the indirect / consequential damages waiver for gross negligence, willful misconduct, indemnification obligations, and breach of Section 4 (Confidentiality) by specific cross-reference - before broadening the confidentiality carve-out to 'either party's breach of its confidentiality obligations.'",
      },
      {
        position:
          "Orbit floor (signed 2026): accept that the indirect/consequential damages waiver carves out 'either party's breach of its confidentiality obligations' (broader than a cross-reference to Section 4 alone), in addition to the carve-outs for gross negligence, willful misconduct, and indemnification obligations.",
      },
    ],
  },
  {
    id: 'rule-section-9-2-aggregate-liability-cap',
    title: 'Section 9.2 - Aggregate Liability Cap',
    category: 'Liability',
    severity: 'Material',
    benefit:
      'Predictable liability ceiling; carve-outs preserve high-priority risk allocation.',
    preferredPosition:
      "Hold standard MSA 9.2 verbatim. 12-month fees cap. Carve-outs for gross negligence, willful misconduct, IP violations, customer's indemnity (uncapped).",
    rationale:
      "Voce AI GC Guidance (mid-2026) permits mutual caps EXCEPT for indemnity, which must remain uncapped (customer Input / Output indemnity uncapped; Voce AI Model indemnity may be uncapped). First Position holds standard 9.2 (12-month fees cap; uncapped customer indemnity). The Round 2 give makes the General Cap explicitly mutual while keeping indemnity entirely outside the cap - consistent with the GC line. The Last Fallback (Orbit signed 2026) accepted the same mutual 12-month cap but routed indemnity to the Section 9.3 enhanced cap (capping it), while Voce AI held the line and rejected deletion of the IP carve-out. Walk away from any cap below 12 months' fees or removal of a carve-out.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed mutual liability caps are acceptable EXCEPT for indemnity, which must remain uncapped. Customer indemnity for Inputs and Customer-Derived Output stays uncapped, and Voce AI's Model indemnity may be uncapped. Confidentiality and security-breach indemnities, if added to Voce AI's side, sit under a super-cap, typically 3x fees or $500K depending on deal size (see Section 9.3 row).\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): The parties agreed a mutual General Liability Cap equal to fees paid or payable in the 12 months before the first event giving rise to liability (Orbit's comment: 'Mutual cap accepted'). Indemnity obligations were excluded from the General Cap and made subject to the Section 9.3 Enhanced Liability Cap, with carve-outs retained for gross negligence, willful misconduct, and a party's IP misappropriation or violation. Voce AI rejected Orbit's attempt to delete the IP carve-out (held the line). Note: unlike the GC hard line (indemnity uncapped), in this deal indemnity was capped via Section 9.3. Recorded as Last Fallback.",
    standardSummary:
      "Standard MSA 9.2 caps aggregate liability at fees paid in the 12 months preceding the claim. Carve-outs: gross negligence, willful misconduct, IP violations, customer's indemnification obligations (which remain uncapped). Guideline email: mutual cap OK; indemnity uncapped.",
    walkAwayTrigger:
      'Customer demands cap below 12-month fees or removal of any carve-out.',
    fallbacks: [
      {
        position:
          "Accept a mutual General Liability Cap of 12 months' fees with all indemnity obligations fully excluded from (and uncapped by) the General Cap, retaining carve-outs for gross negligence, willful misconduct, and a party's IP misappropriation or violation - before routing indemnity into a Section 9.3 super-cap.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept a mutual General Liability Cap of fees paid or payable in the 12 months before the first event giving rise to liability, with indemnity obligations excluded from the General Cap and instead subject to the Section 9.3 Enhanced Liability Cap, and retaining carve-outs for gross negligence, willful misconduct, and a party's misappropriation or violation of the other's IP. Voce AI held the line on the IP carve-out (rejected Orbit's attempt to delete it).",
      },
    ],
  },
  {
    id: 'rule-section-9-3-enhanced-liability-cap-super-cap-for-indemnity',
    title: 'Section 9.3 - Enhanced Liability Cap (Super-cap for indemnity)',
    category: 'Liability',
    severity: 'Material',
    benefit:
      'Preserves uncapped customer indemnity for the highest-risk content categories; tiered fallback allows graceful concession.',
    preferredPosition:
      'No super-cap. Customer indemnity for Inputs and Customer-Derived Output is uncapped per guideline email. Voce AI model indemnity may be uncapped (separate carve-out in 9.2).',
    rationale:
      "Voce AI GC Guidance (mid-2026) confirms the super-cap structure: customer indemnity for Inputs and Customer-Derived Output stays uncapped (hard requirement) and the Model indemnity may be uncapped, but if Voce AI adds confidentiality or security-breach claims to its own indemnity, those added heads sit under a super-cap of roughly 3x fees or $500K depending on deal size. First Position is no super-cap (customer indemnity uncapped). Round 2 sets a 3x-or-$500K super-cap for Voce AI's added confidentiality / security-breach heads only, leaving customer Input / Output indemnity uncapped. The Last Fallback (Orbit signed 2026) applied a mutual enhanced cap to BOTH parties' indemnity (8.2 and 8.3) at the greater of 3x the General Cap or $5,000,000 - which caps the customer's Input / Output indemnity contrary to the GC hard line and exceeds the GC's $500K / 3x reference, so it was flagged for escalation. Cross-deal pattern: customers will press to cap their own indemnity via a mutual super-cap; resist capping customer Input / Output indemnity at Rounds 1-2 and treat any such cap as an escalation item. Walk away from a cap below 3x fees on Voce AI's added heads or any cap on customer indemnity in Round 1 or 2.",
    precedent:
      "Voce AI GC Guidance (mid-2026): GC confirmed the super-cap structure. Customer indemnity for Inputs and Customer-Derived Output is uncapped (hard requirement). Voce AI's Model indemnity may be uncapped. If Voce AI agrees to add confidentiality or security-breach claims to its own indemnity, those added heads sit under a super-cap, typically 3x fees or $500K depending on deal size.\n\nOrbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14) [CONCESSION conflicting with GC hard line]: Section 9.3 created an Enhanced Liability Cap applying to BOTH parties' indemnity obligations under Sections 8.2 and 8.3, equal to the greater of three times (3x) the General Liability Cap or $5,000,000. This means the customer's Input/Customer-Derived Output indemnity was capped (not uncapped), directly contrary to the GC hard line, and the super-cap figure ($5M / 3x) exceeds the GC's $500K/3x reference. The aggregate limitations apply across all ordering documents and customer entities. Recorded as Last Fallback and flagged for escalation.",
    standardSummary:
      'No standalone Section 9.3 in standard MSA. Guideline email: indemnity for Inputs / Customer-Derived Output uncapped; confidentiality / security breach can be added under super-cap typically 3x fees or $500K depending on deal size.',
    walkAwayTrigger:
      'Customer demands cap below 3x fees or cap on customer indemnity in Round 1 or 2.',
    fallbacks: [
      {
        position:
          "Where a super-cap is needed for Voce AI's added confidentiality/security-breach indemnity, set it at 3x fees or $500K depending on deal size. Customer indemnity for Inputs and Customer-Derived Output remains uncapped.",
      },
      {
        position:
          "Calibrate the confidentiality/security-breach super-cap to deal size for strategic customers, but never cap customer indemnity for Inputs and Customer-Derived Output. Escalate.\n\nOrbit floor (signed 2026) [CONCESSION vs GC hard line]: accept a mutual Enhanced Liability Cap on BOTH parties' indemnity obligations (Sections 8.2 and 8.3) equal to the greater of three times (3x) the General Liability Cap or $5,000,000. This caps the customer's Input/Customer-Derived Output indemnity, contrary to the GC hard line that customer indemnity must remain uncapped, and sets the figure above the GC's $500K/3x reference. Escalate.",
      },
    ],
  },
  {
    id: 'rule-insurance-not-in-standard-msa',
    title: 'Insurance (not in standard MSA)',
    category: 'Liability',
    severity: 'Standard',
    benefit:
      'Preserves flexibility on insurance program; aligns MSA with carried coverage.',
    preferredPosition:
      'Hold standard MSA scope. No standalone insurance section. Insurance certificates provided on request, not as MSA covenant.',
    rationale:
      "The standard MSA has no standalone insurance covenant; certificates are provided on request. Committing contractually to the coverage Voce AI already carries is low-cost and a reasonable Round 2 for enterprise customers that require an insurance clause. The Last Fallback (Orbit signed 2026) accepted raised limits - Employer's Liability $1M, CGL $1M per occurrence / $5M aggregate, Umbrella / Excess $10M, Cyber / E&O $5M, surviving one year post-termination - which may carry incremental premium cost and is reserved for the deeper rung. [Inference] 'then-current standard coverage' is used rather than specific figures because Voce AI's actual policy limits are not confirmed in the record. Walk away from demands for coverage levels or types Voce AI does not carry.",
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): Voce AI accepted a Section 12 Insurance provision with limits increased from the older draft: Workers' Compensation per statute plus Employer's Liability of $1,000,000 (up from $250,000); Commercial General Liability of $1,000,000 per occurrence and $5,000,000 aggregate (aggregate up from $1,000,000); Umbrella/Excess Liability of $10,000,000 (up from $5,000,000); and Cyber/Errors & Omissions of $5,000,000 aggregate (up from $3,000,000), with certificates on request. Per Section 6.3, Voce AI's Section 12 obligations survive one year post-termination. Recorded as Last Fallback.",
    standardSummary:
      'The standard MSA, which ends at Section 11, has no standalone insurance section. Certificates of insurance are provided on request, not as an MSA covenant.',
    walkAwayTrigger:
      'Customer demands coverage levels or coverage types Voce AI does not currently carry.',
    fallbacks: [
      {
        position:
          "Accept an insurance covenant pegged to Voce AI's then-current standard coverage levels and types (with certificates of insurance on request), before agreeing to elevated limits such as $10,000,000 umbrella / excess or $5,000,000 cyber / E&O.",
      },
      {
        position:
          "Orbit floor (signed 2026): accept an Insurance section requiring Voce AI to maintain Employer's Liability of $1,000,000; Commercial General Liability of $1,000,000 per occurrence and $5,000,000 aggregate; Umbrella/Excess Liability of $10,000,000; and Cyber/Errors & Omissions of $5,000,000 aggregate, with certificates of insurance on request and Voce AI's insurance obligations surviving one year post-termination.",
      },
    ],
  },
];

const voceMsaTermBoilerplateRules: PlaybookStudioPlaybook['rules'] = [
  {
    id: 'rule-section-6-term-termination-for-material-breach',
    title: 'Section 6 - Term / Termination for material breach',
    category: 'Termination/Exit',
    severity: 'Material',
    benefit:
      'Protects committed-term revenue; aligns pricing with term length.',
    preferredPosition:
      'Hold standard MSA 6.2 verbatim. Mutual material breach termination, 30-day cure, no TfC.',
    rationale:
      "Voce AI GC Guidance (mid-2026) is a hard line: no Termination for Convenience. Subscription economics and committed-capacity planning depend on the customer staying for the term absent Voce AI's breach. First Position holds standard 6.2 (mutual material-breach termination, 30-day cure, no TfC). Round 2 concedes only breach-based exits (uncured material breach; repeated SLA failures), which are mutual and consistent with the no-TfC line. Walk away from any customer demand for a Termination-for-Convenience right with any notice period.",
    precedent:
      'Voce AI GC Guidance (mid-2026): GC confirmed no Termination for Convenience under any circumstances, consistent with the multi-year committed subscription model. Hold the Section 6.2 mutual material-breach-with-cure structure only.',
    standardSummary:
      'Standard MSA 6.2 provides mutual termination right for material breach with 30-day cure period. No termination for convenience. Guideline email priority: no TfC.',
    walkAwayTrigger: 'Customer demands TfC right with any notice period.',
    fallbacks: [
      {
        position:
          "Hold mutual material-breach termination with a 30-day cure and no Termination for Convenience. At most, accept an express customer termination right for Voce AI's uncured material breach or for repeated, documented SLA failures - never a for-convenience or notice-only exit.",
      },
    ],
  },
  {
    id: 'rule-section-11-11-governing-law-and-venue',
    title: 'Section 11.11 - Governing Law and Venue',
    category: 'Boilerplate',
    severity: 'Material',
    benefit:
      'Predictable forum; established counsel network in the three covered jurisdictions.',
    preferredPosition:
      'Apply standard MSA domicile table per the Voce AI contracting entity. For US customers: NY law, NY County. For non-US customers: push for England-Wales law and London venue first (or Ireland law / Dublin venue), per the table.',
    rationale:
      "Governing law and venue are tied to the Voce AI contracting entity and its domicile table; New York (US) and England-Wales or Ireland (non-US) are the institutional defaults that keep enforcement, conflicts-of-law analysis, and outside-counsel coverage predictable. Permitting Delaware as the sole US alternative, or another seat already in the table, accommodates most pushback without fragmenting Voce AI's dispute footprint. Bespoke jurisdictions (California, Singapore, Germany, customer home courts) create cost and uncertainty and require sign-off, hence Material severity and the walk-away on off-table jurisdictions.",
    standardSummary:
      "Standard MSA 11.11 sets governing law and venue by Voce AI's domicile: NY law / NY County for US customers, Ireland law / Dublin for EEA customers, England-Wales law / London for UK customers. Guideline email: standard MSA position; if standard MSA allows non-US, push for England; if same as customer's request, accept.",
    walkAwayTrigger:
      'Customer demands a jurisdiction outside the standard table (e.g., Delaware, California, Singapore, Germany) without Voce AI sign-off.',
    fallbacks: [
      {
        position:
          "For US customers resisting New York, accept Delaware law and Delaware venue as the only US alternative. For non-US customers resisting England-Wales / London, accept the regional Voce AI contracting entity's home jurisdiction from the standard domicile table (e.g., Ireland / Dublin) or another neutral seat already in the table. Do not accept a jurisdiction outside the table without Voce AI sign-off.",
      },
    ],
  },
  {
    id: 'rule-section-10-2-arbitration-dispute-resolution',
    title: 'Section 10.2 - Arbitration / Dispute Resolution',
    category: 'Boilerplate',
    severity: 'Standard',
    benefit:
      'Cost-controlled, confidential dispute resolution; preserved injunctive remedy for IP and confidentiality.',
    preferredPosition:
      'Hold standard MSA 2.3 verbatim, including (c) account-activity attribution and (d) cooperation. Authorized User obligations under 1.4 and Restricted Access under 2.4 remain intact.',
    rationale:
      "Arbitration with a class-action waiver controls dispute cost and forum risk and keeps disputes confidential, protecting both Voce AI's model IP and the customer's data. Administrator and seat should track Voce AI's standard domicile table. A court carve-out for injunctive relief on IP and confidentiality is market-standard and a reasonable Round 2. Removing arbitration entirely or permitting class arbitration is the walk-away. [Note] The First Position text on this row currently mirrors the Section 2.3 entry and appears to be a paste error; flag for correction so the First Position reflects the arbitration / dispute-resolution standard.",
    standardSummary:
      "Standard MSA 2.3 makes Customer responsible for (a) obtaining and maintaining Equipment needed to access the Services; (b) security of the Equipment, accounts, and passwords; (c) all uses of Customer's account or Equipment with or without Customer's knowledge or consent; and (d) reasonably assisting and cooperating with Voce AI to perform the Services. Authorized User responsibility sits separately in 1.4, and Restricted Access in 2.4.",
    walkAwayTrigger:
      'Customer demands removal of arbitration entirely or class-action arbitration.',
    fallbacks: [
      {
        position:
          "Hold binding arbitration with a class-action waiver. If the customer resists, accept a reputable administrator and seat already used in Voce AI's standard table, plus a court carve-out allowing either party to seek injunctive or equitable relief for IP or confidentiality breaches, before conceding any move away from arbitration.",
      },
    ],
  },
  {
    id: 'rule-section-11-4-assignment',
    title: 'Section 11.4 - Assignment',
    category: 'Boilerplate',
    severity: 'Standard',
    benefit: 'M&A optionality; routine operational flexibility.',
    preferredPosition:
      'Hold standard MSA 11.4 verbatim. Customer may not assign without Voce AI consent; both parties keep the right to assign to an Affiliate or M&A successor without consent.',
    rationale:
      "First Position holds standard MSA 11.4 (no customer assignment without consent; both sides free to assign to Affiliates or M&A successors). The symmetric construct protects Voce AI's M&A and reorganization optionality, which matters for a high-growth company that may itself be acquired or restructure across entities. The only realistic customer ask is a veto over assignment to a head-to-head competitor; a 'not unreasonably withheld' competitor-consent right is a contained Round 2 give that does not impair ordinary corporate transactions. Hold the line against any customer demand for a free right to assign to third parties or any attempt to restrict Voce AI's Affiliate or M&A assignment, which is the walk-away.",
    standardSummary:
      "Standard MSA 11.4: the Agreement is not assignable by Customer without Voce AI's prior written consent. Notwithstanding that, EITHER party may assign without consent to (a) an Affiliate or (b) a successor in a merger, acquisition, consolidation, reorganization, or sale of all or substantially all stock or assets. Any other assignment is null and void. Note: the Affiliate and M&A carve-out is mutual; only the general no-assignment-without-consent restriction runs one way against Customer.",
    walkAwayTrigger:
      "Customer demands a free right to assign to any third party without consent, or seeks to restrict Voce AI's Affiliate or M&A assignment.",
    fallbacks: [
      {
        position:
          "Accept a narrow consent right for the customer on a direct Voce AI assignment to the customer's named competitor (consent not to be unreasonably withheld), while keeping Voce AI's right to assign freely to an Affiliate or in a bona fide merger, acquisition, or sale of substantially all assets. Customer assignment still requires Voce AI consent.",
      },
    ],
  },
  {
    id: 'rule-section-11-2-publicity-logo-use',
    title: 'Section 11.2 - Publicity / Logo Use',
    category: 'Boilerplate',
    severity: 'Standard',
    benefit:
      'Preserves marketing control; consent process supports customer comfort.',
    preferredPosition:
      'Hold standard MSA 11.2 verbatim. Mutual consent for any publicity use.',
    rationale:
      'Standard MSA 11.2 requires mutual consent for publicity, protecting both brands. Logo and customer-list use is high-value, low-risk marketing for Voce AI; offering a revocable, pre-approved logo reference while keeping mutual consent for substantive publicity (press, case studies, quotes) is a balanced Round 2 that most customers accept. A blanket marketing-rights grant without any consent process is the walk-away.',
    standardSummary:
      "Standard MSA 11.2 requires mutual prior written consent for press releases and use of the other party's name / logos. Guideline email: standard MSA position; no marketing rider as first position.",
    walkAwayTrigger:
      'Customer demands blanket logo / marketing rights without a consent process.',
    fallbacks: [
      {
        position:
          "Accept a one-time, pre-approved reference to the customer's name and logo in Voce AI's customer list and on its website, revocable on written notice, while press releases, case studies, and quotes continue to require the customer's prior written consent.",
      },
    ],
  },
  {
    id: 'rule-section-11-5-order-of-precedence',
    title: 'Section 11.5 - Order of Precedence',
    category: 'Boilerplate',
    severity: 'Nice-to-have',
    benefit: 'Predictable conflict resolution.',
    preferredPosition:
      'Hold standard MSA 11.5. Order Form > Services Agreement.',
    rationale:
      'First Position holds Order Form > Services Agreement. Letting the DPA/BAA control data-processing conflicts only is standard and harmless because those documents are purpose-built for that subject matter; commercial precedence stays with the Order Form. The deeper concession - a 30-day customer termination right triggered by material changes to URL-incorporated terms - shifts change-control risk to Voce AI and is reserved for the Last Fallback (taken in the Orbit signed deal). Walk away if the customer demands its own documents override the standard MSA wholesale.',
    precedent:
      "Orbit Precedent (Markup mid-2026, signed deal; OrbitLens Inc.; older MSA form v.2025-07-14): In Section 11.5, Voce AI accepted an order of precedence of (a) Order Form, (b) DPA and/or BAA as to Personal Data or PHI, then (c) Services Agreement, and a new 11.5(b) requiring Voce AI to give written notice of any material changes to URL-incorporated terms and allowing the customer to terminate affected Services within 30 days where such a change materially increases its obligations or materially diminishes Voce AI's obligations or Customer Content protections. Recorded as Last Fallback.",
    standardSummary:
      'Standard MSA 11.5 sets order: Order Form > Services Agreement.',
    walkAwayTrigger:
      'Customer demands customer-drafted documents override standard MSA.',
    fallbacks: [
      {
        position:
          'Accept that the DPA and any BAA prevail over the Services Agreement solely for conflicts concerning the processing of Personal Data or PHI, with the Order Form remaining on top for commercial terms. Do not yet add the 30-day customer termination right for material changes to URL-incorporated terms.',
      },
      {
        position:
          "Orbit floor (signed 2026): accept an order of precedence of (a) Order Form, (b) DPA and/or BAA for the processing of Personal Data or PHI, then (c) Services Agreement, plus a customer right to terminate affected Services within 30 days where Voce AI gives notice of a material change to URL-incorporated terms that materially increases the customer's obligations or materially diminishes Voce AI's obligations or the security or privacy protections for Customer Content.",
      },
    ],
  },
  {
    id: 'rule-section-11-1-force-majeure',
    title: 'Section 11.1 - Force Majeure',
    category: 'Boilerplate',
    severity: 'Nice-to-have',
    benefit:
      'Limits liability for uncontrollable disruptions while preserving the right to be paid.',
    preferredPosition:
      "Hold standard MSA 11.1. Neither party is liable for non-performance, excluding Customer's payment obligations, caused by events beyond reasonable control.",
    rationale:
      "Standard MSA 11.1 excuses non-performance (other than payment) for events beyond reasonable control. An extended-FM termination right is customary and mutual, giving the customer an exit if an outage persists while preserving Voce AI's protection during genuine FM and the payment carve-out. The walk-away is any demand that Voce AI remain liable for performance during genuine Force Majeure or that the customer be excused from paying for Services already rendered.",
    standardSummary:
      "Standard MSA 11.1: mutual Force Majeure excuse for non-performance caused by events beyond a party's reasonable control (fire, flood, war, pandemic, government action, strike, civil unrest, supplier disputes, and the like). Expressly does not excuse Customer's payment obligations.",
    walkAwayTrigger:
      'Customer demands Voce AI remain liable for performance during genuine Force Majeure, or seeks to excuse its own payment obligations.',
    fallbacks: [
      {
        position:
          "Accept a mutual extended-Force-Majeure termination right: either party may terminate the affected Services on notice if a Force Majeure event continues beyond 30 to 60 consecutive days, with the customer's payment obligations for Services already delivered preserved.",
      },
    ],
  },
];

export const seedPlaybooks: PlaybookStudioPlaybook[] = [
  {
    id: 'voce-msa-commercial-service',
    name: 'Voce AI MSA - Commercial & Service Terms',
    description:
      'Scope, access, service obligations and pricing/fee positions for the standard Voce AI MSA, including PUP flow-down, suspension, SLA, payment terms, taxes and billing disputes.',
    owner: 'Pamir Ehsas',
    updatedLabel: '3 days ago',
    rules: voceMsaCommercialServiceRules,
  },
  {
    id: 'voce-msa-data-security-confidentiality',
    name: 'Voce AI MSA - Data, Security & Confidentiality',
    description:
      'Data protection, information security, usage data, zero-retention, audit rights and confidentiality positions for the standard Voce AI MSA.',
    owner: 'Daniel Dalla Vedova',
    updatedLabel: '1 week ago',
    rules: voceMsaDataSecurityConfidentialityRules,
  },
  {
    id: 'voce-msa-ip-indemnity-liability',
    name: 'Voce AI MSA - IP, Indemnity, Warranties & Liability',
    description:
      'IP ownership, output rights, indemnities, warranties and disclaimers, and liability caps for the standard Voce AI MSA.',
    owner: 'You',
    updatedLabel: '2 weeks ago',
    rules: voceMsaIpIndemnityLiabilityRules,
  },
  {
    id: 'voce-msa-term-boilerplate',
    name: 'Voce AI MSA - Term, Termination & Boilerplate',
    description:
      'Term and termination for material breach plus boilerplate positions (governing law, arbitration, assignment, publicity, order of precedence, force majeure).',
    owner: 'You',
    updatedLabel: '1 month ago',
    rules: voceMsaTermBoilerplateRules,
  },
];
