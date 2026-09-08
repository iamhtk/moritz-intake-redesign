'use client';

import * as React from 'react';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';
import { Banknote, CreditCard, Globe, Wallet } from '@repo/ui/icons';

import { Button } from '@/components/design/foundations/components/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemDescription,
  ComboboxItemLabel,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/design/foundations/components/combobox';
import { InputGroupAddon } from '@/components/design/foundations/components/input-group';

/**
 * Stateful combobox demos used by the foundation showcase page. These live in a
 * client component because they track the selected value (and, for the
 * multi-select demo, the anchor ref) with React state, while the showcase page
 * itself stays a server component. The set mirrors the shadcn Combobox docs:
 * basic, custom items, multiple, clear, groups, invalid, disabled, auto
 * highlight, popup, and input-group variants.
 */

type Option = { value: string; label: string };

const FRAMEWORKS = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'];

const TIMEZONES: Option[] = [
  { value: 'pt', label: 'Pacific Time (PT)' },
  { value: 'mt', label: 'Mountain Time (MT)' },
  { value: 'ct', label: 'Central Time (CT)' },
  { value: 'et', label: 'Eastern Time (ET)' },
  { value: 'gmt', label: 'Greenwich Mean Time (GMT)' },
  { value: 'cet', label: 'Central European Time (CET)' },
  { value: 'eet', label: 'Eastern European Time (EET)' },
  { value: 'ist', label: 'India Standard Time (IST)' },
  { value: 'jst', label: 'Japan Standard Time (JST)' },
];

const COUNTRIES: Option[] = [
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'us', label: 'United States' },
];

type User = {
  value: string;
  label: string;
  initials: string;
  role: string;
  handle: string;
};

const USERS: User[] = [
  {
    value: 'leslie',
    label: 'Leslie Alexander',
    initials: 'LA',
    role: 'Co-Founder / CEO',
    handle: 'lesliealexander',
  },
  {
    value: 'michael',
    label: 'Michael Foster',
    initials: 'MF',
    role: 'Co-Founder / CTO',
    handle: 'michaelfoster',
  },
  {
    value: 'dries',
    label: 'Dries Vincent',
    initials: 'DV',
    role: 'Business Relations',
    handle: 'driesvincent',
  },
  {
    value: 'lindsay',
    label: 'Lindsay Walton',
    initials: 'LW',
    role: 'Front-end Developer',
    handle: 'lindsaywalton',
  },
  {
    value: 'courtney',
    label: 'Courtney Henry',
    initials: 'CH',
    role: 'Designer',
    handle: 'courtneyhenry',
  },
];

type FlagCountry = { value: string; label: string; flag: string };

const FLAG_COUNTRIES: FlagCountry[] = [
  { value: 'ca', label: 'Canada', flag: '🇨🇦' },
  { value: 'mx', label: 'Mexico', flag: '🇲🇽' },
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'de', label: 'Germany', flag: '🇩🇪' },
  { value: 'jp', label: 'Japan', flag: '🇯🇵' },
];

const CURRENCIES: Option[] = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'jpy', label: 'JPY' },
  { value: 'cad', label: 'CAD' },
];

export function BasicComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={FRAMEWORKS}>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function ControlledComboboxExample() {
  const [value, setValue] = React.useState<Option | null>(null);

  return (
    <Field className="max-w-sm">
      <FieldLabel>Timezone</FieldLabel>
      <Combobox
        items={TIMEZONES}
        value={value}
        onValueChange={(option) => setValue(option)}
      >
        <ComboboxInput placeholder="Select a timezone" />
        <ComboboxContent>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>
        Current value: {value ? value.label : '(empty)'}
      </FieldDescription>
    </Field>
  );
}

type CustomFramework = {
  value: string;
  label: string;
  description: string;
};

const CUSTOM_FRAMEWORKS: CustomFramework[] = [
  { value: 'next', label: 'Next.js', description: 'The React framework' },
  { value: 'svelte', label: 'SvelteKit', description: 'Web, supercharged' },
  { value: 'nuxt', label: 'Nuxt', description: 'The intuitive Vue framework' },
  { value: 'remix', label: 'Remix', description: 'Focused on web standards' },
];

export function SecondaryTextComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={CUSTOM_FRAMEWORKS}>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: CustomFramework) => (
              <ComboboxItem key={item.value} value={item}>
                <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
                <ComboboxItemDescription>
                  {item.description}
                </ComboboxItemDescription>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

const PAYMENT_METHODS: {
  value: string;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'card',
    label: 'Credit card',
    icon: <CreditCard data-slot="icon" />,
  },
  {
    value: 'bank',
    label: 'Bank transfer',
    icon: <Banknote data-slot="icon" />,
  },
  {
    value: 'wallet',
    label: 'Digital wallet',
    icon: <Wallet data-slot="icon" />,
  },
];

