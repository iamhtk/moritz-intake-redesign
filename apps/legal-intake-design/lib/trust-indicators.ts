/**
 * What Moritz actually claims about itself, audited off moritzlegal.com.
 *
 * Every string here is verbatim from a page listed in the site's own sitemap,
 * and carries the path it came from. That provenance is the point of the
 * module: a trust indicator is the one kind of copy where being approximately
 * right is worse than saying nothing, and "200+ teams" is checkable in a way
 * that "trusted by many teams" is not.
 *
 * It exists because the opposite was already in the repo. `en.json` carries a
 * `dashboard.client.homepageV2.trustBar` block claiming "500+ Matters handled"
 * and a "4.9/5 Client rating". Neither number appears anywhere on the real
 * site, and no component renders them, so a pair of invented statistics has
 * been sitting in the copy file waiting for someone to wire up. They are
 * replaced by the audited set below rather than kept beside it.
 *
 * **What is deliberately not here.** The Fortune 500 case study numbers (77%
 * lower legal spend, $917K to $213K, 13 days to 20hrs) and the "$2BN in assets
 * protected within the hour" line are real and published, and they are one
 * client each. On a marketing page that is understood; inside the product,
 * shown to a client about to submit their own matter, a single client's outcome
 * reads as a promise about theirs. The animated counters on the homepage and
 * the About page are also left out, because their values are filled in by
 * script and the served HTML only ever says `0`, so there is nothing to quote.
 */

export type TrustIndicator = {
  /** Verbatim. Not to be tightened, rounded or reworded. */
  text: string;
  /** Path on moritzlegal.com where it is published. */
  source: string;
};

/**
 * Scale, as the site puts it.
 *
 * Two spellings of this line ship on the homepage, "operations teams" and
 * "operational teams". The second is the one in the hero.
 */
export const TRUSTED_BY: TrustIndicator = {
  text: 'Trusted by 200+ in-house legal and operational teams',
  source: '/',
};

export const REACH: TrustIndicator = {
  text: 'BigLaw expertise in 44 countries.',
  source: '/',
};

export const BACKING: TrustIndicator = {
  text: 'Backed by Y Combinator',
  source: '/',
};

/**
 * The certifications, from the security page.
 *
 * Named exactly as they are certified. "SOC 2" and "SOC 2 Type 2" are not the
 * same claim, and shortening the second to the first would be understating a
 * real audit; abbreviating in the other direction would be a lie.
 */
export const CERTIFICATIONS: readonly TrustIndicator[] = [
  { text: 'SOC 2 Type 2', source: '/security' },
  { text: 'ISO 27001', source: '/security' },
  { text: 'GDPR compliant', source: '/security' },
];

/**
 * The one that matters most at the moment a client uploads a contract.
 *
 * Shortened from the site's "Regulated law firm, not a software vendor.
 * Privilege attaches to your work, and the security standards behind it are
 * documented in full." The clause kept is the claim; the rest is the argument
 * for it, which belongs on a marketing page rather than under a drop zone.
 */
export const PRIVILEGE: TrustIndicator = {
  text: 'A regulated law firm, so privilege attaches to your work.',
  source: '/security',
};

/**
 * The same claim as a label, for a strip where a sentence will not fit.
 *
 * A label rather than a paraphrase: the site's own words are "protecting
 * attorney-client privilege at every step", and "Attorney-client privilege"
 * names that without adding or softening anything. Sitting in a row of
 * certifications it reads as what it is, a property of working with a law firm
 * rather than a software vendor.
 */
export const PRIVILEGE_LABEL: TrustIndicator = {
  text: 'Attorney-client privilege',
  source: '/security',
};

/**
 * Who stands behind the output. The strongest phrasing the site uses, from the
 * how-it-works page, because it names accountability rather than review.
 */
export const ATTORNEY_REVIEW: TrustIndicator = {
  text: 'A named, licensed Moritz lawyer reviews every deliverable and stands behind it.',
  source: '/how-it-works',
};

/** Every indicator, for the test that checks none of them drift. */
export const ALL_TRUST_INDICATORS: readonly TrustIndicator[] = [
  TRUSTED_BY,
  REACH,
  BACKING,
  ...CERTIFICATIONS,
  PRIVILEGE,
  PRIVILEGE_LABEL,
  ATTORNEY_REVIEW,
];
