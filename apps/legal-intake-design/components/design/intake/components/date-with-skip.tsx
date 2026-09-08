'use client';

import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@/components/design/design-system/input';
import { Label } from '@repo/ui/components/label';

type DateWithSkipProps = {
  id: string;
  date?: string;
  noDeadline?: boolean;
  skipLabel?: string;
  onDateChange: (value: string) => void;
  onNoDeadlineChange: (value: boolean) => void;
};

/** Date picker paired with a "No specific deadline" checkbox. */
export function DateWithSkip({
  id,
  date,
  noDeadline,
  skipLabel = 'No specific deadline',
  onDateChange,
  onNoDeadlineChange,
}: DateWithSkipProps) {
  return (
    <div className="space-y-4">
      <Input
        id={id}
        type="date"
        value={date ?? ''}
        disabled={noDeadline}
        className="max-w-xs"
        onChange={(event) => onDateChange(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${id}-no-deadline`}
          checked={noDeadline ?? false}
          onCheckedChange={(checked) => onNoDeadlineChange(checked === true)}
        />
        <Label htmlFor={`${id}-no-deadline`} className="font-normal">
          {skipLabel}
        </Label>
      </div>
    </div>
  );
}
