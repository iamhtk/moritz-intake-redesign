import { ShieldCheck } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { CERTIFICATIONS, PRIVILEGE_LABEL } from '@/lib/trust-indicators';

/**
 * What protects the thing the client is about to hand over.
 *
 * Four claims, all audited from moritzlegal.com; see `lib/trust-indicators.ts`
 * for the provenance of each and for the ones deliberately left out.
 *
 * **Two surfaces, because this row has already moved once.** It was built to
 * sit on the page's white, directly under the composer, and it now lives in the
 * footer of the gold "how this works" panel instead (see `how-it-works.tsx`).
 * The treatment cannot simply travel with it: the same hairline that reads as a
 * credential on white reads as the loudest linework in the box on a warm tint,
 * and the panel draws its own rules at `foreground/10`. So `surface` picks the
 * treatment and the claims stay in one component. `'page'` has no call site
 * today and is kept because moving back is a one-word change.
 *
 * ---
 *
 * **`surface="page"` — one solid anchor, three hairline pills, and the split is
 * the whole idea.**
 * Privilege is not a certification. It is a consequence of Moritz being a
 * regulated law firm, and it is the one claim no software vendor can make at
 * all: SOC 2, ISO 27001 and GDPR are things any competent SaaS company has. So
 * the differentiating claim takes the solid mark, in the brand's own `primary`
 * ink with the shield the rest of the app already uses for security, and the
 * three auditable facts sit beside it as evidence. "Here is the point, here is
 * the proof" is a sentence; four identical badges are a list.
 *
 * **Why not four solid pills**, which was the obvious alternative. The
 * composer's send control is itself a solid `primary` circle sitting a few
 * pixels above this row, so four black pills underneath would spend the darkest
 * ink on the screen on compliance badges rather than on the action the client is
 * meant to take. One accent near one button reads as an accent; five dark
 * objects in a hairline field read as a checkout page's trust seals, which is
 * the single association a law firm should avoid.
 *
 * **The border is `/40`, not the `/25` it started at.** At a quarter the pills
 * read as outlines on white and, drawn in `muted-foreground` as they were
 * before that, as disabled. A credential has to look like a statement. Black
 * ink and a hairline you can actually see is as far as this needs to go; the
 * next notch, if it is ever wanted, is a `bg-foreground/[0.03]` fill to make
 * them objects rather than outlines.
 *
 * **Wrap-safe by construction.** The first version was middot-separated flex
 * items sharing a row with the reassurance line; with no width for both it
 * wrapped a single item per line and left a column of orphaned separators.
 * Whole pills wrap into a tidy second row and need no separators at all.
 *
 * ---
 *
 * **`surface="gold"` — one line of type, and not a badge in sight.**
 *
 * The first version of this put the white treatment's pills into the panel with
 * the fills and tracking softened, and it looked exactly like what it was:
 * something carried in from somewhere else. The panel has no other boxed object
 * in it — three serif numerals, three titles, three sentences and a hairline —
 * so four small rounded rectangles were the only objects on a surface made of
 * type, which is why they read as inserted rather than as the closing line they
 * are meant to be. Badge language is also the wrong register for the claim: a
 * stamp is what a checkout page uses to borrow credibility it has not earned,
 * and a law firm stating that privilege attaches is not borrowing anything.
 *
 * So the row becomes a sentence. Same size and colour as the division line
 * directly above it, middot-separated, with the claim in the panel's own ink and
 * the three audited facts muted behind it — the point, then the proof, said with
 * weight instead of with fill. Read down, the footer is now one small paragraph
 * of two lines rather than a sentence with a badge row stapled under it.
 *
 * **The shield is the one mark kept.** It is not decoration: it is what makes
 * the line findable as the security line when the client's eye is skimming for
 * exactly that, and one 14px glyph is nothing like four boxes. It is also
 * already the app's security mark, so it costs no new vocabulary.
 *
 * **No separate wrapping logic, deliberately.** The certifications are one text
 * node with middots in it, so a narrow panel wraps them the way it wraps any
 * other sentence. The earlier concern about orphaned separators came from a
 * flex row of items *with* separators as siblings; there are no siblings here.
 */
export function TrustStrip({
  className,
  surface = 'page',
}: {
  className?: string;
  /** Which treatment to draw. See the two blocks above. */
  surface?: 'page' | 'gold';
}) {
  if (surface === 'gold') {
    return (
      <div
        role="group"
        aria-label="Security and confidentiality"
        /*
         * `items-baseline` rather than `items-center`: this is a line of text
         * with a glyph in it, and centring would float the shield off the
         * baseline the words sit on as soon as the certifications wrap.
         */
        className={cn(
          'text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] leading-relaxed',
          className,
        )}
      >
        <span className="text-foreground inline-flex items-baseline gap-1.5 font-medium">
          <ShieldCheck
            aria-hidden="true"
            /*
             * `translate-y-px` because a stroked icon's optical centre sits a
             * shade above the x-height it is being aligned to.
             */
            className="size-3.5 shrink-0 translate-y-px opacity-55"
            strokeWidth={2}
          />
          {PRIVILEGE_LABEL.text}
        </span>

        {/*
         * A leading middot, so the three facts read as support for the claim
         * rather than as a fourth item in a list of four.
         */}
        <span>
          {'· '}
          {CERTIFICATIONS.map((certification) => certification.text).join(
            ' · ',
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      /*
       * One label for the set. Read item by item a screen reader announces four
       * disconnected fragments; named as a group they are what they are.
       */
      role="group"
      aria-label="Security and confidentiality"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      <span className="bg-primary text-primary-foreground inline-flex h-5 items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[10px] font-medium uppercase leading-none tracking-[0.08em]">
        {/*
         * 16px, up from 12px, in a pill whose height is now fixed rather than
         * derived.
         *
         * At 12px a shield at this stroke weight is a shape rather than a
         * symbol: the notch at the bottom and the check inside it are below the
         * size where either resolves, so it read as a generic blob and stopped
         * doing the one job it has, which is to say "security" before anything
         * is read.
         *
         * Raising it would normally raise the pill, because the icon was the
         * tallest thing in the box: `py-1` plus a 12px icon is 20px, and the
         * 10px text never touched the sides. So the height is pinned at `h-5`,
         * exactly what it measured before, and the icon grows into the slack
         * the text was leaving. Nothing moves except the glyph.
         */}
        <ShieldCheck
          aria-hidden="true"
          className="size-4 shrink-0 opacity-80"
          strokeWidth={2}
        />
        {PRIVILEGE_LABEL.text}
      </span>

      {CERTIFICATIONS.map((certification) => (
        <span
          key={certification.text}
          /*
           * The same `h-5`, which also fixes something that was already
           * slightly wrong: `py-1` around 10px of text made these 18px while
           * the icon made the anchor 20px, so the row held two pill heights
           * two pixels apart. Centred in a flex row that reads as a wobble
           * rather than as a decision.
           */
          className="border-foreground/40 text-foreground inline-flex h-5 items-center rounded-full border px-2.5 text-[10px] font-medium uppercase leading-none tracking-[0.08em]"
        >
          {certification.text}
        </span>
      ))}
    </div>
  );
}
