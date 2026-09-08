'use client';

import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import type { RegistrationState } from '@/components/registration-types';
import { SettingsModal } from './settings-modal';
import { useSettingsV2Modal } from './settings-v2-context';

type SettingsV2ModalProps = {
  registration: RegistrationState;
};

export function SettingsV2Modal({ registration }: SettingsV2ModalProps) {
  const { flags } = useDesignFlags();
  const { open, setOpen } = useSettingsV2Modal();

  if (!flags.useSettingsV2) return null;

  return (
    <SettingsModal
      open={open}
      onOpenChange={setOpen}
      registration={registration}
    />
  );
}
