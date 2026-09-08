# Porting the client onboarding flow into the main app

This folder is the **design playground** version of onboarding. The client
(website signup) flow here is built to be lifted into the main app
(`apps/legal-intake`) with as little rework as possible. This guide is the map.

> Scope: only the **client** flow is production-bound. The lawyer flow, the
> account-type chooser (`customer-type`), and the attorney `review` screen are
> kept here for design reference and are only reachable via the playground's
> dev-chrome Back/Next buttons. They are **not** part of the flow you port.

## The production client journey

```
welcome -> personal -> verify -> company -> address -> complete   (supported country)
                                         \-> waitlist             (unsupported country)

inactive = terminal state when the account is disabled
```

`verify` confirms the mobile number via an OTP (phone capture moved off the
`personal` screen into this dedicated step). `address` collects the client's
**company** postal address used for the engagement letter (it follows the
`company` step and reuses its selected country) and is country-aware (UK/IE
postcode lookup vs. international type-ahead). Both run on mock data in the
playground.

In the main app the user no longer chooses lawyer vs client — the website
signup is always a client. The old account-type selection screen
(`apps/legal-intake/app/[locale]/onboarding/company/`) is replaced by the
**welcome** screen below.

## What to port

| File                                                                                                                        | Role                                                                                       | Portable?                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| `client-flow.ts`                                                                                                            | Pure flow logic: `ClientStep`, branch transitions, progress, panel/logo helpers. No React. | Yes — copy as-is                   |
| `client-onboarding-flow.tsx`                                                                                                | `ClientStepView` (renders each screen) + `ClientOnboardingFlow` (state machine).           | Yes — the main unit                |
| `client-welcome.tsx`                                                                                                        | Welcome screen ("Welcome to Moritz" + Get started).                                        | Yes                                |
| `details-form.tsx`                                                                                                          | Personal + company forms (shared). `showPhone={false}` on the client personal step.        | Yes                                |
| `phone-verify-step.tsx`                                                                                                     | Dedicated phone-verification step (number entry + inline OTP).                             | Yes — mutations are mocked         |
| `address-step.tsx`                                                                                                          | Address step: header + `AddressField` + footer, validates required fields.                 | Yes                                |
| `address-field.tsx`                                                                                                         | Country-aware address capture (postcode lookup vs. type-ahead + manual fallback).          | Yes — lookup is mocked             |
| `lib/mocks/addresses.ts`                                                                                                    | Mock postcode lookup + type-ahead + per-country field config.                              | No — replace with a real provider  |
| `complete-card.tsx`                                                                                                         | Success screen.                                                                            | Yes                                |
| `waitlist-form.tsx`                                                                                                         | Unsupported-country waitlist + success state.                                              | Yes                                |
| `inactive-user-card.tsx`                                                                                                    | Disabled-account screen.                                                                   | Yes                                |
| `onboarding-actions.tsx`, `onboarding-step-header.tsx`, `onboarding-progress.tsx`                                           | Shared footer / header / progress dots.                                                    | Yes                                |
| `edit-photo.tsx`                                                                                                            | Avatar/logo upload.                                                                        | Yes                                |
| `onboarding-walkthrough.tsx`                                                                                                | **Playground harness only** (dev chrome, lawyer walk).                                     | No — replace with main-app routing |
| `onboarding-panel-context.tsx`, `onboarding-brand-panel.tsx`, `onboarding-preview-toggle.tsx`, `onboarding-header-logo.tsx` | Playground layout chrome.                                                                  | Optional (see Layout)              |
| `customer-type-form.tsx`, `attorney-profile-form.tsx`, `team-invite-welcome.tsx`, `waitlist-card.tsx`                       | Lawyer / deprecated screens.                                                               | No — not in the client flow        |

## How the flow is decoupled

`ClientOnboardingFlow` is intentionally free of playground-only chrome:

- **No panel context / dev chrome.** It reports its current step via
  `onStepChange(step)`. The playground harness maps that to the brand-panel tint
  (`clientStepToPanelVariant`) and header-logo visibility
  (`clientStepShowsHeaderLogo`). The main app can ignore `onStepChange`.
- **Injectable mutations.** The forms run a simulated delay by default, but
  accept real async handlers so the playground never imports tRPC:
  - `ClientOnboardingFlow` / `ClientStepView` props `onSubmitDetails` and
    `onJoinWaitlist`.
  - These forward to `DetailsForm`'s `onSubmit` and `WaitlistForm`'s `onJoin`.
- **Step state is local.** `ClientOnboardingFlow` holds `step` in `useState`.
  In the main app, replace this with the server-driven step (see below).

## Callback -> main-app backend mapping

The main app already has all the procedures. Wire each seam to the existing
registration/waitlist routers and keep the server-driven step machine in
`apps/legal-intake/app/[locale]/onboarding/onboarding-state.ts`
(`getOnboardingStep`).

