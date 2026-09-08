'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Textarea } from '@/components/design/design-system/textarea';
import { AlertTriangle, CheckCircle2 } from '@repo/ui/icons';
import { toast } from 'sonner';

type Props = { caseId: string };

export function ProposalActions({ caseId: _ }: Props) {
  const [showQuote, setShowQuote] = useState(false);
  const [amount, setAmount] = useState('');

  const submitQuote = () => {
    toast.success('Quote submitted (mock).');
    setShowQuote(false);
  };

  return (
    <div className="space-y-2 pt-2">
      {!showQuote ? (
        <>
          <Button className="w-full gap-2" onClick={() => setShowQuote(true)}>
            <CheckCircle2 className="h-4 w-4" /> Submit quote
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => toast.success('Conflict reported (mock).')}
          >
            <AlertTriangle className="h-4 w-4" /> Report conflict
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => toast.success('Marked as not interested (mock).')}
          >
            Not interested
          </Button>
        </>
      ) : (
        <div className="space-y-2">
          <Field>
            <FieldLabel htmlFor="amount">Your quote (USD)</FieldLabel>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="memo">Notes (optional)</FieldLabel>
            <Textarea
              id="memo"
              rows={3}
              placeholder="Anything the client should know"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={submitQuote} className="flex-1">
              Submit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQuote(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
