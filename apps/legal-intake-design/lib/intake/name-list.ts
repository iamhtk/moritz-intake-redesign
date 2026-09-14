/**
 * Naming a few things and admitting the rest (L7, L10).
 *
 * Legora's habit is a count on everything, and — the part that is actually
 * novel — an explicit `+n` wherever a list is cut short. That second half is
 * the one worth copying. Silent truncation is the same defect as a vague
 * spinner wearing different clothes: the screen knows a number and shows
 * something that could mean any number, so the client cannot tell whether they
 * are looking at all of it.
 *
 * "and 4 more" is a *smaller* claim than three names and an ellipsis, and it is
 * the only version the reader can tell is complete.
 *
 * Both functions here are pure string work with no opinion about copy: the cap
 * is a layout decision and the words are in `en.json`.
 */

/**
 * Take the first `limit` names and count what is left.
 *
 * @param limit how many to name. Three, at every call site so far, and that is
 * a readability number rather than a technical one: three items is the most a
 * sentence can carry before the reader stops reading it as a sentence and
 * starts scanning it as a list.
 *
 * A `limit` of zero or less names nothing and counts everything, which is a
 * legitimate thing to ask for (a pure "n things" phrasing) rather than an
 * error.
 */
export function capNames(
  names: readonly string[],
  limit: number,
): { named: string[]; more: number } {
  if (limit <= 0) return { named: [], more: names.length };
  return {
    named: [...names.slice(0, limit)],
    more: Math.max(0, names.length - limit),
  };
}

/**
 * "Harvard, Oxford and NYU" — a plain join, no Oxford comma.
 *
 * English only, deliberately. This app ships one locale and `messages/en.json`
 * is the only message file, so a formatter keyed off the request locale would be
 * correct for a second language and a fiction until there is one.
 * `Intl.ListFormat` is the swap when that day comes, and it is a two-line
 * change confined to this function.
 *
 * Lived as a local helper inside `sent-confirmation.tsx` until a second caller
 * needed it. Two copies of a joiner is how one surface ends up with an Oxford
 * comma and the other without.
 */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
