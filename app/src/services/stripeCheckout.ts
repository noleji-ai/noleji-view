/**
 * Stripe Payment Link integration for docwise
 *
 * Uses pre-configured Stripe Payment Links (no backend required).
 * Replace PLACEHOLDER URLs with actual Stripe Payment Link URLs
 * after configuring them in the Stripe Dashboard.
 */

import type { PricingTier } from '../types/pricing';

interface StripeConfig {
  monthlyPaymentLink: string;
  lifetimePaymentLink: string;
}

// TODO: Replace with actual Stripe Payment Link URLs from Stripe Dashboard
const STRIPE_CONFIG: StripeConfig = {
  monthlyPaymentLink: 'https://buy.stripe.com/PLACEHOLDER_MONTHLY',
  lifetimePaymentLink: 'https://buy.stripe.com/PLACEHOLDER_LIFETIME',
};

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'https://noleji-ai.github.io/docwise';
  }
  return window.location.origin + '/docwise';
}

export function redirectToCheckout(tier: PricingTier, userId: string): void {
  if (tier === 'free') return;

  const link =
    tier === 'monthly'
      ? STRIPE_CONFIG.monthlyPaymentLink
      : STRIPE_CONFIG.lifetimePaymentLink;

  const url = new URL(link);
  url.searchParams.set('client_reference_id', userId);
  url.searchParams.set('prefilled_email', ''); // Will be filled by Stripe if user is logged in

  window.location.href = url.toString();
}

export function isPaymentSuccess(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('success') === 'true';
}

export function isPaymentCanceled(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('canceled') === 'true';
}

// Keep getBaseUrl referenced to avoid unused-variable lint errors
export { getBaseUrl };
