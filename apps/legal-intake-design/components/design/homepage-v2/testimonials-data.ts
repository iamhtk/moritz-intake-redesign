/**
 * What Moritz's actual customers said, taken from moritzlegal.com/customers.
 *
 * All six quotes on that page, verbatim. In a TS module rather than in
 * `en.json` for the same reason `onboarding-lawyers.ts` keeps its taglines
 * here: these are a named third party's own words, and a copy file is a place
 * where strings get tightened, reworded and translated. A testimonial that has
 * been improved is not a testimonial. Only the section heading is copy.
 *
 * Two consequences of that worth writing down, so neither reads as an
 * oversight later:
 *
 * - **Hector's quote contains an em dash.** The intake bans those and enforces
 *   it in `no-dashes.test.ts`, but that rule is deliberately scoped to
 *   `messages.intake` because Moritz's wider product uses them throughout. A
 *   real quote keeps its punctuation regardless.
 * - **The company marks are theirs too.** Five of the six are published as
 *   logos on that page, mapped one to one by their `alt` text, and they are
 *   downloaded to `/public/customer-logos` rather than hotlinked off
 *   `framerusercontent.com`: a prototype that goes blank when someone else's
 *   CDN changes a path is not a prototype. Resized to 128px, 52KB for the set.
 *
 * Crafted is the exception and worth knowing about. Moritz publishes no logo
 * for them; the image in that slot is a photograph of Maiuran himself. A
 * headshot among five company marks reads as a mistake in a row of identical
 * frames, so Crafted gets its name set as a wordmark in the same frame instead.
 * The photo is deliberately not in the repo.
 *
 * No customer faces anywhere, for the same reason `lawyers.ts` refuses one for
 * the employment lead: every headshot in this app is already cast as somebody
 * else, and borrowing one for a named real customer would put a stranger's face
 * on that person's words, in the one section whose entire job is to be believed.
 */

export type Testimonial = {
  id: string;
  /** Verbatim. Do not edit for length, tone or punctuation. */
  quote: string;
  /** As published: first names only, which is how the site attributes them. */
  name: string;
  /** e.g. "YC-founder", "Head of Legal". */
  role: string;
  company: string;
  /**
   * The company's own mark, under `/public/customer-logos`, or `null` where
   * Moritz publishes none. A `null` mark is set as a wordmark, not skipped.
   */
  logo: string | null;
};

/**
 * Ordered for the rail, not as published.
 *
 * Every tile is the same width and the row is as tall as its tallest, so the
 * quotes' 84-to-215-character spread is a layout problem: in published order
 * the two longest sit next to each other, which puts the deepest part of the
 * rail in one place and leaves the rest looking empty. Alternating long and
 * short spreads the weight along the travel. Order is layout; the words are
 * untouched.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 'chetan-rhizome',
    quote:
      'Moritz delivered our MSA the same day for $1k. Fast, practical, and founder-friendly.',
    name: 'Chetan',
    role: 'YC-founder',
    company: 'Rhizome AI',
    logo: '/customer-logos/rhizome-ai.png',
  },
  {
    id: 'hector-didit',
    quote:
      "Moritz's Harvard-educated, ex-Fenwick lawyer joined a call the same day to help us structure employee equity — at a fraction of what our former outside counsel quoted.",
    name: 'Hector',
    role: 'CFO',
    company: 'Didit',
    logo: '/customer-logos/didit.png',
  },
  {
    id: 'peter-corgi',
    quote:
      'Moritz handles our routine contracts and procurement work in hours. I finally have time to focus on work that actually matters.',
    name: 'Peter',
    role: 'Head of Legal',
    company: 'Corgi',
    logo: '/customer-logos/corgi.png',
  },
  {
    id: 'pavan-ritivel',
    quote:
      'Got a contractor agreement in 2 hours for $500. This is what legal should feel like.',
    name: 'Pavan',
    role: 'YC-founder',
    company: 'Ritivel',
    logo: '/customer-logos/ritivel.png',
  },
  {
    id: 'maiuran-crafted',
    quote:
      'Moritz delivered our MSA in under 4 hours and helped us close an enterprise client. As an AI-native agency ourselves, we needed counsel that moves at our speed, Moritz is it.',
    name: 'Maiuran',
    role: 'Co-founder',
    company: 'Crafted',
    logo: null,
  },
  {
    id: 'vlad-voygr',
    quote:
      'Moritz drafted our industry tailored terms of use same-day for $1,200. It helped us close a Forbes Global 2000 customer.',
    name: 'Vlad',
    role: 'YC-founder',
    company: 'VOYGR',
    logo: '/customer-logos/voygr.png',
  },
];
