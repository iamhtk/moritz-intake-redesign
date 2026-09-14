# Client intake, redesigned

**Start here:** [`TOUR.md`](TOUR.md) — five screens, in order, with the demo
links. Or open `/en/client/new` and start a case; it is meant to be obvious
without a tour.

---

## The problem

Four complaints, one cause: the intake is a form wearing a chat costume.
Seven questions, one at a time, no way back. A chat has no shape, so you
cannot be anywhere in it, and no end, so you cannot tell when you are done.
Upload is question six in a queue. A better chat does not fix that. The
centre of gravity has to move.

## The change

**The brief became the product. The chat became how you fill it in.** The
client watches their own case get built beside them, and three things
follow:

- **Progress is information received, not steps taken.** The bar counts
  facts the client has confirmed, so a contract that answers four of them
  moves it four.
- **Nothing the model worked out is true until the client says so.** Every
  value is shown back with its source — the passage from the document, or
  one line of why — and confirmed before it can leave.
- **The code owns the brief; the model owns the conversation.** The field
  lists are data. The code decides when intake is complete, and withholds a
  party name the model cannot trace to something the client said.

## The four complaints

**"Did I submit?"** A receipt with a reference number, a status and the
reviewer, on a screen that stays. An email, and the bell. Then the cheapest
sentence that most makes a firm feel expensive: you can close this tab. True
only because the email and the bell exist.

**"Where am I?"** One rail, on the left, from the first screen to the last:
Brief, Quote, Lawyer, Document. It starts as the "how this works" card — who
does each step, and when — and becomes the tracker the moment the client
types. After Send, the Quote step opens on the fact your notes gave me and
the client is never told: a draft of their document is already being
written, inside the wait they experience as silence.

**"How do I upload?"** Drop a file anywhere. The composer eats it. Several
at once, one read. The icon is the file's own colour, so a PDF is red because
PDFs are red. What the document answered fills in as you watch.

**"It feels sterile."** Faces where a person actually is, not as decoration.
The lawyer who prices your kind of matter is on the home screen, follows you
to the confirmation, and signs the email. Their card is the one permanent
control in the flow — _Talk to a person_ — because a face you cannot speak
to is a stock photo with a biography.

## The wait

You said to assume a gap between the click and the case landing. The
prototype names it instead of spinning: three steps from your own
description of that pass — checking nothing is missing, writing up the
notes, handing them over — and "you do not have to stay." Nine seconds:
long enough for a single spinner to start feeling wrong, which is the point.

## Beyond the screens

Seven workflow changes, all on surfaces that already exist: a bell at case
received and at quote ready; an email receipt from the lawyer who will price
it; a drop zone after Send that goes to the pricing team; one request, if
there is one worth making, for the document the client did not send; a quote
card that says what it covers and gives four ways to answer; and a second
agent prompt that stays available after Send.

That last one contradicts what you told me — "the client does not see the
agent again after submission." The composer was still on that screen, still
wired to the interviewer, so "how long does this take?" got a question about
their notice period. The choice was not between a concierge and silence; it
was between a concierge and a text box that answers the wrong question. The
second prompt collects nothing, refuses to price or assess, and offers the
person when it does not know. Overrule it if it is wrong.

## What I assumed

- **An API key is required.** Without one the flow runs on a scripted
  fallback and says so.
- **"Go to case" opens the case this submission created**, on the existing
  case page, unchanged. Steps four onward are yours.
- **The quote card is a demo of what your payment card should say**, behind
  a labelled prototype control, because a person writes the quote.
  `?demo=quote` is the second way in.
- **Ask Nora stays on the intake screen.** It answers "what happens after I
  submit?"; it never acts.
- **Your green fails contrast for text** (2.66:1), as do the amber and red.
  The marks use your colours as they are; the words beside them use each hue
  darkened until it clears 4.5:1. The colour is yours; the ink is derived
  from it.
- **The rail folds at 1280px.** Walked from 320 to 2560, keyboard-only,
  clean in axe.

## Left out on purpose

Payment, the case page, the lawyer's chat, enterprise and Slack.

## Next

Real events on the rail — drafting started, review done — which your agents
already produce and the rail is built to take. A dated promise instead of an
estimate. First-person copy for the bench, from the lawyers; I will not
invent a sentence for a named person.

---

`pnpm verify` is green: 1,791 tests, including guards that fail the build if
a colour is not one of yours, a corner radius is not one of three, a wait
reuses a sentence, or the concierge stops refusing to quote. The detail
behind each decision is in [`APPENDIX.md`](APPENDIX.md), for whichever ones
you want to argue with.
