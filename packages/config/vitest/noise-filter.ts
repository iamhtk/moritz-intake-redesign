const globalFlag = '__repoVitestNoiseFilterInstalled__';

type ConsoleMethod = (...args: unknown[]) => void;

const alwaysSuppressedFragments = [
  'No IP address found in x-forwarded-for header',
  'Failed to send Slack notification for invoice payment',
  'Failed to create promotion code for company',
  'This will cause a hydration error.',
  'not wrapped in act(...)',
  'When testing, code that causes React state updates should be wrapped into act(...)',
  'act(() => {',
  '/* fire events that update state */',
  '/* assert on the output */',
  'Learn more at https://react.dev/link/wrap-tests-with-act',
  'Audit log write failed:',
  'First draft generation failed',
  'Failed to update status to FAILED',
  '" stood down: ',
];

function getMessageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  return '';
}

function shouldSuppressAuditDbNoise(args: unknown[]): boolean {
  if (args.length === 0) return false;
  const first = args[0];
  if (
    first !== 'Audit log write failed:' &&
    first !== 'WorkOS audit log write failed:'
  ) {
    return false;
  }

  return args
    .map(getMessageText)
    .some((text) =>
      text.includes('DRIZZLE_DATABASE_URL is required when using Drizzle'),
    );
}

function shouldSuppressAlwaysNoisyTestMessage(args: unknown[]): boolean {
  const text = args.map(getMessageText).join('\n');
  return alwaysSuppressedFragments.some((fragment) => text.includes(fragment));
}

function wrapConsoleMethod(method: ConsoleMethod): ConsoleMethod {
  return (...args: unknown[]) => {
    if (
      shouldSuppressAuditDbNoise(args) ||
      shouldSuppressAlwaysNoisyTestMessage(args)
    ) {
      return;
    }
    method(...args);
  };
}

const globalWithFlag = globalThis as typeof globalThis & {
  [globalFlag]?: boolean;
};

if (!globalWithFlag[globalFlag]) {
  console.error = wrapConsoleMethod(console.error.bind(console));
  console.warn = wrapConsoleMethod(console.warn.bind(console));
  globalWithFlag[globalFlag] = true;
}
