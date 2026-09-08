'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type HomepageHeroProps = {
  name: string;
};

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'fallback';

function timeOfDayFor(hour: number): TimeOfDay {
  if (hour < 5) return 'evening';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Homepage hero: a time-of-day greeting. The greeting resolves on the client
 * (after mount) to match the visitor's local time, so it renders a neutral
 * "Welcome back" fallback on the server and swaps in once hydrated
 * (`suppressHydrationWarning`).
 */
export function HomepageHero({ name }: HomepageHeroProps) {
  const tGreeting = useTranslations('dashboard.client.homepageV2.greeting');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('fallback');

  useEffect(() => {
    setTimeOfDay(timeOfDayFor(new Date().getHours()));
  }, []);

  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <h1
      className="text-center font-serif text-[2rem] font-semibold tracking-tight sm:text-[2.5rem]"
      suppressHydrationWarning
    >
      {tGreeting(timeOfDay)}, <em className="italic">{firstName}</em>
    </h1>
  );
}
