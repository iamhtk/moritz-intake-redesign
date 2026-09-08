'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_LOCALE = 'en-US';

export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
}

export function useDateFormatter() {
  const isMounted = useIsMounted();
  return useCallback(
    (options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        ...options,
        // On SSR we pin to UTC so the server-rendered string matches the client until mount.
        timeZone: isMounted ? undefined : 'UTC',
      }),
    [isMounted],
  );
}

interface FormattedDateProps {
  date: Date | string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export function FormattedDate({
  date,
  options = DEFAULT_OPTIONS,
  className,
}: FormattedDateProps) {
  const createFormatter = useDateFormatter();
  const parsed = useMemo(
    () => (date instanceof Date ? date : new Date(date)),
    [date],
  );
  const formatted = useMemo(
    () => createFormatter(options).format(parsed),
    [createFormatter, options, parsed],
  );

  return (
    <time
      dateTime={parsed.toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {formatted}
    </time>
  );
}
