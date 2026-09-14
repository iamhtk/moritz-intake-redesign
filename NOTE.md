# Client intake, redesigned

What I did and why. The code is at `/en/client/new`. Six states are reachable
without having to play the flow through: `?demo=1` for the four field states,
`?demo=review` and `?demo=sent` for the phases either side of submission,
`?demo=sentgap` for a sent case with a gap worth asking about, and
`?demo=quote` and `?demo=noquote` for the two shapes of what happens after — a
quote the client can disagree with, and a matter we cannot put a fixed price on.
The last two are query-string-only on purpose: the quote is written by a person
after submission, so no run of this prototype produces one.

Open them in one tab, in any order. That sentence is here because it was not
true until the last day: an in-progress intake is saved to `localStorage`, the
seed refused to run over a brief that already had values in it, and the second
link you clicked therefore showed you the first one's screen. Five documented
URLs and a reviewer would have concluded four of them were never built. A demo
link now clears a session left by a _different_ demo link and nothing else — a
refresh keeps your edits, and a real intake in progress is never touched
(`lib/intake/demo-session.ts`).

## The page you asked for

You said a page is plenty, so this is the page. Everything after it is the
detail behind a decision, for whichever ones you want to argue with.

**The problem.** Four complaints, one cause: the intake is a form wearing a chat
costume. Seven questions, one at a time, no way back. A chat has no shape, so
you cannot be anywhere in it, and no end, so you cannot tell when you are done.

**The change.** The brief became the product and the chat became how you fill it
in. The client watches their own case get built, value by value, and every
value the model worked out is shown back with where it came from and confirmed
before it can leave the building. Progress counts what the client has confirmed,
not questions answered, so a dropped contract that answers four fields moves it
four.

**After the send**, which is where half of complaint two actually lives: a
receipt with a reference, a status and an email; seven pipeline rows saying what
is coming; and inside them the fact your notes gave us — a draft of their
document is already being written, 20 to 50 minutes, during the wait they
experience as silence. Then permission to leave, because the quote reaches them
anyway. Then one request, if there is one worth making. The agent stays
available to answer, which is a change to how Moritz works today and is declared
as one in §3.

**What I would not do.** No timer anywhere: nothing ticks unless a response
arrived. No figure on the quote in the live flow, because a person writes it. No
first-person quote invented for a named lawyer. No progress row for work nobody
can see happening.

**What I would want from you first.** Real events for the pipeline rail, which
would turn "a draft is being written" into a fact about their document rather
than about your process. And first-person copy from the bench.

**One thing worth knowing before you click.** §7 lists seven defects that only
appeared when I drove the real app — the rail that was correct and 822px below
the fold, the count line that contradicted the reply above it, the prompt that
disagreed with the screen about your own pipeline. The tests were green for all
of them. That section is the most useful page in here.

---

## 1. What I think the real problem is

Four complaints, one cause: **the intake is a form wearing a chat costume.**
Seven questions, one at a time, no way back. That shape produces every
complaint on its own. You cannot see where you are, because a chat has no
shape. You cannot tell when you are done, because a chat has no end. Upload is
question six in a queue. Answering seven scripted questions feels like
paperwork because it is paperwork.

So a better chat does not fix it. The centre of gravity has to move.

## 2. What I changed

**The brief became the product. The chat became how you fill it in.** The
client watches their own case get built in front of them.

Three things follow from that, and they are the ones worth arguing about:

- **Progress is information received, not steps taken.** The bar counts fields
  the client has confirmed, so a contract that answers four of them moves it
  four, whether it arrives in the first second or the last.
- **Nothing the model worked out is true until the client says so.** Every
  value read from a document or inferred from a message is shown back, marked
  unsure with its source, and confirmed before it can leave the building. The
  gate costs the client a tap, and it is the only thing standing between a
  misread party name and a drafted document. A value read from a contract shows
  the passage it came from; a value the model merely worked out shows one line
  of why. Those are the only two rows that need to account for themselves — a
  value the client typed is already theirs — and the difference between them is
  enforced in code rather than asked of the prompt.
- **The conversation is model-driven.** The per-matter field lists stay as
  data; the sequencing went to the model. The code owns the brief, the model
  owns the conversation, and the code decides when intake is complete.

