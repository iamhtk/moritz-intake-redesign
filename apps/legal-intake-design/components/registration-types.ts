import type {
  CompanyInvitationStatus,
  CompanyType,
  CompanySize,
  NotificationType,
} from '@/lib/types';

export type RegistrationSections = {
  emailVerification?: boolean;
  personal?: boolean;
  company?: boolean;
  team?: boolean;
  locale?: boolean;
  notifications?: boolean;
};

export type RegistrationMember = {
  id: string;
  name: string | null;
  email: string | null;
  enabled: boolean;
  image?: string | null;
};

export type PreferredLegalCompany = {
  id: string;
  name: string;
};

export type RegistrationCompany = {
  id: string | null;
  name: string | null;
  description: string | null;
  image: string | null;
  type: CompanyType;
  orgNumber: string | null;
  companyUrl: string | null;
  country: string | null;
  size: CompanySize;
  whitelisted?: boolean;
  members: RegistrationMember[];
  preferredLegalCompanies?: PreferredLegalCompany[];
};

export type RegistrationUser = {
  id: string;
  name?: string | null;
  description?: string | null;
  email: string | null;
  emailVerified: string | null;
  phoneNumber?: string | null;
  phoneVerifiedAt?: string | null;
  image?: string | null;
  enabled: boolean;
  isCompanyOwner: boolean;
  company: RegistrationCompany | null;
};

export type RegistrationInvitation = {
  id: string;
  email: string;
  status: CompanyInvitationStatus;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
};

export type SmsConsent = {
  consented: boolean;
  consentedAt: string | null;
  consentSource: string | null;
  optedOutAt: string | null;
};

export type RegistrationState = {
  user: RegistrationUser;
  allowedNotificationTypes: NotificationType[];
  notificationPreferences: Partial<Record<NotificationType, boolean>>;
  allowedSmsNotificationTypes: NotificationType[];
  smsNotificationPreferences: Partial<Record<NotificationType, boolean>>;
  smsEnabled: boolean;
  smsConsent: SmsConsent;
  invitations: RegistrationInvitation[];
  companyType: CompanyType;
  updateCompany: boolean;
  hasOutstandingVerification: boolean;
  phoneVerificationEnabled: boolean;
  /** User preference: receive full case view emails with all messages + documents instead of digest */
  fullCaseViewEmail: boolean;
  /** User preference: forward inbound case emails to this user instantly */
  userPreferenceRelayEmail: boolean;
  /** When true, NON_LEGAL companies can select preferred legal providers */
  preferredLegalCompaniesEnabled: boolean;
  /** Current environment (local, staging, production, ci) */
  arclineEnv: string;
};
