import { Section } from '@/components/design/foundations/showcase/section';
import {
  MarkdownContentInChatExample,
  MarkdownContentPlaygroundExample,
  MarkdownContentSanitizationExample,
  MarkdownContentStreamingExample,
} from '@/components/design/foundations/examples/markdown-content-examples';

export default function MarkdownContentFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Markdown Content</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Renders model-authored markdown. Use it wherever an agent writes the
          text: chat transcripts, drafts, summaries. It sanitizes on the way in,
          so it is safe to point at output derived from documents we did not
          write.
        </p>
      </header>

      <Section
        title="Playground"
        description="Edit the source and watch it render. Variant sets the type scale, streaming completes unterminated markdown before parsing."
      >
        <MarkdownContentPlaygroundExample />
      </Section>

      <Section
        title="In a chat bubble"
        description="The chat variant inherits the surrounding type scale, so headings shift weight instead of jumping to a display size, and blocks sit tighter together."
      >
        <MarkdownContentInChatExample />
      </Section>

      <Section
        title="Streaming"
        description="Press replay and watch the same text arrive in both panes. Unterminated emphasis, code and links are closed before parsing, so a partial message renders as formatted text rather than showing its markers and reflowing once the closer lands. Leave it off for settled text, where completing markdown would corrupt it."
      >
        <MarkdownContentStreamingExample />
      </Section>

      <Section
        title="What gets stripped"
        description="Images never render: an img is fetched without a click, so an injected URL would be a silent request to an arbitrary host. Raw HTML is dropped rather than parsed, and script-protocol links keep their text but lose the href."
      >
        <MarkdownContentSanitizationExample />
      </Section>
    </>
  );
}
