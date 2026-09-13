// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  isEditableTarget,
  isUiOverlayOpen,
  matchesModShortcut,
  modKeyLabel,
  shouldSuppressGlobalLetterShortcut,
} from './keyboard';

/**
 * The overlay predicates, against a real DOM.
 *
 * These are cheap tests for a defect that is genuinely hard to see: a global
 * shortcut firing through an open modal opens the palette *behind* the dialog,
 * which looks like nothing happening. The list of selectors is also the thing
 * most likely to rot — every new overlay library brings a new way of saying
 * "open" — so each idiom this app carries gets its own case, named after the
 * library, so a future failure says which one changed.
 */

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isEditableTarget', () => {
  it.each([
    ['an input', '<input />', 'input'],
    ['a textarea', '<textarea></textarea>', 'textarea'],
    ['a select', '<select></select>', 'select'],
    [
      'a contenteditable div',
      '<div contenteditable="true" id="ce"></div>',
      '#ce',
    ],
  ])('is true for %s', (_label, html, selector) => {
    mount(html);
    expect(isEditableTarget(document.querySelector(selector))).toBe(true);
  });

  it('is true for a node nested inside a typing surface', () => {
    mount('<div contenteditable="true"><span id="inner">x</span></div>');
    expect(isEditableTarget(document.querySelector('#inner'))).toBe(true);
  });

  it('is false for ordinary content and for a non-element target', () => {
    mount('<button id="b">Go</button>');
    expect(isEditableTarget(document.querySelector('#b'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('isUiOverlayOpen', () => {
  it('is false on a page with no overlay', () => {
    mount('<main><button>Go</button></main>');
    expect(isUiOverlayOpen()).toBe(false);
  });

  /*
   * One case per library, because each marks "open" differently and a literal
   * port of the source's Radix-only list would silently miss the last three.
   */
  it.each([
    ['radix, by role', '<div role="dialog" data-state="open"></div>'],
    [
      'radix, by shadcn part name',
      '<div data-slot="sheet-content" data-state="open"></div>',
    ],
    ['base ui popover', '<div data-slot="popover-content" data-open></div>'],
    ['base ui combobox', '<div data-slot="combobox-content" data-open></div>'],
    ['base ui, by role', '<div role="listbox" data-open></div>'],
    ['vaul drawer', '<div data-vaul-drawer></div>'],
    ['cmdk dialog', '<div cmdk-dialog=""></div>'],
  ])('sees an open %s', (_label, html) => {
    mount(html);
    expect(isUiOverlayOpen()).toBe(true);
  });

  /*
   * The reason every selector is anchored on an open-state attribute rather
   * than on the part name alone: Radix keeps dismissed content mounted while it
   * animates out, so a part-name-only selector reports an overlay for a beat
   * after it is gone.
   */
  it('does not see a radix overlay that is animating closed', () => {
    mount('<div role="dialog" data-state="closed"></div>');
    expect(isUiOverlayOpen()).toBe(false);
  });

  it('sees an overlay that focus is inside, even without an open mark', () => {
    mount('<div role="dialog"><button id="inner">Confirm</button></div>');
    document.querySelector<HTMLElement>('#inner')!.focus();
    expect(isUiOverlayOpen()).toBe(true);
  });
});

describe('shouldSuppressGlobalLetterShortcut', () => {
  const press = (init: KeyboardEventInit & { target?: Element }) => {
    const event = new KeyboardEvent('keydown', { key: 'n', ...init });
    if (init.target) {
      Object.defineProperty(event, 'target', { value: init.target });
    }
    return event;
  };

  it('allows a bare letter on an ordinary page', () => {
    mount('<main></main>');
    expect(shouldSuppressGlobalLetterShortcut(press({}))).toBe(false);
  });

  it.each(['metaKey', 'ctrlKey', 'altKey', 'shiftKey'] as const)(
    'suppresses when %s is held',
    (modifier) => {
      mount('<main></main>');
      expect(
        shouldSuppressGlobalLetterShortcut(press({ [modifier]: true })),
      ).toBe(true);
    },
  );

  it('suppresses while typing in a field', () => {
    mount('<input id="f" />');
    expect(
      shouldSuppressGlobalLetterShortcut(
        press({ target: document.querySelector('#f')! }),
      ),
    ).toBe(true);
  });

  it('suppresses over an open overlay', () => {
    mount('<div role="dialog" data-state="open"></div>');
    expect(shouldSuppressGlobalLetterShortcut(press({}))).toBe(true);
  });
});

describe('matchesModShortcut', () => {
  const chord = (init: KeyboardEventInit) =>
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, ...init });

  it('matches ⌘K and Ctrl+K', () => {
    mount('<main></main>');
    expect(matchesModShortcut(chord({}), 'k')).toBe(true);
    expect(
      matchesModShortcut(chord({ metaKey: false, ctrlKey: true }), 'k'),
    ).toBe(true);
  });

  it('is case-insensitive on the key', () => {
    mount('<main></main>');
    expect(matchesModShortcut(chord({ key: 'K' }), 'k')).toBe(true);
  });

  it('does not match a different key, or a bare letter', () => {
    mount('<main></main>');
    expect(matchesModShortcut(chord({ key: 'j' }), 'k')).toBe(false);
    expect(matchesModShortcut(chord({ metaKey: false }), 'k')).toBe(false);
  });

  it.each(['altKey', 'shiftKey'] as const)(
    'leaves %s chords to the browser',
    (modifier) => {
      mount('<main></main>');
      expect(matchesModShortcut(chord({ [modifier]: true }), 'k')).toBe(false);
    },
  );

  /*
   * The deliberate departure from the source, which returns early whenever
   * focus is in a form field. ⌘K from a search box is the single most likely
   * way a reader reaches for a palette.
   */
  it('still matches while the cursor is in a text field', () => {
    mount('<input id="f" />');
    const event = chord({});
    Object.defineProperty(event, 'target', {
      value: document.querySelector('#f'),
    });
    expect(matchesModShortcut(event, 'k')).toBe(true);
  });

  it('does not match over an open overlay', () => {
    mount('<div role="dialog" data-state="open"></div>');
    expect(matchesModShortcut(chord({}), 'k')).toBe(false);
  });

  /* The palette is itself an overlay, so it must be able to close itself. */
  it('matches over an open overlay when the caller is that overlay', () => {
    mount('<div cmdk-dialog=""></div>');
    expect(matchesModShortcut(chord({}), 'k', true)).toBe(true);
  });
});

describe('modKeyLabel', () => {
  it('returns one of the two labels a reader can see', () => {
    expect(['⌘', 'Ctrl']).toContain(modKeyLabel());
  });
});
