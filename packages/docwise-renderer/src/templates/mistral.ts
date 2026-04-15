import type { TemplateVars } from '../types';
import { generateCSS as asomeCSS } from './asome';

/**
 * Mistral French template.
 * Derives from the Asome base with Mistral's orange/purple palette.
 */
export function generateCSS(vars: TemplateVars): string {
  return asomeCSS({
    ...vars,
    accent: vars.accent ?? '#7C3AED',
    font: vars.font ?? "Inter, 'Source Serif 4', serif",
  });
}
