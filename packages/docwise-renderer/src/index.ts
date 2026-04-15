/**
 * @docwise/renderer
 *
 * Standalone Markdown rendering, styling, and export pipeline extracted from docwise.
 *
 * Features:
 * - unified-based Markdown-to-HTML pipeline (remark + rehype)
 * - 6 built-in design templates (Apple, Stripe, Linear, Vercel, Mistral, Asome)
 * - PDF export via html2canvas + jsPDF
 * - Self-contained HTML export with inline styles
 * - iframe srcDoc generation for live preview
 * - Framework-agnostic (no React dependency in core logic)
 */

// ── Pipeline ──
export { createMarkdownProcessor } from './pipeline';

// ── Export ──
export { exportToPdf, downloadPdf } from './exportPdf';
export { generateFullHtml } from './exportHtml';
export { exportToMd, downloadMd } from './exportMd';

// ── Templates ──
export { TEMPLATES, getTemplateCSS, getTemplateList } from './templates';

// ── iframe ──
export { createIframeSrcDoc, createHtmlIframeSrcDoc } from './iframe/renderer';
export { generateIframeStyles, generateIframeHtmlStyles } from './iframe/styles';

// ── Types ──
export type {
  ParseResult,
  TemplateConfig,
  TemplateVars,
  ExportOptions,
} from './types';
