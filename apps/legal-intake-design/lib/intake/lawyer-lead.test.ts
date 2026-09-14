import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { ONBOARDING_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import {
  areaForMatter,
  ENTERPRISE_POD,
  INTAKE_NOTE_ROSTER,
  leadForMatter,
  practiceAreaOf,
  practiceCopyKeyForMatter,
  showcaseForMatter,
  type PracticeArea,
} from '@/components/design/new-case/lawyers';
import type { MatterId } from '@/components/design/new-case/intake-types';

/** Every matter the flow can resolve, plus the state before it knows. */
const EVERY_MATTER: readonly (MatterId | undefined)[] = [
  'contract',
  'procurement',
  'corporate',
  'ma',
  'employment',
  'other',
  undefined,
];

/**
 * The face shown during intake has to be a real, matter-relevant person
 * (T21, Decision 21).
 *
 * `lawyers.ts` used to resolve its personas through a lookup that fell back to
 * the first entry in the roster, and two of the three ids it asked for did not
 * exist. So every matter got the same founding COO and the "matter-relevant
 * lead" was decorative. Nothing failed, nothing was logged, and the only way to
 * see it was to look at the photograph.
 *
 * These tests live here rather than beside the component because the app's
 * runner covers `lib/**`, and because this is a fact about the case rather than
 * about rendering: which human a client is shown while deciding whether to
 * trust this with a legal problem.
 */
describe('showcaseForMatter', () => {
  it('leads a contract matter with the commercial lawyer', () => {
    const lead = showcaseForMatter('contract')[0];
    expect(lead?.id).toBe('onboarding-lawyer-aelita');
    expect(lead?.title).toContain('Commercial');
  });

  it('leads a corporate or M&A matter with the M&A lawyer', () => {
    expect(showcaseForMatter('corporate')[0]?.id).toBe(
      'onboarding-lawyer-maxim',
    );
    expect(showcaseForMatter('ma')[0]?.id).toBe('onboarding-lawyer-maxim');
  });

  // The regression that started this: two different matter types resolving to
  // the same face is how the bug looked from the outside.
  it('does not give a contract and a corporate matter the same lead', () => {
    expect(showcaseForMatter('contract')[0]?.id).not.toBe(
      showcaseForMatter('corporate')[0]?.id,
    );
  });

  /*
   * Employment used to resolve to nothing, which meant roster order, which
   * meant the founding COO's face over a dismissal. It now has its own lead
   * (item 13), and the point of the test is that it is not one of the
   * commercial or corporate faces borrowed for the slot.
   */
  it('gives an employment matter its own lead, distinct from the others', () => {
    const lead = leadForMatter('employment');
    expect(lead?.id).toBe('intake-lawyer-priya');
    expect(lead?.title).toContain('Employment');
    expect(lead?.id).not.toBe(leadForMatter('contract')?.id);
    expect(lead?.id).not.toBe(leadForMatter('corporate')?.id);
  });

  /*
   * The showcase is a rotating three-up of photographs, so the one lead with no
   * photograph must not head it: that put a monogram in the first cell beside
   * two faces, which is the one place a deliberate absence read as a bug. She
   * keeps the lawyer note, which renders the monogram at full weight.
   */
  it('never heads the rotation with a persona who has no headshot', () => {
    for (const matter of EVERY_MATTER) {
      const lead = showcaseForMatter(matter)[0];
      expect(lead, String(matter)).toBeDefined();
      expect(lead!.imageUrl, String(matter)).toMatch(
        /^\/onboarding-lawyers\/.+\.(png|jpg)$/,
      );
    }
  });

  it('falls back to roster order for the matter whose lead has no photo', () => {
    expect(showcaseForMatter('employment').map((one) => one.id)).toEqual(
      ONBOARDING_LAWYERS.map((one) => one.id),
    );
  });

  // Item 13: before a matter type is known, show the default rather than
  // whichever persona happens to sort first.
  it('shows the default lead before the matter type is known', () => {
    expect(leadForMatter(undefined)?.id).toBe('onboarding-lawyer-daniel');
    expect(leadForMatter('other')?.id).toBe('onboarding-lawyer-daniel');
  });

  it('still shows the whole roster, with the lead moved to the front', () => {
    const showcase = showcaseForMatter('contract');
    expect(showcase).toHaveLength(ONBOARDING_LAWYERS.length);
    expect(new Set(showcase.map((one) => one.id)).size).toBe(showcase.length);
  });

  // Every lead has to be a named persona, not a placeholder standing in for one
  // that was never there. Employment is the one lead that is not on the shared
  // roster, because the roster has no employment lawyer.
  it('only ever leads with a real persona', () => {
    const ids = new Set(ONBOARDING_LAWYERS.map((one) => one.id));
    for (const matter of [
      'contract',
      'procurement',
      'corporate',
      'ma',
      'other',
    ] as const) {
      expect(ids.has(showcaseForMatter(matter)[0]!.id)).toBe(true);
    }
  });

  it('gives every matter type a lead with a name and a practice area', () => {
    for (const matter of [
      'contract',
      'employment',
      'procurement',
      'corporate',
      'ma',
      'other',
      undefined,
    ] as const) {
      const lead = leadForMatter(matter);
      expect(lead).not.toBeNull();
      expect(lead!.name.trim()).not.toBe('');
      expect(lead!.title.trim()).not.toBe('');
      // The face and the sentence beside it are resolved from the same area,
      // so a mismatch here is the two disagreeing on screen.
      expect(practiceAreaOf(lead!)).toBe(areaForMatter(matter));
    }
  });

  /*
   * The one persona with no photograph. Asserted rather than left implicit,
   * because the renderers skip `AvatarImage` when this is empty and would
   * otherwise fire a failing request per render to reach the same fallback.
   */
  it('leaves the employment lead without a headshot, and every other lead with one', () => {
    expect(leadForMatter('employment')!.imageUrl).toBe('');
    expect(leadForMatter('employment')!.initials).toBe('PS');
    for (const matter of ['contract', 'corporate', 'other'] as const) {
      expect(leadForMatter(matter)!.imageUrl).toMatch(
        /^\/onboarding-lawyers\/.+\.(png|jpg)$/,
      );
    }
  });
});

/**
 * The sentence beside the face, and the claim it is allowed to make (item 13).
 *
 * It ends "like this one", which is a claim about the client's own matter, and
 * it used to be keyed on the practice area. Four matter types share two areas,
 * so a tender response was told the lead mostly handles "supplier and franchise
 * terms like this one" and a share purchase was told "share sales and
 * investments". Keying it on the matter makes the clause true; these tests are
 * what stop the two lookups drifting apart, since a sentence that claims a
 * speciality the face does not have is worse than the vague one it replaced.
 */
describe('the practice sentence', () => {
  const practice = messages.intake.human.practice as Record<string, string>;

  /** Which area each sentence is written from the point of view of. */
  const AREA_OF_COPY: Readonly<Record<string, PracticeArea>> = {
    contract: 'commercial',
    procurement: 'commercial',
    corporate: 'corporate',
    ma: 'corporate',
    employment: 'employment',
    general: 'general',
  };

  it('resolves to real copy for every matter, and before one is known', () => {
    for (const matter of EVERY_MATTER) {
      const key = practiceCopyKeyForMatter(matter);
      expect(practice[key], `${String(matter)} -> ${key}`).toBeTruthy();
    }
  });

  // The invariant that used to be free: the face and the sentence came from one
  // lookup, and now come from two.
  it('never claims a speciality the face beside it does not have', () => {
    for (const matter of EVERY_MATTER) {
      const sentenceArea = AREA_OF_COPY[practiceCopyKeyForMatter(matter)];
      expect(sentenceArea, String(matter)).toBe(areaForMatter(matter));
      expect(practiceAreaOf(leadForMatter(matter)!), String(matter)).toBe(
        sentenceArea,
      );
    }
  });

  /*
   * "like this one" is only allowed where the matter type is narrow enough for
   * it to be true. `other` and an unknown matter are not: nobody has said what
   * this is, so the sentence claims no speciality at all.
   */
  it('makes no claim about an unclassified matter', () => {
    for (const matter of ['other', undefined] as const) {
      expect(practiceCopyKeyForMatter(matter)).toBe('general');
    }
    expect(practice.general).not.toContain('like this one');
    expect(practice.general).not.toContain('mostly');
  });

  /*
   * The bug this replaced, asserted directly. `employment` is one bucket over
   * dismissal, redundancy, discrimination, harassment and severance (see
   * `matter-of.ts`), so it is the one matter type too wide for "like this one":
   * a harassment claim was told the lead mostly handles offer revocations,
   * like this one. It names its range instead.
   */
  it('does not narrow the employment bucket to one kind of dispute', () => {
    expect(practice.employment).not.toContain('like this one');
    expect(practice.employment).not.toContain('mostly');
    expect(practice.employment).toContain('employment disputes');
  });

  it('says "like this one" wherever the matter type is narrow enough', () => {
    for (const matter of [
      'contract',
      'procurement',
      'corporate',
      'ma',
    ] as const) {
      const sentence = practice[practiceCopyKeyForMatter(matter)]!;
      expect(sentence, matter).toContain('like this one');
    }
  });

  /*
   * A sentence per matter, not a sentence per area wearing several hats: the
   * two matters that share a lawyer must still describe different work, or
   * keying on the matter bought nothing.
   */
  it('describes procurement and contract work differently', () => {
    expect(practice[practiceCopyKeyForMatter('contract')]).not.toBe(
      practice[practiceCopyKeyForMatter('procurement')],
    );
    expect(practice[practiceCopyKeyForMatter('corporate')]).not.toBe(
      practice[practiceCopyKeyForMatter('ma')],
    );
  });

  it('carries no copy no matter type can reach', () => {
    const reachable = new Set(EVERY_MATTER.map(practiceCopyKeyForMatter));
    expect(Object.keys(practice).sort()).toEqual([...reachable].sort());
  });
});

describe('practiceAreaOf', () => {
  // An untagged persona has to fall through to general rather than throw or
  // land in whichever area is first: a new roster entry must not silently
  // become the employment lawyer.
  it('falls through to general for a persona nobody tagged', () => {
    expect(
      practiceAreaOf({
        id: 'onboarding-lawyer-nobody',
        name: 'A N Other',
        title: 'Counsel',
        initials: 'AO',
        imageUrl: '',
        tagline: '',
        education: '',
      }),
    ).toBe('general');
  });

  it('tags every persona the roster ships with', () => {
    for (const lawyer of ONBOARDING_LAWYERS) {
      expect(practiceAreaOf(lawyer)).not.toBeUndefined();
    }
  });
});

describe('ENTERPRISE_POD', () => {
  // It held two nulls' worth of fallback before, so it was one person repeated.
  it('is three distinct real people', () => {
    expect(ENTERPRISE_POD).toHaveLength(3);
    expect(new Set(ENTERPRISE_POD.map((one) => one.id)).size).toBe(3);
    const ids = new Set(ONBOARDING_LAWYERS.map((one) => one.id));
    for (const lawyer of ENTERPRISE_POD) expect(ids.has(lawyer.id)).toBe(true);
  });
});

/**
 * The roster the intake note rotates through while the matter is unknown.
 *
 * The note used to show one person for the whole of every intake, because
 * `leadForMatter` has nothing to resolve until the brief has a matter type and
 * so returns the default lead. It now cycles all eleven until the matter
 * settles it, and the rotation renders each person's `tagline` in place of the
 * matter-keyed practice sentence — so a tagline is rendered copy here, not
 * decoration, and an empty one is a blank line under a face.
 */
describe('INTAKE_NOTE_ROSTER', () => {
  it('is every real person, with no one twice', () => {
    const ids = INTAKE_NOTE_ROSTER.map((one) => one.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(INTAKE_NOTE_ROSTER.length).toBeGreaterThanOrEqual(11);
  });

  /*
   * She is the one person `showcaseForMatter` leaves out, and on purpose: that
   * surface is a three-up of photographs and her missing headshot would read as
   * a broken image. The note shows one person at a time and gives the monogram
   * a treatment of its own, so here she belongs.
   */
  it('includes the employment lead, who has no headshot', () => {
    const employmentLead = leadForMatter('employment');
    expect(employmentLead?.imageUrl).toBe('');
    expect(INTAKE_NOTE_ROSTER.map((one) => one.id)).toContain(
      employmentLead?.id,
    );
  });

  // Whichever face the client happens to look at, the line under it has to say
  // something true about that person.
  it('gives everyone a name, a title and a tagline to rotate on', () => {
    for (const lawyer of INTAKE_NOTE_ROSTER) {
      expect(lawyer.name.trim(), lawyer.id).not.toBe('');
      expect(lawyer.title.trim(), lawyer.id).not.toBe('');
      expect(lawyer.tagline.trim(), lawyer.id).not.toBe('');
    }
  });

  // Rotation has to start somewhere, and starting on the face the note showed
  // before it rotated means a client who looks away and back has not missed a
  // different opening. It is also the frame a reduced-motion client is held on.
  it('opens on the default lead, which is who an unknown matter resolves to', () => {
    expect(INTAKE_NOTE_ROSTER[0]?.id).toBe(leadForMatter(undefined)?.id);
  });

  // Everyone the note can show is someone the flow can also lead a matter with,
  // so the rotation cannot introduce a face that then disappears the moment the
  // matter is known.
  it('contains every matter lead', () => {
    const ids = new Set(INTAKE_NOTE_ROSTER.map((one) => one.id));
    for (const matter of EVERY_MATTER) {
      expect(ids.has(leadForMatter(matter)?.id ?? ''), `${matter}`).toBe(true);
    }
  });

  it('is drawn from the same personas the rest of the app uses', () => {
    const known = new Set(ONBOARDING_LAWYERS.map((one) => one.id));
    const extra = INTAKE_NOTE_ROSTER.filter((one) => !known.has(one.id));
    // The five additional team members and the employment lead.
    expect(extra.length).toBe(INTAKE_NOTE_ROSTER.length - known.size);
  });
});
