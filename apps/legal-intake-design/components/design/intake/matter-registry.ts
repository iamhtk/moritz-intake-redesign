/**
 * Registry of every matter-intake definition, plus the presentation metadata
 * the hub needs (icon + blurb). The generic `IntakeFlow` reads a definition by
 * id; the hub renders one card per entry, all routing into the same wizard.
 */

import {
  Briefcase,
  Building2,
  FileSignature,
  HandCoins,
  HelpCircle,
  ShoppingCart,
  type LucideIcon,
} from '@repo/ui/icons';
import type { MatterIntakeDefinition } from './intake-types';
import { contractMatter } from './matters/contract';
import { employmentMatter } from './matters/employment';
import { procurementMatter } from './matters/procurement';
import { corporateMatter } from './matters/corporate';
import { maMatter } from './matters/ma';

export const MATTER_REGISTRY = {
  contract: contractMatter,
  employment: employmentMatter,
  procurement: procurementMatter,
  corporate: corporateMatter,
  ma: maMatter,
} satisfies Record<string, MatterIntakeDefinition>;

export type MatterId = keyof typeof MATTER_REGISTRY;

export function getMatterDefinition(id: string): MatterIntakeDefinition | null {
  return (
    (MATTER_REGISTRY as Record<string, MatterIntakeDefinition>)[id] ?? null
  );
}

export type MatterPickerCard = {
  /** Stable React key (unique even when two cards route to the same matter). */
  key: string;
  /** Matter flow this card hands off to. */
  id: MatterId;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

/**
 * Presentation metadata for the in-chat matter-type quick-pick cards, in
 * display order. Shown in the unified entry chat as the fallback when the
 * classifier can't confidently route a free-text description. "M&A" and
 * "Other" are separate cards but both hand off to the `ma` catch-all flow.
 */
export const MATTER_PICKER_CARDS: readonly MatterPickerCard[] = [
  {
    key: 'contract',
    id: 'contract',
    label: 'Contract',
    blurb: 'Draft, review, negotiate, or dispute a contract.',
    icon: FileSignature,
  },
  {
    key: 'employment',
    id: 'employment',
    label: 'Employment',
    blurb: 'Hiring, offers, terminations, equity grants.',
    icon: Briefcase,
  },
  {
    key: 'procurement',
    id: 'procurement',
    label: 'Procurement',
    blurb: 'Vendor selection, RFPs, purchasing.',
    icon: ShoppingCart,
  },
  {
    key: 'corporate',
    id: 'corporate',
    label: 'Corporate',
    blurb: 'Entity setup, governance, financings.',
    icon: Building2,
  },
  {
    key: 'ma',
    id: 'ma',
    label: 'M&A',
    blurb: 'Acquisitions, mergers, sales, or investments.',
    icon: HandCoins,
  },
  {
    key: 'other',
    id: 'ma',
    label: 'Other',
    blurb: 'Not sure where it fits, or something else entirely.',
    icon: HelpCircle,
  },
];
