import type { TemplateVars } from '../types';
import { generateCSS as asomeCSS } from './asome';

/**
 * Linear Minimal template.
 * Derives from the Asome base with Linear's indigo accent and Inter font.
 */
export function generateCSS(vars: TemplateVars): string {
  return asomeCSS({
    ...vars,
    accent: vars.accent ?? '#8A94E9',
    font: vars.font ?? "Inter, 'Source Serif 4', serif",
  });
}
