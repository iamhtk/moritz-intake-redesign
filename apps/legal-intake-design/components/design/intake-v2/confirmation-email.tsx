'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  EmailBody,
  EmailButton,
  EmailHeading,
  EmailSecondaryText,
  EmailText,
} from '@repo/ui/components/email-layout';
import { MOCK_CLIENT_USER } from '@/lib/mocks/users';
import type { Brief } from '@/lib/intake/brief';
import type { MatterId } from '@/components/design/new-case/intake-types';
import {
  confirmationEmail,
  type EmailLine,
} from '@/lib/intake/confirmation-email';
import { clientFirstName } from '@/lib/intake/client-session';
import { leadForMatter } from '@/components/design/new-case/lawyers';
import { mattersAhead } from '@/lib/intake/pricing-queue';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';

/**
 * The confirmation email, rendered inside the prototype (Decision 22).
 *
 * Complaint one was that people did not know they had submitted anything. The
 * screen they are looking at says so, but a screen is not a receipt: close the
 * tab and there is nothing left. This is the thing that is still in their inbox
 * tomorrow, and showing it here is how a reviewer can read it without a mail
 * server.
 *
 * It is the *real* email, not a drawing of one. `EmailBody` is the same
 * component the sent mail would use, so the card, the header, the footer rule
 * and the copyright are not reimplemented here and cannot drift from it; the
 * only thing this surface adds is the envelope, which is normally the mail
 * client's job. That is why `EmailBody` was split out of `EmailLayout` in
 * `packages/ui`: `EmailLayout` renders `<html>`, which cannot be nested in a
 * page, and a lookalike would have been wrong within a week.
 *
 * The copy is under the honesty rule (B, Decision 7, Decision 21): it names the
 * quote as the next step and says plainly that nobody is assigned until it is
 * accepted. This is the surface most likely to be read while the client is
 * away from the product, so it is the worst possible place to imply a lawyer is
 * already working.
 */
export function ConfirmationEmailTrigger({
  brief,
  matterId,
  onOpen,
}: {
  brief: Brief;
  /** Resolved from the brief's matter-type field, not `brief.matterId`. */
  matterId: MatterId | undefined;
  /**
   * Where the email goes when it is asked for.
   *
   * It used to be a modal, and a modal was the wrong container for it twice
   * over: it covered the confirmation the email is a copy of, and it made
   * reading the receipt and reading the contract two things that could not
   * happen at once. Handed to the document panel instead, it becomes a tab
   * beside the documents the case was built from — collapsible to the column,
   * closable, and never in front of the page it describes.
   */
  onOpen: (document: {
    id: string;
    name: string;
    meta: readonly (readonly [string, string])[];
    body: React.ReactNode;
  }) => void;
}) {
  const t = useTranslations('intake.email');
  /*
   * The email's link has to be absolute, and in the prototype the only honest
   * absolute URL is the one this page is being served from. Built from the
   * active locale so the link lands on the same case page "Go to case" does,
   * which also means a reviewer can click it and end up somewhere real.
   */
  const locale = useLocale();
  const email = confirmationEmail({
    brief,
    reference: SUBMITTED_CASE.reference,
    fallbackName: t('fallbackName'),
  });

  const subject = t('subject', {
    name: email.caseName,
    reference: email.reference,
  });

  /*
   * Item 18: the same person the intake put on screen signs the email.
   *
   * Resolved from the brief's own matter type through `leadForMatter`, which is
   * the function the lawyer note beside the composer uses. That is the point:
   * a client who spent ten minutes being told Priya handles employment
   * disputes should not then be written to by a team. One lookup, so the two
   * surfaces cannot name different people.
   */
  const lawyer = leadForMatter(matterId);
  const ahead = mattersAhead();

  /*
   * The envelope, as About's rows.
   *
   * A mail client draws this, so it is the one part of the surface that is not
   * the email — which is exactly why it moves into About rather than staying
   * above the message. In the panel the message is the document and the
   * envelope is what the document *is*, and About is already the place this
   * viewer answers that question for a PDF.
   */
  const meta: readonly (readonly [string, string])[] = [
    [t('from'), t('fromValue')],
    [t('to'), MOCK_CLIENT_USER.email],
    [t('subjectLabel'), subject],
  ];

  const body = (
    <div className="px-1 py-2">
      <EmailBody
        appName={t('appName')}
        copyright={t('copyright')}
        footer={t('footer')}
      >
        <EmailHeading>{t('heading')}</EmailHeading>

        <EmailText>
          {t('opening', {
            firstName: clientFirstName() ?? '',
            name: email.caseName,
            reference: email.reference,
          })}
        </EmailText>

        {/*
         * What Moritz understood, restated. The recap paragraph first,
         * because it is the sentence a lawyer reads, then the brief
         * itself, because the client's own words are what they will check
         * this against.
         */}
        {email.summary ? <EmailText>{email.summary}</EmailText> : null}

        <EmailFieldTable
          lines={email.lines}
          unconfirmedNote={t('unconfirmedNote')}
        />

        {/*
         * Item 6, under the brief it is about and above what happens
         * next. Labelled, because in an email there is no "Worth knowing"
         * heading nearby to explain why one loose sentence is sitting
         * between a table and a next-steps section.
         */}
        {email.observation ? (
          <EmailSecondaryText>
            {t('observationNote', { observation: email.observation })}
          </EmailSecondaryText>
        ) : null}

        <EmailHeadingSmall>{t('nextTitle')}</EmailHeadingSmall>
        <EmailText>{t('nextBody')}</EmailText>
        {/*
         * No location, no hour, no overnight claim: see the matching note
         * on the confirmation screen. The email is the worst place to put
         * an unsupportable promise, because it is the copy the client
         * still has in writing tomorrow.
         */}
        <EmailText>{t('turnaroundNote')}</EmailText>
        {/*
         * How long the line actually is (item 18). The one true thing
         * this email can say about timing, and the number comes off the
         * pricing queue rather than out of the copy.
         */}
        <EmailText>{t('queue', { count: ahead })}</EmailText>
        <EmailText>{t('whereBody')}</EmailText>

        <EmailButton href={`/${locale}${SUBMITTED_CASE.href}`}>
          {t('cta')}
        </EmailButton>

        <EmailSecondaryText>{t('changeNote')}</EmailSecondaryText>

        {/* Item 18: a name and a practice area, never "The Moritz Team". */}
        {lawyer ? (
          <EmailSignature
            signOff={t('signOff')}
            name={t('signature', { name: lawyer.name })}
            practice={t('signaturePractice', { title: lawyer.title })}
          />
        ) : null}
      </EmailBody>
    </div>
  );

  return (
    /*
     * A row in the receipt now, not a line of its own under it.
     *
     * It used to be a centred full-width control with a mail icon, sitting
     * two blocks below the reference it quotes. The confirmation was too tall
     * and this was one of the cheapest fixes in it: "a copy is on its way to
     * you" is a *property of the case*, in exactly the way Reference and
     * Status are, so it reads as the fifth row of the description list and
     * costs nothing of its own. Left-aligned, at the size of a value, because
     * that is what it now is.
     *
     * The icon went with the centring. In a description list a glyph in one
     * value and not the other four is decoration.
     *
     * A real ring, not just an underline (T34). It had
     * `focus-visible:underline focus-visible:outline-none`, and it already
     * underlines on hover, so a keyboard user landing on it saw the hover
     * state and nothing that said "this is where you are".
     */
    <button
      type="button"
      onClick={() =>
        onOpen({
          // Fixed, not generated: one case has one confirmation email, and
          // asking for it twice should return to the tab already open on it.
          id: 'reader_confirmation_email',
          name: subject,
          meta,
          body,
        })
      }
      className="focus-visible:outline-ring focus-visible:outline-solid group flex cursor-pointer items-center gap-1.5 rounded-[0.5rem] text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="text-foreground truncate">{MOCK_CLIENT_USER.email}</span>
      <span className="text-muted-foreground group-hover:text-foreground shrink-0 underline underline-offset-4 transition-colors">
        {t('read')}
      </span>
    </button>
  );
}

