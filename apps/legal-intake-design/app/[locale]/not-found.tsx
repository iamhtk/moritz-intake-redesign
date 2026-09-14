import { RouteNotFound } from '@/components/design/route-states/route-state';

/**
 * Unmatched URLs and every `notFound()` call under `[locale]`.
 *
 * Note this also catches the locale layout's own `notFound()` for an
 * unrecognised locale, which is why the copy talks about the address rather
 * than about a missing record.
 */
export default function LocaleNotFound() {
  return <RouteNotFound />;
}
