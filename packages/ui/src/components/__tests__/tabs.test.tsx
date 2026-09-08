import type * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger } from '../tabs.js';

/**
 * jsdom lays nothing out, so the strip has to be told how wide its content is,
 * lent a scroll position a drag can move, and given the pointer capture the
 * drag takes. The position is held per element rather than in one shared
 * variable, or "the list scrolled" would also be true of anything else that
 * happened to be written to.
 */
let contentWidth = 600;
const scrollPositions = new WeakMap<HTMLElement, number>();

Object.defineProperties(HTMLElement.prototype, {
  scrollWidth: { configurable: true, get: () => contentWidth },
  clientWidth: { configurable: true, get: () => 200 },
  scrollLeft: {
    configurable: true,
    get(this: HTMLElement) {
      return scrollPositions.get(this) ?? 0;
    },
    set(this: HTMLElement, value: number) {
      scrollPositions.set(this, value);
    },
  },
});
Element.prototype.setPointerCapture = () => {};

beforeEach(() => {
  contentWidth = 600;
});

/** How far the strip itself has been scrolled. */
function stripScrollLeft() {
  return screen.getByRole('tablist').scrollLeft;
}

function renderTabs({
  onValueChange,
  orientation,
}: {
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}) {
  render(
    <Tabs
      defaultValue="a"
      onValueChange={onValueChange}
      orientation={orientation}
    >
      <TabsList>
        <TabsTrigger value="a">First</TabsTrigger>
        <TabsTrigger value="b">Second</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
}

/** A press on a trigger, optionally pulled sideways before it is released. */
function pressAndPull(
  name: string,
  travel = 0,
  init: { pointerType?: string; button?: number; ctrlKey?: boolean } = {},
) {
  const trigger = screen.getByRole('tab', { name });
  const strip = screen.getByRole('tablist');
  const { pointerType = 'mouse', button = 0, ctrlKey = false } = init;

  fireEvent.pointerDown(trigger, {
    pointerId: 1,
    clientX: 0,
    pointerType,
    button,
    ctrlKey,
  });
  fireEvent.mouseDown(trigger, { button, ctrlKey });
  if (travel !== 0) {
    fireEvent.pointerMove(strip, {
      pointerId: 1,
      clientX: travel,
      pointerType,
    });
  }
  fireEvent.pointerUp(strip, { pointerId: 1, clientX: travel, pointerType });
}

describe('TabsList drag scrolling', () => {
  it('selects the tab a press that never travelled landed on', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second');

    expect(onValueChange).toHaveBeenCalledWith('b');
    // Focusing the trigger already selects it under automatic activation, so
    // putting the press back is two selections unless the state deduplicates
    // them — and a consumer that navigates on change would navigate twice.
    expect(onValueChange).toHaveBeenCalledTimes(1);
    // The press was held back, focus and all, so the release has to give it
    // back — a tab you clicked is a tab you can then arrow away from.
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Second' }),
    );
  });

  // The whole point of holding the press back: a strip dragged past a tab must
  // not leave that tab selected.
  it('scrolls without selecting when the press was pulled', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', -40);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(stripScrollLeft()).toBe(40);
  });

  it('reads a press of a few pixels as a click, not a drag', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', -3);

    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(stripScrollLeft()).toBe(0);
  });

  // Touch already scrolls the strip; taking the pointer would fight the
  // browser and withhold a tap the browser was going to deliver anyway.
  it('leaves a touch to the browser', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', -40, { pointerType: 'touch' });

    expect(stripScrollLeft()).toBe(0);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  // macOS reads ctrl-press as the secondary click, and so does Radix. Taking
  // it as a grab put the press back on release and selected the tab a context
  // menu was being opened on.
  it('ignores a ctrl-press', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', 0, { ctrlKey: true });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(stripScrollLeft()).toBe(0);
  });

  it('ignores a secondary-button press', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', 0, { button: 2 });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(stripScrollLeft()).toBe(0);
  });

  // The release and the loss of the capture arrive in either order depending
  // on the engine. Whichever comes first has to put the press back, or the
  // strip drags but never selects anything.
  it('puts the press back when the capture is lost before the release', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    const trigger = screen.getByRole('tab', { name: 'Second' });
    const strip = screen.getByRole('tablist');
    fireEvent.pointerDown(trigger, { pointerId: 1, clientX: 0 });
    fireEvent.mouseDown(trigger);
    fireEvent.lostPointerCapture(strip, { pointerId: 1, clientX: 0 });
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 0 });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  // Nothing to scroll, nothing to grab: the press goes straight through, as it
  // did before there was any dragging.
  it('leaves a strip that does not overflow alone', () => {
    contentWidth = 100;
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('Second', -40);

    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  // A vertical list stacks and never scrolls sideways, so a sideways pull is
  // just a press.
  it('does not grab a vertical list', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange, orientation: 'vertical' });

    pressAndPull('Second', -40);

    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  // A capture the browser refuses leaves the strip without a release of its
  // own, and the grabbed cursor and the suppressed selection stick to it.
  it('lets go when the pointer comes up away from the strip', () => {
    const refuse = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = () => {
      throw new Error('no capture');
    };
    try {
      renderTabs({ onValueChange: vi.fn() });
      const trigger = screen.getByRole('tab', { name: 'Second' });
      const strip = screen.getByRole('tablist');

      fireEvent.pointerDown(trigger, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(strip, { pointerId: 1, clientX: -40 });
      expect(strip.classList.contains('cursor-grabbing')).toBe(true);

      fireEvent.pointerUp(document.body, { pointerId: 1, clientX: -40 });
      expect(strip.classList.contains('cursor-grabbing')).toBe(false);
    } finally {
      Element.prototype.setPointerCapture = refuse;
    }
  });
});

