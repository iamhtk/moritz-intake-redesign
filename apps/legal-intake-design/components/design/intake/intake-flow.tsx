'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { getAnswerDisplay, resolveBool, resolveCopy } from './intake-config';
import { getVisibleSteps } from './intake-engine';
import type {
  AnswerKey,
  ChatItem,
  IntakeAnswers,
  IntakePhase,
  MatterIntakeDefinition,
  QuestionDef,
} from './intake-types';
import { parseSituation } from './parse-situation';
import { composeReviewSummary, isOpenAiEnabled } from './openai-intake-helpers';
import { extractFromFile } from './mock-document-extraction';
import {
  useIntakeDraft,
  type IntakeDraft,
  type SetId,
} from './use-intake-draft';
import { AnsweredCard } from './components/answered-card';
import { IntakeChatShell } from './components/intake-chat-shell';
import { IntakeProgressPanel } from './components/intake-progress-panel';
import { GeneratingScreen } from './components/generating-screen';
import { IntakeSuccess } from './components/intake-success';
import { QuestionDock } from './components/question-dock';
import { ResumeBanner } from './components/resume-banner';
import { ReviewSummary } from './components/review-summary';
import { ChatComposer } from './chat/chat-composer';
import { ChatMessage } from './chat/chat-message';
import { TypingIndicator } from './chat/typing-indicator';

type IntakeFlowProps = {
  definition: MatterIntakeDefinition;
  /**
   * Free-text the user already typed in the unified entry chat before the
   * matter type was resolved. When present, the flow opens seeded: it echoes
   * the message and runs the matter's own parse on mount (prefilling answers),
   * skips the resume banner, and starts fresh.
   */
  seedText?: string;
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

/** Ordered list of every question key that is currently visible. */
function visibleQuestions(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
): AnswerKey[] {
  return getVisibleSteps(definition, answers).flatMap(
    (step) => step.questionIds,
  );
}

function isAnsweredKey(
  questions: Record<string, QuestionDef>,
  key: AnswerKey,
  answers: IntakeAnswers,
): boolean {
  const question = questions[key];
  if (!question) return false;
  if (question.ui === 'upload') {
    const files = answers[key];
    return Array.isArray(files) && files.length > 0;
  }
  if (question.ui === 'date') {
    const hasDate =
      typeof answers[key] === 'string' &&
      (answers[key] as string).trim().length > 0;
    const skipped = question.skipKey
      ? Boolean(answers[question.skipKey])
      : false;
    return hasDate || skipped;
  }
  const value = answers[key];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null;
}

function isRequiredKey(
  questions: Record<string, QuestionDef>,
  key: AnswerKey,
  answers: IntakeAnswers,
): boolean {
  return resolveBool(questions[key]?.required, answers);
}

/**
 * The active set's question keys. In `requiredOnly` mode (post-paste skip-to-
 * review) we only surface required-and-unanswered detail questions so the paste
 * path still asks the minimum; otherwise every visible detail question is shown.
 */
function detailKeys(
  definition: MatterIntakeDefinition,
  answers: IntakeAnswers,
  requiredOnly: boolean,
): AnswerKey[] {
  const triage = definition.triageKeys;
  const keys = visibleQuestions(definition, answers).filter(
    (key) => !triage.includes(key),
  );
  if (!requiredOnly) return keys;
  return keys.filter(
    (key) =>
      isRequiredKey(definition.questions, key, answers) &&
      !isAnsweredKey(definition.questions, key, answers),
  );
}

function getSetKeys(
  definition: MatterIntakeDefinition,
  setId: SetId,
  answers: IntakeAnswers,
  requiredOnly: boolean,
): AnswerKey[] {
  return setId === 'basics'
    ? definition.triageKeys
    : detailKeys(definition, answers, requiredOnly);
}

/**
 * The next set to open after `committed` sets, or `null` when nothing is left
 * (caller goes to review). Basics always comes first; Details only when it has
 * at least one question to show.
 */
function nextSet(
  definition: MatterIntakeDefinition,
  committed: readonly SetId[],
  answers: IntakeAnswers,
  requiredOnly: boolean,
): SetId | null {
  if (!committed.includes('basics')) return 'basics';
  if (
    !committed.includes('details') &&
    detailKeys(definition, answers, requiredOnly).length > 0
  ) {
    return 'details';
  }
  return null;
}

/** Loose match of free text to one of a question's options. */
function matchOption(question: QuestionDef, text: string): string | undefined {
  const t = text.trim().toLowerCase();
  if (!question.options) return undefined;
  const exact = question.options.find(
    (option) => option.label.toLowerCase() === t || option.value === t,
  );
  if (exact) return exact.value;
  const partial = question.options.find((option) => {
    const label = option.label.toLowerCase();
    return label.includes(t) || t.includes(label);
  });
  return partial?.value;
}

function buildAck(parsedCount: number): string {
  if (parsedCount === 0) {
    return "Thanks. I didn't catch the specifics from that, so let's go through a few quick questions.";
  }
  return "Got it — I've noted that down. Just a couple more details and we'll be set.";
}

function toFileMeta(file: File) {
  return { name: file.name, size: file.size, type: file.type };
}

/** Keys already shown as an `answered` row in the transcript. */
function cardedKeysOf(messages: readonly ChatItem[]): Set<AnswerKey> {
  const keys = new Set<AnswerKey>();
  for (const item of messages) {
    if (item.kind === 'answered') keys.add(item.key);
  }
  return keys;
}

function focusComposer() {
  if (typeof document === 'undefined') return;
  const el = document.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Message Moritz"]',
  );
  el?.focus();
}

