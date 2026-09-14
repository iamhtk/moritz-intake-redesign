/**
 * Ranking for the command palette (task K1).
 *
 * Ported near-verbatim from the Moritz-admin source, which is the one piece of
 * that palette that is entirely generic: it knows nothing about matters or
 * quotes, only about how well a string matches and what *kind* of thing it is.
 *
 * `cmdk` calls this for every item on every keystroke and sorts by the number
 * it returns; `0` hides the row. Two ideas are doing the work:
 *
 * 1. **Where the match landed matters more than that it matched.** An exact hit
 *    beats a prefix, which beats a word-start inside the string, which beats a
 *    match buried in the middle. Typing `nor` should put *Northwind* above
 *    *Senior Counsel*, and substring-only scoring puts them level.
 * 2. **Kind breaks the tie.** A case the reader is looking for outranks a
 *    destination that happens to contain the same letters, because the
 *    destinations are always there and the entity is what they searched for.
 *    Without this the nav swamps the list on short queries: every section name
 *    is short, so every section matches early and scores well.
 */

/**
 * What a row *is*, passed to `cmdk` as the first keyword so this function can
 * read it back. Ranked in this order: entity, action, filter, nav.
 */
export type RankKind = 'entity' | 'action' | 'filter' | 'nav';

/** How much each kind is trusted, once the match quality is known. */
const KIND_WEIGHT: Record<RankKind, number> = {
  entity: 1.25,
  action: 1,
  filter: 0.45,
  nav: 0.35,
};

/** Where a word can start: whitespace, and the separators our labels use. */
const WORD_BOUNDARY = /[\s·,/\-_]+/;

/**
 * A score for one row against the current query.
 *
 * `0` means "hide this row". An empty query returns `1` for everything, which
 * is what leaves the unfiltered palette in its authored group order rather than
 * re-sorting it into a ranking nobody asked for.
 */
export function commandFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;

  const haystack = value.toLowerCase();
  const kind = (keywords?.[0] as RankKind | undefined) ?? 'action';

  let score: number;
  if (haystack === query) {
    score = 1;
  } else if (haystack.startsWith(query)) {
    score = 0.95;
  } else if (
    haystack.split(WORD_BOUNDARY).some((word) => word.startsWith(query))
  ) {
    score = 0.9;
  } else if (haystack.includes(query)) {
    score = 0.7;
  } else {
    return 0;
  }

  return score * (KIND_WEIGHT[kind] ?? KIND_WEIGHT.action);
}
