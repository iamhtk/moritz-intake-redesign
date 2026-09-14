/**
 * Single source of truth for the playground's design feature flags.
 *
 * Each entry registers one toggle that appears in the Design playground
 * settings section. Flags are intended to gate forward-looking design
 * iterations so designers can A/B between the current production-replica
 * and the proposed new version on the same screen.
 *
 * To add a flag:
 *   1. Append an entry to DESIGN_FLAGS below.
 *   2. Read it from any client component via:
 *        const { flags } = useDesignFlags();
 *        if (flags.useNewIntakeFormLayout) { ... }
 *
 * Keep keys camelCase. They double as localStorage keys.
 */
export type DesignFlagDefinition = {
  key: string;
  label: string;
  description: string;
  defaultValue: boolean;
};

export const DESIGN_FLAGS: readonly DesignFlagDefinition[] = [
  {
    key: 'useSidebar',
    label: 'New sidebar layout',
    description: 'Dashboard-01 sidebar chrome.',
    defaultValue: true,
  },
  {
    key: 'useSettingsV2',
    label: 'Settings v2 modal',
    description: 'Tabbed settings modal.',
    defaultValue: true,
  },
  {
    key: 'useTopNav',
    label: 'Top navigation bar',
    description:
      'Horizontal top nav for client and lawyer areas (admin keeps the left sidebar).',
    defaultValue: true,
  },
  {
    key: 'usePlaybooks',
    label: 'Playbooks tab (Sales)',
    description:
      'Sales-only Playbooks destination in the top navigation (with a count badge like Cases). This version exists purely for sales demos; the real usage version is tracked separately.',
    defaultValue: false,
  },
  {
    key: 'usePlaybooksAdmin',
    label: 'Playbook Studio tab',
    description:
      'Adds a Playbook Studio destination to the internal admin app navigation, with a count badge like Cases. Real-usage version; only appears in the admin app.',
    defaultValue: false,
  },
  {
    key: 'useAiEvalsAdmin',
    label: 'AI Evals tab',
    description:
      'Adds the AI Evals quality workspace to the internal admin app, including gated runs, golden-set regression, and human calibration.',
    defaultValue: false,
  },
  {
    key: 'useFirstDraftsAdmin',
    label: 'First draft in a case',
    description:
      'Adds the First draft tab to the admin case page: the drafting conversation, the document and its versions, and the handoff to the lawyer.',
    defaultValue: false,
  },
  {
    key: 'useFirstDraftV0',
    label: 'First draft v0.1 (chat only)',
    description:
      'The first slice of the first draft, before the document preview exists: picking First draft keeps the case conversation in the main column and gives the rail to the drafting agent. No paper, versions, redline or handoff. Needs “First draft in a case”.',
    defaultValue: false,
  },
  {
    key: 'useTabularPlaybooksAdmin',
    label: 'Playbooks tab',
    description:
      'Adds the Playbooks contract-review workspace to the internal admin app: a spreadsheet of contracts against extracted questions, with filtering, agentic chat, a contract calendar and analytics.',
    defaultValue: true,
  },
  {
    key: 'usePlaybookRuleReview',
    label: 'Playbook rule review',
    description:
      'Rules the playbook agent writes or rewrites arrive as drafts needing a lawyer’s approval: draft markers down the grid, a draft count in the header that filters, bulk approval on a selection, and a stepper for working through a batch. Off, agent output lands straight in the playbook.',
    defaultValue: false,
  },
  {
    key: 'useHomepageSocialProof',
    label: 'Homepage social proof',
    description:
      'Adds a lawyer trust bar and a "Meet your legal team" profile row to the client homepage.',
    defaultValue: false,
  },
  {
    key: 'useEnterpriseAccount',
    label: 'Enterprise account',
    description:
      'Treats the current client as an enterprise account. After submitting a case they see their dedicated lawyers (notified directly) instead of a rotating shortlist of lawyers who could take it on.',
    defaultValue: false,
  },
  {
    key: 'useSlackIntegration',
    label: 'Slack integration',
    description:
      'Enterprise Slack layer: notifications + "Open in Slack" jump-back. Moritz stays the source of truth; no chat happens in Slack.',
    defaultValue: false,
  },
  {
    key: 'useIroncladIntegration',
    label: 'Ironclad integration',
    description:
      'Adds a "Start a case with Ironclad" quick action to the client homepage for teams that manage contracts in Ironclad.',
    defaultValue: false,
  },
  {
    key: 'useEmailCaseAction',
    label: 'Email a case',
    description:
      'Adds an "Email a case" quick action to the client homepage that opens a pre-filled intake email to Moritz.',
    defaultValue: false,
  },
  {
    key: 'useAiCaseIntake',
    label: 'AI powered Case intake',
    description:
      'Uses Claude to make the conversational case intake smarter: routes free-text matters, pre-fills answers from a description, warms up replies, answers off-script questions, and suggests a case title. Falls back to the scripted flow when off or unavailable.',
    defaultValue: false,
  },
  {
    key: 'useSupportChat',
    label: 'Support chat',
    description:
      'Shows a floating support chat launcher in the bottom-right corner across the app, like Intercom and other chat-based support products.',
    defaultValue: true,
  },
  {
    key: 'useInPlatformEngagementLetter',
    label: 'In-platform engagement letter',
    description:
      'Adds an account-level Engagement Letter task to the client home screen and requires signing before a case can be submitted.',
    defaultValue: false,
  },
  {
    key: 'useCommandPalette',
    label: 'Command palette (⌘K)',
    description:
      'One keyboard entry point to everything the current role can reach: jump to any section, find a case, company, user or quote round by name, and run the same actions the rows themselves offer. Destinations are generated from the navigation, so they cannot drift from the sidebar.',
    /*
     * On by default. It was shipped off, which made it invisible everywhere —
     * the flag gates the trigger in the top nav *and* the palette itself, so
     * a reviewer had to find this screen and flip a switch before the feature
     * existed at all. A discoverability affordance nobody can discover is the
     * exact failure the trigger was built to prevent (§8.10, task K6).
     */
    defaultValue: true,
  },
  {
    key: 'useAskNora',
    label: 'Ask Nora (⌘J)',
    description:
      'A question box in the top nav that answers a client from their own cases and documents, scoped server-side. Client-only for now: the lawyer, admin and assistant projections are built and tested but switched off in lib/ask/availability.ts, so the panel, the ⌘J chord, the palette’s Ask row and the API all decline for those roles. Gives information rather than advice, proposes actions that already exist elsewhere in the UI, and never acts on its own. Replaces the floating support launcher wherever it appears, so one screen never carries two chat surfaces.',
    /*
     * On by default, for the same reason as the palette above: off meant the
     * ⌘J trigger, the panel and the palette's *Ask Nora* row were all absent
     * on every page and every viewport.
     *
     * Two narrower gates still apply and are deliberate, not oversights.
     * `isAskAvailableFor` keeps it to the client role (see
     * `lib/ask/availability.ts` — the server reads the same list, so opening
     * it here alone would offer a control the API declines), and
     * `DashboardOverlays` stands it down on `/client/new`, where the intake
     * already owns the screen's one AI conversation.
     */
    defaultValue: true,
  },
  {
    key: 'useLawyerQa',
    label: 'Submit work and QA review',
    description:
      'Adds the Submit work tab to the lawyer case page: a form for handing in the finished document (never a chat), the QA agent’s verdict with the things it wants fixed, every earlier round and its verdict, and the context Moritz forwards from the client conversation.',
    defaultValue: false,
  },
] as const;

export type DesignFlagKey = (typeof DESIGN_FLAGS)[number]['key'];

export type DesignFlagsState = Record<string, boolean>;

export function buildDefaultFlagsState(): DesignFlagsState {
  return DESIGN_FLAGS.reduce<DesignFlagsState>((acc, flag) => {
    acc[flag.key] = flag.defaultValue;
    return acc;
  }, {});
}
