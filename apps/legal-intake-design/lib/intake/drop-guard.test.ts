import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  carriesFiles,
  createDropGuard,
  filesFrom,
  type DragLike,
} from './drop-guard';

function file(name = 'msa.pdf'): File {
  return new File(['x'], name, { type: 'application/pdf' });
}

/**
 * An indexed collection with a `length` and no array methods, which is what
 * `DataTransferItemList` and `FileList` actually are.
 *
 * Every fixture below was a real array, which is why `items.some(...)` passed
 * the suite and then threw on the first `dragenter` in a browser. Anything read
 * off a `DataTransfer` is built through this.
 */
function arrayLike<T>(items: T[]): ArrayLike<T> {
  return { length: items.length, ...Object.fromEntries(items.entries()) };
}

/** A drag carrying files, as the browser reports one mid-drag. */
function fileDrag(overrides: Partial<DragLike> = {}): DragLike {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      items: arrayLike([{ kind: 'file' }]),
      types: arrayLike(['Files']),
    },
    ...overrides,
  };
}

/** A drag carrying a selected sentence, not a file. */
function textDrag(): DragLike {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      items: arrayLike([{ kind: 'string' }]),
      types: arrayLike(['text/plain']),
    },
  };
}

function fileDrop(files: File[]): DragLike {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      items: arrayLike(
        files.map((one) => ({ kind: 'file', getAsFile: () => one })),
      ),
      files: arrayLike(files),
      types: arrayLike(['Files']),
    },
  };
}

describe('carriesFiles', () => {
  it('is true for a file drag', () => {
    expect(carriesFiles(fileDrag())).toBe(true);
  });

  it('is false for a text drag', () => {
    expect(carriesFiles(textDrag())).toBe(false);
  });

  // Some browsers leave `items` empty until the drop and only populate `types`.
  it('falls back to the type list when items are empty', () => {
    expect(
      carriesFiles({
        preventDefault: vi.fn(),
        dataTransfer: { items: arrayLike([]), types: arrayLike(['Files']) },
      }),
    ).toBe(true);
  });

  it('is false with no data transfer at all', () => {
    expect(carriesFiles({ preventDefault: vi.fn(), dataTransfer: null })).toBe(
      false,
    );
  });
});

describe('filesFrom', () => {
  it('reads the item list', () => {
    const one = file();
    expect(filesFrom(fileDrop([one]))).toEqual([one]);
  });

  it('falls back to the file list', () => {
    const one = file();
    expect(
      filesFrom({
        preventDefault: vi.fn(),
        dataTransfer: { items: arrayLike([]), files: arrayLike([one]) },
      }),
    ).toEqual([one]);
  });

  // A directory drags as an item of kind "file" whose `getAsFile` is null.
  it('drops items that cannot produce a file', () => {
    expect(
      filesFrom({
        preventDefault: vi.fn(),
        dataTransfer: {
          items: arrayLike([{ kind: 'file', getAsFile: () => null }]),
        },
      }),
    ).toEqual([]);
  });
});

