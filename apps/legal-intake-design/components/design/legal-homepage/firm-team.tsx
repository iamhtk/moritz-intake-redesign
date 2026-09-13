import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { MOCK_COMPANY_MEMBERS } from '@/lib/mocks/companies';
import { SectionHeader } from './section-header';

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * "Your firm" closer — an avatar grid of the lawyer's firm colleagues. Mirrors
 * the client homepage's `LegalTeam` avatar grid for visual symmetry across the
 * two roles, sourced from the company-members mock.
 */
export function FirmTeam({
  companyId,
  firmName,
}: {
  companyId: string;
  firmName: string;
}) {
  const members = MOCK_COMPANY_MEMBERS[companyId] ?? [];

  if (members.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader title={`Your firm · ${firmName}`} />

      <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4">
        {members.map((member) => (
          <li
            key={member.membershipId}
            className="flex flex-col items-center gap-3 text-center"
          >
            <Avatar size="2xl" className="border-border/60 border shadow-sm">
              {/* Unconditional even without a photograph; see `AvatarImage`. */}
              <AvatarImage src={member.image} alt={member.name} />
              <AvatarFallback className="text-foreground font-medium">
                {initialsFor(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium">{member.name}</p>
              {member.title ? (
                <p className="text-muted-foreground text-balance text-xs leading-snug">
                  {member.title}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