export function IntakeFlow({ definition, seedText }: IntakeFlowProps) {
  const { questions, triageKeys } = definition;
  const { initialDraft, hydrated, save, clear } = useIntakeDraft(definition.id);
  // Snapshot the seed once so it survives re-renders but a later prop change
  // (it shouldn't change) can't re-trigger the seeding effect.
  const seedTextRef = useRef(seedText);

  const [phase, setPhase] = useState<IntakePhase>('intro');
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [messages, setMessages] = useState<ChatItem[]>(() =>
    seedText
      ? [
          {
            id: 'greet',
            kind: 'assistant',
            text: `Great — let's get your ${definition.label.toLowerCase()} matter started.`,
          },
          { id: 'seed', kind: 'user', text: seedText },
        ]
      : [{ id: 'greet', kind: 'assistant', text: definition.introGreeting }],
  );
  // The active set + position within it. `activeSetKeys` is a snapshot of the
  // set's keys taken when it opens, so the pager stays stable while answering
  // (detail-set membership only depends on the already-committed basics).
  const [activeSet, setActiveSet] = useState<SetId | null>('basics');
  const [activeSetKeys, setActiveSetKeys] = useState<AnswerKey[]>(triageKeys);
  const [setIndex, setSetIndex] = useState(0);
  const [committedSets, setCommittedSets] = useState<SetId[]>([]);
  // A transient single-key re-ask opened from the right Sheet; returns to review.
  const [editKey, setEditKey] = useState<AnswerKey | null>(null);
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [summary, setSummary] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [showResume, setShowResume] = useState(false);
  const [started, setStarted] = useState(false);

  const aiEnabled = useMemo(() => isOpenAiEnabled(), []);

  // Refs mirror state so async handlers see the latest values.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const activeSetRef = useRef(activeSet);
  activeSetRef.current = activeSet;
  const activeSetKeysRef = useRef(activeSetKeys);
  activeSetKeysRef.current = activeSetKeys;
  const setIndexRef = useRef(setIndex);
  setIndexRef.current = setIndex;
  const committedSetsRef = useRef(committedSets);
  committedSetsRef.current = committedSets;
  const editKeyRef = useRef(editKey);
  editKeyRef.current = editKey;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const requiredOnlyRef = useRef(requiredOnly);
  requiredOnlyRef.current = requiredOnly;
  const thinkingRef = useRef(isThinking);
  thinkingRef.current = isThinking;

  useEffect(() => {
    if (!hydrated) return;
    // A seeded start (the user already described their matter in the unified
    // entry chat) always begins fresh — no resume prompt.
    if (seedTextRef.current) {
      setStarted(true);
      return;
    }
    if (initialDraft) setShowResume(true);
    else setStarted(true);
  }, [hydrated, initialDraft]);

  useEffect(() => {
    if (!started) return;
    if (phase === 'generating' || phase === 'success') return;
    save({
      answers,
      messages,
      phase,
      activeSet,
      setIndex,
      committedSets,
      requiredOnly,
    });
  }, [
    started,
    phase,
    answers,
    messages,
    activeSet,
    setIndex,
    committedSets,
    requiredOnly,
    save,
  ]);

  const pushAssistant = useCallback((text: string) => {
    setMessages((current) => [
      ...current,
      { id: makeId(), kind: 'assistant', text },
    ]);
  }, []);

  const pushUser = useCallback(
    (text: string, attachment?: { name: string; size: number }) => {
      setMessages((current) => [
        ...current,
        { id: makeId(), kind: 'user', text, attachment },
      ]);
    },
    [],
  );

  const respondLater = useCallback((build: () => void) => {
    setIsThinking(true);
    thinkingRef.current = true;
    window.setTimeout(() => {
      setIsThinking(false);
      thinkingRef.current = false;
      build();
    }, 450);
  }, []);

  const applyAnswers = useCallback((next: IntakeAnswers) => {
    answersRef.current = next;
    setAnswers(next);
  }, []);

  const updateAnswer = useCallback(
    (key: AnswerKey, value: IntakeAnswers[AnswerKey]) => {
      const next = { ...answersRef.current, [key]: value };
      applyAnswers(next);
      if (key === 'urgency' && value === 'today') {
        toast.info("Got it — we'll flag this as urgent.");
      }
    },
    [applyAnswers],
  );

  /** The key the dock is currently showing (edit key, or the active set slot). */
  const getCurrentKey = useCallback((): AnswerKey | null => {
    if (editKeyRef.current) return editKeyRef.current;
    const keys = activeSetKeysRef.current;
    return keys[setIndexRef.current] ?? null;
  }, []);

  const goToReview = useCallback(
    async (a: IntakeAnswers) => {
      activeSetRef.current = null;
      setActiveSet(null);
      editKeyRef.current = null;
      setEditKey(null);
      phaseRef.current = 'review';
      setPhase('review');
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          kind: 'assistant',
          text: "Here's everything I've pulled together. Take a look — edit anything in the panel on the right, then send it over and we'll prepare your quote and line up a lawyer.",
        },
      ]);
      setSummary(definition.staticSummary(a));
      const composed = await composeReviewSummary(definition, a);
      setSummary(composed);
    },
    [definition],
  );

  /** Open a set: snapshot its keys and start at the first unanswered question. */
  const goToSet = useCallback(
    (setId: SetId, a: IntakeAnswers) => {
      const keys = getSetKeys(definition, setId, a, requiredOnlyRef.current);
      activeSetRef.current = setId;
      setActiveSet(setId);
      activeSetKeysRef.current = keys;
      setActiveSetKeys(keys);
      editKeyRef.current = null;
      setEditKey(null);
      const firstUnanswered = keys.findIndex(
        (k) => !isAnsweredKey(questions, k, a),
      );
      const startIndex = firstUnanswered >= 0 ? firstUnanswered : 0;
      setIndexRef.current = startIndex;
      setSetIndex(startIndex);
      phaseRef.current = 'asking';
      setPhase('asking');
    },
    [definition, questions],
  );

  /** Finish a single-key Sheet edit: re-card the value and return to review. */
  const completeEdit = useCallback(() => {
    const key = editKeyRef.current;
    const a = answersRef.current;
    if (key && getAnswerDisplay(questions, key, a)) {
      setMessages((current) => [
        ...current,
        { id: makeId(), kind: 'answered', key },
      ]);
    }
    editKeyRef.current = null;
    setEditKey(null);
    void goToReview(a);
  }, [goToReview, questions]);

  /**
   * Collapse the active set: push an `answered` item for each of its keys that
   * has a display value (renders as one AnsweredCard), mark the set committed,
   * then open the next set or go to review.
   */
  const completeSet = useCallback(() => {
    const set = activeSetRef.current;
    if (!set) return;
    const a = answersRef.current;
    const carded = cardedKeysOf(messagesRef.current);
    const items = activeSetKeysRef.current
      .filter((key) => getAnswerDisplay(questions, key, a) && !carded.has(key))
      .map((key): ChatItem => ({ id: makeId(), kind: 'answered', key }));
    if (items.length > 0) {
      setMessages((current) => [...current, ...items]);
    }
    const committed = uniq([...committedSetsRef.current, set]);
    committedSetsRef.current = committed;
    setCommittedSets(committed);
    if (set === 'basics') {
      pushAssistant(definition.buildTriageTransition(a));
    }
    const next = nextSet(definition, committed, a, requiredOnlyRef.current);
    if (next) goToSet(next, a);
    else void goToReview(a);
  }, [definition, goToReview, goToSet, pushAssistant, questions]);

  /** Move forward within the set, or finish it (or the edit) when at the end. */
  const advance = useCallback(() => {
    if (phaseRef.current === 'intro') {
      phaseRef.current = 'asking';
      setPhase('asking');
    }
    if (editKeyRef.current) {
      completeEdit();
      return;
    }
    const keys = activeSetKeysRef.current;
    const idx = setIndexRef.current;
    if (idx < keys.length - 1) {
      setIndexRef.current = idx + 1;
      setSetIndex(idx + 1);
      return;
    }
    completeSet();
  }, [completeEdit, completeSet]);

  const runParse = useCallback(
    async (text: string) => {
      setIsThinking(true);
      thinkingRef.current = true;
      const parsed = await parseSituation(text, definition);
      setIsThinking(false);
      thinkingRef.current = false;

      const merged = { ...answersRef.current, ...parsed.answers };
      applyAnswers(merged);
      requiredOnlyRef.current = true;
      setRequiredOnly(true);
      pushAssistant(buildAck(parsed.keys.length));

      const basicsDone = triageKeys.every((key) =>
        isAnsweredKey(questions, key, merged),
      );
      if (!basicsDone) {
        // Not enough to collapse triage — open the Basics set (parsed answers
        // pre-fill) starting at the first unanswered question.
        goToSet('basics', merged);
        return;
      }

      // Collapse every captured question into one card with "from description"
      // tags, mark Basics committed, then ask only the missing required details.
      const carded = cardedKeysOf(messagesRef.current);
      const captured = visibleQuestions(definition, merged).filter(
        (key) => getAnswerDisplay(questions, key, merged) && !carded.has(key),
      );
      if (captured.length > 0) {
        setMessages((current) => [
          ...current,
          ...captured.map(
            (key): ChatItem => ({ id: makeId(), kind: 'answered', key }),
          ),
        ]);
      }
      const committed = uniq([...committedSetsRef.current, 'basics' as SetId]);
      committedSetsRef.current = committed;
      setCommittedSets(committed);

      const next = nextSet(definition, committed, merged, true);
      if (next) goToSet(next, merged);
      else void goToReview(merged);
    },
    [
      applyAnswers,
      definition,
      goToReview,
      goToSet,
      pushAssistant,
      questions,
      triageKeys,
    ],
  );

  const runParseInReview = useCallback(
    async (text: string) => {
      setIsThinking(true);
      thinkingRef.current = true;
      const parsed = await parseSituation(text, definition);
      setIsThinking(false);
      thinkingRef.current = false;

      const merged = { ...answersRef.current, ...parsed.answers };
      applyAnswers(merged);

      const carded = cardedKeysOf(messagesRef.current);
      const captured = visibleQuestions(definition, merged).filter(
        (key) => getAnswerDisplay(questions, key, merged) && !carded.has(key),
      );
      if (captured.length > 0) {
        setMessages((current) => [
          ...current,
          ...captured.map(
            (key): ChatItem => ({ id: makeId(), kind: 'answered', key }),
          ),
        ]);
      }
      pushAssistant(
        captured.length > 0
          ? "Updated — I've added that to your matter."
          : "Noted — I've added that to your matter.",
      );
      setSummary(definition.staticSummary(merged));
      const composed = await composeReviewSummary(definition, merged);
      setSummary(composed);
    },
    [applyAnswers, definition, pushAssistant, questions],
  );

  const answerActiveViaText = useCallback(
    (text: string) => {
      const key = getCurrentKey();
      const question = key ? questions[key] : undefined;
      if (!key || !question) {
        void runParse(text);
        return;
      }

      if (question.ui === 'card-grid' || question.ui === 'chips') {
        const matched = matchOption(question, text);
        if (matched) {
          updateAnswer(key, matched);
          advance();
        } else {
          void runParse(text);
        }
        return;
      }
      if (question.ui === 'multi-select') {
        const matched = matchOption(question, text);
        if (matched) {
          updateAnswer(key, [matched]);
          advance();
        } else {
          void runParse(text);
        }
        return;
      }
      if (question.ui === 'date') {
        updateAnswer(key, text);
        advance();
        return;
      }
      if (question.ui === 'upload') {
        pushAssistant('Use the paperclip below to attach your file.');
        return;
      }
      // text / textarea: store verbatim.
      updateAnswer(key, text);
      advance();
    },
    [advance, getCurrentKey, pushAssistant, questions, runParse, updateAnswer],
  );

  const handleUserText = useCallback(
    (text: string) => {
      if (thinkingRef.current) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      pushUser(trimmed);

      if (phaseRef.current === 'review') {
        void runParseInReview(trimmed);
        return;
      }
      if (phaseRef.current === 'asking') {
        answerActiveViaText(trimmed);
        return;
      }
      void runParse(trimmed);
    },
    [answerActiveViaText, pushUser, runParse, runParseInReview],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      setExtractionError(null);
      const existing =
        (answersRef.current.documents as
          | ReturnType<typeof toFileMeta>[]
          | undefined) ?? [];
      const withDocs = {
        ...answersRef.current,
        documents: [...existing, ...files.map(toFileMeta)],
      };
      answersRef.current = withDocs;
      setAnswers(withDocs);

      const [firstFile] = files;
      if (!firstFile) return;
      if (!definition.applyExtraction) return;
      setExtracting(true);
      void extractFromFile(firstFile).then((result) => {
        setExtracting(false);
        if (!result.ok) {
          setExtractionError(result.reason);
          return;
        }
        const next = definition.applyExtraction?.(
          answersRef.current,
          result.fields,
        );
        if (next) {
          answersRef.current = next;
          setAnswers(next);
          toast.success('We pulled a few details from your document.');
        }
      });
    },
    [definition],
  );

  const handleAttach = useCallback(
    (files: File[]) => {
      const [first] = files;
      if (thinkingRef.current || !first) return;
      addFiles(files);
      if (getCurrentKey() !== 'documents') {
        const label =
          files.length === 1
            ? `Attached ${first.name}`
            : `Attached ${files.length} files`;
        pushUser(label, { name: first.name, size: first.size });
        respondLater(() =>
          pushAssistant("Thanks — I'll include that with your matter."),
        );
      }
    },
    [addFiles, getCurrentKey, pushAssistant, pushUser, respondLater],
  );

  const handleRemoveFile = useCallback((index: number) => {
    const existing =
      (answersRef.current.documents as
        | ReturnType<typeof toFileMeta>[]
        | undefined) ?? [];
    const next = {
      ...answersRef.current,
      documents: existing.filter((_, i) => i !== index),
    };
    answersRef.current = next;
    setAnswers(next);
  }, []);

  const handleEditKey = useCallback(
    (key: AnswerKey) => {
      // Pull the field's card out of the transcript and re-ask it as a transient
      // single-key dock that returns to review once answered.
      setMessages((current) =>
        current.filter(
          (item) => !(item.kind === 'answered' && item.key === key),
        ),
      );
      editKeyRef.current = key;
      setEditKey(key);
      activeSetRef.current = null;
      setActiveSet(null);
      setIndexRef.current = 0;
      setSetIndex(0);
      phaseRef.current = 'asking';
      setPhase('asking');
      pushAssistant("Sure — let's update that.");
    },
    [pushAssistant],
  );

  const handleSubmit = useCallback(() => {
    phaseRef.current = 'generating';
    setPhase('generating');
  }, []);

  const handleSaveForLater = useCallback(() => {
    toast.success('Saved — come back anytime to finish.');
  }, []);

  const handleGenerationComplete = useCallback(() => {
    phaseRef.current = 'success';
    setPhase('success');
    clear();
  }, [clear]);

  const resetState = useCallback(() => {
    answersRef.current = {};
    activeSetRef.current = 'basics';
    activeSetKeysRef.current = triageKeys;
    setIndexRef.current = 0;
    committedSetsRef.current = [];
    editKeyRef.current = null;
    phaseRef.current = 'intro';
    requiredOnlyRef.current = false;
    setAnswers({});
    setMessages([
      { id: 'greet', kind: 'assistant', text: definition.introGreeting },
    ]);
    setActiveSet('basics');
    setActiveSetKeys(triageKeys);
    setSetIndex(0);
    setCommittedSets([]);
    setEditKey(null);
    setRequiredOnly(false);
    setPhase('intro');
    setSummary('');
    setExtracting(false);
    setExtractionError(null);
  }, [definition.introGreeting, triageKeys]);

  const handleStartOver = useCallback(() => {
    clear();
    resetState();
  }, [clear, resetState]);

  const handleResume = useCallback(() => {
    const draft = initialDraft as IntakeDraft;
    const setKeys = draft.activeSet
      ? getSetKeys(
          definition,
          draft.activeSet,
          draft.answers,
          draft.requiredOnly,
        )
      : [];
    answersRef.current = draft.answers;
    activeSetRef.current = draft.activeSet;
    activeSetKeysRef.current = setKeys;
    setIndexRef.current = draft.setIndex;
    committedSetsRef.current = draft.committedSets;
    editKeyRef.current = null;
    phaseRef.current = draft.phase;
    requiredOnlyRef.current = draft.requiredOnly;
    setAnswers(draft.answers);
    setMessages(draft.messages);
    setActiveSet(draft.activeSet);
    setActiveSetKeys(setKeys);
    setSetIndex(draft.setIndex);
    setCommittedSets(draft.committedSets);
    setEditKey(null);
    setRequiredOnly(draft.requiredOnly);
    setPhase(draft.phase === 'generating' ? 'review' : draft.phase);
    if (draft.phase === 'review' || draft.phase === 'generating') {
      setSummary(definition.staticSummary(draft.answers));
    }
    setShowResume(false);
    setStarted(true);
  }, [definition, initialDraft]);

  const handleStartFresh = useCallback(() => {
    clear();
    resetState();
    setShowResume(false);
    setStarted(true);
  }, [clear, resetState]);

  // Seeded start: once the flow is live, run the matter's parse on the message
  // the user already typed in the unified entry chat, prefilling answers and
  // advancing past the questions we can answer. Runs exactly once.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!started || seededRef.current) return;
    const seed = seedTextRef.current;
    if (!seed) return;
    seededRef.current = true;
    void runParse(seed);
  }, [started, runParse]);

  if (!hydrated || (!started && !showResume)) return null;

  if (showResume) {
    return (
      <ResumeBanner onResume={handleResume} onStartFresh={handleStartFresh} />
    );
  }

  const headerTitle = definition.buildHeaderTitle(answers);

  const dockSetKeys: AnswerKey[] = editKey ? [editKey] : activeSetKeys;
  const currentKey = dockSetKeys[setIndex] ?? null;
  const activeQuestion = currentKey ? questions[currentKey] : null;
  const showDock =
    currentKey !== null && (phase === 'asking' || phase === 'intro');
  const showComposer = phase !== 'generating' && phase !== 'success';

  let placeholder = 'Type a message…';
  if (phase === 'review') {
    placeholder = 'Anything to add before we prepare your quote?';
  } else if (phase === 'intro') {
    placeholder = 'Describe your situation, or pick what you need below…';
  } else if (phase === 'asking' && activeQuestion) {
    const isFreeText =
      activeQuestion.ui === 'text' ||
      activeQuestion.ui === 'textarea' ||
      activeQuestion.ui === 'date';
    placeholder = isFreeText
      ? (resolveCopy(activeQuestion.header, answers) ?? 'Type your answer…')
      : 'Or reply directly…';
  }

  const currentSkipKey = currentKey
    ? questions[currentKey]?.skipKey
    : undefined;

  const terminal =
    phase === 'generating' ? (
      <GeneratingScreen onComplete={handleGenerationComplete} />
    ) : phase === 'success' ? (
      <IntakeSuccess shortlist={definition.getLawyerShortlist(answers)} />
    ) : phase === 'review' ? (
      <div className="pt-2">
        <ReviewSummary
          definition={definition}
          answers={answers}
          summary={summary}
          aiAssisted={aiEnabled}
          exploring={answers.urgency === 'exploring'}
          onEditStep={handleEditKey}
          onSubmit={handleSubmit}
          onSaveForLater={handleSaveForLater}
        />
      </div>
    ) : null;

  return (
    <IntakeChatShell
      title={headerTitle}
      panel={
        <IntakeProgressPanel
          definition={definition}
          answers={answers}
          phase={phase}
          onEditKey={handleEditKey}
          onStartOver={handleStartOver}
        />
      }
      footer={
        showComposer ? (
          <>
            {showDock && currentKey ? (
              <QuestionDock
                questions={questions}
                setKeys={dockSetKeys}
                index={setIndex}
                onIndexChange={(i) => {
                  setIndexRef.current = i;
                  setSetIndex(i);
                }}
                answers={answers}
                aiEnabled={aiEnabled}
                extracting={extracting}
                extractionError={extractionError}
                onSelect={(value) => {
                  updateAnswer(currentKey, value);
                  advance();
                }}
                onConfirmMulti={(values) => {
                  updateAnswer(currentKey, values);
                  advance();
                }}
                onText={(value) => {
                  updateAnswer(currentKey, value);
                  advance();
                }}
                onContinue={advance}
                onSkip={advance}
                onAddFiles={addFiles}
                onRemoveFile={handleRemoveFile}
                onDismissExtractionError={() => setExtractionError(null)}
                onDateChange={(value) => updateAnswer(currentKey, value)}
                onNoDeadlineChange={(value) => {
                  if (currentSkipKey) updateAnswer(currentSkipKey, value);
                }}
                onFocusComposer={focusComposer}
              />
            ) : null}
            <ChatComposer
              disabled={isThinking}
              placeholder={placeholder}
              onSend={handleUserText}
              onAttach={handleAttach}
            />
          </>
        ) : null
      }
    >
      {renderTranscript(messages, answers, questions)}
      {isThinking ? <TypingIndicator /> : null}
      {terminal}
    </IntakeChatShell>
  );
}

/** Render the transcript, grouping consecutive answered questions into cards. */
function renderTranscript(
  messages: ChatItem[],
  answers: IntakeAnswers,
  questions: Record<string, QuestionDef>,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;
  while (index < messages.length) {
    const item = messages[index];
    if (!item) break;
    if (item.kind === 'answered') {
      const groupKeys: AnswerKey[] = [item.key];
      const groupId = item.id;
      let next = index + 1;
      while (next < messages.length) {
        const candidate = messages[next];
        if (!candidate || candidate.kind !== 'answered') break;
        groupKeys.push(candidate.key);
        next += 1;
      }
      nodes.push(
        <AnsweredCard
          key={groupId}
          keys={groupKeys}
          answers={answers}
          questions={questions}
        />,
      );
      index = next;
      continue;
    }
    if (item.kind === 'user') {
      nodes.push(
        <ChatMessage
          key={item.id}
          messageId={item.id}
          role="user"
          attachment={item.attachment}
        >
          {item.text}
        </ChatMessage>,
      );
    } else {
      nodes.push(
        <ChatMessage key={item.id} messageId={item.id} role="assistant">
          {item.text}
        </ChatMessage>,
      );
    }
    index += 1;
  }
  return nodes;
}
