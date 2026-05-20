import type { PricingTier } from './pricing';

export interface UserEntitlements {
  cloudSync: boolean;
  managedAI: boolean;
  linkSharing: boolean;
  localWorkspaceRestore: boolean;
}

export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface DocwiseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'github' | 'email' | 'unknown';
  plan: PricingTier;
  subscriptionStatus: SubscriptionStatus;
  entitlements: UserEntitlements;
  createdAt: string;
  lastSyncedAt: string | null;
}

export type SupportedAuthProvider = 'google' | 'github';

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: DocwiseUser }
  | { status: 'unauthenticated' };
