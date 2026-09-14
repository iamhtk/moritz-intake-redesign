import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * No avatar renders `AvatarImage` conditionally.
 *
 * Radix's `Avatar` root holds the image loading status in state and nothing
 * resets it when the image child unmounts. So an avatar that swaps
 * `<AvatarImage>` out for `null` — the obvious way to express "this person has
 * no photograph" — leaves the root believing an image is loaded, and
 * `AvatarFallback` renders nothing while it does. The result is a blank circle
 * where the initials should be, and only when that same avatar had shown a
 * photograph first, which is what made it look intermittent: the intake's lead
 * lawyer follows the matter type, and the employment lead is the one partner
 * with no headshot (see `components/design/new-case/lawyers.ts`).
 *
 * The wrappers now pass an absent `src` through as `''`, which the primitive
 * resolves to `error` with no request, so the correct usage is unconditional
 * and this is the check that keeps it that way. A source scan rather than a
 * component test because this project's vitest runs without a DOM, and because
 * the defect is a usage pattern rather than a behaviour of any one component.
 *
 * It lives at the root of `lib` rather than beside a component because the
 * suite's include glob is `lib/**`, and because the rule is not one surface's.
 */

const ROOTS = [
  join(process.cwd(), 'components'),
  join(process.cwd(), '..', '..', 'packages', 'ui', 'src', 'components'),
];

function tsxFilesIn(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...tsxFilesIn(path));
    else if (entry.name.endsWith('.tsx')) found.push(path);
  }
  return found;
}

/**
 * A `<AvatarImage` that some expression decided to render, in either JSX form:
 * `{x ? (<AvatarImage` / `{x ? <AvatarImage` and `{x && (<AvatarImage`.
 *
 * Whitespace and newlines between the operator and the tag are why this is a
 * regex over the source rather than an `includes`.
 */
const CONDITIONAL_IMAGE =
  /(\?|&&)\s*\(?\s*(\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*<AvatarImage\b/;

const files = ROOTS.flatMap(tsxFilesIn);

describe('avatar fallbacks', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('finds the avatar components it is about', () => {
    expect(files.some((path) => path.endsWith('avatar.tsx'))).toBe(true);
    expect(
      files.filter((path) =>
        readFileSync(path, 'utf8').includes('<AvatarImage'),
      ).length,
    ).toBeGreaterThan(5);
  });

  it('never renders AvatarImage behind a condition', () => {
    const offenders = files.filter((path) =>
      CONDITIONAL_IMAGE.test(readFileSync(path, 'utf8')),
    );
    expect(offenders.map((path) => path.replace(process.cwd(), '.'))).toEqual(
      [],
    );
  });
});

/**
 * Every avatar that crops with `AVATAR_FRAMING` also clips.
 *
 * The foundation `Avatar` root does not clip, deliberately: its own comment
 * explains that the shape lives on the image and the fallback so a corner
 * `AvatarBadge` can sit proud of the edge. `AVATAR_FRAMING` crops the lawyer
 * headshots with a `scale`, and on an unclipped root that scale paints outside
 * the circle.
 *
 * It hid for as long as it did because it is proportional to the zoom. Most of
 * the map is at 1.3 or below, where the spill is a few pixels off the rim and
 * reads as a tight crop; Eric is at `scale-[2.2]`, so his photograph rendered
 * at roughly twice the avatar and covered the name beside it. One face looked
 * broken and nine looked fine, which is the least diagnosable version of a
 * layout bug.
 */
describe('framed avatars', () => {
  /** Each `<Avatar …>…</Avatar>` block in a file, with its opening tag. */
  function avatarBlocks(source: string) {
    return [...source.matchAll(/<Avatar(\s[^>]*)?>([\s\S]*?)<\/Avatar>/g)].map(
      (match) => ({ open: match[1] ?? '', body: match[2] ?? '' }),
    );
  }

  const framed = files
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
    .filter(({ source }) => source.includes('AVATAR_FRAMING'));

  it('finds the avatars that use the framing map', () => {
    expect(framed.length).toBeGreaterThanOrEqual(2);
  });

  it('clips every avatar whose image is scaled by the framing map', () => {
    const offenders: string[] = [];
    for (const { path, source } of framed) {
      for (const block of avatarBlocks(source)) {
        if (!block.body.includes('AVATAR_FRAMING')) continue;
        if (!block.open.includes('overflow-hidden')) {
          offenders.push(path.replace(process.cwd(), '.'));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
