import type { TemplateVars } from '../types';
import { generateCSS as asomeCSS } from './asome';

/**
 * Apple Premium template.
 * Derives from the Asome base with Apple's color palette and SF Pro font.
 */
export function generateCSS(vars: TemplateVars): string {
  return asomeCSS({
    ...vars,
    accent: vars.accent ?? '#0071E3',
    font: vars.font ?? "SF Pro, Inter, 'Source Serif 4', serif",
  });
}
