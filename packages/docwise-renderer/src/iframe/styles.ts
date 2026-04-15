import type { TemplateConfig, TemplateVars } from '../types';
import { getTemplateCSS } from '../templates';

/**
 * Generate a complete CSS string for iframe-based Markdown rendering.
 *
 * This is the same logic used by docwise's `iframeMdStyles` useMemo,
 * extracted into a pure function.
 *
 * @param template - The selected design template configuration
 * @param vars     - Variable overrides (fontSize, isDark, etc.)
 * @returns CSS string (without `<style>` tags -- use `createIframeSrcDoc` for that)
 *
 * @example
 * ```ts
 * const css = generateIframeStyles(TEMPLATES.stripe, { fontSize: 16, isDark: false });
 * ```
 */
export function generateIframeStyles(
  template: TemplateConfig,
  vars: TemplateVars = {},
): string {
  const mergedVars: TemplateVars = {
    accent: template.accent,
    font: `${template.font}, 'Source Serif 4', serif`,
    ...vars,
  };
  return getTemplateCSS(template.id, mergedVars);
}

/**
 * Generate the HTML-mode iframe styles (simpler, for raw HTML content).
 *
 * Corresponds to docwise's `iframeHtmlStyles` useMemo.
 */
export function generateIframeHtmlStyles(
  template: TemplateConfig,
  vars: TemplateVars = {},
): string {
  const font = vars.font ?? `${template.font}, 'Inter', system-ui, sans-serif`;
  const fontSize = vars.fontSize ?? 18;
  const lineHeight = vars.lineHeight ?? 1.8;
  const padding = vars.padding ?? 60;
  const isDark = vars.isDark ?? false;
  const accent = vars.accent ?? template.accent;

  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,700;0,900;1,400&display=swap');
* { box-sizing: border-box; }
body {
  font-family: ${font};
  font-size: ${fontSize}px; line-height: ${lineHeight};
  color: ${isDark ? '#E2E8F0' : '#1A202C'};
  background: ${isDark ? '#1A202C' : '#FFFFFF'};
  padding: ${padding}px; margin: 0; -webkit-font-smoothing: antialiased;
}
h1 { font-size: 2.5em; font-weight: 800; margin: 0.5em 0; letter-spacing: -0.03em; }
h2 { font-size: 1.8em; font-weight: 700; margin: 0.5em 0; }
h3 { font-size: 1.4em; font-weight: 600; margin: 0.5em 0; }
p { margin: 0.8em 0; }
a { color: ${accent}; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid ${isDark ? '#4A5568' : '#E2E8F0'}; padding: 10px 14px; text-align: left; }
th { background: ${isDark ? '#2D3748' : '#F7FAFC'}; font-weight: 600; }
@media print {
  @page { margin: 2cm; size: A4; }
  body { font-size: 12pt !important; color: #000 !important; background: #fff !important; padding: 0 !important; }
}
`.trim();
}
