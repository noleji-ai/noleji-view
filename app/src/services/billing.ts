import type { PricingTier } from '../types/pricing';
import { appEnv, getAppUrl } from '../config/env';

export type BillingProvider = 'toss' | 'manual';

export interface BillingCheckoutConfig {
  provider: BillingProvider;
  tossClientKey: string;
  monthlyFlowUrl: string;
  lifetimeFlowUrl: string;
}

export function getBillingConfig(): BillingCheckoutConfig {
  const configuredProvider = appEnv.billingProvider.toLowerCase();
  const hasTossCheckout = Boolean(
    appEnv.tossClientKey &&
    appEnv.tossMonthlyFlowUrl &&
    appEnv.tossLifetimeFlowUrl,
  );

  return {
    provider: configuredProvider === 'toss' && hasTossCheckout ? 'toss' : 'manual',
    tossClientKey: appEnv.tossClientKey,
    monthlyFlowUrl: appEnv.tossMonthlyFlowUrl,
    lifetimeFlowUrl: appEnv.tossLifetimeFlowUrl,
  };
}

export function getActiveBillingProvider(): BillingProvider {
  return getBillingConfig().provider;
}

export function getBillingProviderLabel(provider: BillingProvider = getActiveBillingProvider()): string {
  return provider === 'toss' ? 'Toss Payments' : 'manual';
}

function getPostCheckoutUrl(result: 'success' | 'canceled', tier: PricingTier): string {
  if (typeof window === 'undefined') return '';

  const url = new URL(getAppUrl('/pricing'));
  url.searchParams.set('provider', 'toss');

  if (result === 'success') {
    url.searchParams.set('success', 'true');
    url.searchParams.set('plan', tier);
  } else {
    url.searchParams.set('canceled', 'true');
  }

  return url.toString();
}

function getConfiguredFlowUrl(tier: Exclude<PricingTier, 'free'>, config: BillingCheckoutConfig): string {
  return tier === 'monthly' ? config.monthlyFlowUrl : config.lifetimeFlowUrl;
}

function getTierLabel(tier: Exclude<PricingTier, 'free'>): string {
  return tier === 'monthly' ? '월간' : '평생';
}

/**
 * Provider-agnostic checkout entrypoint.
 *
 * Noleji View now targets Toss Payments. The frontend intentionally stays
 * fail-closed until Noleji-owned Toss flow endpoints and webhook entitlement sync
 * are configured, so users are never sent into a half-wired billing path.
 */
export function startCheckout(tier: PricingTier, userId: string): void {
  if (tier === 'free') return;

  const config = getBillingConfig();
  if (config.provider !== 'toss') {
    throw new Error('Toss Payments billing is not configured yet.');
  }

  const flowUrl = getConfiguredFlowUrl(tier, config);
  if (!flowUrl) {
    throw new Error(`Missing Toss Payments flow URL for ${tier} plan.`);
  }

  const url = new URL(flowUrl, window.location.origin);
  url.searchParams.set('userId', userId);
  url.searchParams.set('plan', tier);
  url.searchParams.set('provider', 'toss');
  url.searchParams.set('successUrl', getPostCheckoutUrl('success', tier));
  url.searchParams.set('cancelUrl', getPostCheckoutUrl('canceled', tier));
  url.searchParams.set('orderName', `Noleji View ${getTierLabel(tier)} 플랜`);

  if (tier === 'monthly') {
    url.searchParams.set('mode', 'billing');
    url.searchParams.set('customerKey', userId);
  } else {
    url.searchParams.set('mode', 'payment');
  }

  window.location.href = url.toString();
}
