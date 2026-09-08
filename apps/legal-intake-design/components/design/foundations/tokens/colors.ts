/**
 * Moritz color palette — single source of truth for the foundation Colors page.
 *
 * Values are transcribed from the brand palette reference: core black/white, a
 * 19-step grayscale ramp, the light tints (Gold, Sky), and the status accents
 * (success/warning/failure). RGB is derived from the hex at render time, so each
 * swatch only stores hex, the optional CMYK spec, and the published WCAG rating.
 */

export type Swatch = {
  /** Display name; omitted for the unnamed grayscale ramp steps. */
  name?: string;
  hex: `#${string}`;
  /** Print CMYK spec, where the brand sheet provides one. */
  cmyk?: string;
  /** Published WCAG contrast rating for the swatch. */
  wcag: 'AA' | 'AAA';
  /**
   * Full literal Tailwind utility used to paint the fill from a theme token
   * (e.g. `bg-mz-gray-130`). Must be a complete literal so Tailwind detects it
   * during source scanning. When set, the swatch renders from the token instead
   * of an inline hex, keeping the token the single source of truth.
   */
  fillClass?: string;
};

export const CORE: Swatch[] = [
  {
    name: 'Moritz Black',
    hex: '#000000',
    wcag: 'AAA',
    fillClass: 'bg-mz-black',
  },
  {
    name: 'Moritz White',
    hex: '#FFFFFF',
    wcag: 'AAA',
    fillClass: 'bg-mz-white',
  },
];

/** Darkest -> lightest. Numbered so darker = higher (Gray 200 -> Gray 10, step 10). */
export const GRAYSCALE: Swatch[] = [
  {
    name: 'Gray 200',
    hex: '#141414',
    wcag: 'AAA',
    fillClass: 'bg-mz-gray-200',
  },
  {
    name: 'Gray 190',
    hex: '#282829',
    wcag: 'AAA',
    fillClass: 'bg-mz-gray-190',
  },
  {
    name: 'Gray 180',
    hex: '#414042',
    wcag: 'AAA',
    fillClass: 'bg-mz-gray-180',
  },
  {
    name: 'Gray 170',
    hex: '#4D4D4F',
    wcag: 'AAA',
    fillClass: 'bg-mz-gray-170',
  },
  {
    name: 'Gray 160',
    hex: '#58595B',
    wcag: 'AAA',
    fillClass: 'bg-mz-gray-160',
  },
  { name: 'Gray 150', hex: '#636466', wcag: 'AA', fillClass: 'bg-mz-gray-150' },
  { name: 'Gray 140', hex: '#6D6E71', wcag: 'AA', fillClass: 'bg-mz-gray-140' },
  { name: 'Gray 130', hex: '#77787B', wcag: 'AA', fillClass: 'bg-mz-gray-130' },
  { name: 'Gray 120', hex: '#808285', wcag: 'AA', fillClass: 'bg-mz-gray-120' },
  { name: 'Gray 110', hex: '#8A8C8E', wcag: 'AA', fillClass: 'bg-mz-gray-110' },
  { name: 'Gray 100', hex: '#939598', wcag: 'AA', fillClass: 'bg-mz-gray-100' },
  { name: 'Gray 90', hex: '#9D9FA2', wcag: 'AAA', fillClass: 'bg-mz-gray-90' },
  { name: 'Gray 80', hex: '#A7A9AC', wcag: 'AAA', fillClass: 'bg-mz-gray-80' },
  { name: 'Gray 70', hex: '#B1B3B6', wcag: 'AAA', fillClass: 'bg-mz-gray-70' },
  { name: 'Gray 60', hex: '#BCBEC0', wcag: 'AAA', fillClass: 'bg-mz-gray-60' },
  { name: 'Gray 50', hex: '#C7C8CA', wcag: 'AAA', fillClass: 'bg-mz-gray-50' },
  { name: 'Gray 40', hex: '#D1D3D4', wcag: 'AAA', fillClass: 'bg-mz-gray-40' },
  { name: 'Gray 30', hex: '#DCDDDE', wcag: 'AAA', fillClass: 'bg-mz-gray-30' },
  { name: 'Gray 20', hex: '#E6E7E8', wcag: 'AAA', fillClass: 'bg-mz-gray-20' },
  { name: 'Gray 10', hex: '#F1F2F2', wcag: 'AAA', fillClass: 'bg-mz-gray-10' },
];

export const TINTS: Swatch[] = [
  {
    name: 'Moritz Light Gold',
    hex: '#FBF6ED',
    cmyk: 'C1 M2 Y6 K0',
    wcag: 'AAA',
    fillClass: 'bg-mz-gold',
  },
  {
    name: 'Moritz Sky',
    hex: '#ECF8FE',
    cmyk: 'C6 M0 Y0 K0',
    wcag: 'AAA',
    fillClass: 'bg-mz-sky',
  },
];

export const STATUS: Swatch[] = [
  {
    name: 'Moritz Green (Success)',
    hex: '#5EAE8B',
    wcag: 'AAA',
    fillClass: 'bg-mz-green',
  },
  {
    name: 'Moritz Yellow (Warning)',
    hex: '#E8A952',
    wcag: 'AAA',
    fillClass: 'bg-mz-yellow',
  },
  {
    name: 'Moritz Swiss Red (Failure)',
    hex: '#EB5444',
    wcag: 'AA',
    fillClass: 'bg-mz-red',
  },
];

export type GradientSwatch = {
  name: string;
  /**
   * Full literal class painting the gradient from the `--mz-gradient-*` token
   * (e.g. `bg-mz-gradient-gold`). Defined in `app/globals.css`.
   */
  fillClass: string;
  /** Human-readable stop list shown beneath the swatch. */
  stops: string;
  /** The CSS gradient value copied to the clipboard on click. */
  css: string;
};

export const GRADIENTS: GradientSwatch[] = [
  {
    name: 'Moritz Grey',
    fillClass: 'bg-mz-gradient-grey',
    stops: '#F1F2F2 → #E6E7E8 → #D1D3D4',
    css: 'linear-gradient(180deg, #F1F2F2 0%, #E6E7E8 50%, #D1D3D4 100%)',
  },
  {
    name: 'Moritz Light Gold',
    fillClass: 'bg-mz-gradient-gold',
    stops: '#FFFFFF → #FBF6ED → #F1F0DD',
    css: 'linear-gradient(180deg, #FFFFFF 0%, #FBF6ED 50%, #F1F0DD 100%)',
  },
  {
    name: 'Moritz Sky',
    fillClass: 'bg-mz-gradient-sky',
    stops: '#FFFFFF → #ECF8FE → #DCF2FD',
    css: 'linear-gradient(180deg, #FFFFFF 0%, #ECF8FE 50%, #DCF2FD 100%)',
  },
];
