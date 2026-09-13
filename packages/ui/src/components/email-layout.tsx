import * as React from 'react';

interface EmailBodyProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Translated app name for the header */
  appName: string;
  /** Translated copyright text (e.g., "© 2026 Moritz. All rights reserved.") */
  copyright: string;
}

/**
 * The visible part of a transactional email: the card, its header, the content,
 * the footer rule and the copyright line.
 *
 * Split out of {@link EmailLayout} so a surface that cannot host `<html>` can
 * still show the real email rather than an imitation of it. The intake renders
 * a preview of the confirmation email inside the prototype, and a hand-built
 * lookalike there would drift from what actually gets sent the first time
 * either is touched. Everything the recipient sees lives here; `EmailLayout`
 * adds only the document, the background and the hidden preheader.
 */
export function EmailBody({
  children,
  footer,
  appName,
  copyright,
}: EmailBodyProps) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ background: '#f6f9fc', padding: '24px 0' }}
    >
      <tbody>
        <tr>
          <td align="center">
            {/* Content container */}
            <table
              role="presentation"
              width="600"
              cellPadding={0}
              cellSpacing={0}
              style={{ width: '100%', maxWidth: 600 }}
            >
              <tbody>
                {/* Main content card */}
                <tr>
                  <td
                    style={{
                      background: '#ffffff',
                      borderRadius: 12,
                      padding: 28,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {/* App name header */}
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {appName}
                    </div>

                    {/* Main content */}
                    {children}

                    {/* Footer divider */}
                    <hr
                      style={{
                        border: 'none',
                        borderTop: '1px solid #e5e7eb',
                        margin: '16px 0',
                      }}
                    />

                    {/* Footer text */}
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                      {footer}
                    </p>
                  </td>
                </tr>

                {/* Copyright row */}
                <tr>
                  <td
                    style={{
                      textAlign: 'center',
                      padding: '12px 0',
                      color: '#9ca3af',
                      fontSize: 12,
                    }}
                  >
                    {copyright}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

interface EmailLayoutProps {
  locale: string;
  preheader: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Translated app name for the header */
  appName: string;
  /** Translated copyright text (e.g., "© 2026 Moritz. All rights reserved.") */
  copyright: string;
}

/**
 * Shared email layout component for all transactional emails.
 * Provides consistent structure, styling, and branding.
 */
export function EmailLayout({
  locale,
  preheader,
  children,
  footer,
  appName,
  copyright,
}: EmailLayoutProps) {
  return (
    <html lang={locale}>
      <body style={{ margin: 0, padding: 0, background: '#f6f9fc' }}>
        {/* Preheader text (hidden, shown in email client preview) */}
        <div
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
            opacity: 0,
          }}
        >
          {preheader}
        </div>

        {/* Main email table */}
        <EmailBody appName={appName} copyright={copyright} footer={footer}>
          {children}
        </EmailBody>
      </body>
    </html>
  );
}

interface EmailHeadingProps {
  children: React.ReactNode;
}

/**
 * Standardized email heading (h1)
 */
export function EmailHeading({ children }: EmailHeadingProps) {
  return (
    <h1
      style={{
        margin: '0 0 12px',
        fontSize: 22,
        lineHeight: 1.3,
      }}
    >
      {children}
    </h1>
  );
}

interface EmailTextProps {
  children: React.ReactNode;
}

/**
 * Standardized email paragraph text
 */
export function EmailText({ children }: EmailTextProps) {
  return (
    <p
      style={{
        margin: '0 0 16px',
        fontSize: 14,
        color: '#4b5563',
      }}
    >
      {children}
    </p>
  );
}

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Standardized email call-to-action button
 */
export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <p style={{ margin: '20px 0' }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: '#111827',
          color: '#ffffff',
          textDecoration: 'none',
          display: 'inline-block',
          padding: '12px 18px',
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        {children}
      </a>
    </p>
  );
}

interface EmailSecondaryTextProps {
  children: React.ReactNode;
}

/**
 * Standardized secondary text (smaller, muted)
 */
export function EmailSecondaryText({ children }: EmailSecondaryTextProps) {
  return (
    <p
      style={{
        margin: '0 0 16px',
        fontSize: 12,
        color: '#6b7280',
      }}
    >
      {children}
    </p>
  );
}

interface EmailLinkProps {
  href: string;
  children: React.ReactNode;
  breakAll?: boolean;
}

/**
 * Standardized email link
 */
export function EmailLink({ href, children, breakAll }: EmailLinkProps) {
  return (
    <p
      style={{
        wordBreak: breakAll ? 'break-all' : 'normal',
        margin: '0 0 16px',
        fontSize: 12,
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#2563eb' }}
      >
        {children}
      </a>
    </p>
  );
}
