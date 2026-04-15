import type { TemplateConfig, TemplateVars } from '../types';
import { generateCSS as appleCSS } from './apple';
import { generateCSS as stripeCSS } from './stripe';
import { generateCSS as linearCSS } from './linear';
import { generateCSS as vercelCSS } from './vercel';
import { generateCSS as mistralCSS } from './mistral';
import { generateCSS as asomeCSS } from './asome';

/**
 * Registry of all built-in design templates.
 * Each entry maps a template ID to its configuration.
 */
export const TEMPLATES: Record<string, TemplateConfig> = {
  apple: { id: 'apple', name: 'Apple Premium', color: '#000000', accent: '#0071E3', font: 'SF Pro, Inter' },
  stripe: { id: 'stripe', name: 'Stripe Elegant', color: '#635BFF', accent: '#00D7FF', font: 'Inter' },
  linear: { id: 'linear', name: 'Linear Minimal', color: '#5E6AD2', accent: '#8A94E9', font: 'Inter' },
  vercel: { id: 'vercel', name: 'Vercel Precise', color: '#000000', accent: '#000000', font: 'Geist, sans-serif' },
  mistral: { id: 'mistral', name: 'Mistral French', color: '#FF5917', accent: '#7C3AED', font: 'Inter' },
  asome: { id: 'asome', name: 'Asome Emerald', color: '#1A202C', accent: '#10B981', font: 'Source Serif 4' },
};

/**
 * Map from template ID to its CSS generator function.
 */
const CSS_GENERATORS: Record<string, (vars: TemplateVars) => string> = {
  apple: appleCSS,
  stripe: stripeCSS,
  linear: linearCSS,
  vercel: vercelCSS,
  mistral: mistralCSS,
  asome: asomeCSS,
};

/**
 * Get the full CSS string for a given template and variable set.
 *
 * Falls back to the `asome` template if the requested ID is unknown.
 *
 * @param templateId - One of the registered template IDs
 * @param vars - Template variables (fontSize, isDark, etc.)
 * @returns Complete CSS string ready for injection into a `<style>` tag
 *
 * @example
 * ```ts
 * const css = getTemplateCSS('stripe', { fontSize: 16, isDark: true });
 * ```
 */
export function getTemplateCSS(templateId: string, vars: TemplateVars): string {
  const gen = CSS_GENERATORS[templateId] ?? CSS_GENERATORS['asome'];
  return gen(vars);
}

/**
 * Get the list of all template configs as an array (useful for UI rendering).
 */
export function getTemplateList(): TemplateConfig[] {
  return Object.values(TEMPLATES);
}