describe('createDropGuard', () => {
  let onFiles: Mock<(files: File[]) => void>;
  let setDragging: Mock<(dragging: boolean) => void>;
  let enabled: boolean;

  function guard() {
    return createDropGuard({
      onFiles,
      setDragging,
      isEnabled: () => enabled,
    });
  }

  beforeEach(() => {
    onFiles = vi.fn();
    setDragging = vi.fn();
    enabled = true;
  });

  /*
   * The defect this exists for. A dropped file that nothing handles navigates
   * the browser to it, which replaced the page and lost the whole intake. It
   * has to be cancelled whether or not this surface wants the file, so both
   * assertions below are about the disabled case.
   */
  describe('the guard (Decision 20)', () => {
    it('cancels dragover even when dropping is disabled', () => {
      enabled = false;
      const event = fileDrag();
      guard().dragover(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('cancels drop even when dropping is disabled', () => {
      enabled = false;
      const event = fileDrop([file()]);
      guard().drop(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onFiles).not.toHaveBeenCalled();
    });

    it('cancels a text drag too, rather than letting it navigate', () => {
      const event = textDrag();
      guard().dragover(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('marks the drag as a copy so the cursor says yes', () => {
      const event = fileDrag();
      guard().dragover(event);
      expect(event.dataTransfer?.dropEffect).toBe('copy');
    });

    it('leaves the cursor alone when dropping is disabled', () => {
      enabled = false;
      const event = fileDrag();
      guard().dragover(event);
      expect(event.dataTransfer?.dropEffect).toBeUndefined();
    });

    it('survives a drag with no data transfer', () => {
      const event = { preventDefault: vi.fn(), dataTransfer: null };
      expect(() => guard().dragover(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('the overlay', () => {
    it('turns on for a file drag', () => {
      guard().dragenter(fileDrag());
      expect(setDragging).toHaveBeenCalledWith(true);
    });

    it('ignores a text drag', () => {
      guard().dragenter(textDrag());
      expect(setDragging).not.toHaveBeenCalled();
    });

    it('does not turn on where dropping is disabled', () => {
      enabled = false;
      guard().dragenter(fileDrag());
      expect(setDragging).not.toHaveBeenCalledWith(true);
    });

    /*
     * The flicker bug. Enter and leave fire per element crossed, so moving the
     * cursor from the chat onto the brief fires a leave before the next enter,
     * and a boolean would blink the overlay off in the middle of a drag.
     */
    it('stays on while the cursor crosses children', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.dragenter(fileDrag());
      one.dragleave(fileDrag({ relatedTarget: {} }));
      expect(setDragging).not.toHaveBeenCalledWith(false);
    });

    it('turns off once the last leave is matched', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.dragenter(fileDrag());
      one.dragleave(fileDrag({ relatedTarget: {} }));
      one.dragleave(fileDrag({ relatedTarget: {} }));
      expect(setDragging).toHaveBeenCalledWith(false);
    });

    // The one signal that means the cursor really left, whatever the count says.
    it('turns off immediately when the drag leaves the window', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.dragenter(fileDrag());
      one.dragleave(fileDrag({ relatedTarget: null }));
      expect(setDragging).toHaveBeenCalledWith(false);
    });

    it('turns off on drop', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.drop(fileDrop([file()]));
      expect(setDragging).toHaveBeenLastCalledWith(false);
    });

    // Escape, or a drag released outside the window, fires neither.
    it('turns off on dragend', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.dragend();
      expect(setDragging).toHaveBeenLastCalledWith(false);
    });

    /*
     * A cancelled drag must not leave the count above zero, or the next drag
     * needs two leaves to clear and the overlay sticks.
     */
    it('resets the count so the next drag behaves', () => {
      const one = guard();
      one.dragenter(fileDrag());
      one.dragenter(fileDrag());
      one.dragend();

      setDragging.mockClear();
      one.dragenter(fileDrag());
      one.dragleave(fileDrag({ relatedTarget: {} }));
      expect(setDragging).toHaveBeenLastCalledWith(false);
    });
  });

  describe('the drop', () => {
    it('hands over the files', () => {
      const one = file('msa.pdf');
      guard().drop(fileDrop([one]));
      expect(onFiles).toHaveBeenCalledWith([one]);
    });

    it('says nothing when a drop carried no files', () => {
      guard().drop({
        preventDefault: vi.fn(),
        dataTransfer: { items: arrayLike([]), files: arrayLike([]) },
      });
      expect(onFiles).not.toHaveBeenCalled();
    });

    /*
     * The page has real drop zones on it, and a drop on one of those bubbles up
     * to the window as well. Taking the file twice means two extraction calls
     * for one document, or one document listed twice on the confirmation with
     * Moritz announcing it twice. The zone cancels the event, so that is the
     * signal.
     */
    it('leaves a drop a nearer zone already handled alone', () => {
      const event = { ...fileDrop([file()]), defaultPrevented: true };
      guard().drop(event);
      expect(onFiles).not.toHaveBeenCalled();
    });

    it('still cancels a drop a nearer zone handled, and clears the overlay', () => {
      const event = { ...fileDrop([file()]), defaultPrevented: true };
      const one = guard();
      one.dragenter(fileDrag());
      one.drop(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(setDragging).toHaveBeenLastCalledWith(false);
    });

    // `isEnabled` is read at event time, not at install time, so a phase that
    // changes mid-drag is respected rather than remembered.
    it('reads enablement at drop time', () => {
      const one = guard();
      one.dragenter(fileDrag());
      enabled = false;
      one.drop(fileDrop([file()]));
      expect(onFiles).not.toHaveBeenCalled();
    });
  });
});

/*
 * The shape of the bug, pinned directly rather than only through the fixtures.
 *
 * `DataTransferItemList` has a `length` and no array methods. The first version
 * of this module called `.some` and `.filter` on it, typed it as an array, and
 * was tested entirely with arrays — so it compiled, passed, and threw on the
 * first `dragenter` in a real browser, taking the navigate-away guard down with
 * it.
 */
describe('the DataTransfer collections', () => {
  it('are read without array methods on them', () => {
    const one = file();
    const items = {
      length: 1,
      0: { kind: 'file', getAsFile: () => one },
    } as ArrayLike<{ kind: string; getAsFile: () => File }>;

    expect('some' in items).toBe(false);
    expect(
      carriesFiles({ preventDefault: vi.fn(), dataTransfer: { items } }),
    ).toBe(true);
    expect(
      filesFrom({ preventDefault: vi.fn(), dataTransfer: { items } }),
    ).toEqual([one]);
  });

  it('reads a FileList that is not an array either', () => {
    const one = file();
    const files = { length: 1, 0: one } as ArrayLike<File>;
    expect(
      filesFrom({
        preventDefault: vi.fn(),
        dataTransfer: { items: { length: 0 }, files },
      }),
    ).toEqual([one]);
  });
});
