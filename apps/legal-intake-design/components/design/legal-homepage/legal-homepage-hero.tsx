'use client';

import { useEffect, useState } from 'react';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'fallback';

const GREETINGS: Record<TimeOfDay, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  fallback: 'Welcome back',
};

function timeOfDayFor(hour: number): TimeOfDay {
  if (hour < 5) return 'evening';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Lawyer homepage hero: a serif time-of-day greeting plus a muted subline that
 * summarizes the day. The greeting resolves on the client (after mount) to the
 * visitor's local time, rendering a neutral "Welcome back" fallback on the
 * server and swapping in once hydrated (`suppressHydrationWarning`). The subline
 * is deterministic, so it is computed server-side and passed in.
 */
export function LegalHomepageHero({
  name,
  subline,
}: {
  name: string;
  subline: string;
}) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('fallback');

  useEffect(() => {
    setTimeOfDay(timeOfDayFor(new Date().getHours()));
  }, []);

  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <div className="flex flex-col gap-2">
      <h1
        className="font-serif text-[2rem] font-semibold tracking-tight sm:text-[2.5rem]"
        suppressHydrationWarning
      >
        {GREETINGS[timeOfDay]}, <em className="italic">{firstName}</em>
      </h1>
      <p className="text-muted-foreground text-balance text-base">{subline}</p>
    </div>
  );
}
