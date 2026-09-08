import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailSecondaryText,
  EmailLink,
} from '../email-layout.js';

describe('EmailLayout', () => {
  describe('EmailLayout component', () => {
    it('renders all required sections', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="This is the preheader text"
          footer="This is the footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <p>Main content</p>
        </EmailLayout>,
      );

      expect(html).toContain('lang="en"');
      expect(html).toContain('This is the preheader text');
      expect(html).toContain('Moritz');
      expect(html).toContain('Main content');
      expect(html).toContain('This is the footer');
      expect(html).toContain('© 2026 Moritz. All rights reserved.');
    });

    it('renders the preheader as hidden text', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Preheader text"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <p>Content</p>
        </EmailLayout>,
      );

      // Preheader should be hidden (display: none)
      expect(html).toMatch(/display:none[^>]*>Preheader text/);
    });

    it('uses the correct HTML structure for email compatibility', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Preheader"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <p>Content</p>
        </EmailLayout>,
      );

      // Should use tables for layout (email-safe structure)
      expect(html).toContain('role="presentation"');
      expect(html).toContain('cellPadding="0"');
      expect(html).toContain('cellSpacing="0"');
      expect(html).toContain('width="600"');
      expect(html).toContain('background:#f6f9fc');
    });

    it('applies correct styling for main content card', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Test"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <p>Content</p>
        </EmailLayout>,
      );

      // Main card styling
      expect(html).toMatch(/background:#ffffff/);
      expect(html).toMatch(/border-radius:12px/);
      expect(html).toMatch(/border:1px solid #e5e7eb/);
    });

    it('renders with different locales', () => {
      const locales = ['en', 'nb', 'es', 'fr', 'de'];

      locales.forEach((locale) => {
        const html = renderToString(
          <EmailLayout
            locale={locale}
            preheader="Test"
            footer="Footer"
            appName="Moritz"
            copyright="© 2026 Moritz. All rights reserved."
          >
            <p>Content</p>
          </EmailLayout>,
        );

        expect(html).toContain(`lang="${locale}"`);
      });
    });
  });

  describe('EmailHeading component', () => {
    it('renders heading with correct styling', () => {
      const html = renderToString(<EmailHeading>Test Heading</EmailHeading>);

      expect(html).toContain('<h1');
      expect(html).toContain('Test Heading');
      expect(html).toMatch(/font-size:22px/);
      expect(html).toMatch(/margin:0 0 12px/);
      expect(html).toMatch(/line-height:1\.3/);
    });

    it('renders children content', () => {
      const html = renderToString(
        <EmailHeading>
          <strong>Bold</strong> Heading
        </EmailHeading>,
      );

      expect(html).toContain('<strong>Bold</strong> Heading');
    });
  });

  describe('EmailText component', () => {
    it('renders paragraph with correct styling', () => {
      const html = renderToString(
        <EmailText>This is some text content.</EmailText>,
      );

      expect(html).toContain('<p');
      expect(html).toContain('This is some text content.');
      expect(html).toMatch(/font-size:14px/);
      expect(html).toMatch(/color:#4b5563/);
      expect(html).toMatch(/margin:0 0 16px/);
    });

    it('renders children content', () => {
      const html = renderToString(
        <EmailText>
          Text with <em>emphasis</em>
        </EmailText>,
      );

      expect(html).toContain('Text with <em>emphasis</em>');
    });
  });

  describe('EmailButton component', () => {
    it('renders button with correct styling and attributes', () => {
      const html = renderToString(
        <EmailButton href="https://example.com/action">Click Me</EmailButton>,
      );

      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com/action"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('Click Me');
      expect(html).toMatch(/background-color:#111827/);
      expect(html).toMatch(/color:#ffffff/);
      expect(html).toMatch(/text-decoration:none/);
      expect(html).toMatch(/border-radius:6px/);
      expect(html).toMatch(/font-weight:600/);
    });

    it('renders as inline-block', () => {
      const html = renderToString(
        <EmailButton href="https://example.com">Button</EmailButton>,
      );

      expect(html).toMatch(/display:inline-block/);
    });

    it('has proper padding', () => {
      const html = renderToString(
        <EmailButton href="https://example.com">Button</EmailButton>,
      );

      expect(html).toMatch(/padding:12px 18px/);
    });
  });

  describe('EmailSecondaryText component', () => {
    it('renders with correct styling', () => {
      const html = renderToString(
        <EmailSecondaryText>Secondary information</EmailSecondaryText>,
      );

      expect(html).toContain('<p');
      expect(html).toContain('Secondary information');
      expect(html).toMatch(/font-size:12px/);
      expect(html).toMatch(/color:#6b7280/);
      expect(html).toMatch(/margin:0 0 16px/);
    });

    it('renders children content', () => {
      const html = renderToString(
        <EmailSecondaryText>
          Small <span>text</span>
        </EmailSecondaryText>,
      );

      expect(html).toContain('Small <span>text</span>');
    });
  });

  describe('EmailLink component', () => {
    it('renders link with correct styling and attributes', () => {
      const html = renderToString(
        <EmailLink href="https://example.com/link">View more</EmailLink>,
      );

      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com/link"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('View more');
      expect(html).toMatch(/color:#2563eb/);
      expect(html).toMatch(/font-size:12px/);
    });

    it('applies word-break when breakAll is true', () => {
      const html = renderToString(
        <EmailLink href="https://example.com/very-long-url" breakAll>
          https://example.com/very-long-url
        </EmailLink>,
      );

      expect(html).toMatch(/word-break:break-all/);
    });

    it('does not apply word-break when breakAll is false or undefined', () => {
      const html = renderToString(
        <EmailLink href="https://example.com">Link</EmailLink>,
      );

      expect(html).toMatch(/word-break:normal/);
    });

    it('renders children content', () => {
      const html = renderToString(
        <EmailLink href="https://example.com">
          Click <strong>here</strong>
        </EmailLink>,
      );

      expect(html).toContain('Click <strong>here</strong>');
    });
  });

  describe('Integration tests', () => {
    it('renders a complete email with all components', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Welcome to our service"
          footer="If you have questions, contact support"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <EmailHeading>Welcome!</EmailHeading>
          <EmailText>
            Thank you for joining. We&apos;re excited to have you on board.
          </EmailText>
          <EmailButton href="https://example.com/get-started">
            Get Started
          </EmailButton>
          <EmailSecondaryText>This link expires in 7 days.</EmailSecondaryText>
          <EmailLink href="https://example.com/help">Need help?</EmailLink>
        </EmailLayout>,
      );

      // Check all components are present
      expect(html).toContain('Welcome to our service');
      expect(html).toContain('Moritz');
      expect(html).toContain('Welcome!');
      expect(html).toContain('Thank you for joining');
      expect(html).toContain('Get Started');
      expect(html).toContain('https://example.com/get-started');
      expect(html).toContain('This link expires in 7 days');
      expect(html).toContain('Need help?');
      expect(html).toContain('https://example.com/help');
      expect(html).toContain('If you have questions, contact support');
      expect(html).toContain('© 2026 Moritz. All rights reserved.');
    });

    it('maintains proper email structure with nested components', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Test"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <div>
            <EmailHeading>Title</EmailHeading>
            <div>
              <EmailText>Nested text</EmailText>
              <EmailButton href="https://example.com">Action</EmailButton>
            </div>
          </div>
        </EmailLayout>,
      );

      // Should maintain table-based structure
      expect(html).toContain('role="presentation"');
      expect(html).toContain('Title');
      expect(html).toContain('Nested text');
      expect(html).toContain('Action');
    });
  });

  describe('Email client compatibility', () => {
    it('uses inline styles instead of classes', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Test"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <EmailHeading>Test</EmailHeading>
          <EmailText>Text</EmailText>
          <EmailButton href="https://example.com">Button</EmailButton>
        </EmailLayout>,
      );

      // Should use inline styles (style attribute)
      expect(html).toMatch(/style="/);
      // Should not use CSS classes (which may not work in all email clients)
      expect(html).not.toMatch(/class="/);
    });

    it('uses absolute units (px) for sizing', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Test"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <EmailHeading>Test</EmailHeading>
          <EmailText>Text</EmailText>
        </EmailLayout>,
      );

      // Should use px units (more reliable in email clients)
      expect(html).toMatch(/font-size:\d+px/);
      expect(html).toMatch(/padding:\d+px/);
      expect(html).toMatch(/border-radius:\d+px/);
      // Should not use relative units like rem or em
      expect(html).not.toMatch(/\d+rem/);
      expect(html).not.toMatch(/\d+em(?!ail)/); // Exclude 'email' word
    });

    it('uses hex colors instead of named colors', () => {
      const html = renderToString(
        <EmailLayout
          locale="en"
          preheader="Test"
          footer="Footer"
          appName="Moritz"
          copyright="© 2026 Moritz. All rights reserved."
        >
          <EmailText>Text</EmailText>
          <EmailButton href="https://example.com">Button</EmailButton>
        </EmailLayout>,
      );

      // Should use hex colors
      expect(html).toMatch(/#[0-9a-fA-F]{6}/);
    });
  });
});
