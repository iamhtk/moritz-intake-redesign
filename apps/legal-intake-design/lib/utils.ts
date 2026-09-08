export { cn } from '@repo/ui/lib/utils';

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** An ISO country code as a reader would say it ("DE" → "Germany"). */
export function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function actorColorClass(
  actor: 'client' | 'opposing' | 'legal' | 'admin' | 'ai',
) {
  switch (actor) {
    case 'client':
      return 'bg-[var(--actor-client)] text-white';
    case 'opposing':
      return 'bg-[var(--actor-opposing)] text-white';
    case 'legal':
      return 'bg-[var(--actor-legal)] text-white';
    case 'admin':
      return 'bg-[var(--actor-admin)] text-white';
    case 'ai':
      return 'bg-[var(--actor-ai)] text-white';
  }
}

export function generateId(): string {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const formatted =
    value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1);

  return `${formatted} ${units[exponent]}`;
};