/**
 * A section label inside the email.
 *
 * `packages/ui` has a heading and two paragraph weights but nothing between
 * them, and "What happens next" needs to be findable by someone skimming on a
 * phone. Inline styles because this is email, where a class name is worthless.
 */
function EmailHeadingSmall({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '24px 0 8px',
        fontSize: 14,
        fontWeight: 600,
        color: '#111827',
      }}
    >
      {children}
    </p>
  );
}

/**
 * The sign-off: a person, their practice area, and the firm (item 18).
 *
 * A local helper for the same reason `EmailHeadingSmall` is one: `packages/ui`
 * has a heading and two paragraph weights, and a signature needs three lines
 * stacked tight enough to read as one block. Three `EmailText` paragraphs carry
 * their own margins and come out as three unrelated sentences with a gap
 * between each. Inline styles because this is email, where a class name is
 * worthless, and the colours are the same two greys the table above uses.
 */
function EmailSignature({
  signOff,
  name,
  practice,
}: {
  signOff: string;
  name: string;
  practice: string;
}) {
  return (
    <div style={{ margin: '24px 0 0' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{signOff}</p>
      <p
        style={{
          margin: '4px 0 0',
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
        }}
      >
        {name}
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
        {practice}
      </p>
    </div>
  );
}

/**
 * The brief, restated as a table.
 *
 * A table rather than a list because email clients are the last place on earth
 * where tables are the reliable layout primitive, and this is the part of the
 * email a client will forward to a colleague.
 *
 * An unconfirmed line is marked. Everything required is confirmed by the time a
 * case can be sent, so in practice this only ever fires on an optional value
 * the client left alone, which is exactly the line that could still be the
 * model's guess.
 */
function EmailFieldTable({
  lines,
  unconfirmedNote,
}: {
  lines: EmailLine[];
  unconfirmedNote: string;
}) {
  if (lines.length === 0) return null;

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ width: '100%', margin: '0 0 16px' }}
    >
      <tbody>
        {lines.map((line) => (
          <tr key={line.label}>
            <td
              style={{
                padding: '8px 12px 8px 0',
                fontSize: 13,
                color: '#6b7280',
                verticalAlign: 'top',
                width: '38%',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              {line.label}
            </td>
            <td
              style={{
                padding: '8px 0',
                fontSize: 13,
                color: '#111827',
                verticalAlign: 'top',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              {line.value}
              {line.confirmed ? null : (
                <span style={{ color: '#6b7280' }}> ({unconfirmedNote})</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
