import type { PricingTier } from '../types/pricing';

/**
 * Legacy payment-link adapter retained only to avoid stale imports in older
 * branches. New code must use `startCheckout` from `billing.ts`, which is
 * Toss Payments-ready and fails closed until real Noleji billing flow URLs are configured.
 */
export function redirectToCheckout(_tier: PricingTier, _userId: string): never {
  throw new Error('Legacy Stripe checkout is disabled. Use Toss Payments billing via services/billing.ts.');
}

export function isPaymentSuccess(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('success') === 'true';
}

export function isPaymentCanceled(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('canceled') === 'true';
}
