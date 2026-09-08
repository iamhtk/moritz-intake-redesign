/**
 * Design-system shim for Card. The playground standardised on the foundation
 * design system, so this re-exports the foundation Card parts. Kept as a stable
 * `@/components/design/design-system/card` import path for existing call sites.
 */
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/design/foundations/components/card';
