export const CASE_INTAKE_EMAIL =
  'i.pYZenIA0SycwPzLmKFao1Q.b0j06WNLXgK_@mail.arcline-ai.com';

const CASE_INTAKE_SUBJECT = 'New case';

const CASE_INTAKE_BODY_LINES: readonly string[] = [
  'Hi Moritz,',
  '',
  "I'd like to start a new case. I've answered the prompts below where I can — skip anything that doesn't apply, the notes in (parens) are just hints to help you fill it in.",
  '',
  '—',
  '',
  "What's going on?",
  "(A short summary in your own words — what happened, and why you're reaching out. No need to be polished or get every detail right; we can dig in later.)",
  '· ',
  '',
  'When did this happen?',
  '(Rough dates are fine — "a few weeks ago" works. Flag any deadlines, hearings, or letters with response dates.)',
  '· ',
  '',
  "Who's involved?",
  '(Other parties, companies, or people — and how they relate to you. e.g. "my landlord (Acme Properties)" or "former employer". Skip names if you\'d rather share them later.)',
  '· ',
  '',
  'Any documents?',
  "(Drag contracts, emails, screenshots, photos, or PDFs straight into this email — anything that might be relevant. Don't worry about organising them.)",
  '· ',
  '',
  'What would a good outcome look like?',
  '(What you\'d ideally want to happen, even if it feels far off — e.g. "get my deposit back", "understand my options". Helps me focus on what actually matters to you.)',
  '· ',
  '',
  'Anything else I should know?',
  '(Constraints, sensitivities, or context that doesn\'t fit above — e.g. "please don\'t email me at work", or "I\'ve already spoken to a lawyer".)',
  '· ',
  '',
  '—',
  '',
  'Thanks,',
  '',
  '',
  "P.S. This intake address is personal to you — please don't forward it. If someone else needs to share case info, ask them to send it to you first.",
];

export function buildCaseIntakeMailto(): string {
  const subject = encodeURIComponent(CASE_INTAKE_SUBJECT);
  // RFC 2368: line breaks in the body must be CRLF, percent-encoded.
  const body = encodeURIComponent(CASE_INTAKE_BODY_LINES.join('\r\n'));
  return `mailto:${CASE_INTAKE_EMAIL}?subject=${subject}&body=${body}`;
}
