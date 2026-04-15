import type { PricingTier } from './pricing';

export interface DocwiseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'github' | 'email' | 'anonymous';
  plan: PricingTier;
  createdAt: string;
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: DocwiseUser }
  | { status: 'unauthenticated' };
