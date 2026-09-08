import type { GeneratedRuleTemplate } from '@/components/design/playbook-studio-admin/playbook-generation-data';

/**
 * Flat cell values for one generated playbook rule, keyed by the Pylon
 * tabular-playbook column schema. Position title is applied separately via
 * the sticky `name` column on the document row.
 */
export type GeneratedRowCells = Record<string, string>;

const CATEGORIES = [
  'Boilerplate',
  'Data / Security',
  'IP / Indemnity',
  'Liability',
  'Warranties',
  'Termination / Exit',
] as const;

/**
 * Maps a Playbook Studio demo rule template onto the Tabular Playbook columns
 * so the assistant generation stream can populate the grid cell-by-cell.
 */
export function mapGeneratedRuleToRow(
  template: GeneratedRuleTemplate,
  index: number,
): GeneratedRowCells {
  const guidance = template.guidanceNote ?? '';
  const lowerGuidance = guidance.toLowerCase();

  let severity = 'Material';
  if (
    lowerGuidance.includes('hard line') ||
    lowerGuidance.includes('do not accept') ||
    lowerGuidance.includes('escalate')
  ) {
    severity = 'Critical';
  } else if (
    lowerGuidance.includes('nice-to-have') ||
    lowerGuidance.includes('rarely negotiated')
  ) {
    severity = 'Acceptable';
  }

  const firstPositionParts = [template.preferredPosition];
  if (template.preferredLanguage) {
    firstPositionParts.push(`\n\nLanguage: ${template.preferredLanguage}`);
  }
  if (template.preferredComment) {
    firstPositionParts.push(`\n\nComment: ${template.preferredComment}`);
  }

  return {
    category: CATEGORIES[index % CATEGORIES.length]!,
    severity,
    standardMsaGuidelineSummary:
      template.preferredLanguage ?? template.preferredPosition,
    firstPosition: firstPositionParts.join(''),
    fallback1: template.fallbacks[0]?.position ?? '',
    fallback2: template.fallbacks[1]?.position ?? '',
    fallback3: template.fallbacks[2]?.position ?? '',
    walkAwayTrigger: lowerGuidance.includes('hard line')
      ? guidance
      : 'Escalate to legal if the counterparty rejects the preferred and fallback positions.',
    precedent:
      'Derived from the uploaded agreement(s) attached to the Playbook agent.',
    rationale: guidance,
    openQuestions: '',
  };
}

/**
 * Reveal order for progressive cell fill. Groups stream left-to-right so the
 * table fills like Studio’s card stream (metadata → position → fallbacks → notes).
 */
export const GENERATED_CELL_REVEAL_GROUPS: string[][] = [
  ['category', 'severity'],
  ['standardMsaGuidelineSummary'],
  ['firstPosition'],
  ['fallback1'],
  ['fallback2'],
  ['fallback3'],
  ['walkAwayTrigger', 'precedent'],
  ['rationale', 'openQuestions'],
];
