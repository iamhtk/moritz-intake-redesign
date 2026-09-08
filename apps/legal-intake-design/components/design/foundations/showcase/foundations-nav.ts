/**
 * Single source of truth for the design-library foundation components.
 *
 * Both the library sidebar and the `/foundations` index page render from this
 * list, so adding a future foundation component is a one-line change here.
 */
export type FoundationNavItem = {
  title: string;
  href: string;
  description: string;
  /** Marks the component as work-in-progress; surfaces a "WIP" badge in the UI. */
  wip?: boolean;
};

// Ordered alphabetically by title.
export const FOUNDATION_ITEMS: FoundationNavItem[] = [
  {
    title: 'Alert',
    href: '/foundations/alert',
    description:
      'Modal confirmation that interrupts with a cancel and confirm action.',
  },
  {
    title: 'Attachment',
    href: '/foundations/attachment',
    description:
      'File or image preview with media, name, metadata, actions, upload states, sizes, orientation, scrollable groups, and a full-card trigger.',
    wip: true,
  },
  {
    title: 'Avatar',
    href: '/foundations/avatar',
    description:
      'User image with initials fallback, sizes, grayscale, a status badge, and stacked groups with an overflow count.',
  },
  {
    title: 'Badge',
    href: '/foundations/badge',
    description:
      'Soft tinted-pill with the full status palette, icons, links, and an interactive BadgeButton.',
    wip: true,
  },
  {
    title: 'Banner',
    href: '/foundations/banner',
    description:
      'Inline status callout with default, destructive, warning, and success tones.',
    wip: true,
  },
  {
    title: 'Breadcrumb',
    href: '/foundations/breadcrumb',
    description:
      'Hierarchical navigation trail with links, a current page, custom separators, and a collapsed ellipsis.',
    wip: true,
  },
  {
    title: 'Bubble',
    href: '/foundations/bubble',
    description:
      'Framed conversational surface with seven variants, alignment, groups, reactions, links/buttons, and tooltip/popover/collapsible compositions.',
    wip: true,
  },
  {
    title: 'Buttons',
    href: '/foundations/buttons',
    description:
      'Solid, outline, ghost, rounded, icon-only, and disabled states.',
  },
  {
    title: 'Card',
    href: '/foundations/card',
    description:
      'Bordered surface with header, title, description, action, content, and footer parts.',
    wip: true,
  },
  {
    title: 'Chat Composer',
    href: '/foundations/chat-composer',
    description:
      'Auto-growing message input with attach, voice, and send affordances; Enter sends and Shift+Enter adds a line.',
  },
  {
    title: 'Checkbox',
    href: '/foundations/checkbox',
    description:
      'Box with checked, indeterminate, disabled, and invalid states for selection.',
  },
  {
    title: 'Chip',
    href: '/foundations/chip',
    description:
      'Spacious pill with an icon and label that triggers an action, in outline and ghost variants — used for composer quick actions.',
  },
  {
    title: 'Collapsible',
    href: '/foundations/collapsible',
    description:
      'Expandable region toggled by a trigger for show more / show less and progressive disclosure.',
    wip: true,
  },
  {
    title: 'Colors',
    href: '/foundations/colors',
    description:
      'Core, grayscale, tints, and status accents with hex and WCAG ratings.',
  },
  {
    title: 'Combobox',
    href: '/foundations/combobox',
    description:
      'Autocomplete input with a filtered list, single and multi (chips) selection, clear, and groups.',
  },
  {
    title: 'Description List',
    href: '/foundations/description-list',
    description:
      'Key/value list built on dl/dt/dd, with a responsive two-column layout and hairline row separators.',
  },
  {
    title: 'Dialog',
    href: '/foundations/dialog',
    description:
      'General-purpose modal for focused tasks with a dimmed, frosted backdrop.',
  },
  {
    title: 'Drawer',
    href: '/foundations/drawer',
    description:
      'Vaul-based drawer that slides from any edge, with header, scrollable content, and footer actions.',
    wip: true,
  },
  {
    title: 'Dropdown',
    href: '/foundations/dropdowns',
    description:
      'Menus with items, checkboxes, radios, submenus, and shortcuts.',
  },
  {
    title: 'Empty',
    href: '/foundations/empty',
    description:
      'Centered empty-state block with optional icon media, title, description, and actions.',
    wip: true,
  },
  {
    title: 'Hover Card',
    href: '/foundations/hover-card',
    description:
      'Reveals rich content on hover or focus on a translucent surface, for previews and contextual detail.',
    wip: true,
  },
  {
    title: 'Input Fields',
    href: '/foundations/inputs',
    description: 'Text inputs with label, focus, disabled, and invalid states.',
  },
  {
    title: 'Input OTP',
    href: '/foundations/otp',
    description:
      'One-time-code input with grouped slots, a separator, label, digit/PIN/alphanumeric patterns, disabled, invalid, and form states.',
  },
  {
    title: 'Markdown Content',
    href: '/foundations/markdown-content',
    description:
      'Model-authored markdown with document and chat type scales, streaming completion for partial text, and sanitization that drops images and raw HTML.',
    wip: true,
  },
  {
    title: 'Marker',
    href: '/foundations/marker',
    description:
      'Inline conversation markers — status, notes, shimmering streaming text, bordered rows, and labeled separators, with icons and links/buttons.',
    wip: true,
  },
  {
    title: 'Message Scroller',
    href: '/foundations/message-scroller',
    description:
      'Streaming chat transcript with auto-scroll, turn anchoring, previous-turn peek, opening position, history preservation, visibility tracking, and jump-to-latest.',
    wip: true,
  },
  {
    title: 'Popover',
    href: '/foundations/popover',
    description:
      'Floats rich content next to a trigger on a translucent, blurred surface, with optional header, title, and description.',
    wip: true,
  },
  {
    title: 'Radio',
    href: '/foundations/radio',
    description:
      'Single-select group that fills with the primary color, with descriptions, choice cards, fieldsets, disabled, and invalid states.',
  },
  {
    title: 'Select',
    href: '/foundations/select',
    description:
      'Single-select dropdown with label, groups, icons, disabled, and invalid states.',
  },
  {
    title: 'Slider',
    href: '/foundations/slider',
    description:
      'Draggable range control with single or multiple thumbs, steps, and a disabled state.',
    wip: true,
  },
  {
    title: 'Spinner',
    href: '/foundations/spinner',
    description:
      'Spinning loader icon for inline in-progress states, with sizes and currentColor.',
    wip: true,
  },
  {
    title: 'Switch',
    href: '/foundations/switch',
    description:
      'On/off switch with label, default-on, disabled, and controlled states.',
  },
  {
    title: 'Table',
    href: '/foundations/table',
    description:
      'Data grid with sortable headers, status badges, loading, empty, and pagination.',
    wip: true,
  },
  {
    title: 'Tabs',
    href: '/foundations/tabs',
    description:
      'Transparent strip with an animated underline indicator, horizontal or vertical orientation, icons, disabled triggers, RTL, and a mobile dropdown.',
  },
  {
    title: 'Text Area',
    href: '/foundations/textareas',
    description:
      'Multi-line text inputs with label, focus, disabled, and invalid states.',
  },
  {
    title: 'Toggle',
    href: '/foundations/toggle',
    description:
      'Two-state button with default and outline variants, sizes, and disabled state.',
    wip: true,
  },
  {
    title: 'Toggle Group',
    href: '/foundations/toggle-group',
    description:
      'Set of related two-state buttons for single- or multi-select, reusing the foundation Toggle styling.',
    wip: true,
  },
  {
    title: 'Typography',
    href: '/foundations/typography',
    description:
      'Typefaces, heading scale, body text styles, inline code, and prose.',
  },
];
