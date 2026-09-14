import type { Metadata } from 'next';
import { TalkScreen } from '@/components/design/talk/talk-screen';
import { isMatterId } from '@/components/design/new-case/intake-types';

export const metadata: Metadata = { title: 'Talk' };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ matter?: string }>;
}

/**
 * *Talk to a person*, on its own address.
 *
 * Its own route rather than a state of `/client/new`, because the nav reads the
 * URL: `EXTRA_ROUTES` maps `/client/new` to the title "New case", so a client
 * who asked to speak to a human would have sat under a heading offering to
 * start another matter. It is also the wrong shape for that page — see
 * `talk-screen.tsx` on why there is no brief column here.
 *
 * `?matter=` carries what the intake had worked out, so the picker can mark the
 * lawyer who fits. Validated rather than cast: the value is in a URL a reader
 * can edit, and `leadForMatter` takes `undefined` for "not known yet", which is
 * exactly what an unrecognised one means.
 */
export default async function ClientTalkPage({
  params,
  searchParams,
}: PageProps) {
  await params;
  const { matter } = await searchParams;

  return (
    <div className="h-full">
      <TalkScreen {...(isMatterId(matter) ? { matterId: matter } : {})} />
    </div>
  );
}
