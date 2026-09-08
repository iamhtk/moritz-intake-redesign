// Mirrors `TEMPLATE_SECTION_TAG_VALUES` / `TemplateSectionTag` from
// `@repo/temporal-shared`. Inlined here so the playground stays self-contained.

export const TEMPLATE_SECTION_TAG_VALUES = [
  'NONE',
  'KEEP',
  'REWRITE',
  'PROMPT',
] as const;

export type TemplateSectionTag = (typeof TEMPLATE_SECTION_TAG_VALUES)[number];