export function WithIconComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={PAYMENT_METHODS}>
        <ComboboxInput placeholder="Select a payment method" />
        <ComboboxContent>
          <ComboboxEmpty>No payment methods found.</ComboboxEmpty>
          <ComboboxList>
            {(item: (typeof PAYMENT_METHODS)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.icon}
                <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function ComboboxWithClearExample() {
  const [value, setValue] = React.useState<Option | null>(TIMEZONES[0] ?? null);

  return (
    <div className="w-full max-w-sm">
      <Combobox
        items={TIMEZONES}
        value={value}
        onValueChange={(option) => setValue(option)}
      >
        <ComboboxInput placeholder="Select a timezone" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

type Group = { value: string; items: Option[] };

const GROUPED_FRAMEWORKS: Group[] = [
  {
    value: 'Frontend',
    items: [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
      { value: 'svelte', label: 'Svelte' },
    ],
  },
  {
    value: 'Backend',
    items: [
      { value: 'express', label: 'Express' },
      { value: 'fastify', label: 'Fastify' },
      { value: 'nest', label: 'NestJS' },
    ],
  },
];

export function GroupedComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={GROUPED_FRAMEWORKS}>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(group: Group, index: number) => (
              <React.Fragment key={group.value}>
                {index > 0 ? <ComboboxSeparator /> : null}
                <ComboboxGroup items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item: Option) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              </React.Fragment>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function MultiSelectComboboxExample() {
  const [value, setValue] = React.useState<Option[]>([]);
  const anchorRef = useComboboxAnchor();

  return (
    <div className="w-full max-w-sm">
      <Combobox
        multiple
        items={TIMEZONES}
        value={value}
        onValueChange={(options) => setValue(options)}
      >
        <ComboboxChips ref={anchorRef}>
          <ComboboxValue>
            {(selected: Option[]) =>
              selected.map((item) => (
                <ComboboxChip key={item.value}>{item.label}</ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput placeholder="Select timezones" />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef}>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function InvalidComboboxExample() {
  return (
    <Field className="max-w-sm" data-invalid="true">
      <FieldLabel>Framework</FieldLabel>
      <Combobox items={FRAMEWORKS}>
        <ComboboxInput aria-invalid placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldError>Please select a framework.</FieldError>
    </Field>
  );
}

export function DisabledComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={TIMEZONES} disabled defaultValue={TIMEZONES[0]}>
        <ComboboxInput placeholder="Select a timezone" disabled />
        <ComboboxContent>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function AutoHighlightComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={FRAMEWORKS} autoHighlight>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function PopupComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={COUNTRIES}>
        <ComboboxTrigger
          render={<Button variant="outline" />}
          className="w-full justify-between font-normal"
        >
          <ComboboxValue>
            {(value: Option | null) =>
              value ? value.label : 'Select a country'
            }
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput
            autoFocus
            showTrigger={false}
            placeholder="Search countries"
          />
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function InputGroupComboboxExample() {
  return (
    <div className="w-full max-w-sm">
      <Combobox items={COUNTRIES}>
        <ComboboxInput placeholder="Select a country">
          <InputGroupAddon align="inline-start">
            <Globe />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function WithAvatarsComboboxExample() {
  return (
    <Field className="max-w-sm">
      <FieldLabel>Assigned to</FieldLabel>
      <Combobox items={USERS} defaultValue={USERS[0]}>
        <ComboboxInput placeholder="Select a user" />
        <ComboboxContent>
          <ComboboxEmpty>No users found.</ComboboxEmpty>
          <ComboboxList>
            {(item: User) => (
              <ComboboxItem key={item.value} value={item}>
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export function WithFlagsComboboxExample() {
  return (
    <Field className="max-w-sm">
      <FieldLabel>Country</FieldLabel>
      <Combobox items={FLAG_COUNTRIES} defaultValue={FLAG_COUNTRIES[2]}>
        <ComboboxInput placeholder="Select a country" />
        <ComboboxContent>
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(item: FlagCountry) => (
              <ComboboxItem key={item.value} value={item}>
                <span aria-hidden className="text-base leading-none">
                  {item.flag}
                </span>
                <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export function WithFieldDescriptionComboboxExample() {
  return (
    <Field className="max-w-sm">
      <FieldLabel>Assigned to</FieldLabel>
      <FieldDescription>
        This user will have full access to the project.
      </FieldDescription>
      <Combobox items={USERS} defaultValue={USERS[0]}>
        <ComboboxInput placeholder="Select a user" />
        <ComboboxContent>
          <ComboboxEmpty>No users found.</ComboboxEmpty>
          <ComboboxList>
            {(item: User) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export function ConstrainedWidthComboboxExample() {
  return (
    <Field className="max-w-40">
      <FieldLabel>Currency</FieldLabel>
      <Combobox items={CURRENCIES} defaultValue={CURRENCIES[0]}>
        <ComboboxInput placeholder="Select" />
        <ComboboxContent>
          <ComboboxEmpty>No currencies found.</ComboboxEmpty>
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export function HorizontalComboboxExample() {
  return (
    <Field orientation="horizontal" className="w-fit">
      <FieldLabel>Assigned to</FieldLabel>
      <Combobox items={USERS} defaultValue={USERS[0]}>
        <ComboboxInput className="w-48" placeholder="Select a user" />
        <ComboboxContent>
          <ComboboxEmpty>No users found.</ComboboxEmpty>
          <ComboboxList>
            {(item: User) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export function CustomFilterComboboxExample() {
  return (
    <Field className="max-w-sm">
      <FieldLabel>Assigned to</FieldLabel>
      <Combobox
        items={USERS}
        defaultValue={USERS[0]}
        filter={(item: User, query: string) => {
          const q = query.toLowerCase();
          return (
            item.label.toLowerCase().includes(q) ||
            `@${item.handle}`.toLowerCase().includes(q)
          );
        }}
      >
        <ComboboxInput placeholder="Search by name or @handle" />
        <ComboboxContent>
          <ComboboxEmpty>No users found.</ComboboxEmpty>
          <ComboboxList>
            {(item: User) => (
              <ComboboxItem key={item.value} value={item}>
                <ComboboxItemLabel>{item.label}</ComboboxItemLabel>
                <ComboboxItemDescription>
                  @{item.handle}
                </ComboboxItemDescription>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
