export type CellBadgeVariant = 'accent' | 'success' | 'warning' | 'destructive';

/*
 * Badge variants for enum / yes-no cells. Plain enums such as Category classify
 * a row rather than judge it, so they take the `accent` chip — a hue of its own,
 * well clear of the traffic light. Severity is a ranked scale and so reads as
 * red / amber / green; yes-no borrows the same green / red for polarity.
 */
const SEVERITY_BADGE_VARIANTS: Record<string, CellBadgeVariant> = {
  critical: 'destructive',
  material: 'warning',
  acceptable: 'success',
};

export function getBadgeVariantForValue(
  value: string,
  columnType: string,
  columnKey?: string,
): CellBadgeVariant {
  const normalizedValue = value.toLowerCase().trim();

  if (columnType === 'yes-no') {
    if (normalizedValue === 'yes') return 'success';
    if (normalizedValue === 'no') return 'destructive';
    return 'accent';
  }

  if (columnKey === 'severity') {
    return SEVERITY_BADGE_VARIANTS[normalizedValue] ?? 'accent';
  }

  return 'accent';
}

/**
 * The chips the grid shows for a cell, or `null` for the column types that
 * render as plain text. Enum and yes/no columns hold a single choice, so this
 * is at most one chip.
 */
export function getCellBadges(
  value: string,
  columnType: string,
  columnKey?: string,
): { label: string; variant: CellBadgeVariant }[] | null {
  const label = value.trim();
  const rendersBadges =
    (columnType === 'enum' || columnType === 'yes-no') && label !== '';
  if (!rendersBadges) return null;

  return [
    { label, variant: getBadgeVariantForValue(label, columnType, columnKey) },
  ];
}
