'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Check, X } from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import { Textarea } from '@/components/design/foundations/components/textarea';
import { Input } from '@/components/design/foundations/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { cn } from '@repo/ui/lib/utils';

// Columns that should have numeric validation
const VALUE_COLUMNS = [
  'value',
  'contractValue',
  'dealValue',
  'deal-value',
  'contract-value',
];

// Validation pattern for numeric values (allows currency symbols, numbers, decimals, K/M/B suffixes, percentages)
const isValidNumericValue = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Empty is valid (will show as N/A)

  // Allow common numeric formats:
  // - Plain numbers: 1000, 1,000, 1000.50
  // - Currency: $1,000, €500, £200, USD 1000
  // - Shorthand: 2.5M, 1.5B, 500K
  // - Percentages: 150%, 50.5%
  // - Ranges: 1-2M, $1M - $2M
  const numericPattern =
    /^[$€£¥]?\s*[\d,]+\.?\d*\s*[KMBkmb%]?\s*(-\s*[$€£¥]?\s*[\d,]+\.?\d*\s*[KMBkmb%]?)?$|^[A-Z]{3}\s*[\d,]+\.?\d*\s*[KMBkmb%]?$/i;
  return numericPattern.test(value.trim());
};

interface CellEditInputProps {
  columnType: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  enumOptions?: string[];
  columnKey?: string;
  autoFocus?: boolean;
  className?: string;
  compact?: boolean; // For inline table editing (smaller controls)
  /**
   * Icon-only tick/cross beside the field. Off where the surrounding view
   * already offers labelled Save / Discard buttons, as the analysis panel does.
   */
  showActions?: boolean;
}

export function CellEditInput({
  columnType,
  value,
  onChange,
  onSave,
  onCancel,
  enumOptions = [],
  columnKey = '',
  autoFocus = true,
  className,
  compact = false,
  showActions = true,
}: CellEditInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  /*
   * Taking focus the ordinary way asks the browser to reveal the field, and it
   * obliges by scrolling every scrollable ancestor — including the grid behind
   * the panel, which lurches sideways while the panel is still sliding in. The
   * field is already on screen wherever it is used, so the reveal is only ever
   * damage.
   */
  const focusOnMount = useCallback(
    (node: HTMLElement | null) => {
      if (autoFocus) node?.focus({ preventScroll: true });
    },
    [autoFocus],
  );

  // Check if this is a value column that needs numeric validation
  const isValueColumn = VALUE_COLUMNS.some((col) =>
    columnKey.toLowerCase().includes(col.toLowerCase()),
  );

  // Validate on change for value columns
  useEffect(() => {
    if (isValueColumn && value) {
      if (!isValidNumericValue(value)) {
        setValidationError(
          'Please enter a valid number (e.g., $1,000, 2.5M, 150%)',
        );
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [value, isValueColumn]);

  const handleSave = () => {
    if (validationError) return;
    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Render buttons for save/cancel
  const renderActionButtons = () =>
    !showActions ? null : (
      <div className={cn('flex gap-1', compact ? 'flex-row' : 'flex-col')}>
        <Button
          size="sm"
          variant="outline"
          className={cn('p-0', compact ? 'h-6 w-6' : 'h-8 w-8')}
          onClick={handleSave}
          disabled={!!validationError}
        >
          <Check className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={cn('p-0', compact ? 'h-6 w-6' : 'h-8 w-8')}
          onClick={onCancel}
        >
          <X className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </div>
    );

  /*
   * Yes/no and enum columns both pick one value from a fixed list — a rule has
   * one severity and sits in one category — so they share a single-select
   * dropdown rather than a picker that lets several be ticked at once.
   */
  const isSingleChoice =
    columnType === 'yes-no' ||
    ((columnType === 'enum' || columnType === 'enum-category') &&
      enumOptions.length > 0);

  if (isSingleChoice) {
    const options = columnType === 'yes-no' ? ['Yes', 'No'] : enumOptions;

    return (
      <div className={cn('flex items-start gap-2', className)}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            /*
             * Height comes from the trigger's own padding, and the size prop is
             * what shortens it. A `h-*` here lands on the wrapper that carries
             * the fill and the focus ring, which then stands a pixel or two
             * outside the button's border all the way round — one field drawn
             * as two.
             */
            size={compact ? 'sm' : 'default'}
            className="bg-dt-bg-primary flex-1"
            ref={focusOnMount}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          {/*
           * The foundation menu is a tinted pane over a blurred backdrop,
           * which reads well over a page but not over a dense table or the
           * panel's own buttons: whatever sits behind shows through the
           * options and the two layers of text run together. Here it is a
           * solid surface.
           */}
          <SelectContent className="bg-popover backdrop-blur-none">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderActionButtons()}
      </div>
    );
  }

  // Number/Value input with validation
  if (isValueColumn) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-start gap-2">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={validationError ? true : undefined}
            className={cn(
              'flex-1',
              compact ? '[&_input]:h-7 [&_input]:text-sm' : '[&_input]:h-9',
            )}
            ref={focusOnMount}
            placeholder="e.g., $1,000 or 2.5M"
          />
          {renderActionButtons()}
        </div>
        {validationError && (
          <p className="text-destructive px-1 text-xs">{validationError}</p>
        )}
      </div>
    );
  }

  // Default: Textarea for verbatim and other types
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        /*
         * The foundation field takes layout classes on its wrapper and needs the
         * `[&_textarea]` reach for anything belonging to the control itself —
         * otherwise a taller `min-h` stretches the wrapper's fill past the
         * bordered field and leaves a bare strip under it.
         */
        className={cn(
          'flex-1 [&_textarea]:resize-none',
          compact
            ? '[&_textarea]:min-h-[60px]'
            : 'max-w-[600px] [&_textarea]:min-h-[120px]',
        )}
        ref={focusOnMount}
      />
      {renderActionButtons()}
    </div>
  );
}

export default CellEditInput;
