/**
 * Design-system shim for Button. The playground standardised on the foundation
 * design system, so this simply re-exports the foundation Button. Kept as a
 * stable `@/components/design/design-system/button` import path for the many
 * call sites across the app.
 */
export {
  Button,
  buttonVariants,
} from '@/components/design/foundations/components/button';
