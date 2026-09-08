/**
 * Curated lawyer personas shown in the onboarding right-hand brand panel while a
 * client moves through signup. Deliberately separate from the intake `Lawyer`
 * type (which is matter/specialty-shortlist shaped): this is a small, ambient
 * showcase, so it only carries what the panel renders — a photo, a one-sentence
 * tagline, and where they studied.
 */
export type OnboardingLawyer = {
  id: string;
  name: string;
  /** Practice-area role label, e.g. "Commercial Counsel". */
  title: string;
  /** Avatar fallback when the headshot is unavailable. */
  initials: string;
  /** Local headshot under /public/onboarding-lawyers. */
  imageUrl: string;
  /** One-sentence, client-facing introduction. */
  tagline: string;
  /** Where they graduated, e.g. "Harvard Law School, J.D.". */
  education: string;
};

export const ONBOARDING_LAWYERS: OnboardingLawyer[] = [
  {
    id: 'onboarding-lawyer-daniel',
    name: 'Daniel Dalla Vedova',
    title: 'Founding Head of Legal & COO',
    initials: 'DV',
    imageUrl: '/onboarding-lawyers/daniel-dalla-vedova.png',
    tagline: 'Harvard-JD, ex-Orrick and GC.',
    education: 'Harvard Law School, J.D.',
  },
  {
    id: 'onboarding-lawyer-kyle',
    name: 'Kyle Westaway',
    title: 'Technology Lawyer',
    initials: 'KW',
    imageUrl: '/onboarding-lawyers/kyle-westaway.png',
    tagline: 'Ex-professor at Harvard Law and Cornell.',
    education: 'Harvard Law School, J.D.',
  },
  {
    id: 'onboarding-lawyer-maxim',
    name: 'Max Van Eeckhout',
    title: 'Venture & M&A',
    initials: 'MV',
    imageUrl: '/onboarding-lawyers/maxim-van-eeckhout.png',
    tagline: 'Ex-Clifford Chance, Stripe and Monzo.',
    education: 'KU Leuven, LL.M.',
  },
  {
    id: 'onboarding-lawyer-aelita',
    name: 'Aélita Jacob',
    title: 'Commercial & Franchise',
    initials: 'AJ',
    imageUrl: '/onboarding-lawyers/aelita-jacob.png',
    tagline: 'Ex-Group General Counsel (20+ years).',
    education: 'Paris-Panthéon-Assas University, LL.M.',
  },
  {
    id: 'onboarding-lawyer-catarina',
    name: 'Catarina Milagre',
    title: 'Technology & Privacy',
    initials: 'CM',
    imageUrl: '/onboarding-lawyers/catarina-milagre.png',
    tagline: 'EU-lawyer, ex-BigLaw counsel.',
    education: 'Católica Global School of Law, LL.M.',
  },
];

/**
 * Additional lawyer personas surfaced only on the homepage "Your legal team"
 * showcase, where the row cross-fades through a larger roster. Kept separate
 * from `ONBOARDING_LAWYERS` so the onboarding brand panel and intake lawyer
 * lists keep their curated set unchanged.
 */
export const ADDITIONAL_TEAM_LAWYERS: OnboardingLawyer[] = [
  {
    id: 'onboarding-lawyer-eric',
    name: 'Eric',
    title: 'Venture Capital',
    initials: 'E',
    imageUrl: '/onboarding-lawyers/eric.png',
    tagline: 'Ex-Latham and Gunderson, VC.',
    education: 'NYU School of Law, J.D.',
  },
  {
    id: 'onboarding-lawyer-aaron',
    name: 'Aaron',
    title: 'Emerging Companies & VC',
    initials: 'A',
    imageUrl: '/onboarding-lawyers/aaron.png',
    tagline: 'Ex-Cooley, startups and VC.',
    education: 'Duke Law School, J.D.',
  },
  {
    id: 'onboarding-lawyer-mike',
    name: 'Mike',
    title: 'Corporate & M&A',
    initials: 'M',
    imageUrl: '/onboarding-lawyers/mike.png',
    tagline: 'Ex-Mayer Brown and Greenberg Traurig.',
    education: 'NYU School of Law, J.D.',
  },
  {
    id: 'onboarding-lawyer-enes',
    name: 'Enes',
    title: 'M&A & Private Equity',
    initials: 'E',
    imageUrl: '/onboarding-lawyers/enes.png',
    tagline: 'Ex-Baker McKenzie, M&A and PE.',
    education: 'Duke Law School, LL.M.',
  },
  {
    id: 'onboarding-lawyer-pamir',
    name: 'Pamir',
    title: 'Commercial & AI',
    initials: 'P',
    imageUrl: '/onboarding-lawyers/pamir.png',
    tagline: 'Ex-OpenAI counsel, Oxford-trained.',
    education: 'University of Oxford',
  },
];
