# Fact-check — email claims

Date: 2026-09-11  
Read-only. Be blunt before you send.

---

## CLAIM 1 — file paths exist

**Verdict: CORRECT**

Both files exist at exactly these paths:

- `apps/legal-intake-design/components/design/new-case/lawyers.ts`
- `apps/legal-intake-design/components/design/new-case/intake-brief-panel.tsx`

The older folder also exists as a sibling:

- `apps/legal-intake-design/components/design/intake/`  
  (contains `intake-flow.tsx`, `intake-entry.tsx`, `matters/`, `components/intake-progress-panel.tsx`, etc.)

### Short unambiguous names for the email

| Refer to | Use |
| --- | --- |
| New conversational intake (live default) | **`new-case/`** — or “the `new-case` conversational intake” |
| Lawyer showcase helper | **`new-case/lawyers.ts`** |
| Live brief sidebar | **`new-case/intake-brief-panel.tsx`** |
| Older matter wizard | **`design/intake/`** — or “the older `design/intake` folder” (not `new-case`) |

Do not say “the intake folder” alone — there are two.

---

## CLAIM 2 — documents are asked last

**Verdict: PARTLY CORRECT**

### Live path (what `/en/client/new` actually renders)

```8:19:apps/legal-intake-design/app/[locale]/(dashboard)/client/new/page.tsx
export default async function ClientNewCasePage({ params }: PageProps) {
  await params;

  return (
    <div className="h-full">
      <IntakeEntry
        fallback={
          <div className="mx-auto flex w-full max-w-2xl flex-col py-4 lg:py-8">
            <CaseCreationSection />
          </div>
        }
      />
```

```28:31:apps/legal-intake-design/components/design/intake/intake-entry.tsx
  if (flags.useSimplifiedMatterIntake) {
    return <ConversationalIntakeFlow />;
  }
  return <>{fallback}</>;
```

```25:30:apps/legal-intake-design/components/design/feature-flags/design-flags-registry.ts
  {
    key: 'useSimplifiedMatterIntake',
    label: 'Case intake',
    description:
      'Moritz-style conversational case intake (chat + suggestion chips + live case brief). Off falls back to the form-based case intake.',
    defaultValue: true,
```

**Live default = `ConversationalIntakeFlow` from `new-case/`** (flag defaults to on). The older `design/intake` wizard is not the default on that page.

### Contract matter question order (live `new-case` engine)

From `orderedQuestions` + `contractFlow` + shared tail:

```64:77:apps/legal-intake-design/components/design/new-case/script.ts
export function orderedQuestions(
  matterId: MatterId | undefined,
  _answers: AnswersMap,
): IntakeQuestion[] {
  const list: IntakeQuestion[] = [MATTER_TYPE_QUESTION];
  if (!matterId) return list;
  const flow = MATTER_FLOWS[matterId];
  list.push(
    ...flow.questions,
    URGENCY_QUESTION,
    DOCUMENTS_QUESTION,
    RECAP_QUESTION,
  );
  return list;
}
```

**In order, first → last for a contract matter:**

1. Matter type — “What’s this about” (chips)
2. Situation — “What you need” (text)
3. Other side — “Other side” (text)
4. Outcome — “Desired outcome” (text, **optional**)
5. Urgency — “Timeline” (chips)
6. Documents — “Documents” (attach, **optional**)
7. Recap — “Review” (terminal summary)

Documents optional proof:

```49:57:apps/legal-intake-design/components/design/new-case/matters/shared.ts
export const DOCUMENTS_QUESTION: IntakeQuestion = {
  key: DOCUMENTS_KEY,
  kind: 'attach',
  optional: true,
  reviewLabel: 'Documents',
  hint: 'Supporting files',
  prompt: () =>
    'Anything to attach? Contracts, letters, term sheets, or prior drafts all help — drop them in below, or say “skip” if there’s nothing right now.',
};
```

### What is wrong in the claim

Documents are **optional: yes**.  
Documents come **after** the matter questions and urgency: yes.  
Documents are **not** the absolute last step — **recap/review is last**.

### Accurate one-liner

> In the live `new-case` flow (default on `/en/client/new`), documents are optional and come after the matter questions and timeline, immediately before the final recap — not after the recap.

---

## CLAIM 3 — brief panel shows labels but not values

**Verdict: CORRECT** (both halves)

### Brief panel (`new-case`) — labels + ticks/states only; no answer text

Answers are only used to decide filled/active/skipped/upcoming. The UI renders `step.label` (= `reviewLabel`), never the captured string:

```53:68:apps/legal-intake-design/components/design/new-case/intake-brief-panel.tsx
  const questionSteps: BriefStep[] = rows.map((q, i) => {
    const filled = isFilled(q.key);
    const active = i === activeIndex && !filled;
    // ...
    return {
      key: q.key,
      label: q.reviewLabel,
      state,
    };
  });
```

```148:157:apps/legal-intake-design/components/design/new-case/intake-brief-panel.tsx
                <p
                  className={cn(
                    'text-sm font-medium leading-snug',
                    step.state === 'upcoming' || step.state === 'skipped'
                      ? 'text-muted-foreground'
                      : 'text-foreground',
                  )}
                >
                  {step.label}
                </p>
```

Complete state draws a tick (`Check`) in `StepDot` (lines 167–176) with no value next to it.

### Recap card — does show actual answers

