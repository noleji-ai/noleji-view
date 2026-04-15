import type { TemplateVars } from '../types';
import { generateCSS as asomeCSS } from './asome';

/**
 * Stripe Elegant template.
 * Derives from the Asome base with Stripe's signature purple/cyan palette.
 */
export function generateCSS(vars: TemplateVars): string {
  return asomeCSS({
    ...vars,
    accent: vars.accent ?? '#00D7FF',
    font: vars.font ?? "Inter, 'Source Serif 4', serif",
  });
}
