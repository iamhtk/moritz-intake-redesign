import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarkdownContent } from '../markdown-content.js';

describe('MarkdownContent', () => {
  it('renders GFM markdown as elements', () => {
    const html = renderToString(
      <MarkdownContent
        content={'# Title\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |'}
      />,
    );

    expect(html).toContain('<h1');
    expect(html).toContain('<li');
    expect(html).toContain('<table');
  });

  // Tailwind preflight resets h4-h6 to body text, and #### is common in model
  // output, so an unstyled heading would be indistinguishable from a sentence.
  it('styles h4 through h6 rather than leaving them as body text', () => {
    const html = renderToString(
      <MarkdownContent
        variant="chat"
        content={'#### four\n\n##### five\n\n###### six'}
      />,
    );

    for (const tag of ['h4', 'h5', 'h6']) {
      expect(html).toContain(`<${tag} class="`);
    }
  });

  it('renders fenced code in a pre and inline code as a chip', () => {
    const html = renderToString(
      <MarkdownContent
        content={'Use `cn()` here.\n\n```ts\nconst a = 1;\n```'}
      />,
    );

    expect(html).toContain('<pre');
    expect(html).toContain('cn()');
  });

  describe('sanitization', () => {
    it('does not emit script tags from raw HTML', () => {
      const html = renderToString(
        <MarkdownContent content={'<script>alert(1)</script>\n\nhi'} />,
      );

      expect(html).not.toContain('<script');
      expect(html).not.toContain('alert(1)');
    });

    it('strips javascript: hrefs', () => {
      const html = renderToString(
        <MarkdownContent content={'[click](javascript:alert(1))'} />,
      );

      expect(html).not.toContain('javascript:');
      expect(html).toContain('click');
    });

    // An <img> is fetched without a click, so an injected image URL in model
    // output would be a silent outbound GET carrying whatever it encoded.
    it('does not render remote images from model output', () => {
      const html = renderToString(
        <MarkdownContent
          content={'![alt text](https://elsewhere.example/p?d=leak)'}
        />,
      );

      expect(html).not.toContain('<img');
      expect(html).not.toContain('elsewhere.example');
      expect(html).not.toContain('preload');
    });

    it('does not render data: images either', () => {
      const html = renderToString(
        <MarkdownContent
          content={'![x](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)'}
        />,
      );

      expect(html).not.toContain('<img');
      expect(html).not.toContain('data:image');
    });

    it('keeps ordinary links, opened safely', () => {
      const html = renderToString(
        <MarkdownContent content={'[docs](https://example.com)'} />,
      );

      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('line breaks', () => {
    it('keeps single newlines as breaks in chat, as the old bubble did', () => {
      const html = renderToString(
        <MarkdownContent variant="chat" content={'line one\nline two'} />,
      );

      expect(html).toContain('<br');
    });

    it('folds single newlines into the paragraph in document prose', () => {
      const html = renderToString(
        <MarkdownContent content={'line one\nline two'} />,
      );

      expect(html).not.toContain('<br');
    });
  });

  describe('streaming', () => {
    it('closes unterminated emphasis instead of showing the markers', () => {
      const html = renderToString(
        <MarkdownContent streaming content="this is **half a bold" />,
      );

      expect(html).toContain('<strong>half a bold</strong>');
      expect(html).not.toContain('**');
    });

    it('renders a half-typed link as its own text, with no href', () => {
      const html = renderToString(
        <MarkdownContent streaming content="see [the docs](https://exam" />,
      );

      expect(html).toContain('the docs');
      expect(html).not.toContain('<a ');
      expect(html).not.toContain('streamdown:');
    });

    it('leaves settled text alone when not streaming', () => {
      const html = renderToString(
        <MarkdownContent content="a lone ** stays literal" />,
      );

      expect(html).not.toContain('<strong>');
    });
  });
});
