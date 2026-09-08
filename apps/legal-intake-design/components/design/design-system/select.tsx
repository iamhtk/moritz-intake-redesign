/**
 * Design-system shim for the Select compound component. The playground
 * standardised on the foundation design system, so this re-exports the
 * foundation Select parts. Kept as a stable
 * `@/components/design/design-system/select` import path for existing call sites.
 */
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