### The half of complaint two that is after the send

Complaint two reads as one sentence and is two questions from two moments. _How
long is this, how many steps, am I nearly done?_ is asked while filling the
thing in, and the brief panel answers it. _I pressed send — what is happening to
my case now?_ is asked afterwards, and until the last day nothing answered it at
all. Your own summary of what the client experiences is the diagnosis: submit, a
quote to pay, silence, a lawyer appears, a document arrives. Three of the seven
steps behind that are invisible by design and the client cannot tell how many
are left.

So the confirmation now carries the pipeline, seven rows, as the client can
honestly be shown it (`lib/intake/case-stages.ts`). Three things about it are
decisions rather than layout:

- **Drafting is a line on the pricing row, not a row after payment.** The
  obvious shape was eight sequential rows following the brief's numbering, and
  it was built that way and it was wrong. Garzai's answer corrects it: "the
  drafting agent starts on the first draft straight away, currently 20 to 50
  minutes, and a QA agent reviews it. Once the quote is paid, a lawyer is
  assigned." Steps two and three do not follow the quote, they run _alongside_
  it, inside the exact window the client experiences as silence. That turns the
  answer to "what is happening during those four hours" from "we are preparing
  your quote" into **"a draft of your document already exists"**, which is the
  single most valuable sentence available on that screen. A linear rail cannot
  say it and a concurrent row would need a second "you are here" mark, so it is
  a second line on the row it genuinely coincides with.
- **A row is `done` only where the client's screen has evidence of it**, and
  nothing in the rail is driven by a clock. The reference product the brief
  points at has a top bar reading "Uploading" across five screens and
  twenty-nine minutes of footage and never resolves; a rail advancing on a
  `setInterval` would be that defect with better typography, and worse, because
  it would be a law firm telling a client their document had been drafted when
  nobody had opened the file. The one live row does not spin either: a lawyer
  will read the brief at some point in the next four hours and a spinner would
  be this product claiming to watch them do it.
- **The quote is three rows, not one** — we price it, you get a price, you pay —
  because it is the only step the client drives, and collapsing it would hide
  the only part that is theirs. The three rows after acceptance fold away behind
  one click: somebody deciding whether to spend money is entitled to see the
  process, and it is not yet what they came to find out.

The rail was also the first thing this project got right in code and wrong on
screen, which is written up in §7 because the lesson is not about the rail.

Three smaller things sit under it, in this order. **Permission to leave** —
"you can close this tab, your quote comes to your email and to the bell" — which
is the cheapest sentence on the screen and the one that most makes a firm feel
expensive, and which is only true because the email receipt and the bell
notification both genuinely exist. **The one thing that would help most**, if
there is one: a case with no document attached is asked for the document, a case
with no stated outcome is asked what a good result looks like, and a case with
neither gap is asked for nothing at all and says nothing at all
(`lib/intake/one-more-thing.ts`). It is one request with a reason, not a form
reopening, and there is deliberately no _Not now_ button, because skipping is
closing the tab and the sentence above has already allowed that. **The faces are
readable**: pressing one opens the name, the role, the credential and where they
trained, which is a fair way to spend a wait and the direct answer to "it feels
sterile".

Things I added that the brief did not ask for, and would defend:

- **The quote sentence.** The flow hands the client into a commercial step and
  says nothing about it. Garzai named the gap: after submit comes a quote, and
  a lawyer only after the quote is paid. Every surface now says so, and none of
  them implies a lawyer is next.
- **Confusion handling.** In the flow this replaces, typing "I don't understand
  what you mean" recorded that sentence as the answer and then used it as the
  name of the case. It now produces zero field updates. I measured it against
  the live API with three confused messages in a row, not one, because the
  interesting failure is a model that holds the line once and gives up.
- **A named way out, on every screen, and a face that answers.** One quiet
  control under the composer: _Talk to a person_. The same dialog opens from
  the lawyer's own card, where it names whoever that is instead — _Ask {them}
  something_ — because a real person on screen who cannot be spoken to is a
  stock photo with a biography, and that is what the face was before this. What
  the client writes goes onto the case transcript, which is the channel the
  whole intake already travels on, so it genuinely reaches the person who reads
  the brief. What the client writes is appended to the case transcript,
  which is the same channel the whole intake travels on, so it genuinely reaches
  whoever reads the brief — and it does **not** start a model turn, because a
  reply to "I would rather explain this on a call" is the software arguing with
  someone who has just told you it is not enough. It is the one permanent
  control in the flow, and deliberately the only one: a row of mode toggles
  hands a decision to someone with no basis for making it, and Alex should not
  be choosing between fast and careful on their own dispute. An exit is not a
  mode.
