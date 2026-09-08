import { useId } from 'react';

import './moritz-symbol.css';

// Shared path data so the visible mark and the (optional) shine clip stay in sync.
const M_PATH =
  'M438.842 745L605.577 380.653V669.959C605.577 694.229 603.236 709.77 598.565 716.581C591.123 727.652 578.16 733.185 559.67 733.185H544.368V745H728V733.185H713.015C696.01 733.185 683.577 728.716 675.715 719.775C669.763 713.178 666.788 696.573 666.788 669.959V387.039C666.788 362.771 669.126 347.233 673.803 340.419C681.453 329.353 694.525 323.815 713.015 323.815H728V312H605.577L451.275 650.801L294.423 312H172V323.815C189.64 323.815 202.446 325.891 210.416 330.04C218.387 334.192 223.857 339.356 226.837 345.529C231.085 354.044 233.212 367.881 233.212 387.039V669.959C233.212 694.229 230.871 709.77 226.197 716.581C218.547 727.652 205.581 733.185 187.304 733.185H172V745H322.477V733.185H307.175C290.17 733.185 277.734 728.716 269.875 719.775C264.137 713.178 261.268 696.573 261.268 669.959V380.653L428.322 745H438.842Z';
const RING_PATH =
  'M437.67 24.66C659.59 24.66 834.24 246.58 834.24 526.03C834.24 819.87 690.4 1031.51 462.32 1031.51C234.24 1031.51 65.75 809.59 65.75 530.13C65.75 236.3 209.59 24.66 437.67 24.66ZM443.83 1056.16C706.84 1056.16 899.99 819.86 899.99 517.8C900 232.19 717.12 0 456.16 0C195.2 0 0 236.3 0 538.35C0 823.97 182.88 1056.16 443.83 1056.16Z';

export default function MoritzSymbol(props: {
  className?: string;
  /**
   * When true, a subtle diagonal light band sweeps across the mark once on
   * mount (driven by the `.mz-logo-shine` animation in moritz-symbol.css). The
   * band is
   * clipped to the glyph so the highlight only paints on the logo itself.
   */
  shine?: boolean;
  /**
   * When true (default) the circular ring is drawn around the "M". Set to
   * false to render the bare "M" glyph on its own, tightly framed so it can
   * stand alone without a surrounding medallion.
   */
  ring?: boolean;
}) {
  const { ring = true } = props;
  const uid = useId();
  const clipId = `mz-logo-clip-${uid}`;
  const gradId = `mz-logo-shine-grad-${uid}`;

  return (
    <svg
      viewBox={ring ? '-12 -12 924 1081' : '140 218 620 620'}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      role="img"
      aria-label="Moritz"
      className={props.className}
    >
      {props.shine && (
        <defs>
          <clipPath id={clipId}>
            <path d={M_PATH} />
            {ring && <path d={RING_PATH} />}
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      <path d={M_PATH} fill="currentColor" />
      {ring && <path d={RING_PATH} fill="currentColor" />}

      {props.shine && (
        <g clipPath={`url(#${clipId})`}>
          <rect
            className="mz-logo-shine"
            x="0"
            y="-400"
            width="1040"
            height="1857"
            fill={`url(#${gradId})`}
          />
        </g>
      )}
    </svg>
  );
}
