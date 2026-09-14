/**
 * The `md` layer: what happens between a phone and two columns.
 *
 * The flow used `sm` (640) and `lg` (1024) and nothing in between, so every
 * width from 640 to 1023 — every tablet in portrait, every small laptop, a
 * half-screen browser on any monitor — rendered the phone layout at whatever
 * width it happened to have. At 768 that is a single 752px-wide column with
 * one line of conversation in it and roughly 500px of empty space below,
 * which is not a layout, it is the absence of one.
 *
 * The fix is deliberately not "two columns earlier". Two columns need a brief
 * wide enough to keep its values beside their labels *and* a transcript wide
 * enough to read, and 768 does not have room for both; forcing it there buys a
 * tablet the same cramped compromise 1024 was already the floor for. What 768
 * actually has is too much width for one column, not too little for two.
 *
 * So the column stops growing. From `md` up it caps at 40rem and centres,
 * which is the same measure the layout already resolves to at the 640
 * boundary — the width the phone layout was designed against, and the width
 * the conversation reads at. A tablet gets the phone composition at its
 * intended size with margin either side, rather than the phone composition
 * stretched. At `lg` the cap is released and the two-column grid takes over
 * exactly as it did before.
 *
 * `lg:max-w-none` is load-bearing rather than tidy: each pane below is a grid
 * track from `lg` up, and a 40rem cap left on one of them would stop that
 * track filling its column.
 *
 * Applied to the *contents* of each stacked band rather than to the bands
 * themselves, so full-width backgrounds, the action bar's top hairline and
 * the journey bar's progress rule still run edge to edge. Five bands have to
 * agree or they step on each other: the journey bar, the brief summary row,
 * the chat pane, the brief pane and the mobile action bar.
 */
export const TABLET_COLUMN =
  'md:mx-auto md:w-full md:max-w-[40rem] lg:max-w-none';

/**
 * The width at which the rail unfolds from the top bar into the left column.
 *
 * `xl` (1280), and it is written down here because it was only ever an
 * emergent property of four hand-tuned `grid-cols-*` strings: the rail column
 * is `xl:` and the bar that replaces it is `xl:hidden`, so the fold happened
 * at 1280 and nothing said so. Two columns appear at `lg` (1024) and the rail
 * stays folded through that step, which is the rule §3 of the scope asks for.
 */
export const RAIL_UNFOLDS_AT = 'xl';
