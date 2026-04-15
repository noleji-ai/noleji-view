/**
 * Create a complete HTML document string for use as an iframe `srcDoc`.
 *
 * This is the standalone equivalent of docwise's `mdSrcDoc` and `htmlSrcDoc` useMemo hooks.
 *
 * @param parsedHtml  - The HTML body content (e.g., from `pipeline.process()`)
 * @param templateCSS - The full CSS string (from `getTemplateCSS` or `generateIframeStyles`)
 * @param lang        - The `<html lang>` attribute. Default: `'ko'`
 * @returns A complete `<!DOCTYPE html>` string ready for iframe srcDoc
 *
 * @example
 * ```ts
 * import { createMarkdownProcessor } from '@docwise/renderer';
 * import { getTemplateCSS } from '@docwise/renderer';
 * import { createIframeSrcDoc } from '@docwise/renderer';
 *
 * const md = createMarkdownProcessor();
 * const result = await md.process('# Hello\n\nWorld');
 * const css = getTemplateCSS('stripe', { fontSize: 16 });
 * const srcDoc = createIframeSrcDoc(result.html, css);
 *
 * // Use in an iframe:
 * iframe.srcdoc = srcDoc;
 * ```
 */
export function createIframeSrcDoc(
  parsedHtml: string,
  templateCSS: string,
  lang: string = 'ko',
): string {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><style>${templateCSS}</style></head><body>${parsedHtml}</body></html>`;
}

/**
 * Create an iframe srcDoc for raw HTML content.
 *
 * If the content is already a full HTML document (`<!doctype` or `<html`),
 * it is returned as-is. Otherwise it is wrapped with basic styles.
 *
 * @param htmlContent  - Raw HTML content
 * @param templateCSS  - CSS string for wrapping (only used when content is a fragment)
 * @param lang         - HTML lang attribute. Default: `'ko'`
 * @returns A complete HTML document string
 */
export function createHtmlIframeSrcDoc(
  htmlContent: string,
  templateCSS: string,
  lang: string = 'ko',
): string {
  const trimmed = htmlContent.trim().toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    return htmlContent;
  }
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"><\/script><style>${templateCSS}</style></head><body>${htmlContent}</body></html>`;
}
