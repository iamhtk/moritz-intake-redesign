import type { Metadata } from 'next';
import { Section } from '@/components/design/foundations/showcase/section';
import {
  AutoHighlightComboboxExample,
  BasicComboboxExample,
  ComboboxWithClearExample,
  ConstrainedWidthComboboxExample,
  ControlledComboboxExample,
  CustomFilterComboboxExample,
  DisabledComboboxExample,
  GroupedComboboxExample,
  HorizontalComboboxExample,
  InputGroupComboboxExample,
  InvalidComboboxExample,
  MultiSelectComboboxExample,
  PopupComboboxExample,
  SecondaryTextComboboxExample,
  WithAvatarsComboboxExample,
  WithFieldDescriptionComboboxExample,
  WithFlagsComboboxExample,
  WithIconComboboxExample,
} from '@/components/design/foundations/examples/combobox-examples';

export const metadata: Metadata = { title: 'Combobox · Foundations' };

export default function ComboboxFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Combobox</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation combobox, built on the Base UI Combobox primitive: an
          autocomplete input with a filtered list, single and multi (chips)
          selection, clear, groups, and disabled and invalid states.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Type to filter the list, then pick an option. The selected label fills the input."
      >
        <BasicComboboxExample />
      </Section>

      <Section
        title="With secondary text"
        description="Pair ComboboxItemLabel with ComboboxItemDescription to add muted secondary text to each option."
      >
        <SecondaryTextComboboxExample />
      </Section>

      <Section
        title="Custom filtering"
        description="Pass a filter function to match options against more than the label — here name or @handle."
      >
        <CustomFilterComboboxExample />
      </Section>

      <Section
        title="With icons"
        description="Add a leading icon (marked with data-slot='icon') before ComboboxItemLabel; it tints with the option on highlight."
      >
        <WithIconComboboxExample />
      </Section>

      <Section
        title="With avatars"
        description="Render an Avatar before ComboboxItemLabel to give each option a leading portrait."
      >
        <WithAvatarsComboboxExample />
      </Section>

      <Section
        title="With flags"
        description="Add a leading flag emoji before ComboboxItemLabel for country-style options."
      >
        <WithFlagsComboboxExample />
      </Section>

      <Section
        title="With clear"
        description="Pass showClear to swap the trigger for a clear button once a value is selected."
      >
        <ComboboxWithClearExample />
      </Section>

      <Section
        title="With field description"
        description="Pair the combobox with a FieldLabel and FieldDescription for helper text above the input."
      >
        <WithFieldDescriptionComboboxExample />
      </Section>

      <Section
        title="With groups"
        description="Pass grouped items and render each group with ComboboxGroup, ComboboxLabel, ComboboxCollection, and a ComboboxSeparator between them."
      >
        <GroupedComboboxExample />
      </Section>

      <Section
        title="Multi-select"
        description="Set multiple and render selected values as removable chips above the input."
      >
        <MultiSelectComboboxExample />
      </Section>

      <Section
        title="Auto highlight"
        description="Pass autoHighlight to highlight the first matching item automatically while filtering."
      >
        <AutoHighlightComboboxExample />
      </Section>

      <Section
        title="Popup trigger"
        description="Trigger the combobox from a button with the trigger render prop, and move the search input inside the content."
      >
        <PopupComboboxExample />
      </Section>

      <Section
        title="Input group"
        description="Add a leading icon or other decoration by placing an InputGroupAddon inside ComboboxInput."
      >
        <InputGroupComboboxExample />
      </Section>

      <Section
        title="Constraining width"
        description="Constrain the field width (e.g. max-w-40) for short values like currency codes."
      >
        <ConstrainedWidthComboboxExample />
      </Section>

      <Section
        title="With custom layout"
        description="Use a horizontal Field to place the label beside the combobox instead of above it."
      >
        <HorizontalComboboxExample />
      </Section>

      <Section
        title="Disabled state"
        description="Disable the whole combobox with the disabled prop on the root and input."
      >
        <DisabledComboboxExample />
      </Section>

      <Section
        title="Validation error"
        description="Mark the input with aria-invalid for the destructive border and render the message with FieldError."
      >
        <InvalidComboboxExample />
      </Section>

      <Section
        title="Controlled"
        description="Use the value and onValueChange props to drive the combobox from React state."
      >
        <ControlledComboboxExample />
      </Section>
    </>
  );
}
