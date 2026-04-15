import type { ExportOptions } from './types';
import { getTemplateCSS } from './templates';

/**
 * Generate a complete, self-contained HTML document string suitable for
 * saving as a standalone `.html` file or embedding in an iframe.
 *
 * Supports two modes:
 * - `'md'`   -- wraps `parsedHtml` (the HTML output from the unified pipeline)
 *               with the selected template CSS.
 * - `'html'` -- treats `content` as raw HTML.  If it already contains
 *               `<!doctype` or `<html`, it is returned as-is.  Otherwise
 *               it is wrapped with basic styling.
 *
 * @param content     - The raw source content (Markdown or HTML)
 * @param mode        - `'md'` or `'html'`
 * @param parsedHtml  - The HTML rendered by the pipeline (only used in `'md'` mode)
 * @param options     - Template and variable overrides
 * @returns A complete HTML document string
 *
 * @example
 * ```ts
 * const processor = createMarkdownProcessor();
 * const result = await processor.process(mdSource);
 * const html = generateFullHtml(mdSource, 'md', result.html, {
 *   template: TEMPLATES.stripe,
 *   templateVars: { fontSize: 16, isDark: false },
 * });
 * ```
 */
export function generateFullHtml(
  content: string,
  mode: 'md' | 'html',
  parsedHtml: string,
  options: ExportOptions = {},
): string {
  const { template, templateVars = {} } = options;

  if (mode === 'md') {
    const templateId = template?.id ?? 'asome';
    const vars = {
      accent: template?.accent,
      font: template?.font ? `${template.font}, 'Source Serif 4', serif` : undefined,
      ...templateVars,
    };
    const css = getTemplateCSS(templateId, vars);

    return [
      '<!DOCTYPE html>',
      '<html lang="ko">',
      '<head>',
      '<meta charset="UTF-8">',
      `<style>${css}</style>`,
      '</head>',
      `<body>${parsedHtml}</body>`,
      '</html>',
    ].join('\n');
  }

  // HTML mode
  const trimmed = content.trim().toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    // Already a full document
    return content;
  }

  // Wrap fragment with basic styling
  const font = template?.font ?? 'Inter, system-ui, sans-serif';
  const accent = template?.accent ?? '#10B981';
  const isDark = templateVars.isDark ?? false;
  const fontSize = templateVars.fontSize ?? 18;
  const lineHeight = templateVars.lineHeight ?? 1.8;
  const padding = templateVars.padding ?? 60;

  const htmlStyles = `
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

  return [
    '<!DOCTYPE html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="UTF-8">',
    '<script src="https://cdn.tailwindcss.com"><\/script>',
    `<style>${htmlStyles}</style>`,
    '</head>',
    `<body>${content}</body>`,
    '</html>',
  ].join('\n');
}
