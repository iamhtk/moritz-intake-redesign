import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollActivity } from '../use-scroll-activity.js';

function Region({ autoscrolling = false }: { autoscrolling?: boolean }) {
  const markScrolling = useScrollActivity();
  return (
    <div
      data-testid="region"
      onScroll={markScrolling}
      {...(autoscrolling ? { 'data-autoscrolling': '' } : {})}
    />
  );
}

const region = () => screen.getByTestId('region');

describe('useScrollActivity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('marks the region while it is being scrolled', () => {
    render(<Region />);

    fireEvent.scroll(region());

    expect(region().hasAttribute('data-scrolling')).toBe(true);
  });

  it('clears the mark once the region settles', () => {
    render(<Region />);
    fireEvent.scroll(region());

    vi.advanceTimersByTime(700);

    expect(region().hasAttribute('data-scrolling')).toBe(false);
  });

  // Each event has to push the settle point out, or a slow drag drops the
  // scrollbar halfway through.
  it('keeps the mark through a continuous scroll', () => {
    render(<Region />);

    fireEvent.scroll(region());
    vi.advanceTimersByTime(600);
    fireEvent.scroll(region());
    vi.advanceTimersByTime(600);

    expect(region().hasAttribute('data-scrolling')).toBe(true);
  });

  // Following a streaming reply scrolls the transcript constantly; surfacing a
  // scrollbar for that would flash it on every token.
  it('ignores a scroll the component performs itself', () => {
    render(<Region autoscrolling />);

    fireEvent.scroll(region());

    expect(region().hasAttribute('data-scrolling')).toBe(false);
  });

  it('drops its pending timer when the region unmounts', () => {
    const { unmount } = render(<Region />);
    fireEvent.scroll(region());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    // Asserted before advancing: running the clock would drain the timer either
    // way and hide a missing cleanup.
    expect(vi.getTimerCount()).toBe(0);
  });
});
