'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@/components/design/design-system/input';
import { Label } from '@repo/ui/components/label';
import { Sparkles } from '@repo/ui/icons';
import { composeDealSummary } from '../openai-intake-helpers';

type GuidedDealSubflowProps = {
  open: boolean;
  aiEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (summary: string) => void;
};

const STEPS = [
  {
    id: 'whoDoesWhat',
    label: 'Who does what?',
    placeholder: 'e.g. A designer redesigns my website',
  },
  {
    id: 'whoPaysWhom',
    label: 'Who pays whom?',
    placeholder: 'e.g. I pay them a flat fee of $8,000',
  },
  {
    id: 'whenIsItDone',
    label: 'When is it done?',
    placeholder: 'e.g. delivered within 6 weeks',
  },
] as const;

/**
 * Escape hatch for the draft path "what's the deal" question. Walks the user
 * through three small prompts, then composes a single plain-English sentence
 * (smarter if an OpenAI key is configured).
 */
export function GuidedDealSubflow({
  open,
  aiEnabled,
  onOpenChange,
  onComplete,
}: GuidedDealSubflowProps) {
  const [parts, setParts] = useState({
    whoDoesWhat: '',
    whoPaysWhom: '',
    whenIsItDone: '',
  });
  const [composing, setComposing] = useState(false);

  const handleComplete = async () => {
    setComposing(true);
    try {
      const summary = await composeDealSummary(parts);
      onComplete(summary);
      onOpenChange(false);
    } finally {
      setComposing(false);
    }
  };

  const hasAnyInput = Object.values(parts).some((v) => v.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Let&apos;s think it through together</DialogTitle>
          <DialogDescription>
            Answer these three and we&apos;ll turn them into one clear sentence.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.id} className="space-y-1.5">
              <Label htmlFor={`guided-${step.id}`}>{step.label}</Label>
              <Input
                id={`guided-${step.id}`}
                value={parts[step.id]}
                placeholder={step.placeholder}
                onChange={(event) =>
                  setParts((current) => ({
                    ...current,
                    [step.id]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!hasAnyInput || composing}
            onClick={handleComplete}
          >
            {aiEnabled ? (
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            ) : null}
            {composing ? 'Composing…' : 'Use this'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
