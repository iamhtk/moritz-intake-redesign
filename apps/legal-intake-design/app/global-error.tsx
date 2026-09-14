'use client';

/**
 * The last resort: a failure in the locale layout itself, which is the one
 * place the app's own shell — fonts, providers, `<body>` — is not available
 * to render an apology in.
 *
 * So this file owns its `<html>` and `<body>`, imports nothing from the
 * design system, and is styled inline. Every dependency it took would be a
 * dependency that could be the reason it is rendering.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
          color: '#1c1c1c',
          background: '#fff',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: '0.75rem 0 1.5rem',
              lineHeight: 1.6,
              color: '#5c5c5c',
            }}
          >
            Moritz could not start this page. Nothing you have sent has been
            lost.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: 'pointer',
              borderRadius: '0.5rem',
              border: '1px solid #1c1c1c',
              background: '#1c1c1c',
              color: '#fff',
              padding: '0.5rem 1rem',
              font: 'inherit',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: '1.5rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.6875rem',
                color: '#9a9a9a',
              }}
            >
              {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
