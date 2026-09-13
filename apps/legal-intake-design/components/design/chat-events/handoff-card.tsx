'use client';

import { Clock, GraduationCap, UserRound } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Card } from '@repo/ui/components/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { AVATAR_FRAMING } from '@/components/design/homepage-v2/legal-team';
import { lawyerById } from '@/components/design/new-case/lawyers';
import { schoolOf } from '@/lib/intake/credentials';

/**
 * "Handed to a person" — the one entry in a case thread that is not a bubble.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A CARD AND NOT TWO CHAT BUBBLES.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Talk to a person* is the flow's exit (V22, G6): the client has decided the
 * software is not enough, and what they write is put in front of a human rather
 * than answered by a model. That is categorically different from every other
 * turn in the thread, and rendering it as an ordinary client bubble followed by
 * an ordinary Moritz bubble loses all three parts of it:
 *
 * 1. **The acknowledgement lands in an AI bubble**, so the moment the client
 *    asked for a human reads as the software replying to them again. The one
 *    turn that is supposed to prove a person exists looks like more chatbot.
 * 2. **The promise scrolls away.** "Somebody reads this within four hours" is
 *    the only commitment the flow makes here, and as a sentence in a bubble it
 *    is unfindable ten messages later — which is exactly when the client wants
 *    to check what they were told.
 * 3. **On the case page it is invisible.** The intake transcript is copied onto
 *    the case as bubbles, so the exchange where a human got involved sits in the
 *    middle of the AI conversation looking identical to it. A client scanning
 *    their own case for "did anyone actually see this" finds nothing.
 *
 * So one object, carrying all three: what they wrote, who it went to, and what
 * they were told would happen.
 *
 * **`body` is quoted rather than ignored.** `paymentEvent` derives its copy
 * from the event kind and drops `body`; this does the opposite, because the
 * client's own sentence *is* the content. Showing it back is also the only
 * honest way to make the card checkable — the client can see exactly what was
 * passed on, rather than taking "we passed it on" on trust.
 *
 * **No countdown, no "replies in 2 minutes".** Same stance as the dialog that
 * produces this: the prototype has no rota, so the footer states the standing
 * promise and nothing that would have to be true of a particular person today.
 * A live timer here would be the vague-indicator failure the brief complains
 * about, placed at the one moment the client has already lost patience.
 *
 * **Two call sites, one rendering.** The card appears in the intake transcript
 * (where the client sends it) and in the case thread (where they find it
 * later), and those two surfaces disagree about copy: the intake is
 * `next-intl` under `intake.person`, and the case thread is hardcoded English
 * like every sibling in this directory. So the strings are an optional
 * `labels` prop with the case thread's English as the default, and the intake
 * passes its translations in. One component either way, because two would be
 * two descriptions of the same event that could drift apart.
 *
 * The footer states the promise without bolding the duration, unlike
 * `lawyer-assigned-card.tsx`. Bolding would mean splitting one sentence across
 * two message keys, and a sentence a translator cannot see whole is a sentence
 * that comes back wrong in the languages nobody on the team reads.
 */
export function HandoffCard({
  body,
  createdAt,
  lawyerId,
  labels,
  className,
}: {
  /** The client's own words. Quoted, not summarised. */
  body: string;
  /** ISO. Stamped when they sent it. */
  createdAt: string;
  /**
   * Roster id of whoever it was put in front of, when the matter was known.
   *
   * Absent is a real state rather than an error: the client can reach for the
   * exit before they have said what the matter is, and at that point no lead
   * has been resolved. The card then says a lawyer reads these without naming
   * one, which is the claim the data actually supports.
   */
  lawyerId?: string;
  /**
   * Translated copy, for the intake. Every field falls back to the case
   * thread's English, so the case-side call site passes nothing.
   *
   * `who` arrives already interpolated: the first name is inside the sentence
   * in English and may not be in another language, so the caller that owns the
   * message catalogue owns the placement too.
   */
  labels?: {
    title?: string;
    who?: string;
    whoUnknown?: string;
    promise?: string;
  };
  className?: string;
}) {
  const lawyer = lawyerId ? lawyerById(lawyerId) : null;
  const firstName = lawyer ? (lawyer.name.split(' ')[0] ?? lawyer.name) : null;

  const title = labels?.title ?? 'Handed to a person';
  const promise = labels?.promise ?? 'Somebody reads this within four hours.';
  const who =
    labels?.who ??
    (firstName
      ? `A lawyer like ${firstName} reads these, alongside your brief.`
      : undefined);
  const whoUnknown =
    labels?.whoUnknown ?? 'A lawyer reads these, alongside your brief.';

  const sentAt = new Date(createdAt);
  const time = Number.isNaN(sentAt.getTime())
    ? null
    : sentAt.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });

  return (
    <div className={cn('flex justify-center py-1', className)}>
      <Card className="w-full max-w-md gap-0 overflow-hidden py-0 shadow-none">
        {/*
         * The label strip. This is the part that does the differentiating: a
         * reader scanning the thread sees one row that is not a bubble and is
         * not the same colour as one, and the words on it say what happened.
         */}
        <div className="border-border/60 text-muted-foreground flex items-center gap-1.5 border-b px-4 py-2 text-xs">
          <UserRound aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="text-foreground font-medium">{title}</span>
          {time ? (
            <>
              <span aria-hidden="true" className="text-foreground/25">
                &middot;
              </span>
              <span className="tabular-nums">{time}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 p-4">
          {/*
           * Their sentence, back to them. `blockquote` with a rule rather than
           * a bubble, so it reads as a record of what was sent rather than as
           * another message in the conversation.
           */}
          <blockquote className="border-primary/25 text-foreground whitespace-pre-line border-s-2 ps-3 text-sm/6">
            {body}
          </blockquote>

          {lawyer && firstName ? (
            <div className="flex items-start gap-3">
              <Avatar
                className={cn(
                  'size-9 shrink-0 overflow-hidden',
                  lawyer.imageUrl
                    ? 'border-border/60 border'
                    : 'ring-primary/20 ring-1',
                )}
              >
                <AvatarImage
                  src={lawyer.imageUrl}
                  alt={lawyer.name}
                  className={AVATAR_FRAMING[lawyer.id] ?? 'object-cover'}
                />
                <AvatarFallback className="bg-primary/10 text-foreground text-xs font-medium tracking-wide">
                  {lawyer.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-foreground font-serif text-[15px] font-semibold leading-tight tracking-tight">
                    {lawyer.name}
                  </p>
                  {lawyer.education ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="text-foreground/25 text-xs"
                      >
                        &middot;
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] leading-snug">
                        <GraduationCap
                          aria-hidden="true"
                          className="size-3 shrink-0"
                        />
                        {schoolOf(lawyer.education)}
                      </span>
                    </>
                  ) : null}
                </div>
                {who ? (
                  <p className="text-muted-foreground mt-1 text-[11.5px] leading-relaxed">
                    {who}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            /* No matter yet, so no lead. Claim only what is true. */
            <p className="text-muted-foreground text-[11.5px] leading-relaxed">
              {whoUnknown}
            </p>
          )}
        </div>

        {/*
         * The standing promise, in the footer strip its sibling card uses for
         * the same job. Pinned to the card so it stays attached to the message
         * it is a promise about, however far the thread runs on.
         */}
        <div className="text-muted-foreground bg-muted/40 flex items-center gap-1.5 px-4 py-2.5 text-xs">
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{promise}</span>
        </div>
      </Card>
    </div>
  );
}