- **A written limit on how much of a client's document this will ever show.**
  A verified quote earns the sentence it sits in and one either side; it does
  not earn a page. That holds on screen, in the JSON crossing the wire, and in
  any screenshot of either. Most of the bound is structural, and the part that
  is not is the case worth having a test for: a scanned page through OCR has no
  sentence boundaries at all, so "three sentences" on that document is the whole
  file. There is a character cap, it cuts on a word boundary, and it says that
  it cut.
- **Telling the client what the microphone costs.** Dictation uses the browser's
  own `SpeechRecognition`, which in Chrome is not on-device — the audio goes to
  the vendor to be transcribed. On a screen where someone is describing a
  confidential dispute that is worth saying, so it is said, in one sentence,
  while the mic is actually running. It was the only control in the flow whose
  real cost was unstated.
- **The four-state field.** From Legora, which you named as the reference.
- **A flow that completes on the keyboard.** Tabbed end to end, which turned up
  four focus rings that rendered nothing and two phantom tab stops. The
  composer was the worst of them: an `::after` ring with no `content`, so the
  one control the entire flow runs through had no focus indication at all.
  Mentioned because §5 makes a point of the accessibility in your videos, and
  it would be cheap of me to raise that without having checked my own.

## 3. One change to how Moritz works, not just to the screens

Worth its own heading because it contradicts something you told us, and the
right thing to do with that is say so rather than let you find it.

You wrote: **"The client does not see the agent again after submission. From
that point only our Ops team and the assigned lawyer speak to them."** We have
kept the agent alive after submission, on purpose.

The reason is the shape of the gap. The client is told to wait up to four hours
for a price, and in the current flow the one live control on that screen — the
composer — was still there and still wired to the interviewer. So a client
asking "how long does this take?" got an agent trying to ask them about their
notice period, and anything it proposed was dropped on arrival, because the
brief is sealed. The choice was not between a concierge and silence. It was
between a concierge and a text box that answers the wrong question.

So there are two prompts rather than one (`lib/intake/waiting-prompt.ts`). The
second one collects nothing, has a closed list of facts, and is told what to do
when a question falls outside it: say you do not know, and offer the person. It
answers where the case is, what the quote covers, what the firm is, and how to
send a document now that the brief is closed. It refuses to quote, estimate or
hint at a price, and it refuses to assess the matter — the two things a client
with nothing to do but wait is most likely to ask, and the two refusals
`waiting-prompt.test.ts` now pins. What it is emphatically not for is company. A
firm with time to make small talk is a firm with time on its hands.

Three tappable questions sit under the composer, because nobody types into a
blank box on a screen that has just told them they are finished. They are the
three the closed fact list can answer completely, and a test asserts none of
them is a question the prompt is obliged to refuse: offering a refusal as a
suggestion would be baiting somebody into being told no.

Two things follow that you should overrule if this is the wrong call. Anything
said after submission now lands on the case transcript rather than only in the
browser (`addSubmittedCaseTurns`) — a prototype that shows a reply and drops the
message is worse than one with no chat at all, because it looks like the message
landed. And your Ops team and the assigned lawyer still own the conversation
from assignment onwards; nothing here reaches past the quote.

## 4. What I assumed, because the brief did not say

- **One role.** I designed for the self-serve client. The other three are
  downstream consumers of what intake produces, and the case page is unchanged
  by design, though the handoff lands on the case you created.
- **The redesign is the default.** No flag, no gate. A flag would have meant
  designing two products and shipping the average.
- **The playground is not the product.** You said it is there for the visual
  language, not the flow, and that looking nothing like it is a good sign, so
  the layout follows the phase rather than the playground. The visual language
  is yours throughout: your components, your grey ramp, Cormorant Garamond and
  Inter, and every string in `messages/en.json`.
