import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '../chat-composer.js';

/**
 * jsdom has no DataTransfer constructor, so drags are simulated with the
 * minimum surface the component reads.
 */
function fileDrag(files: File[]) {
  return { types: ['Files'], files, dropEffect: 'none' };
}

const textDrag = { types: ['text/plain'], files: [], dropEffect: 'none' };

describe('ChatComposer file drop', () => {
  const composer = () => screen.getByRole('textbox').closest('form')!;

  it('hands dropped files to onAttach', () => {
    const onAttach = vi.fn();
    render(<ChatComposer onSend={vi.fn()} onAttach={onAttach} />);

    const file = new File(['contract'], 'contract.pdf', {
      type: 'application/pdf',
    });
    fireEvent.drop(composer(), { dataTransfer: fileDrag([file]) });

    expect(onAttach).toHaveBeenCalledWith([file]);
  });

  // Without preventDefault on dragover the browser opens the dropped file
  // instead of handing it over, which is what made dropping do nothing.
  it('claims the drag so the browser does not open the file', () => {
    render(<ChatComposer onSend={vi.fn()} onAttach={vi.fn()} />);

    const dragOver = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(dragOver, 'dataTransfer', { value: fileDrag([]) });
    composer().dispatchEvent(dragOver);

    expect(dragOver.defaultPrevented).toBe(true);
  });

  it('leaves a text drag to the textarea', () => {
    const onAttach = vi.fn();
    render(<ChatComposer onSend={vi.fn()} onAttach={onAttach} />);

    const dragOver = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(dragOver, 'dataTransfer', { value: textDrag });
    composer().dispatchEvent(dragOver);
    fireEvent.drop(composer(), { dataTransfer: textDrag });

    expect(dragOver.defaultPrevented).toBe(false);
    expect(onAttach).not.toHaveBeenCalled();
  });

  it('ignores drops while disabled', () => {
    const onAttach = vi.fn();
    render(<ChatComposer onSend={vi.fn()} onAttach={onAttach} disabled />);

    const file = new File(['x'], 'x.pdf');
    fireEvent.drop(composer(), { dataTransfer: fileDrag([file]) });

    expect(onAttach).not.toHaveBeenCalled();
  });

  // dragenter/dragleave fire per nested element, so a naive boolean clears the
  // highlight as soon as the cursor crosses onto the textarea.
  it('keeps the drop highlight while moving over its own children', () => {
    render(<ChatComposer onSend={vi.fn()} onAttach={vi.fn()} />);
    const form = composer();
    const textarea = screen.getByRole('textbox');
    const dragged = () => form.hasAttribute('data-drop-target');

    fireEvent.dragEnter(form, { dataTransfer: fileDrag([]) });
    expect(dragged()).toBe(true);

    fireEvent.dragEnter(textarea, { dataTransfer: fileDrag([]) });
    fireEvent.dragLeave(form, { dataTransfer: fileDrag([]) });
    expect(dragged()).toBe(true);

    fireEvent.dragLeave(textarea, { dataTransfer: fileDrag([]) });
    expect(dragged()).toBe(false);
  });
});