```566:618:apps/legal-intake-design/components/design/new-case/intake-message.tsx
  const rows = orderedQuestions(matterId, answers)
    .filter((q) => q.key !== RECAP_KEY && q.key !== DOCUMENTS_KEY)
    .map((q) => {
      const raw = displayAnswer(q, answers);
      const summary =
        q.kind !== 'chips' && raw && raw !== 'Skipped'
          ? summaries?.[q.key]
          : undefined;
      return { label: q.reviewLabel, value: summary ?? raw };
    })
    // ...
                <dd className="text-foreground text-sm leading-relaxed">
                  {r.value}
                </dd>
```

(Recap shows labels + values; documents appear as a file count, not per-field text.)

### Older `design/intake` progress panel — values + edit control

```69:72:apps/legal-intake-design/components/design/intake/components/intake-progress-panel.tsx
 * Sheet body for the intake chat: a coarse stage checklist, then every
 * captured answer (with an edit affordance that re-asks it as a chat turn),
 * then attached document chips.
```

```114:120:apps/legal-intake-design/components/design/intake/components/intake-progress-panel.tsx
            {reviewKeys.map((key) => (
              <CapturedRow
                key={key}
                question={questions[key]}
                value={getAnswerDisplay(questions, key, answers) ?? ''}
                onEdit={() => onEditKey(key)}
              />
```

```213:231:apps/legal-intake-design/components/design/intake/components/intake-progress-panel.tsx
  return (
    <li className="group space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {question.reviewLabel}
        </p>
        <Button
          // ...
          onClick={onEdit}
          aria-label={`Edit ${question.reviewLabel}`}
        >
          <Pencil aria-hidden="true" className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-foreground text-sm">{value}</p>
    </li>
  );
```

Yes: older panel shows captured values and a pencil edit control per row.

---

## CLAIM 4 — lawyer ID mismatch

**Verdict: PARTLY CORRECT** — direction is right; “may fall back” undersells it, and the submitted-card effect is stronger than “maybe Daniel.”

### IDs `lawyers.ts` looks up

```21:26:apps/legal-intake-design/components/design/new-case/lawyers.ts
const byId = (id: string): OnboardingLawyer =>
  ONBOARDING_LAWYERS.find((l) => l.id === id) ?? ONBOARDING_LAWYERS[0]!;

const AMARA = byId('onboarding-lawyer-amara'); // Commercial Counsel
const DANIEL = byId('onboarding-lawyer-daniel'); // Corporate & M&A
const MEI_LIN = byId('onboarding-lawyer-mei'); // Employment & People
```

Lookups attempted:

1. `onboarding-lawyer-amara`
2. `onboarding-lawyer-daniel`
3. `onboarding-lawyer-mei`

Fallback on miss: **`ONBOARDING_LAWYERS[0]`** = Daniel Dalla Vedova (`onboarding-lawyer-daniel`).

### IDs that actually exist in `ONBOARDING_LAWYERS`

From `onboarding-lawyers.ts`:

- `onboarding-lawyer-daniel`
- `onboarding-lawyer-kyle`
- `onboarding-lawyer-maxim`
- `onboarding-lawyer-aelita`
- `onboarding-lawyer-catarina`

(`ADDITIONAL_TEAM_LAWYERS` has eric/aaron/mike/enes/pamir — **not** consulted by `byId`.)

### Which lookups fail

| Lookup | Result |
| --- | --- |
| `onboarding-lawyer-daniel` | **Hits** — real Daniel |
| `onboarding-lawyer-amara` | **Misses** — becomes Daniel |
| `onboarding-lawyer-mei` | **Misses** — becomes Daniel |

So `AMARA` and `MEI_LIN` are both Daniel objects at runtime.

### Would a real client see the wrong face?

**Yes, in predictable cases — not “maybe”.**

- **Contract / procurement** standard showcase: intended lead Amara → **Daniel leads** (`leadForMatter` returns `AMARA`, which is Daniel). Lines 32–35, 50–55.
- **Employment** standard showcase: intended lead Mei Lin → **Daniel leads**. Lines 39–40.
- **Corporate / M&A**: lead Daniel — **correct**.
- **Enterprise pod** (`ENTERPRISE_POD`): `[DANIEL, AMARA, MEI_LIN]` collapses to **three Daniels**. Lines 62–66. Client can see Daniel repeated as the “dedicated team,” never Amara or Mei Lin from this helper.

Amara/Mei Lin photo files exist under `public/onboarding-lawyers/`, but they are **not** in `ONBOARDING_LAWYERS`, so this submitted-card path cannot show those faces via `lawyers.ts`.

### Accurate one sentence for the email

> In `new-case/lawyers.ts`, `onboarding-lawyer-amara` and `onboarding-lawyer-mei` are not in `ONBOARDING_LAWYERS`, so both resolve to Daniel Dalla Vedova; contract/procurement/employment showcases therefore lead with Daniel, and the enterprise pod is three copies of Daniel.

---

## Send / don’t-send cheat sheet

| Claim | Verdict | Action |
| --- | --- | --- |
| 1 Paths | **CORRECT** | Safe to cite; distinguish `new-case/` vs `design/intake/` |
| 2 Documents last | **PARTLY CORRECT** | Fix: optional + before recap, not absolute last |
| 3 Brief vs recap | **CORRECT** | Safe as written |
| 4 Lawyer IDs | **PARTLY CORRECT** | Fix: misses are definite; wrong face is real for those matters / enterprise pod |
