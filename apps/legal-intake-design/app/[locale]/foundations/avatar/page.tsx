import type { Metadata } from 'next';
import { Plus } from '@repo/ui/icons';

import { Section } from '@/components/design/foundations/showcase/section';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { getInitials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Avatar · Foundations' };

const PEOPLE = [
  { name: 'Sofia Marchetti', image: '/onboarding-lawyers/sofia-marchetti.jpg' },
  { name: 'Daniel Foss', image: '/onboarding-lawyers/daniel-foss.jpg' },
  { name: 'Mei Lin Chen', image: '/onboarding-lawyers/mei-lin-chen.jpg' },
  { name: 'James Whitfield', image: '/onboarding-lawyers/james-whitfield.jpg' },
  { name: 'Amara Okonkwo', image: '/onboarding-lawyers/amara-okonkwo.jpg' },
] as const;

export default function AvatarFoundationPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="heading-2">Avatar</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The foundation avatar, built on the shadcn Avatar: an initials
          fallback, round or square shapes, a size scale, status badges, and
          stacked groups with an overflow count.
        </p>
      </header>

      <Section
        title="Basic example"
        description="When no image is provided (or it fails to load) the avatar renders an initials fallback on a muted surface."
      >
        <Avatar>
          <AvatarFallback>{getInitials('Sofia Marchetti')}</AvatarFallback>
        </Avatar>
      </Section>

      <Section
        title="With image"
        description="Provide an AvatarImage with an alt text, and keep an AvatarFallback as the graceful degradation while the image loads or if it errors."
      >
        {PEOPLE.slice(0, 3).map((person) => (
          <Avatar key={person.name}>
            <AvatarImage src={person.image} alt={person.name} />
            <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
          </Avatar>
        ))}
      </Section>

      <Section
        title="With text"
        description="Pair the avatar with a name and a secondary line for a profile cell; wrap it in a group to coordinate hover states."
      >
        <a href="#" className="group block shrink-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={PEOPLE[0].image} alt={PEOPLE[0].name} />
              <AvatarFallback>{getInitials(PEOPLE[0].name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-foreground/80 group-hover:text-foreground text-sm font-medium">
                {PEOPLE[0].name}
              </p>
              <p className="text-muted-foreground group-hover:text-foreground/70 text-xs font-medium">
                View profile
              </p>
            </div>
          </div>
        </a>
      </Section>

      <Section
        title="Sizes"
        description="Use the size prop to scale the avatar from a dense sm up to 2xl alongside the default."
      >
        <div className="flex items-end gap-4">
          {(['sm', 'default', 'lg', 'xl', '2xl'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Avatar size={size === 'default' ? undefined : size}>
                <AvatarImage src={PEOPLE[1].image} alt={PEOPLE[1].name} />
                <AvatarFallback>{getInitials(PEOPLE[1].name)}</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">{size}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Square"
        description="Set the square prop for a soft-cornered square shape instead of the default circle."
      >
        <Avatar square>
          <AvatarImage src={PEOPLE[2].image} alt={PEOPLE[2].name} />
          <AvatarFallback>{getInitials(PEOPLE[2].name)}</AvatarFallback>
        </Avatar>
        <Avatar square>
          <AvatarFallback>{getInitials(PEOPLE[2].name)}</AvatarFallback>
        </Avatar>
      </Section>

      <Section
        title="Grayscale"
        description="Add the grayscale utility for the desaturated treatment used in the top navigation account menu."
      >
        <Avatar className="grayscale">
          <AvatarImage src={PEOPLE[4].image} alt={PEOPLE[4].name} />
          <AvatarFallback>{getInitials(PEOPLE[4].name)}</AvatarFallback>
        </Avatar>
        <Avatar className="grayscale">
          <AvatarFallback>{getInitials(PEOPLE[4].name)}</AvatarFallback>
        </Avatar>
      </Section>

      <Section
        title="Status badge"
        description="Add an AvatarBadge as a presence dot in the corner. Override the badge color for the status — success for online, muted for offline."
      >
        <Avatar size="lg">
          <AvatarImage src={PEOPLE[2].image} alt={PEOPLE[2].name} />
          <AvatarFallback>{getInitials(PEOPLE[2].name)}</AvatarFallback>
          <AvatarBadge className="bg-success" />
        </Avatar>
        <Avatar size="lg">
          <AvatarImage src={PEOPLE[3].image} alt={PEOPLE[3].name} />
          <AvatarFallback>{getInitials(PEOPLE[3].name)}</AvatarFallback>
          <AvatarBadge className="bg-muted-foreground" />
        </Avatar>
        <Avatar>
          <AvatarImage src={PEOPLE[0].image} alt={PEOPLE[0].name} />
          <AvatarFallback>{getInitials(PEOPLE[0].name)}</AvatarFallback>
          <AvatarBadge className="bg-success" />
        </Avatar>
      </Section>

      <Section
        title="Badge with icon"
        description="Render an icon inside the AvatarBadge; it inherits the badge color and is auto-sized off the active avatar size."
      >
        <Avatar size="lg">
          <AvatarImage src={PEOPLE[1].image} alt={PEOPLE[1].name} />
          <AvatarFallback>{getInitials(PEOPLE[1].name)}</AvatarFallback>
          <AvatarBadge>
            <Plus />
          </AvatarBadge>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>{getInitials(PEOPLE[1].name)}</AvatarFallback>
          <AvatarBadge>
            <Plus />
          </AvatarBadge>
        </Avatar>
      </Section>

      <Section
        title="Avatar group"
        description="Stack related avatars with AvatarGroup; the ring separates each from its neighbour. Cap the visible avatars and use AvatarGroupCount for the overflow."
      >
        <AvatarGroup stacking="last">
          {PEOPLE.slice(0, 4).map((person) => (
            <Avatar key={person.name}>
              <AvatarImage src={person.image} alt={person.name} />
              <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Section>

      <Section
        title="Avatar group with icon"
        description="Use an icon inside AvatarGroupCount — for example an add action at the end of a stacked row."
      >
        <AvatarGroup stacking="last">
          {PEOPLE.slice(0, 3).map((person) => (
            <Avatar key={person.name}>
              <AvatarImage src={person.image} alt={person.name} />
              <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>
            <Plus />
          </AvatarGroupCount>
        </AvatarGroup>
      </Section>

      <Section
        title="Stacking order"
        description="Use the stacking prop to choose which avatar overlaps its neighbour: first (default) keeps the leading avatar on top, last puts the trailing avatar on top."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AvatarGroup>
              {PEOPLE.slice(0, 4).map((person) => (
                <Avatar key={person.name}>
                  <AvatarImage src={person.image} alt={person.name} />
                  <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <span className="text-muted-foreground text-xs">first</span>
          </div>
          <div className="flex items-center gap-3">
            <AvatarGroup stacking="last">
              {PEOPLE.slice(0, 4).map((person) => (
                <Avatar key={person.name}>
                  <AvatarImage src={person.image} alt={person.name} />
                  <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <span className="text-muted-foreground text-xs">last</span>
          </div>
        </div>
      </Section>

      <Section
        title="Dropdown"
        description="Use the avatar as a DropdownMenuTrigger to open an account menu."
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className="focus-visible:outline-ring focus-visible:outline-solid cursor-pointer rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Open account menu"
          >
            <Avatar className="size-10 sm:size-8">
              <AvatarImage src={PEOPLE[0].image} alt={PEOPLE[0].name} />
              <AvatarFallback>{getInitials(PEOPLE[0].name)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel>{PEOPLE[0].name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>
    </>
  );
}
