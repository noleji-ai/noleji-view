import type { TemplateVars } from '../types';
import { generateCSS as asomeCSS } from './asome';

/**
 * Vercel Precise template.
 * Derives from the Asome base with Vercel's monochrome black accent and Geist font.
 */
export function generateCSS(vars: TemplateVars): string {
  return asomeCSS({
    ...vars,
    accent: vars.accent ?? '#000000',
    font: vars.font ?? "Geist, sans-serif, 'Source Serif 4', serif",
  });
}