- **No brand guidelines arrived**, so I inferred them and wrote the inference
  down. `notes/colour-and-type-rulebook.md` is that: the twenty greys, white,
  black and five accents read off the real site, and a rule that colour is
  reserved for state. `notes/check-colours.sh` enforces it and passes. Two
  things follow that you should overrule if I guessed wrong. **Green marks and
  never speaks.** Your green is #5eae8b, which measures 2.66:1 on white — it
  fails WCAG AA for text by a wide margin, and so do the amber (3.73:1) and the
  red (3.57:1). So the whole confidence ramp lives on the 18px mark beside each
  row, where the bar to clear is 3:1 and it clears it, and the words next to it
  — High, Check this, You confirmed — are ink. A tick is content; a green word
  is decoration. Guard tests cap how much of each colour the flow can spend and
  fail the build on any colour that is not one of yours. And **the serif stays**, but for a better
  reason than inheritance: Legora, which you named as the reference, does use a
  display serif — roughly one line per screen, and that line is the largest
  thing on it. That is a deliberate match with your own reference rather than a
  playground habit. There are twelve `font-serif` uses in the flow and I would
  defend the large ones and the italic asides; the three step titles in the
  gold panel are the ones I would cut first.
- **The rail folds at 1280px**, and that is the width worth writing down
  because nothing in the code said it. At 1280 and up the journey rail is its
  own column at the far left; below it, it lies down into the sticky bar at the
  top of the page and opens on a tap. Two columns — conversation and brief —
  appear at 1024, so there is a step where the brief is beside the chat and the
  rail is still folded. That is deliberate: three columns need a brief wide
  enough to keep values beside their labels and a transcript wide enough to
  read, and 1024 has room for one of those, not both. Below 768 it is a single
  column; between 768 and 1024 that column stops growing and centres at 40rem
  rather than stretching to fill a tablet. Walked at every width in the table
  from 320 to 2560, on seven screens each.
- **Submission is stubbed**, so the sending state is a manufactured gap. The
  gap itself is not a fiction: you said the final pass "takes a few minutes"
  today and that the design has to survive it, so the wait is named rather than
  spun — three steps taken from your own description of what that pass does,
  close out the checklist, write up the notes, hand them over. Nine seconds is
  the prototype's length and a compromise: long enough that a single spinner
  starts to feel wrong, which is the point being demonstrated, and short enough
  that a reviewer clicking through four times does not resent it. When there is
  a backend the steps advance on real events and neither the copy nor the
  component changes.
- **Nobody has given us a timescale for anything after the quote**, so the rail
  says so once, under itself, rather than hedging on every row: "only the quote
  has a time on it. We would rather leave the rest without an estimate than
  guess at one." Eight rows in order is a strong implication that somebody knows
  how long they take, and four hours is a quote turnaround, not a turnaround for
  the work. Give us real figures and they belong on the rows.
- **The bench profiles are the facts you published, and no more.** They carry
  the name, the role, the credential and the school, all read off the roster.
  What they do not carry is a line in the lawyer's own voice, which is what
  would make them properly warm — and I am not willing to write one, because
  these are real people with real names and photographs, and an invented
  first-person sentence attributed to a named lawyer is not a design decision
  you can review, it is a fabrication you would have to retract. Four of the
  nine also have no surname in the roster. Both want copy from the firm, and
  they are a two-hour job once it exists.

## 5. What I left out on purpose

- **Slack.** The scaffolding is there and I left it alone. You said it is
  enterprise-only and enterprise never sees intake.
- **The document viewer proper.** A value read from a contract names the file
  and the clause, and clicking it now opens the passage it came from: the clause
  itself with the heading above and the clause below, cut verbatim from the
  PDF's own text layer, with the quoted line highlighted. No PDF viewer, no new
  dependency — `unpdf` already ran server-side to verify the quote, so the
  passage is the document rather than a rendering of it, and it never travels
  further than three sentences.
  That answers "is this real", which is the question the confirm gate asks the
  client to answer. It does not answer "what else does this say", and opening
  the actual file at the actual page still wants a real viewer. That is the part
  still marked `TODO(intake)`.
  Writing this feature found a bug worth the paragraph: the verifier normalises
  the whole document at once, so it rejoins a word the PDF hyphenated across a
  line break, and my first locator normalised sentence by sentence — where a
  line break is also a boundary, so the two halves of the word could never be
  rejoined. The result was the worst available shape: a quote the verifier
  accepts and the locator cannot find, so the row renders a source link with
  nothing behind it. There is now a test asserting that anything the verifier
  accepts is locatable, run against the real contract.
