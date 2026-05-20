import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { PricingTier } from '../types/pricing';
import type { DocwiseUser, SubscriptionStatus, UserEntitlements } from '../types/auth';

const USER_KEY = 'noleji-view-user';
const LEGACY_USER_KEY = 'docwise-user';
const USER_PLAN_KEY = 'noleji-view-user-plan';
const LEGACY_USER_PLAN_KEY = 'docwise-user-plan';

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  default_plan: string | null;
  created_at: string | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type EntitlementRow = {
  cloud_sync: boolean | null;
  managed_ai: boolean | null;
  link_sharing: boolean | null;
  local_workspace_restore: boolean | null;
};

interface AccountSnapshot {
  profile: ProfileRow | null;
  subscription: SubscriptionRow | null;
  entitlements: EntitlementRow | null;
}

function generateUid(): string {
  return `noleji-view-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePlan(plan: string | null | undefined, fallback: PricingTier = 'free'): PricingTier {
  if (plan === 'monthly' || plan === 'lifetime' || plan === 'free') {
    return plan;
  }
  return fallback;
}

function normalizeSubscriptionStatus(status: string | null | undefined, plan: PricingTier): SubscriptionStatus {
  if (status === 'inactive' || status === 'trialing' || status === 'active' || status === 'past_due' || status === 'canceled') {
    return status;
  }
  return plan === 'free' ? 'inactive' : 'active';
}

export function getEntitlementsForPlan(plan: PricingTier): UserEntitlements {
  const isPaid = plan === 'monthly' || plan === 'lifetime';
  return {
    cloudSync: true,
    managedAI: isPaid,
    linkSharing: isPaid,
    localWorkspaceRestore: true,
  };
}

function mergeEntitlements(plan: PricingTier, row: EntitlementRow | null | undefined): UserEntitlements {
  const defaults = getEntitlementsForPlan(plan);
  if (!row) {
    return defaults;
  }

  return {
    cloudSync: row.cloud_sync ?? defaults.cloudSync,
    managedAI: row.managed_ai ?? defaults.managedAI,
    linkSharing: row.link_sharing ?? defaults.linkSharing,
    localWorkspaceRestore: row.local_workspace_restore ?? defaults.localWorkspaceRestore,
  };
}

export function readStoredUser(): DocwiseUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocwiseUser;
    if (!parsed.uid || !parsed.provider) return null;
    const normalizedPlan = normalizePlan(parsed.plan, 'free');
    return {
      ...parsed,
      plan: normalizedPlan,
      entitlements: parsed.entitlements ?? getEntitlementsForPlan(normalizedPlan),
      subscriptionStatus: normalizeSubscriptionStatus(parsed.subscriptionStatus, normalizedPlan),
      lastSyncedAt: parsed.lastSyncedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function persistUser(user: DocwiseUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(USER_PLAN_KEY, user.plan);
      localStorage.setItem(LEGACY_USER_PLAN_KEY, user.plan);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_PLAN_KEY);
      localStorage.removeItem(LEGACY_USER_PLAN_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

export function createSessionUser(provider: 'google' | 'github'): DocwiseUser {
  const displayName = provider === 'google' ? 'Google Workspace User' : 'GitHub Workspace User';
  const email = provider === 'google' ? 'user@gmail.com' : 'user@github.com';
  return {
    uid: generateUid(),
    email,
    displayName,
    photoURL: null,
    provider,
    plan: 'free',
    subscriptionStatus: 'inactive',
    entitlements: getEntitlementsForPlan('free'),
    createdAt: new Date().toISOString(),
    lastSyncedAt: null,
  };
}

function normalizeProvider(provider: string | undefined): DocwiseUser['provider'] {
  if (provider === 'google' || provider === 'github' || provider === 'email') {
    return provider;
  }
  return 'unknown';
}

function buildUserFromSources(user: User, snapshot: AccountSnapshot | null, persisted: DocwiseUser | null, fallbackPlan: PricingTier): DocwiseUser {
  const provider = normalizeProvider(
    user.app_metadata?.provider
      ?? user.identities?.[0]?.provider
      ?? undefined,
  );
  const metadata = user.user_metadata ?? {};
  const plan = normalizePlan(
    snapshot?.subscription?.plan
      ?? snapshot?.profile?.default_plan
      ?? (persisted?.uid === user.id ? persisted.plan : fallbackPlan),
    fallbackPlan,
  );

  return {
    uid: user.id,
    email: snapshot?.profile?.email ?? user.email ?? null,
    displayName: snapshot?.profile?.display_name ?? metadata.full_name ?? metadata.name ?? metadata.user_name ?? null,
    photoURL: snapshot?.profile?.avatar_url ?? metadata.avatar_url ?? metadata.picture ?? null,
    provider,
    plan,
    subscriptionStatus: normalizeSubscriptionStatus(snapshot?.subscription?.status, plan),
    entitlements: mergeEntitlements(plan, snapshot?.entitlements),
    createdAt: snapshot?.profile?.created_at ?? user.created_at ?? new Date().toISOString(),
    lastSyncedAt: persisted?.uid === user.id ? persisted.lastSyncedAt : null,
  };
}

export function mapSupabaseUser(user: User, fallbackPlan: PricingTier = 'free'): DocwiseUser {
  const persisted = readStoredUser();
  return buildUserFromSources(user, null, persisted, fallbackPlan);
}

export async function hydrateSupabaseUser(
  supabase: SupabaseClient,
  user: User,
  fallbackPlan: PricingTier = 'free',
): Promise<DocwiseUser> {
  const persisted = readStoredUser();
  const snapshot = await fetchSupabaseAccountSnapshot(supabase, user.id);
  return buildUserFromSources(user, snapshot, persisted, fallbackPlan);
}

async function fetchSupabaseAccountSnapshot(supabase: SupabaseClient, userId: string): Promise<AccountSnapshot | null> {
  const [{ data: profile }, { data: entitlements }, { data: subscription }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, default_plan, created_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('entitlements')
      .select('cloud_sync, managed_ai, link_sharing, local_workspace_restore')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, status, updated_at, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    profile: (profile as ProfileRow | null) ?? null,
    entitlements: (entitlements as EntitlementRow | null) ?? null,
    subscription: (subscription as SubscriptionRow | null) ?? null,
  };
}

export function updateStoredUserPlan(plan: PricingTier): DocwiseUser | null {
  const current = readStoredUser();
  if (!current) return null;
  const normalizedPlan = normalizePlan(plan, current.plan);
  const nextUser: DocwiseUser = {
    ...current,
    plan: normalizedPlan,
    subscriptionStatus: normalizeSubscriptionStatus(current.subscriptionStatus, normalizedPlan),
    entitlements: getEntitlementsForPlan(normalizedPlan),
  };
  persistUser(nextUser);
  return nextUser;
}

export function updateStoredUserSyncTimestamp(timestamp: string): DocwiseUser | null {
  const current = readStoredUser();
  if (!current) return null;
  const nextUser = { ...current, lastSyncedAt: timestamp };
  persistUser(nextUser);
  return nextUser;
}
