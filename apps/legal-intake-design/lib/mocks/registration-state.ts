import type {
  RegistrationCompany,
  RegistrationInvitation,
  RegistrationMember,
  RegistrationState,
  RegistrationUser,
} from '@/components/registration-types';
import type {
  AuthUser,
  CompanyType,
  CompanySize,
  NotificationType,
} from '@/lib/types';
import { getCompanyById, MOCK_COMPANY_MEMBERS } from '@/lib/mocks/companies';

/**
 * Notification matrix by company type, mirrored from `@repo/temporal-shared`
 * (`EMAIL_NOTIFICATION_TYPES_BY_COMPANY` / `SMS_NOTIFICATION_TYPES_BY_COMPANY`).
 * Kept inline so the playground stays self-contained.
 */
const EMAIL_NOTIFICATION_TYPES_BY_COMPANY: Record<
  CompanyType,
  NotificationType[]
> = {
  NON_LEGAL: [
    'NEW_MESSAGE',
    'CASE_COLLABORATOR_ADDED',
    'QUOTE_CREATED',
    'CASE_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
    'INVOICE_CREATED',
  ],
  LEGAL: [
    'NEW_MESSAGE',
    'CASE_READY_FOR_CLAIM',
    'CASE_COLLABORATOR_ADDED',
    'CASE_CLOSED',
    'QUOTE_ROUND_INVITATION',
    'QUOTE_ACCEPTED',
    'QUOTE_ROUND_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
  ],
  INTERNAL_ADMIN: ['COMPANY_CREATED'],
  INTERNAL_ASSISTANT: [],
};

const SMS_NOTIFICATION_TYPES_BY_COMPANY: Record<
  CompanyType,
  NotificationType[]
> = {
  NON_LEGAL: [
    'NEW_MESSAGE',
    'QUOTE_CREATED',
    'CASE_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
    'INVOICE_CREATED',
  ],
  LEGAL: [
    'NEW_MESSAGE',
    'QUOTE_ROUND_INVITATION',
    'QUOTE_ACCEPTED',
    'CASE_CLOSED',
    'LAWYER_DIRECTLY_ASSIGNED',
  ],
  INTERNAL_ADMIN: [],
  INTERNAL_ASSISTANT: [],
};

function normaliseCompanySize(size: string | null | undefined): CompanySize {
  switch (size) {
    case 'PRE_INCORPORATION':
    case 'SMALL':
    case 'MEDIUM':
    case 'LARGE':
      return size;
    default:
      return 'SMALL';
  }
}

function buildMembers(
  companyId: string,
  currentUser: AuthUser,
): RegistrationMember[] {
  const members = MOCK_COMPANY_MEMBERS[companyId] ?? [];
  const mapped: RegistrationMember[] = members.map((m) => ({
    id: m.userId,
    name: m.name,
    email: m.email,
    enabled: m.enabled,
    image: m.image,
  }));

  // Make sure the current user is in the list (some roles have no mock members).
  if (!mapped.some((m) => m.id === currentUser.id)) {
    mapped.unshift({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      enabled: true,
      image: currentUser.image,
    });
  }

  return mapped;
}

function buildInvitations(companyId: string): RegistrationInvitation[] {
  const baseDate = new Date('2026-05-01T08:00:00.000Z').getTime();
  return [
    {
      id: `inv_${companyId}_001`,
      email: 'pending.invite@example.com',
      status: 'PENDING',
      createdAt: new Date(baseDate).toISOString(),
      expiresAt: new Date(baseDate + 1000 * 60 * 60 * 24 * 14).toISOString(),
      acceptedAt: null,
    },
    {
      id: `inv_${companyId}_002`,
      email: 'old.invite@example.com',
      status: 'ACCEPTED',
      createdAt: new Date(baseDate - 1000 * 60 * 60 * 24 * 30).toISOString(),
      expiresAt: null,
      acceptedAt: new Date(baseDate - 1000 * 60 * 60 * 24 * 28).toISOString(),
    },
  ];
}

/**
 * Build a full `RegistrationState` shape (the payload prod returns from
 * `registration.onboardingState`) from the playground's `AuthUser`.
 *
 * The Settings UI consumes this exact shape, so engineers can lift it back
 * to prod by replacing this factory with the real tRPC prefetch.
 */
export function buildMockRegistrationState(user: AuthUser): RegistrationState {
  const fullCompany = getCompanyById(user.company.id);
  const isCompanyOwner = user.role === 'OWNER';
  const companyType = user.company.type;

  const company: RegistrationCompany = {
    id: user.company.id,
    name: fullCompany?.name ?? user.company.name,
    description: fullCompany?.description ?? null,
    image: null,
    type: companyType,
    orgNumber: fullCompany?.orgNumber ?? null,
    companyUrl: fullCompany?.companyUrl ?? null,
    country: fullCompany?.country ?? null,
    size: normaliseCompanySize(fullCompany?.size),
    whitelisted: fullCompany?.whitelisted ?? true,
    members: buildMembers(user.company.id, user),
    preferredLegalCompanies: [],
  };

  const registrationUser: RegistrationUser = {
    id: user.id,
    name: user.name,
    description: user.description,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phone,
    phoneVerifiedAt: user.phoneVerified,
    image: user.image,
    enabled: user.enabled,
    isCompanyOwner,
    company,
  };

  return {
    user: registrationUser,
    allowedNotificationTypes:
      EMAIL_NOTIFICATION_TYPES_BY_COMPANY[companyType] ?? [],
    notificationPreferences: {},
    allowedSmsNotificationTypes:
      SMS_NOTIFICATION_TYPES_BY_COMPANY[companyType] ?? [],
    smsNotificationPreferences: {},
    smsEnabled: true,
    smsConsent: {
      consented: false,
      consentedAt: null,
      consentSource: null,
      optedOutAt: null,
    },
    invitations: isCompanyOwner ? buildInvitations(user.company.id) : [],
    companyType,
    updateCompany: true,
    hasOutstandingVerification: false,
    phoneVerificationEnabled: false,
    fullCaseViewEmail: false,
    userPreferenceRelayEmail: false,
    preferredLegalCompaniesEnabled: false,
    arclineEnv: 'dev',
  };
}
