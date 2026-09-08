/**
 * Design-system shim for the DropdownMenu compound component. The playground
 * standardised on the foundation design system, so this re-exports the
 * foundation DropdownMenu parts. Kept as a stable
 * `@/components/design/design-system/dropdown-menu` import path for existing
 * call sites.
 */
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/design/foundations/components/dropdown-menu';