describe('Tabs selection', () => {
  // Six consumers turn a change into a route change. Reporting a press on the
  // tab that is already active as a change makes every one of them redo it.
  it('says nothing when the tab that is already active is pressed', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    pressAndPull('First');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'First' }),
    );
  });
});

describe('TabsTrigger asChild', () => {
  // The active trigger renders its indicator alongside the label. With
  // `asChild` both have to reach the Slot as one element, or Radix refuses
  // the render (React.Children.only) — which is exactly what a sibling
  // `Slottable` did once pnpm resolved a second copy of @radix-ui/react-slot.
  it('renders the active trigger as the slotted element with its indicator inside', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" asChild>
            <a href="/a">First</a>
          </TabsTrigger>
          <TabsTrigger value="b" asChild>
            <a href="/b">Second</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );

    const active = screen.getByRole('tab', { name: 'First' });
    expect(active.tagName).toBe('A');
    expect(active.getAttribute('href')).toBe('/a');
    expect(active.querySelector('[aria-hidden="true"]')).not.toBeNull();

    const inactive = screen.getByRole('tab', { name: 'Second' });
    expect(inactive.tagName).toBe('A');
    expect(inactive.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('TabsList pointer capture hygiene', () => {
  // A capture that outlives its press retargets every later mouse event on
  // the page to the strip, which then swallows them — dead links everywhere.
  it('releases the pointer capture when the press ends', () => {
    const released: number[] = [];
    Element.prototype.hasPointerCapture = () => true;
    Element.prototype.releasePointerCapture = (id: number) => {
      released.push(id);
    };
    try {
      renderTabs({ onValueChange: vi.fn() });

      pressAndPull('Second', -40);

      expect(released).toContain(1);
    } finally {
      delete (Element.prototype as Partial<Element>).hasPointerCapture;
      delete (Element.prototype as Partial<Element>).releasePointerCapture;
    }
  });

  // Focus stolen mid-press: no pointerup or pointercancel ever arrives for a
  // mouse, so the blur is the only signal left to let the press go.
  it('lets go of a press when the window loses focus', () => {
    const released: number[] = [];
    Element.prototype.hasPointerCapture = () => true;
    Element.prototype.releasePointerCapture = (id: number) => {
      released.push(id);
    };
    try {
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      const trigger = screen.getByRole('tab', { name: 'Second' });

      fireEvent.pointerDown(trigger, { pointerId: 1, clientX: 0 });
      fireEvent(window, new Event('blur'));

      expect(released).toContain(1);
      // The strip is no longer grabbed: an ordinary click goes through.
      pressAndPull('Second');
      expect(onValueChange).toHaveBeenCalledWith('b');
    } finally {
      delete (Element.prototype as Partial<Element>).hasPointerCapture;
      delete (Element.prototype as Partial<Element>).releasePointerCapture;
    }
  });
});

describe('TabsList overflow modes', () => {
  function renderStrip(listProps?: React.ComponentProps<typeof TabsList>) {
    render(
      <Tabs defaultValue="a">
        <TabsList {...listProps}>
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    return {
      list: screen.getByRole('tablist'),
      activeIndicator: () =>
        screen
          .getByRole('tab', { selected: true })
          .querySelector('[aria-hidden="true"]'),
    };
  }

  it('scrolls by default, with the indicator hanging below the strip', () => {
    const { list, activeIndicator } = renderStrip();

    expect(list.className).toContain('overflow-x-auto');
    expect(list.hasAttribute('data-wrap')).toBe(false);
    expect(activeIndicator()?.className).toContain('-bottom-2.5');
  });

  it('wraps instead of scrolling when wrap is set', () => {
    const { list } = renderStrip({ wrap: true });

    expect(list.hasAttribute('data-wrap')).toBe(true);
    expect(list.className).toContain('flex-wrap');
    expect(list.className).not.toContain('overflow-x-auto');
  });

  // A hanging indicator would overlap the next row once the strip wraps,
  // and the padding that buys its room would open a gap between rows.
  it('keeps the indicator and its spacing inside the row when wrapping', () => {
    const { list, activeIndicator } = renderStrip({ wrap: true });

    expect(list.className).not.toContain('-mb-3');
    const indicator = activeIndicator();
    expect(indicator?.className).toContain(':bottom-0');
    expect(indicator?.className).not.toContain('-bottom-2.5');
  });

  it('does not grab a wrapped strip', () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabsList wrap>
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
      </Tabs>,
    );

    pressAndPull('Second', -40);

    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(stripScrollLeft()).toBe(0);
  });
});
