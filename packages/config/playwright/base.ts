import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
} from '@playwright/test';

type CreatePlaywrightConfigOptions = {
  testDir?: string;
  baseURL?: string;
  webServer?: PlaywrightTestConfig['webServer'];
};

export function createPlaywrightConfig({
  testDir = './e2e',
  baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
  webServer,
}: CreatePlaywrightConfigOptions = {}) {
  const reporter: PlaywrightTestConfig['reporter'] = process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['github'],
        // Machine-readable results so CI can list failing/flaky tests directly
        // in the PR comment (see the E2E workflow's comment step).
        ['json', { outputFile: 'playwright-results.json' }],
      ]
    : [['list'], ['html', { open: 'never' }]];

  // When running against an environment fronted by the perimeter/ALB WAF (AWS
  // qa), the parallel suite floods the rate-based rule from one egress IP and
  // gets 403'd at the edge. CI assumes a read-only role, fetches the per-env
  // bypass token from Secrets Manager, and exposes it here; the WAF skips the
  // rate-limit check for requests carrying a valid token. Unset locally, so no
  // header is sent there.
  const wafBypassToken = process.env.PLAYWRIGHT_WAF_BYPASS_TOKEN;
  const extraHTTPHeaders = wafBypassToken
    ? { 'x-e2e-waf-bypass': wafBypassToken }
    : undefined;

  // Stripe's hosted checkout fingerprints automated browsers (via
  // `navigator.webdriver`) and flags their sessions as AI agents; a flagged
  // session's confirm stalls silently after submit until the attestation boxes
  // are ticked (see e2e/helpers/invoice.ts). Dropping the automation marker
  // does not reliably prevent the flagging, so the attestation there is what
  // actually carries the flow. Fingerprinting only: rendering is unaffected.
  const launchOptions = {
    args: ['--disable-blink-features=AutomationControlled'],
  };

  return defineConfig({
    testDir,
    // Keep runs against a local development server bounded: every worker can
    // trigger RSC compilation, polling, and SSE connections. CI may use all
    // CPUs only when it targets an independently deployed environment.
    fullyParallel: true,
    workers: process.env.CI && process.env.PLAYWRIGHT_BASE_URL ? '100%' : 4,
    retries: process.env.CI ? 2 : 0,
    timeout: 60_000,
    reporter,
    expect: {
      timeout: 10_000,
    },
    use: {
      baseURL,
      extraHTTPHeaders,
      trace: 'on-first-retry',
      video: 'retain-on-failure',
      screenshot: 'only-on-failure',
    },
    projects: [
      {
        // Runs *.setup.ts specs (e.g. auth.setup.ts) before any test project.
        // Lifecycle specs read the saved storage states this produces.
        name: 'setup',
        testMatch: /.*\.setup\.ts/,
      },
      {
        name: 'chromium-desktop',
        use: {
          ...devices['Desktop Chrome'],
          // Pin browser locale + timezone so date/number formatting and
          // Accept-Language are deterministic across runners. Stripe's IP-
          // based regional defaults are pinned separately app-side (see
          // lib/billing-service.ts).
          locale: 'en-US',
          timezoneId: 'UTC',
          launchOptions,
        },
        dependencies: ['setup'],
      },
      {
        // iPhone 14 viewport. Resolution + DPR only — no UA spoofing or touch
        // emulation: this project covers layout, not device behavior.
        name: 'chromium-mobile',
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 1,
          locale: 'en-US',
          timezoneId: 'UTC',
          launchOptions,
        },
        dependencies: ['setup'],
      },
    ],
    webServer,
  });
}