- **Grey placeholder bars where a document is implied.** The idea was to never
  render real document text and to imply it with skeleton bars instead. The
  confidentiality half of that is built and bounded (see §2); the skeleton bars
  are not, because there is no surface in this flow where a document is implied
  rather than shown. Everywhere one appears it appears by name, because the
  client needs to know which of their files is being talked about — and drawing
  grey bars in place of a filename we actually have would be less honest, not
  more.
- **Matter types beyond contract review.** The field lists for the others are
  data and already load; only contract is wired to the demo.
- **The agent-progress translation.** In production, you said, the agent
  replies once after the first message and then works in the background with
  nothing further visible. That single fact makes the case for a brief that
  visibly fills in better than any playground bug does. Mapping real agent
  events onto three or four client-facing states is the next piece of work, and
  it is a backend change, not a design one.

## 6. What I read, and what it changed

Two things the brief pointed me at, read properly rather than glanced at.

**Your own how-it-works videos.** Three findings I would want to know about if
they were mine. The compliance context pill in the step 3 video reads **"EU GDPR
Complicance"**. The draft's section headings in the same video read **"Liability
& Idemnification"** — that one is the damaging one, because it is core contract
vocabulary misspelled inside the panel whose whole job is making the drafting
look precise. And across all 21 `<video>` elements there are zero `<track>`
captions and zero `aria-label`s, with every word of meaning in steps 1–4 living
in on-screen text; none of it reaches a screen reader. The hero video also
carries a real stereo audio track that no visitor can ever hear, because it is
muted with no controls and no unmute on the page.

**Legora, which you named as the reference.** The single most useful thing I
found there is not a pattern to copy, it is a bug. **Its top bar says
"Uploading", with a spinner, in all twenty frames I have — five different
screens, from 2:29 to 18:31 — and never resolves.** The product the brief points
at has, in its own demo, exactly the vague-indicator problem the brief complains
about, for twenty minutes.

That is why the loading work in here is the shape it is, and it is a claim you
can check by reading the code rather than by trusting me. Every wait in
`lib/intake/waits.ts` is listed, with a test that fails the build if any two of
them share a sentence, and every one is driven by a response arriving — nothing
is on a timer anywhere in the flow. Each turn now also keeps a record of what
was actually done, with the real counts nested in it (how many documents were
read, how many values traced back to a line in the text, how many fields were
written), which folds into one line you can reopen three turns later. A rail is
a tempting place to put a reassuring step nobody measured, so the test asserts
every step on it is one of the listed waits.

## 7. What using it found that reading it did not

The last thing I did was drive the real app — a real matter, the live API, a
laptop window and a 390px one, every phase. It found seven things, and six of
them were invisible to the type checker and to 1,200 passing tests. They are
listed because "does the prototype actually work" is one of the five things you
say you are looking at, and because the pattern in them is the same.

**The rail was built, correct, and not on the screen.** It rendered in the right
place by every argument in the file: below the receipt, because "did that work"
is the question a client has just pressed send with, and "what happens next"
comes after. Then I measured it. The brief column is its own scroller and held
2,265px of content in 828px of height, so the rail began at 822 — behind the
sticky footer — with nine blocks above it. The ordering argument was right about
the question and wrong about the cost: the rows that answer "did that work" are
the reference and the status, and they are read in the first 300px. The rail is
now at 457 on a laptop and 609 on a phone, and the drafting sentence is on the
first screen. Moving it up also made a duplication visible that had been fine
while the two blocks were far apart: a "Next step" row saying "a lawyer reads
this and prices the work, then sends you a fixed quote, nobody is assigned until
you accept" is every clause of the rail, worse, and 100px of the reason the rail
was off screen. It is gone. "Nobody is assigned until you accept" survives as
the ordering of the _pay_ row before the _lawyer_ row, which is a stronger way
to say it, because the client can see which comes first.

