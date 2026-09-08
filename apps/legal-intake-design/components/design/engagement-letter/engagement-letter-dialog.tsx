'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/design/design-system/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import { Input } from '@/components/design/foundations/components/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import { FormattedDate } from '@/components/formatted-date';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { SignaturePad } from './signature-pad';

type SignatureMethod = 'typed' | 'drawn';

type EngagementLetterDialogProps = {
  companyName: string;
  signerName: string;
  signerTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (details: {
    signedBy: string;
    signedTitle: string;
    signatureMethod: SignatureMethod;
  }) => void;
};

const TERMS_PAGES = [
  [
    {
      number: 1,
      title: 'Confidentiality and Related Matters',
      paragraphs: [
        'The firm is subject to professional-conduct rules requiring lawyers and their employees to preserve and protect confidential information. Client will likewise protect confidential information about the firm’s internal operations with no less than reasonable care.',
        'The firm may use carefully selected service providers for administrative operations such as secure file storage, document processing, accounting, and billing. The firm will follow applicable law when those providers require access to Client information.',
      ],
    },
    {
      number: 2,
      title: 'Affiliated Firms',
      paragraphs: [
        'For matters involving non-US law, Moritz Law may engage an affiliated firm where necessary to obtain appropriately qualified local counsel. Client consents to the disclosure of its identity and relevant matter information for conflict checks and delivery of those services.',
        'Local professional-conduct, privilege, and confidentiality rules may differ from US rules. Foreign-law advice beyond the agreed scope may require Client to retain independent local counsel.',
      ],
    },
  ],
  [
    {
      number: 3,
      title: 'Client Affiliates',
      paragraphs: [
        'The attorney-client relationship is with Client only. It does not automatically extend to Client’s executives, shareholders, directors, members, parent, subsidiaries, or other affiliates.',
        'Because those persons and entities are not clients of the firm, their interests will not ordinarily create a conflict that prevents the firm from representing another client.',
      ],
    },
    {
      number: 4,
      title: 'Advance Waiver of Conflicts of Interest',
      paragraphs: [
        'Client gives informed consent for the firm to represent existing or new clients in matters that are not the same as, or substantially related to, the firm’s work for Client, even where those clients’ interests are directly adverse to Client.',
        'This consent does not permit the firm to use Client’s sensitive or confidential information to Client’s material disadvantage. Client may revoke the waiver for future matters, subject to representations already undertaken.',
      ],
    },
  ],
  [
    {
      number: 5,
      title: 'Joint Representation Waiver',
      paragraphs: [
        'Where the firm represents more than one client in a matter, information relevant to the joint representation may be shared among those clients. Each joint client consents to that sharing for purposes of the engagement.',
        'If material differences arise that cannot be resolved consistently with every joint client’s interests, the firm may be required to withdraw from representing all joint clients.',
      ],
    },
    {
      number: 6,
      title: 'Electronic Communications and Information Storage',
      paragraphs: [
        'Client consents to electronic communications and storage through technology providers reasonably selected by the firm. No electronic system is entirely free from risk, and Client will notify the firm if heightened security or alternative arrangements are required.',
        'Special-category personal data will be processed only where permitted for legal services. Separate written consent will be requested before such data is used for AI training or improvement where required.',
      ],
    },
  ],
  [
    {
      number: 7,
      title: 'Use of External Platforms',
      paragraphs: [
        'Client and the firm may agree to use e-signature, messaging, collaboration, or other third-party platforms. Those services are outside the firm’s control, and Client is responsible for maintaining appropriate access and security controls.',
        'The firm may preserve records of advice delivered through an agreed platform. Email or another channel may be used where urgency, sensitivity, access limitations, or technical constraints make that appropriate.',
      ],
    },
    {
      number: 8,
      title: 'Fees and Costs',
      paragraphs: [
        'Fees reflect the work required, complexity, professional skill, resources used, amounts at risk, results obtained, and time constraints. Estimates are based on professional judgment and may change if the facts or scope change.',
        'Client is responsible for agreed expenses and disbursements incurred on its behalf. The firm may ask Client to pay a vendor directly or provide funds in advance for anticipated third-party costs.',
      ],
    },
  ],
  [
    {
      number: 9,
      title: 'Independent Contractors',
      paragraphs: [
        'The firm may use qualified independent lawyers, paralegals, or other professionals under firm supervision. Their work may be billed in the same manner as work performed by similarly qualified firm personnel.',
        'Where appropriate, Client authorizes the firm to retain experts, investigators, litigation-support providers, court reporters, and other third parties needed for the representation.',
      ],
    },
    {
      number: 10,
      title: 'Billings',
      paragraphs: [
        'Invoices are generally issued periodically and are due upon receipt unless another arrangement is agreed in writing. Client should raise questions promptly so the firm can provide additional billing information.',
        'Subject to applicable law and ethical rules, overdue balances may accrue interest and may result in the firm withdrawing from the representation. Applicable taxes may be added to invoices.',
      ],
    },
  ],
  [
    {
      number: 11,
      title: 'E-Billing Policies and Procedures',
      paragraphs: [
        'If Client requires use of an approved e-billing vendor, Client will provide the relevant policies and ensure the system permits access by responsible attorneys and authorized billing personnel.',
        'Rejected charges, delayed approvals, or vendor issues do not change Client’s responsibility for prompt payment under the engagement letter.',
      ],
    },
    {
      number: 12,
      title: 'Client Files',
      paragraphs: [
        'The firm will maintain an electronic or paper Client File containing materials reasonably necessary to the representation. Internal communications, lawyer notes, mental impressions, and other work product remain the firm’s property.',
        'Client may request delivery of the Client File, subject to the firm’s right to retain copies. Files may be destroyed seven years after a matter closes or according to applicable retention requirements.',
      ],
    },
  ],
  [
    {
      number: 13,
      title: 'Termination',
      paragraphs: [
        'Either Client or the firm may terminate the representation, subject to applicable professional obligations. Client remains responsible for fees, expenses, and transition work incurred before termination.',
        'The relationship may be considered concluded when the agreed services are complete or after an extended period without active work. The firm may withdraw where continued advice would breach sanctions, anti-money-laundering, anticorruption, or export-control laws.',
      ],
    },
    {
      number: 14,
      title: 'Agreement to Arbitrate and Waive Jury Trial',
      paragraphs: [
        'Disputes arising from the representation will be resolved by confidential binding arbitration administered by JAMS after good-faith nonbinding mediation. Arbitration procedures and available appellate relief differ from court proceedings.',
        'By accepting these terms, Client waives the right to a jury trial to the extent permitted by law. Statutory fee-arbitration rights remain available where they cannot lawfully be waived.',
      ],
    },
  ],
  [
    {
      number: 15,
      title: 'Internal Law Firm Privilege',
      paragraphs: [
        'Professional-responsibility questions may require the firm to consult its internal or outside counsel. Client consents to those consultations and agrees that the ongoing representation does not waive any privilege protecting them.',
        'The firm will limit such consultation to what it considers necessary or appropriate to understand and comply with its legal and professional obligations.',
      ],
    },
    {
      number: 16,
      title: 'Acknowledgement and Agreement to Third-Party Vendors',
      paragraphs: [
        'Operational, technology, and administrative services may be supplied through a separate management-services organization or other vendors. Those providers do not give legal advice, and firm lawyers remain responsible for legal services.',
        'Technology support does not waive attorney-client privilege or work-product protection. By signing, Client acknowledges and consents to these arrangements, subject to its right to raise objections.',
      ],
    },
  ],
  [
    {
      number: 17,
      title: 'Artificial Intelligence',
      paragraphs: [
        'The firm and its vendors may use supervised AI tools to assist with legal analysis, document review, drafting, research, compliance, and related work. Use remains subject to professional-conduct, confidentiality, privilege, and security obligations.',
        'Client authorizes processing of Client Matter Content as reasonably necessary to provide services and improve firm systems. Client may opt out of training, fine-tuning, and third-party licensing by written notice without changing the standard scope or rates.',
      ],
    },
    {
      number: 18,
      title: 'Miscellaneous',
      paragraphs: [
        'The engagement letter and these Terms of Engagement contain the entire agreement and supersede prior understandings. Amendments must be in writing, and an invalid provision will not affect the remaining terms.',
        'The engagement also incorporates applicable terms and privacy policies published by Moritz Law and any enterprise master-services agreement expressly made part of the relationship.',
      ],
    },
  ],
] as const;

