'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { MOCK_CLIENT_ENGAGEMENT_LETTER } from '@/lib/mocks/engagement-letters';
import { MOCK_CLIENT_USER } from '@/lib/mocks/users';
import { EngagementLetterDialog } from './engagement-letter-dialog';
import type { ClientEngagementLetter } from '@/lib/types';

const STORAGE_KEY = 'playground:client-engagement-letter';

type ClientEngagementContextValue = {
  enabled: boolean;
  letter: ClientEngagementLetter | null;
  isPending: boolean;
  openSigning: () => void;
};

const ClientEngagementContext =
  createContext<ClientEngagementContextValue | null>(null);

type ClientEngagementProviderProps = {
  children: ReactNode;
};

function loadStoredLetter(): ClientEngagementLetter | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClientEngagementLetter>;
    if (
      parsed.companyId !== MOCK_CLIENT_ENGAGEMENT_LETTER.companyId ||
      parsed.status !== 'SIGNED' ||
      typeof parsed.signedAt !== 'string' ||
      typeof parsed.signedBy !== 'string' ||
      typeof parsed.signedTitle !== 'string' ||
      (parsed.signatureMethod !== 'typed' && parsed.signatureMethod !== 'drawn')
    ) {
      return null;
    }
    return {
      ...MOCK_CLIENT_ENGAGEMENT_LETTER,
      status: 'SIGNED',
      signedAt: parsed.signedAt,
      signedBy: parsed.signedBy,
      signedTitle: parsed.signedTitle,
      signatureMethod: parsed.signatureMethod,
    };
  } catch {
    return null;
  }
}

function persistLetter(letter: ClientEngagementLetter) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(letter));
  } catch {
    // The playground still works for this session when storage is unavailable.
  }
}

export function ClientEngagementProvider({
  children,
}: ClientEngagementProviderProps) {
  const { flags } = useDesignFlags();
  const [letter, setLetter] = useState<ClientEngagementLetter>(
    MOCK_CLIENT_ENGAGEMENT_LETTER,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const enabled = Boolean(flags.useInPlatformEngagementLetter);
  const isPending = enabled && letter.status === 'PENDING';

  useEffect(() => {
    const stored = loadStoredLetter();
    if (stored) setLetter(stored);
  }, []);

  const openSigning = useCallback(() => {
    if (isPending) setIsDialogOpen(true);
  }, [isPending]);

  const handleSign = useCallback(
    ({
      signedBy,
      signedTitle,
      signatureMethod,
    }: {
      signedBy: string;
      signedTitle: string;
      signatureMethod: 'typed' | 'drawn';
    }) => {
      const signedAt = new Date().toISOString();
      const signedLetter: ClientEngagementLetter = {
        ...letter,
        status: 'SIGNED',
        signedAt,
        signedBy,
        signedTitle,
        signatureMethod,
      };
      setLetter(signedLetter);
      persistLetter(signedLetter);
      setIsDialogOpen(false);
      toast.success('Engagement Letter signed. You can now submit cases.');
    },
    [letter],
  );

  const value = useMemo(
    () => ({
      enabled,
      letter: enabled ? letter : null,
      isPending,
      openSigning,
    }),
    [enabled, isPending, letter, openSigning],
  );

  return (
    <ClientEngagementContext.Provider value={value}>
      {children}
      {enabled ? (
        <EngagementLetterDialog
          companyName={MOCK_CLIENT_USER.company.name}
          signerName={MOCK_CLIENT_USER.name}
          signerTitle="Operations Lead"
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSign={handleSign}
        />
      ) : null}
    </ClientEngagementContext.Provider>
  );
}

export function useClientEngagement() {
  const context = useContext(ClientEngagementContext);
  if (!context) {
    return {
      enabled: false,
      letter: null,
      isPending: false,
      openSigning: () => undefined,
    } satisfies ClientEngagementContextValue;
  }
  return context;
}
