/**
 * Registry of the commercial matter flows plus the matter-type chips. Each flow
 * asks its own short list of open-ended questions before converging on the
 * shared urgency -> documents -> recap tail.
 */

import {
  type MatterFlow,
  type MatterId,
  type SuggestionChip,
} from '../intake-types';
import { chip } from './shared';
import { contractFlow } from './contract';
import { employmentFlow } from './employment';
import { procurementFlow } from './procurement';
import { corporateFlow } from './corporate';
import { maFlow } from './ma';
import { otherFlow } from './other';

export const MATTER_FLOWS: Record<MatterId, MatterFlow> = {
  contract: contractFlow,
  employment: employmentFlow,
  procurement: procurementFlow,
  corporate: corporateFlow,
  ma: maFlow,
  other: otherFlow,
};

/** The matter-type chips, in the order shown to the client. */
export const MATTER_CHIPS: SuggestionChip[] = (
  ['contract', 'employment', 'procurement', 'corporate', 'ma', 'other'] as const
).map((id) => chip(id, MATTER_FLOWS[id].label));

export {
  URGENCY_QUESTION,
  DOCUMENTS_QUESTION,
  RECAP_QUESTION,
  urgencyRush,
} from './shared';
