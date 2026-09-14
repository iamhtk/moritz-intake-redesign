import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The third guard: one type scale, as something that fails the build.
 *
 * There was a colour guard and a radius guard and no type guard, and type is
 * the one that drifted. The intake had **sixteen** distinct sizes in it —
 * `7px`, `9px`, `10px`, `10.5px`, `11px`, `11.5px`, `12px`, `13px`, `15px`,
 * `19px`, `25px` and five named ones — because `text-[11.5px]` is always
 * available and always looks defensible on the one screen you are looking at.
 * Ninety-three arbitrary values, none of them a decision anybody would defend
 * as a scale.
 *
 * Two separate problems, and the half-pixel sizes were only the second one:
 *
 * 1. **Forty-five of those sites rendered below 12px**, which is an
 *    accessibility failure before it is a taste one. `/foundations/typography`
 *    has no step under `text-xs`, so there was never a sanctioned way to write
 *    them.
 * 2. **Eleven sizes where the foundations have eight** is not a scale, it is a
 *    habit. Two steps 0.5px apart cannot be told apart on screen and cannot be
 *    chosen between on purpose.
 *
 * So: arbitrary sizes fail outright. The scale is Tailwind's named one, which
 * is what `/foundations/typography` and every foundations component already
 * use — `text-sm` on the button, `text-xs` on the badge, `text-base` on the
 * card, `text-4xl` on the specimen. Nothing new to learn and nothing to keep
 * in step with a second document.
 *
 * Scoped to the four directories the intake actually renders from, which is
 * the scope `check-colours.sh` had to learn the hard way — `intake-v2` alone
 * reported a clean flow while the composer, the message rows and the trust
 * strip went unchecked.
 */

const ROOT = process.cwd();

const DIRS = [
  'components/design/intake-v2',
  'components/design/intake/chat',
  'components/design/new-case',
  'components/shared',
];

/**
 * The foundations scale, and nothing else.
 *
 * `text-xs` (12px) is the floor on purpose: it is the smallest step the
 * foundations define and the smallest size WCAG-adjacent guidance tolerates
 * for body text, and those two agreeing is the reason there is no argument to
 * have here.
 */
const ALLOWED = new Set([
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
]);

/** Strip comments: a size named in prose is documentation, not type. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (name.endsWith('.tsx') || name.endsWith('.ts')) out.push(path);
    }
  };
  walk(join(ROOT, dir));
  return out;
}

type Hit = { file: string; line: number; token: string };

function scan(pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const dir of DIRS) {
    for (const path of sourceFiles(dir)) {
      const lines = code(readFileSync(path, 'utf8')).split('\n');
      lines.forEach((text, index) => {
        for (const match of text.matchAll(pattern)) {
          hits.push({
            file: path.slice(ROOT.length + 1),
            line: index + 1,
            token: match[0],
          });
        }
      });
    }
  }
  return hits;
}

const show = (hits: Hit[]) =>
  hits.map((one) => `${one.file}:${one.line}  ${one.token}`);

describe('the type scale in the intake', () => {
  it('has files to check', () => {
    expect(DIRS.flatMap(sourceFiles).length).toBeGreaterThan(20);
  });

  /*
   * The rule, stated as the thing that broke. Any bracketed size at all —
   * px, rem, em or a bare number — rather than a list of the eleven that were
   * there, because the next one will be a twelfth nobody thought of.
   */
  it('uses no arbitrary font sizes', () => {
    const found = scan(/\btext-\[[^\]]*(?:px|rem|em|pt|%|\d)\][^\s'"`]*/g);
    expect(show(found)).toEqual([]);
  });

  /*
   * Inline `fontSize` is the other way round the class system, and it is not
   * hypothetical here: `intake-v2.tsx` records a session lost to exactly this,
   * where arbitrary classes were compiling to nothing against a stale dev
   * chunk and an inline style was reached for to get a size to take at all.
   *
   * The email preview is exempt and is the only exemption. Email clients do
   * not run Tailwind, so `confirmation-email.tsx` has to inline everything —
   * the same carve-out `check-colours.sh` makes for the same file for the same
   * reason.
   */
  it('sets no font size with an inline style, outside the email', () => {
    const found = scan(/fontSize\s*:/g).filter(
      (one) => !one.file.endsWith('confirmation-email.tsx'),
    );
    expect(show(found)).toEqual([]);
  });

  /* Nothing below `text-xs`, said again in the language somebody would use. */
  it('has no size class below the 12px floor', () => {
    const found = scan(/\btext-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g);
    expect(show(found)).toEqual([]);
  });

  it('only uses steps that exist on the foundations scale', () => {
    const found = scan(
      /\btext-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])(?![\w-])/g,
    ).filter((one) => !ALLOWED.has(one.token));
    expect(show(found)).toEqual([]);
  });

  /*
   * The guard has to be able to fail, and a scan whose regex quietly stops
   * matching passes forever. Pinned against a literal rather than against the
   * tree so it cannot be satisfied by an empty directory.
   */
  it('would catch an arbitrary size if one came back', () => {
    const pattern = /\btext-\[[^\]]*(?:px|rem|em|pt|%|\d)\][^\s'"`]*/g;
    expect('className="text-[11.5px]"'.match(pattern)).toEqual([
      'text-[11.5px]',
    ]);
    expect('className="text-[0.6875rem]"'.match(pattern)).toEqual([
      'text-[0.6875rem]',
    ]);
    expect('className="text-xs"'.match(pattern)).toBeNull();
  });

  /* And it has to be looking at type that is really there. */
  it('still finds the scale in use', () => {
    const used = new Set(
      scan(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g).map(
        (one) => one.token,
      ),
    );
    expect(used.has('text-xs')).toBe(true);
    expect(used.has('text-sm')).toBe(true);
    expect(used.size).toBeGreaterThan(2);
  });
});