export function EngagementLetterDialog({
  companyName,
  signerName: defaultSignerName,
  signerTitle: defaultSignerTitle,
  open,
  onOpenChange,
  onSign,
}: EngagementLetterDialogProps) {
  const [method, setMethod] = useState<SignatureMethod>('typed');
  const [typedName, setTypedName] = useState(defaultSignerName);
  const [drawnSignerName, setDrawnSignerName] = useState(defaultSignerName);
  const [signerTitle, setSignerTitle] = useState(defaultSignerTitle);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [hasAuthority, setHasAuthority] = useState(false);
  const signingDate = useMemo(() => new Date().toISOString(), []);
  const signerName = method === 'typed' ? typedName : drawnSignerName;
  const hasSignature =
    method === 'typed' ? typedName.trim().length > 1 : hasDrawnSignature;
  const canSign =
    signerName.trim().length > 1 &&
    signerTitle.trim().length > 1 &&
    hasSignature &&
    hasAuthority;

  const handleSign = () => {
    if (!canSign) return;
    onSign({
      signedBy: signerName.trim(),
      signedTitle: signerTitle.trim(),
      signatureMethod: method,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="5xl"
        className="sm:flex sm:max-h-[calc(100vh-2rem)] sm:flex-col sm:overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Review and sign your Engagement Letter</DialogTitle>
          <DialogDescription>
            Complete this account-level step in Moritz before submitting your
            first case.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
          <EngagementLetterPreview
            companyName={companyName}
            signerName={signerName}
            signerTitle={signerTitle}
            signingDate={signingDate}
          />

          <div className="space-y-5 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Field>
                <FieldLabel htmlFor="engagement-company">Company</FieldLabel>
                <Input id="engagement-company" value={companyName} readOnly />
              </Field>
              <Field>
                <FieldLabel>Signing date</FieldLabel>
                <div className="border-field bg-muted/30 flex h-10 items-center rounded-md border px-3 text-sm">
                  <FormattedDate
                    date={signingDate}
                    options={{ dateStyle: 'medium' }}
                  />
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="signer-title">Title</FieldLabel>
              <Input
                id="signer-title"
                value={signerTitle}
                onChange={(event) => setSignerTitle(event.target.value)}
                autoComplete="organization-title"
              />
            </Field>

            <Tabs
              value={method}
              onValueChange={(value) => setMethod(value as SignatureMethod)}
            >
              <TabsList aria-label="Signature method">
                <TabsTrigger value="typed">Type signature</TabsTrigger>
                <TabsTrigger value="drawn">Draw signature</TabsTrigger>
              </TabsList>
              <TabsContent value="typed" className="pt-4">
                <Field>
                  <FieldLabel htmlFor="typed-signature">
                    Type your full legal name
                  </FieldLabel>
                  <Input
                    id="typed-signature"
                    value={typedName}
                    onChange={(event) => setTypedName(event.target.value)}
                    autoComplete="name"
                    className="font-serif text-xl italic"
                  />
                </Field>
              </TabsContent>
              <TabsContent value="drawn" className="space-y-4 pt-4">
                <Field>
                  <FieldLabel htmlFor="drawn-signer-name">
                    Signer full name
                  </FieldLabel>
                  <Input
                    id="drawn-signer-name"
                    value={drawnSignerName}
                    onChange={(event) => setDrawnSignerName(event.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <SignaturePad onChange={setHasDrawnSignature} />
              </TabsContent>
            </Tabs>

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
              <Checkbox
                checked={hasAuthority}
                onCheckedChange={(checked) => setHasAuthority(checked === true)}
                aria-label="Confirm authority to sign"
                className="mt-0.5"
              />
              <span>
                I am authorised to sign for {companyName}. I have read and agree
                to this Engagement Letter and the attached Terms of Engagement,
                including the advance conflict waiver and arbitration
                provisions.
              </span>
            </label>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled={!canSign} onClick={handleSign}>
            Sign Engagement Letter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EngagementLetterPreview({
  companyName,
  signerName,
  signerTitle,
  signingDate,
}: {
  companyName: string;
  signerName: string;
  signerTitle: string;
  signingDate: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState<75 | 100 | 125 | 150>(100);

  const goToPage = (page: number) => {
    const nextPage = Math.min(12, Math.max(1, page));
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(
      `[data-document-page="${nextPage}"]`,
    );
    const firstPage = container?.querySelector<HTMLElement>(
      '[data-document-page="1"]',
    );
    if (container && target && firstPage) {
      container.scrollTo({
        top: target.offsetTop - firstPage.offsetTop,
        behavior: 'smooth',
      });
      setCurrentPage(nextPage);
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const pages = Array.from(
      container.querySelectorAll<HTMLElement>('[data-document-page]'),
    );
    const firstOffset = pages[0]?.offsetTop ?? 0;
    const nearest = pages.reduce(
      (best, page) => {
        const distance = Math.abs(
          page.offsetTop - firstOffset - container.scrollTop,
        );
        return distance < best.distance
          ? { page: Number(page.dataset.documentPage), distance }
          : best;
      },
      { page: 1, distance: Number.POSITIVE_INFINITY },
    );
    setCurrentPage(nearest.page);
  };

  const changeZoom = (direction: -1 | 1) => {
    const levels = [75, 100, 125, 150] as const;
    const index = levels.indexOf(zoom);
    const nextIndex = Math.min(
      levels.length - 1,
      Math.max(0, index + direction),
    );
    setZoom(levels[nextIndex]!);
  };

  return (
    <article className="border-field bg-muted/40 flex max-h-[65vh] min-h-0 flex-col overflow-hidden rounded-2xl border lg:h-full lg:max-h-none">
      <div className="bg-background border-border flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Engagement Letter</p>
            <p className="text-muted-foreground text-xs">
              Letter and Terms of Engagement · 12 pages
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <span className="text-muted-foreground min-w-11 text-center text-xs tabular-nums">
            {currentPage} / 12
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={currentPage === 12}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
          <span
            aria-hidden="true"
            className="bg-border mx-1 hidden h-5 w-px sm:block"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={zoom === 75}
            onClick={() => changeZoom(-1)}
            aria-label="Zoom out"
          >
            <ZoomOut aria-hidden="true" className="size-4" />
          </Button>
          <span className="text-muted-foreground hidden min-w-10 text-center text-xs tabular-nums sm:block">
            {zoom}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={zoom === 150}
            onClick={() => changeZoom(1)}
            aria-label="Zoom in"
          >
            <ZoomIn aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              toast.success('Engagement Letter downloaded (mock).')
            }
            aria-label="Download Engagement Letter"
          >
            <Download aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 snap-y snap-proximity space-y-5 overflow-auto scroll-smooth p-3 sm:p-5"
      >
        <DocumentPage page={1} zoom={zoom}>
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <p className="text-lg font-bold tracking-wide">MORITZ LAW, APC</p>
              <p className="text-[9px] uppercase tracking-[0.18em]">
                Attorneys at Law
              </p>
            </div>
            <p className="text-right text-[10px] leading-4">
              <FormattedDate
                date={signingDate}
                options={{ dateStyle: 'long' }}
              />
            </p>
          </div>

          <address className="mb-7 not-italic">
            <p>{companyName}</p>
            <p>Oakland, California</p>
            <p>United States</p>
          </address>

          <div className="space-y-4">
            <p>
              Thank you for retaining Moritz Law, APC (“Moritz Law” or “the
              firm”) to represent {companyName} (“Client” or “You”).
            </p>
            <LegalParagraph title="Scope of Engagement.">
              Moritz Law’s engagement will involve advising Client on commercial
              and corporate legal matters, including commercial contracts,
              technology and SaaS agreements, data protection and privacy,
              cross-border legal work, and regulatory compliance. The engagement
              will not involve litigation, tax, intellectual property
              prosecution, or corporate finance unless separately agreed in
              writing.
            </LegalParagraph>
            <LegalParagraph title="Terms of Engagement.">
              This letter and the attached nine-page Terms of Engagement
              constitute the entire understanding between You and the firm.
              Future matters accepted through the Moritz platform will be
              governed by this letter and the attached Terms of Engagement
              unless otherwise agreed in writing.
            </LegalParagraph>
            <LegalParagraph title="Fees.">
              The firm’s fee for services is generally a flat fee per contract
              (from draft to signature) of $500–$2,000, payable in advance. You
              are entitled to a refund of any portion that has not been earned.
              By signing below, you consent to deposit of the flat fee into the
              firm’s operating account. The firm may charge $400 per hour for
              live meetings and negotiations.
            </LegalParagraph>
            <p>
              The firm reserves its right to withdraw from the representation in
              a manner consistent with applicable ethical standards.
            </p>
          </div>
        </DocumentPage>

        <DocumentPage page={2} zoom={zoom}>
          <div className="space-y-4">
            <LegalParagraph title="Client Relationship.">
              The firm’s attorney-client relationship is with Client only and
              not with Client’s individual executives, shareholders, directors,
              members, managers, partners, parent, subsidiaries, or other
              affiliates.
            </LegalParagraph>
            <LegalParagraph title="Advance Waiver to Future Conflicts.">
              Client understands and gives informed consent that the firm may
              represent existing or new clients in future matters that are not
              substantially related to its representation of Client, even when
              those clients’ interests are directly adverse to Client.
            </LegalParagraph>
            <LegalParagraph title="Considerations Relating to the Decision to Waive.">
              Client should not sign if it has unanswered reservations or
              concerns. Moritz Law recommends that Client discuss this waiver
              and the Terms of Engagement with an attorney of its choice.
            </LegalParagraph>
            <LegalParagraph title="Agreement to Arbitrate and Waive Jury Trial.">
              Any dispute arising from this letter or the provision of
              professional services will be settled by binding arbitration
              administered by JAMS. By agreeing to arbitration, Client waives
              rights to a jury trial and limits rights to appellate relief.
            </LegalParagraph>
            <LegalParagraph title="AI Development.">
              Client authorizes Moritz Law and its service providers to use
              Client content to provide legal services, operate and secure
              systems, evaluate conflicts, comply with professional obligations,
              and develop and improve AI tools, subject to confidentiality,
              privilege, and professional-responsibility obligations.
            </LegalParagraph>
          </div>
        </DocumentPage>

        <DocumentPage page={3} zoom={zoom}>
          <div className="space-y-5">
            <p>
              If the terms described above and in the attached Terms of
              Engagement are satisfactory, please indicate by signing this
              letter, which will confirm the engagement agreement.
            </p>
            <p>
              The firm looks forward to working with Client, and Moritz Law
              appreciates Client’s decision to engage the firm.
            </p>
            <div className="pt-3">
              <p>Sincerely yours,</p>
              <p className="mt-4 font-bold">MORITZ LAW, APC</p>
              <div className="mt-5 grid grid-cols-[3rem_1fr] gap-y-2">
                <span>By:</span>
                <span className="border-foreground/60 border-b" />
                <span>Name:</span>
                <span>Daniel Dalla Vedova</span>
                <span>Title:</span>
                <span>President of Moritz Law, APC</span>
              </div>
            </div>
            <div className="pt-6">
              <p className="font-bold">CLIENT</p>
              <div className="mt-5 grid grid-cols-[3rem_1fr] gap-y-2">
                <span>By:</span>
                <span className="border-foreground/60 border-b" />
                <span>Name:</span>
                <span>{signerName || '\u00a0'}</span>
                <span>Title:</span>
                <span>{signerTitle || '\u00a0'}</span>
                <span>Date:</span>
                <span>
                  <FormattedDate
                    date={signingDate}
                    options={{ dateStyle: 'short' }}
                  />
                </span>
              </div>
            </div>
          </div>
        </DocumentPage>

        {TERMS_PAGES.map((sections, index) => (
          <DocumentPage key={index} page={index + 4} zoom={zoom}>
            <header className="mb-7 text-center">
              <p className="text-sm font-bold">Moritz Law, APC</p>
              <h3 className="text-base font-bold">Terms of Engagement</h3>
            </header>
            {index === 0 ? (
              <p className="mb-6">
                These terms are an integral part of Client’s engagement of
                Moritz Law and apply unless modified in writing.
              </p>
            ) : null}
            <div className="space-y-7">
              {sections.map((section) => (
                <section key={section.number} className="space-y-3">
                  <h4 className="font-bold">
                    Section {section.number}. {section.title}
                  </h4>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </DocumentPage>
        ))}
      </div>
    </article>
  );
}

function LegalParagraph({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <p>
      <strong>{title}</strong> {children}
    </p>
  );
}

function DocumentPage({
  page,
  zoom,
  children,
}: {
  page: number;
  zoom: 75 | 100 | 125 | 150;
  children: ReactNode;
}) {
  const zoomClass = {
    75: 'min-h-[34.5rem] w-3/4 text-[8px] sm:text-[8.25px]',
    100: 'min-h-[46rem] w-full max-w-[42rem] text-[10px] sm:text-[11px]',
    125: 'min-h-[57.5rem] w-[125%] max-w-none text-[12.5px] sm:text-[13.75px]',
    150: 'min-h-[69rem] w-[150%] max-w-none text-[15px] sm:text-[16.5px]',
  }[zoom];

  return (
    <section
      data-document-page={page}
      className={cn(
        "bg-background text-foreground mx-auto flex snap-start flex-col px-8 py-9 leading-[1.6] shadow-sm ring-1 ring-black/5 [font-family:'Times_New_Roman',Times,serif] sm:px-12 sm:py-11",
        zoomClass,
      )}
    >
      <div className="flex-1">{children}</div>
      <p className="text-muted-foreground mt-10 text-center font-sans text-[9px]">
        {page} of 12
      </p>
    </section>
  );
}
