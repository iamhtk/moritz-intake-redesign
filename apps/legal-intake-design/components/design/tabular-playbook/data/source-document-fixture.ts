/**
 * Stand-in for the executed agreement that citations point into.
 *
 * The source viewer renders a document, not a snippet, so the excerpt behind a
 * cell value is seated inside a realistic agreement: a title block, numbered
 * sections, sub-clauses and lettered lists, long enough that following a
 * citation genuinely has to scroll to the passage.
 *
 * Section titles are kept short because the viewer treats a short numbered line
 * as a heading; sub-clauses run long on purpose so they render as body prose.
 */
export const SOURCE_DOCUMENT = {
  name: 'Pylon Master Services Agreement (executed).docx',
  author: 'Pamir Ehsas',
  lastModified: '2026-06-18T09:24:00.000Z',
};

/**
 * Builds the agreement text with `excerpt` seated in the clause it was
 * extracted from. The excerpt is inserted verbatim so a citation's snippet can
 * still be located and highlighted inside the full document.
 */
export const buildSourceDocumentText = (excerpt: string): string =>
  `MASTER SERVICES AGREEMENT

BETWEEN

PYLON TECHNOLOGIES, INC.

AND

__________________________

THIS MASTER SERVICES AGREEMENT (the "Agreement") is entered into on 18 June 2026 (the "Effective Date") and made between:

(1) PYLON TECHNOLOGIES, INC., a Delaware corporation, having a principal place of business at 1 Harrison Street, Suite 400, San Francisco, California, 94105 (the "Provider"); and

(2) ___________ (the "Customer"),

(each a "Party", together the "Parties").

BACKGROUND:

(1) The Provider desires to make available to the Customer, and the Customer desires to receive, the software and services described in Schedule 1 (Services) subject to the terms and conditions of this Agreement.

(2) Now, therefore, in consideration of the mutual covenants, terms and conditions set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

1. DEFINITIONS AND INTERPRETATION

In this Agreement:

"Affiliate" means any entity that directly or indirectly controls, is controlled by, or is under common control with a Party;

"Business Day" means a day other than a Saturday, Sunday or public holiday in the State of California;

"Confidential Information" has the meaning given to it in Clause 6 (Confidentiality);

"Customer Data" means all data, records, files and other materials submitted to or processed by the Services by or on behalf of the Customer;

"Order Form" means an ordering document executed by the Parties under this Agreement that describes the Services, the fees and the applicable subscription term; and

"Services" means the software, hosting, support and professional services described in Schedule 1 and in each Order Form.

The headings in this Agreement do not affect its interpretation. References to a clause or schedule are references to a clause of, or schedule to, this Agreement, and the schedules form part of it and have the same force and effect as if set out in the body of this Agreement.

2. SCOPE OF SERVICES

2.1 Subject to the terms and conditions of this Agreement, the Provider shall make the Services available to the Customer and its Affiliates for their internal business purposes during the subscription term set out in the applicable Order Form, in accordance with the service levels set out in Schedule 2 (Service Levels).

2.2 The Provider shall not materially decrease the functionality of the Services during a subscription term, and shall give the Customer at least sixty (60) days' prior written notice of any change to the Services that would require a material change to the Customer's own systems or processes.

3. FEES AND PAYMENT

3.1 In consideration of the Provider's performance of its obligations under this Agreement, the Customer shall pay the fees set out in the applicable Order Form within forty-five (45) days of the date of receipt of a valid invoice containing a detailed description of the Services delivered.

3.2 Fees are exclusive of sales, goods and services, harmonised sales and value-added taxes, which shall be separately identified on each invoice. Undisputed amounts that remain unpaid thirty (30) days after their due date may accrue interest at the lesser of one percent (1%) per month and the maximum rate permitted by applicable law.

4. TERM AND TERMINATION

4.1 This Agreement commences on the Effective Date and continues until the expiry or termination of the last Order Form executed under it, unless terminated earlier in accordance with this Clause 4.

4.2 Either Party may terminate this Agreement or any Order Form for material breach on thirty (30) days' written notice if the breaching Party has not cured the breach within that period, and the Customer may terminate for convenience on ninety (90) days' written notice with a pro-rated refund of prepaid fees for the unused portion of the subscription term.

5. RELEVANT PROVISIONS

5.1 ${excerpt}

5.2 The Provider shall maintain complete and accurate records sufficient to evidence its compliance with this Clause 5, and shall make those records available to the Customer on reasonable written notice and no more than once in any twelve (12) month period.

6. CONFIDENTIALITY

6.1 From time to time either Party may disclose or make available to the other Party information about its business affairs, clients, products, confidential intellectual property, trade secrets and other sensitive or proprietary information, including Customer Data, whether orally or in written, electronic or other form or media, and whether or not marked as confidential (collectively, "Confidential Information").

Confidential Information does not include information that, at the time of disclosure is:

(a) in the public domain other than through a breach of this Agreement;

(b) known to the receiving Party at the time of disclosure;

(c) rightfully obtained by the receiving Party on a non-confidential basis from a third party; or

(d) independently developed by the receiving Party without reference to the disclosing Party's Confidential Information, provided that these exceptions do not apply to personal information or Customer Data.

6.2 The receiving Party shall not disclose the disclosing Party's Confidential Information to any person except to those of its personnel and professional advisers who need to know it in order to exercise its rights or perform its obligations under this Agreement and who are bound by obligations of confidentiality no less protective than those set out in this Clause 6.

7. DATA PROTECTION AND SECURITY

7.1 Each Party shall comply with applicable data protection laws in respect of its processing of personal data under this Agreement, and the Parties shall enter into the data processing addendum attached as Schedule 3 (Data Processing Addendum), which shall govern the Provider's processing of personal data on the Customer's behalf.

7.2 The Provider shall maintain an information security programme that includes administrative, technical and physical safeguards designed to protect Customer Data against unauthorised access, use, alteration and destruction, and shall notify the Customer without undue delay and in any event within seventy-two (72) hours of becoming aware of a security incident affecting Customer Data.

8. GENERAL PROVISIONS

8.1 Neither Party may assign this Agreement without the other Party's prior written consent, except that either Party may assign it in whole to an Affiliate or to a successor in connection with a merger, acquisition or sale of substantially all of its assets on written notice to the other Party.

8.2 This Agreement, together with its schedules and each Order Form, constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior proposals, negotiations and understandings, whether written or oral, relating to that subject matter.

8.3 This Agreement is governed by the laws of the State of California, excluding its conflict of laws rules, and the Parties submit to the exclusive jurisdiction of the state and federal courts located in San Francisco, California.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.`;