**Moritz contradicted himself in one bubble.** On a turn that filled the last
required field while asking about the optional one, the count line read "which
is all of them. Nothing left to ask" directly under a reply whose final sentence
was a question. Both numbers were right; the confidence was not. The model
already reports what it is asking about — the panel marks that row "asking now"
— so the note is told too, and when a question is in flight it says "anything
else is optional" instead, which is both true and the more useful thing to know.
Extracted to `lib/intake/progress-note.ts` on the way out, because a rule with
three branches and a firing threshold should be readable by a test.

**The first row of the brief said "contract" in lower case.** The model returns
the matter type either as the id or as the label, both resolve correctly, and
one of them looks like a bug sitting above "Acme Holdings" on the screen that is
supposed to read like a document a firm would put its name on. Canonicalised for
that one field and only where the whole value _is_ a matter name: a value that
is a sentence about the client's circumstances is left exactly as written,
because that is the part a lawyer reads twice.

**A reply ended "(reply only)".** The waiting prompt still carried the intake's
per-property briefing — leave `fieldUpdates` empty, set
`nothingRequiredMissing` to true — for properties that are not in the schema the
model is handed. Describe a schema that is not there and the nearest thing the
model can do with the instruction is say it out loud. The section now names one
thing and forbids annotating it, and a test asserts the prompt mentions no
property the waiting schema does not have.

**The prompt and the rail disagreed about your own pipeline.** Asked how long
things take, Moritz said "once you accept, work starts" on a screen whose rail
said a draft was already being written. The rail had Garzai's correction and the
prompt still had the brief's numbered list. Two surfaces, one case, contradicting
each other in the same viewport — which is worse than either being wrong alone,
because a client who reads both learns that the product does not know. Fixed in
the prompt, with the drafting figure named as the single exception to "never put
a number on anything after the quote", and a test that reads both halves.

**The document tab sat on top of the text on a phone.** It is `fixed` to the
right edge at mid-height, which lands in the desktop gutter and, at 390px, in
the middle of a sentence. A reserved gutter rather than a moved control, because
every other position on a phone is worse and the edge is where the panel
actually comes from.

**And the demo links, in the header.** That one is the worst of the seven and the
least technical: five documented URLs, each correct on its own, and a reviewer
clicking them in one tab would have seen the first screen four times.

The pattern is that none of these are defects of implementation. Every one of
them is a decision that was right in the file it was written in and wrong once
something else existed next to it, and the only instrument that detects that is
a browser. The type checker and the tests were green throughout. I would rather
hand over the list than the impression that reading code is enough.

## 8. What I would do next

1. **The agent-progress mapping above**, and with it a dated commitment instead
   of an estimate, with a notification if it slips.
2. **Real events on the pipeline rail.** Every row in it is honest and static
   because nothing tells us when a stage happens. Three of the seven — drafting
   started, internal review done, revision back — are events your own agents
   already produce, and the rail is already built to take them: a row goes from
   `future` to `done` and nothing else changes. That is a backend change and the
   single highest-value one on this list, because it turns "a draft is being
   written" from a general fact about your process into a fact about _their_
   document.
3. **Extraction as a feedback loop.** Every correction the client makes to a
   document value is a labelled example of the reader getting it wrong, and
   right now that signal is recorded on the case and used for nothing.
4. **First-person copy for the bench**, from the lawyers. See §4.
5. **The before-and-after.** Today: submit, silence, quote, silence, lawyer.
   Ours: submit, receipt, seven steps with the drafting named inside the wait, a
   concierge who answers and refuses to guess, permission to leave, a quote with
   what it covers and four ways to answer it, lawyer introduction.

## One thing their flow has no design for

Their videos, and all twenty frames I have of the reference product, agree on
one thing: the quote arrives and the only control on it is `APPROVE AND START`.
That is the first decision in the whole journey with money attached, and there
is no design for the client saying anything other than yes. The client who is
not ready to say yes abandons the case, or agrees to something they did not
want.

So `?demo=quote` is that moment with four paths instead of one. Accept is still
first and still the only solid button: the default is yes, and a flow that leads
with "this seems high" is coaching people to haggle.

