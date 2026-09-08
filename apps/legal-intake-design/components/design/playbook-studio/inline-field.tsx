'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

interface InlineFieldProps {
  /** Omit when a parent heading already names the field (e.g. guidance note). */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when the field is blurred empty (used to drop optional fields). */
  onEmpty?: () => void;
  placeholder?: string;
  bold?: boolean;
  /**
   * When true the field preserves line breaks: Enter inserts a newline instead
   * of committing (blur/Escape still commit/revert). Used for long-form
   * reference text such as rationale or precedent.
   */
  multiline?: boolean;
  /** When set, applied to the editable element (e.g. larger title text). */
  className?: string;
  /** Forwarded to the editable element so callers can target it (e.g. focus). */
  editableProps?: React.HTMLAttributes<HTMLSpanElement> &
    Record<`data-${string}`, string>;
}

/**
 * Click-to-edit inline text. Renders as plain text until clicked, then becomes
 * a single-line `contentEditable` span. Enter commits, Escape reverts, blur
 * commits (or fires `onEmpty` when cleared). Reskinned onto Moritz tokens: the
 * active edit state uses the accent tint + ring stroke, and the resting state
 * shows a subtle underline on hover.
 */
export function InlineField({
  label,
  value,
  onChange,
  onEmpty,
  placeholder = 'click to add',
  bold = true,
  multiline = false,
  className,
  editableProps,
}: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const el = inputRef.current;
      requestAnimationFrame(() => {
        el.focus();
        if (!el.textContent) return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.addRange(range);
        }
      });
    }
  }, [isEditing]);

  const readValue = useCallback(
    () =>
      (multiline
        ? inputRef.current?.innerText
        : inputRef.current?.textContent) ?? '',
    [multiline],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const newValue = readValue();
    if (newValue.trim() === '' && onEmpty) {
      onEmpty();
      return;
    }
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, onChange, onEmpty, readValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Escape') {
        if (inputRef.current) inputRef.current.textContent = value;
        setIsEditing(false);
      } else if (event.key === 'Enter' && !event.shiftKey && !multiline) {
        event.preventDefault();
        inputRef.current?.blur();
      }
    },
    [value, multiline],
  );

  const isEmpty = !value || value.trim() === '';
  const showLabel = label != null && label !== '';

  return (
    <span className="inline">
      {showLabel && (
        <span
          className={cn(
            'text-foreground mr-1',
            bold ? 'font-semibold' : 'font-medium',
          )}
        >
          {label}:
        </span>
      )}
      {isEditing ? (
        <span
          {...editableProps}
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder={placeholder}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'text-foreground bg-accent border-ring rounded-sm border-b-2 outline-none',
            'empty:before:text-muted-foreground empty:before:pointer-events-none empty:before:italic empty:before:content-[attr(data-placeholder)]',
            multiline
              ? 'block min-h-[1.5em] whitespace-pre-wrap break-words'
              : 'inline-block min-w-[2ch]',
            className,
          )}
        >
          {value}
        </span>
      ) : (
        <span
          {...editableProps}
          onClick={(event) => {
            editableProps?.onClick?.(event);
            setIsEditing(true);
          }}
          className={cn(
            'hover:border-border/60 cursor-text border-b border-transparent transition-colors',
            multiline && 'block whitespace-pre-wrap break-words',
            isEmpty ? 'text-muted-foreground italic' : 'text-foreground',
            className,
          )}
        >
          {isEmpty ? placeholder : value}
        </span>
      )}
    </span>
  );
}
