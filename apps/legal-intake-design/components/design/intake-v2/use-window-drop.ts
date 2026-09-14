'use client';

import { useEffect, useRef, useState } from 'react';
import { createDropGuard, type DragLike } from '@/lib/intake/drop-guard';

/**
 * Install the window-level drop guard and report whether a file is being held
 * over the page (Decisions 9 and 20).
 *
 * All of the behaviour is in `lib/intake/drop-guard.ts`, where it can be tested
 * without a browser: which drags count as carrying files, when a `dragleave`
 * really means the cursor has gone, which of the two file lists a drop is
 * authoritative, and above all that the browser's navigate-to-the-file default
 * is cancelled whether or not this surface wants the file. That last one is the
 * defect behind Decision 20 and it is not a thing to leave sitting inside an
 * effect.
 *
 * What is left here is the wiring, and the one detail that has to be got right:
 * the listeners are installed exactly once. `onFiles` and `enabled` are read
 * through refs, because re-subscribing on every render would reset the guard's
 * drag depth mid-drag and make the overlay flicker.
 */
export function useWindowDrop({
  onFiles,
  enabled = true,
}: {
  onFiles: (files: File[]) => void;
  enabled?: boolean;
}): { dragging: boolean } {
  const [dragging, setDragging] = useState(false);

  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const guard = createDropGuard({
      onFiles: (files) => onFilesRef.current(files),
      isEnabled: () => enabledRef.current,
      setDragging,
    });

    // A `DragEvent` is a `DragLike`; the narrower type is what lets the guard be
    // tested with plain objects.
    const on = (event: DragEvent, handler: (one: DragLike) => void) =>
      handler(event as unknown as DragLike);

    const onDragEnter = (event: DragEvent) => on(event, guard.dragenter);
    const onDragOver = (event: DragEvent) => on(event, guard.dragover);
    const onDragLeave = (event: DragEvent) => on(event, guard.dragleave);
    const onDrop = (event: DragEvent) => on(event, guard.drop);
    const onDragEnd = () => guard.dragend();

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragend', onDragEnd);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragend', onDragEnd);
    };
  }, []);

  return { dragging };
}
