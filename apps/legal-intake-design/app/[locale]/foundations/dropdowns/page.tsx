import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  CreditCard,
  HelpCircle,
  LogOut,
  Mail,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
  User,
  UserPlus,
  Users,
} from '@repo/ui/icons';

import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';

import { Button } from '@/components/design/foundations/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  CheckboxItemsExample,
  RadioGroupExample,
} from '@/components/design/foundations/examples/dropdown-examples';
import { Section } from '@/components/design/foundations/showcase/section';

export default function DropdownsFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Dropdown</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation dropdown menu, built on the shadcn Dropdown Menu:
          labels, separators, icons, shortcuts, sections, checkbox and radio
          items, and submenus.
        </p>
      </header>

      <Section
        title="Basic example"
        description="Use the menu, trigger, and items to build a basic dropdown menu."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="Button style"
        description="The trigger is the foundation Button and accepts all of its variants."
      >
        {(['default', 'outline', 'ghost'] as const).map((variant) => (
          <DropdownMenu key={variant}>
            <DropdownMenuTrigger asChild>
              <Button variant={variant} className="capitalize">
                {variant}
                <ChevronDown data-icon="inline-end" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Export as CSV…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </Section>

      <Section
        title="Menu placement"
        description="Use the side and align props to position the menu relative to the trigger."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronUp data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Export as CSV…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With disabled items"
        description="Use the disabled prop on an item to prevent it from being selected."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuItem disabled>Rename</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With sections"
        description="Group related items with DropdownMenuGroup, an optional label heading, and separators."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem>Account</DropdownMenuItem>
              <DropdownMenuItem>Notifications</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>My events</DropdownMenuLabel>
              <DropdownMenuItem>Upcoming events</DropdownMenuItem>
              <DropdownMenuItem>Past events</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With descriptions"
        description="Pair a label with a muted description to add supporting copy to an item."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72">
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span>Open</span>
              <span className="text-muted-foreground group-focus:text-primary-foreground text-xs">
                Open the file in a new tab.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span>Rename</span>
              <span className="text-muted-foreground group-focus:text-primary-foreground text-xs">
                Rename the file.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span>Delete</span>
              <span className="text-muted-foreground group-focus:text-primary-foreground text-xs">
                Move the file to the trash.
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With icons"
        description="Add an icon as the first child of an item to render it alongside the label."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <User />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle />
              Help center
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Moon />
              Dark mode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With keyboard shortcuts"
        description="Use DropdownMenuShortcut to surface keyboard shortcuts on the trailing edge."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              Open
              <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Rename
              <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Delete
              <DropdownMenuShortcut>⇧⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With header"
        description="Add a non-interactive header to the top of a menu with a label."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="text-muted-foreground block text-xs">
                Signed in as
              </span>
              <span className="text-foreground block text-sm font-semibold">
                tom@example.com
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>My profile</DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
            <DropdownMenuItem>Security</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With disabled button"
        description="Disable the whole dropdown by disabling its trigger button."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled>
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With icon trigger"
        description="A compact, icon-only trigger for inline row actions."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More options">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With avatar trigger"
        description="Use an avatar as the dropdown trigger for account menus."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account options"
              className="ring-offset-background focus-visible:ring-ring cursor-pointer rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  TC
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>My profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With custom trigger"
        description="Render any element as the trigger via asChild for a fully custom control."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account options"
              className="ring-offset-background focus-visible:ring-ring hover:bg-muted flex w-56 cursor-pointer items-center gap-3 rounded-xl border p-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg text-sm font-medium">
                  WA
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  Whitney
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  Admin
                </span>
              </span>
              <ChevronsUpDown
                aria-hidden="true"
                className="text-muted-foreground ml-auto size-4 shrink-0"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuItem>My profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="With custom menu width"
        description="Menus size to their content by default; use min-w-* / max-w-* to override."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Options
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-72">
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="Checkbox items"
        description="Toggleable items that track their checked state."
      >
        <CheckboxItemsExample />
      </Section>

      <Section
        title="Radio group"
        description="A single-select radio group with the active item indicated."
      >
        <RadioGroupExample />
      </Section>

      <Section
        title="Submenu"
        description="Nest a DropdownMenuSub for a flyout of secondary actions."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Invite
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <UserPlus />
              New member
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Mail />
                Invite via
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus />
                  More…
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="Inset items"
        description="Inset labels and items align with rows that have a leading icon."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              View
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel inset>Layout</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem inset>Back</DropdownMenuItem>
            <DropdownMenuItem inset>Forward</DropdownMenuItem>
            <DropdownMenuItem inset>Reload</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section
        title="Destructive item"
        description="A destructive item turns red on focus; pair it with a disabled item as needed."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <CreditCard />
              Upgrade (soon)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>
    </>
  );
}
