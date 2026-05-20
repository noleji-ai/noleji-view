import type { PricingTier, PremiumAction } from '../types/pricing';
import { PRICING_PLANS } from '../data/pricingPlans';
import { readStoredUser } from '../services/accountStore';

const USAGE_KEY_PREFIX = 'noleji-view-usage-';
const LEGACY_USAGE_KEY_PREFIX = 'docwise-usage-';
const USER_PLAN_KEY = 'noleji-view-user-plan';
const LEGACY_USER_PLAN_KEY = 'docwise-user-plan';

/**
 * Get the current KST date string (YYYY-MM-DD).
 * KST = UTC + 9 hours.
 */
function getKSTDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/**
 * Get the user's current plan from localStorage.
 * Defaults to 'free' if not set or invalid.
 */
export function getUserPlan(): PricingTier {
  const storedUser = readStoredUser();
  if (storedUser) return storedUser.plan;

  try {
    const stored = localStorage.getItem(USER_PLAN_KEY) ?? localStorage.getItem(LEGACY_USER_PLAN_KEY);
    if (stored === 'free' || stored === 'monthly' || stored === 'lifetime') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'free';
}

/**
 * Get the limits for the current user plan.
 */
function getPlanLimits() {
  const tier = getUserPlan();
  const plan = PRICING_PLANS.find((p) => p.tier === tier);
  return plan?.limits ?? PRICING_PLANS[0].limits;
}

/**
 * Get the localStorage key for today's usage counter.
 */
function getTodayUsageKey(): string {
  return `${USAGE_KEY_PREFIX}${getKSTDateString()}`;
}

/**
 * Get current daily premium action usage.
 */
export function getDailyUsage(): { used: number; limit: number; date: string } {
  const date = getKSTDateString();
  const key = getTodayUsageKey();
  const limits = getPlanLimits();

  let used = 0;
  try {
    const stored = localStorage.getItem(key) ?? localStorage.getItem(`${LEGACY_USAGE_KEY_PREFIX}${date}`);
    if (stored !== null) {
      used = parseInt(stored, 10);
      if (isNaN(used)) used = 0;
    }
  } catch {
    // localStorage not available
  }

  return {
    used,
    limit: limits.dailyPremiumActions,
    date,
  };
}

/**
 * Check whether a premium action is allowed.
 * Paid users always get { allowed: true, remaining: Infinity }.
 * Free users get a daily cap of 10.
 */
export function canUsePremiumAction(): { allowed: boolean; remaining: number; limit: number } {
  const { used, limit } = getDailyUsage();

  if (!isFinite(limit)) {
    return { allowed: true, remaining: Infinity, limit };
  }

  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, limit };
}

/**
 * Increment the daily premium action counter.
 * Returns true if the action was tracked (within limit), false if limit reached.
 */
export function trackPremiumAction(_action: PremiumAction): boolean {
  const { allowed } = canUsePremiumAction();
  if (!allowed) return false;

  const key = getTodayUsageKey();
  const legacyKey = `${LEGACY_USAGE_KEY_PREFIX}${getKSTDateString()}`;
  let current = 0;
  try {
    const stored = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
    if (stored !== null) {
      current = parseInt(stored, 10);
      if (isNaN(current)) current = 0;
    }
    localStorage.setItem(key, String(current + 1));
  } catch {
    // localStorage not available
  }

  return true;
}

/**
 * Check whether the user can create a new folder.
 */
export function canCreateFolder(currentCount: number): boolean {
  const limits = getPlanLimits();
  if (!isFinite(limits.maxFolders)) return true;
  return currentCount < limits.maxFolders;
}

/**
 * Check whether the user can create a new file in the current folder.
 */
export function canCreateFile(currentFileCount: number): boolean {
  const limits = getPlanLimits();
  if (!isFinite(limits.maxFilesPerFolder)) return true;
  return currentFileCount < limits.maxFilesPerFolder;
}

export function canUseManagedAI(): boolean {
  return getPlanLimits().managedAI;
}

export function canUseCloudSync(): boolean {
  return getPlanLimits().cloudSync;
}

export function canUseLinkSharing(): boolean {
  return getPlanLimits().linkSharing;
}
