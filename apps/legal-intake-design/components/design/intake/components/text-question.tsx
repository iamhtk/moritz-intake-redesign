'use client';

import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import { Button } from '@/components/design/design-system/button';
import { cn } from '@repo/ui/lib/utils';

type TextQuestionProps = {
  id: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  suggestions?: readonly string[];
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onEnter?: () => void;
};

/** Single-line or multi-line free-text input with optional suggestion chips. */
export function TextQuestion({
  id,
  value,
  multiline = false,
  placeholder,
  maxLength,
  suggestions,
  autoFocus = false,
  onChange,
  onEnter,
}: TextQuestionProps) {
  return (
    <div className="space-y-3">
      {suggestions && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'rounded-full',
                value === suggestion && 'border-primary bg-primary/5',
              )}
              onClick={() => onChange(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onEnter?.();
            }
          }}
        />
      )}
      {maxLength ? (
        <p className="text-muted-foreground text-right text-xs">
          {value.length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}