The one worth the work is **"this seems high"**, because the obvious version of
it is a dead end. Sending that sentence and nothing else means the client has
refused and given nobody anything to act on. So pressing it asks which of four
things it is, and three of them are briefs for the lawyer's next move: no budget
at this size, expected less for this kind of work, has a cheaper quote
elsewhere. The fourth — "nothing is wrong, I want to think about it" — is
deliberately unactionable and deliberately there. Without it, a client who
simply wants a day has to pick one of the three that misrepresents them, and a
misrepresented objection is worse for the lawyer than an honest silence. It is
also the only one that does not promise a reply, because promising one would be
inventing an obligation the client never asked for.

**"Quote me for part of it" is where the brief pays off.** Ten minutes were spent
itemising this matter, so a client asking for less can point at the parts that
already exist instead of describing a scope from nothing. The options are the
brief's own filled required fields, derived rather than listed, so they cannot
go stale when a matter type changes.

`?demo=noquote` is the other half: what the client sees when a fixed fee is not
possible. It is a product decision and not an error screen, which is the whole
of the design brief for it — no destructive colour, no alert icon, and the
heading in the same serif the brief's own title uses, because this is a
considered answer rather than something going wrong. Every reason says what is
possible instead, and a test fails the build if one of them does not: "we cannot
help" and "we cannot help on these terms" are very different sentences and only
the second is ever true.

**On the number.** The live flow shows no price, and I would keep it that way —
the real quote is written by a person after submission, so any figure this
prototype invented would be a commitment nobody made. But the response is not a
real decision without a number on the screen, so that screen reads one out of
this app's own case fixtures (`case_007`, the nearest comparable matter) and says
on its face that it is an example figure from the prototype's data. Unmarked, it
would have been the one place here where a made-up number sat on screen looking
like a quote.

## One thing the model got wrong, and how it is handled

Worth a paragraph because it is the shape of the whole approach. The seeded
contract names two companies in the same recital, in the same format, one
sentence apart, and nothing in the document says which of them is the client.
Handed over with the client's own sentence ("we signed an MSA with Acme") the
reader gets it right. Handed over with no words, which is a real path because
the opening move never requires any, it picked the first party it read, and
Moritz said it out loud: "with Northwind Logistics as the other side". The
client's own company, named to a lawyer as their opponent.

I tightened the prompt first. It stopped the value being the whole recital
clause, and it did not stop this: the next run made the same mistake with the
sentence present, having got it right the run before. It is not a rule the
reader follows unreliably, it is a coin it flips.

So the code decides. A value naming the other side only survives a read if it
is traceable to something the client actually said; otherwise it is withheld
and Moritz asks. He now asks well: _"Who is the other party to this agreement
from your side?"_ An empty field costs the client one question. A wrong one
costs them catching us out.

That is the thesis in miniature. The model is good at reading and bad at
knowing what it cannot know, so the code keeps the decisions that have
consequences and the client keeps the last word.

---

`pnpm verify` runs typecheck, lint, prettier and the test suite: 1,223 tests
pass, **970 of them the intake's own**, under `lib/intake` and
`components/design/intake-v2`. Five end-to-end runs against the live API are
opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`.

A few are worth opening, because they enforce decisions rather than behaviour:
`waits.test.ts` fails the build if two loading states share a sentence,
`timeline.test.ts` if a step appears that no listed wait produced,
`colour-restraint.test.ts` if green is used anywhere but the progress bar,
`radii.test.ts` if a fourth corner radius appears, `verify-source.test.ts` if a
quote the verifier accepts cannot be located in the document, and
`demo-brief.test.ts` re-reads the real seeded PDF so the demo cannot drift into
showing a passage the contract does not contain. `notes/check-colours.sh`
passes.

Four are new and guard the post-submission work. `waiting-prompt.test.ts` fails
the build if the concierge stops refusing to price the work or to assess the
matter, if it starts naming a property its schema does not have, or if it
disagrees with the rail about when the drafting happens — that file existed as a
claim in a comment before it existed as a file, which is the worst way for a
refusal to be protected. `case-stages.test.ts` fails if a rail row is ticked
without evidence on the client's own screen, if more than one row is `current`,
or if `paid` stops preceding `lawyer`. `one-more-thing.test.ts` fails if the
confirmation asks a client for something they already gave, or if it ever asks
about money. And `progress-note.test.ts` fails if the count line goes back to
promising there is nothing left to ask while the reply above it is asking
something.