| Screen   | Playground callback                                  | Main-app action                                                                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| welcome  | `onContinue` (gated on the consent checkbox)         | `registration.createCompany({ type: 'NON_LEGAL' })`, then advance (router refresh). Always NON_LEGAL — the lawyer branch is gone. Persist the Terms & Conditions / Privacy Policy acceptance here (consent flag on `createCompany`, or a dedicated terms-acceptance mutation).             |
| personal | `DetailsForm.onSubmit`                               | `registration.updatePersonalDetails` (no phone — captured on `verify`)                                                                                                                                                                                                                     |
| verify   | `onSendVerificationCode` / `onCheckVerificationCode` | `registration.sendPhoneVerification` / `registration.checkPhoneVerification`. The verified number + status are lifted via `value` / `onChange` (a `PhoneVerificationValue`) so back-navigation restores the number and only a _changed_ number re-verifies; persist `phoneE164` on verify. |
| company  | `DetailsForm.onSubmit`                               | `registration.updateCompany` (country drives address vs. waitlist via `getOnboardingStep` + `countryConfig`)                                                                                                                                                                               |
| address  | `AddressStep.onSubmit`                               | Persist the structured address (e.g. `registration.updateCompany` address fields). Swap `lib/mocks/addresses` for a real provider (getAddress.io / Loqate / Smarty).                                                                                                                       |
| waitlist | `WaitlistForm.onJoin`                                | `waitlist.joinAuthenticated`                                                                                                                                                                                                                                                               |
| complete | CTA `dashboardPath`                                  | No mutation — signups are manually screened and whitelisting is admin-only (`registration.completeSignup` was removed). Just link to `companyTypeToPath(type)` (`/client`).                                                                                                                |
| inactive | —                                                    | rendered when `getOnboardingStep === 'enable-user'`                                                                                                                                                                                                                                        |

Because the main app is server-driven, the recommended port is **not** to reuse
`ClientOnboardingFlow`'s local `useState` step machine. Instead:

1. Render the correct `ClientStepView step={...}` per route based on
   `getOnboardingStep(user)` (e.g. `link-company` -> `welcome`,
   `add-details-client-company` -> `personal`/`company`, `waitlist-country` ->
   `waitlist`, `complete` -> `complete`, `enable-user` -> `inactive`).
2. Pass real data (user name/email, company name, country) as props.
3. Pass the tRPC mutations via `onSubmitDetails` / `onJoinWaitlist`, and do the
   `router.push('/onboarding')` / `router.refresh()` in `onContinue`.

`client-flow.ts` (`clientBranchNext`/`clientBranchBack`, `SUPPORTED_CLIENT_COUNTRIES`)
documents the intended transitions and can validate the server logic, even if
the main app derives the step from the DB rather than client state.

## Playground-only dependencies to swap

The playground uses a "design-system resolver" + a "foundation" component set.
The main app uses `@repo/ui` directly. Swap these imports when porting:

| Playground import                                                          | Main-app equivalent                    |
| -------------------------------------------------------------------------- | -------------------------------------- |
| `@/components/design/design-system/button`                                 | `@repo/ui/components/button`           |
| `@/components/design/design-system/input`                                  | `@repo/ui/components/input`            |
| `@/components/design/design-system/select`                                 | `@repo/ui/components/select`           |
| `@/components/design/design-system/textarea`                               | `@repo/ui/components/textarea`         |
| `@/components/design/design-system/typography` (`H2`, `Muted`, `TextLink`) | `@repo/ui/components/heading` / `text` |
| `@/components/design/foundations/components/heading` (`Heading`)           | `@repo/ui/components/heading`          |
| `@/components/design/foundations/components/text` (`Text`)                 | `@repo/ui/components/text`             |
| `@/components/playground/auth-stubs` (`getMockUser`)                       | real session/user from tRPC context    |

Also drop: `onboarding-panel-context`, `onboarding-preview-toggle`, dev chrome,
and the simulated `setTimeout` submits (replaced by real mutations).

## Assets to copy

- **Logo + shine:** `apps/legal-intake-design/components/icons/moritz-symbol.tsx`
  and `moritz-symbol.css` (the `mz-logo-shine` animation is self-contained in the
  CSS file).
- **Animation classes** from `apps/legal-intake-design/app/globals.css`:
  `mz-animate-step`, `mz-animate-reveal`, `mz-animate-check`, `mz-animate-draw`
  (+ the `prefers-reduced-motion` guard). These power the step transitions and
  the status-mark draws.
- **Optional two-column layout:** the main app onboarding currently uses a
  single centered column. The playground uses a two-column brand-panel layout
  (`app/[locale]/onboarding/layout.tsx` + `onboarding-brand-panel.tsx` +
  `bg-mz-gradient-*` utilities in `globals.css`). Port it only if you want the
  gradient panel; the screens work in a single column too.

## i18n keys to copy

From `apps/legal-intake-design/messages/en.json` into the main app messages:

- `onboarding.welcome.*` — `title`, `subtitle`, `getStarted`, `signedInAs`, `consent` (rich-text `<terms>`/`<privacy>` link tags)
- `onboarding.waitlist.*` — `title`, `description`, `summary.*`, `cta.*`,
  `success.*`
- `onboarding.complete.*` — `success.title`, `success.description`, `success.cta`
- `onboarding.inactive.*` — `title`, `description`, `help`
- `registration.sections.*` — `yourDetails(/Description)`,
  `companyDetails(/Description)`
- `registration.fields.*` — name/phone/company/country/role/companySize and
  their option + validation keys
- `registration.actions.*` — `continue`, `back`
- `registration.photo.*` / `registration.logo.*` — upload labels + errors

> The main app already has an `onboarding.customerType.*` namespace for the old
> chooser; it becomes unused once the welcome screen replaces that page.
