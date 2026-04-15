# @docwise/renderer

Standalone Markdown rendering, styling, and export pipeline extracted from the [docwise](https://github.com/docwise) desktop editor. This package provides a framework-agnostic set of functions for parsing Markdown into beautifully styled HTML, generating PDFs, and managing design templates -- all without any React dependency in the core logic.

## Overview

- **Unified pipeline** -- remark-parse, remark-gfm, remark-rehype, rehype-raw, rehype-highlight, rehype-stringify
- **6 built-in design templates** -- Apple, Stripe, Linear, Vercel, Mistral, Asome (Emerald)
- **PDF export** -- html2canvas + jsPDF with multi-page A4 support
- **HTML export** -- self-contained documents with inline styles
- **Markdown export** -- simple blob generation with browser download helper
- **iframe rendering** -- srcDoc generation for live preview in any iframe
- **Framework-agnostic** -- pure functions, no React dependency

## Installation

```bash
npm install @docwise/renderer
```

### Peer Dependencies

These are listed as peer dependencies and must be installed separately:

```bash
npm install unified remark-parse remark-gfm remark-rehype rehype-raw rehype-highlight rehype-stringify jspdf html2canvas
```

## Quick Start

```typescript
import {
  createMarkdownProcessor,
  getTemplateCSS,
  createIframeSrcDoc,
  TEMPLATES,
} from '@docwise/renderer';

// 1. Parse Markdown
const processor = createMarkdownProcessor();
const result = await processor.process('# Hello World\n\nThis is **docwise**.');

console.log(result.html);       // Rendered HTML
console.log(result.wordCount);  // 4
console.log(result.headings);   // [{ level: 1, text: 'Hello World' }]

// 2. Apply a design template
const css = getTemplateCSS('stripe', { fontSize: 16, isDark: false });

// 3. Create an iframe preview
const srcDoc = createIframeSrcDoc(result.html, css);
document.querySelector('iframe').srcdoc = srcDoc;
```

## API Reference

### `createMarkdownProcessor()`

Creates a reusable Markdown processor instance.

```typescript
const processor = createMarkdownProcessor();
const result: ParseResult = await processor.process(markdownString);
```

**Returns** an object with:
- `process(markdown: string): Promise<ParseResult>` -- parse Markdown and extract statistics

**`ParseResult`** shape:
| Field       | Type                                  | Description                    |
|-------------|---------------------------------------|--------------------------------|
| `html`      | `string`                              | Rendered HTML                  |
| `wordCount` | `number`                              | Approximate word count         |
| `charCount` | `number`                              | Total character count          |
| `lineCount` | `number`                              | Number of source lines         |
| `headings`  | `{ level: number; text: string }[]`   | Extracted heading hierarchy    |

### `getTemplateCSS(templateId, vars)`

Generate a complete CSS string for a template.

```typescript
const css = getTemplateCSS('apple', {
  fontSize: 18,
  lineHeight: 1.8,
  padding: 60,
  isDark: false,
  accent: '#0071E3',
});
```

### `TEMPLATES`

A `Record<string, TemplateConfig>` of all built-in templates:

| ID        | Name              | Color     | Accent    | Font                  |
|-----------|-------------------|-----------|-----------|-----------------------|
| `apple`   | Apple Premium     | `#000000` | `#0071E3` | SF Pro, Inter         |
| `stripe`  | Stripe Elegant    | `#635BFF` | `#00D7FF` | Inter                 |
| `linear`  | Linear Minimal    | `#5E6AD2` | `#8A94E9` | Inter                 |
| `vercel`  | Vercel Precise    | `#000000` | `#000000` | Geist, sans-serif     |
| `mistral` | Mistral French    | `#FF5917` | `#7C3AED` | Inter                 |
| `asome`   | Asome Emerald     | `#1A202C` | `#10B981` | Source Serif 4        |

### `getTemplateList()`

Returns `TemplateConfig[]` -- all templates as an array for UI rendering.

### `exportToPdf(htmlContent, options?)`

Export rendered HTML to a PDF Blob.

```typescript
const blob = await exportToPdf(result.html, {
  filename: 'report',
  template: TEMPLATES.stripe,
  templateVars: { fontSize: 16, isDark: false },
});
```

### `downloadPdf(htmlContent, options?)`

Convenience wrapper that calls `exportToPdf` and triggers a browser download.

### `generateFullHtml(content, mode, parsedHtml, options?)`

Generate a complete, self-contained HTML document.

```typescript
// Markdown mode
const html = generateFullHtml(mdSource, 'md', result.html, {
  template: TEMPLATES.apple,
  templateVars: { fontSize: 18 },
});

// HTML mode (raw HTML passthrough)
const html = generateFullHtml(htmlSource, 'html', '', {});
```

### `exportToMd(content, filename)`

Create a Markdown Blob for download.

```typescript
const blob = exportToMd('# My Doc', 'notes.md');
```

### `downloadMd(content, filename)`

Convenience wrapper that triggers a browser download.

### `createIframeSrcDoc(parsedHtml, templateCSS, lang?)`

Generate a full `<!DOCTYPE html>` string for iframe srcDoc.

```typescript
const srcDoc = createIframeSrcDoc(result.html, css, 'en');
iframe.srcdoc = srcDoc;
```

### `createHtmlIframeSrcDoc(htmlContent, templateCSS, lang?)`

Same as above, but for raw HTML content. Returns the content as-is if it is already a full document.

### `generateIframeStyles(template, vars?)`

Generate CSS for Markdown-mode iframe rendering.

### `generateIframeHtmlStyles(template, vars?)`

Generate CSS for HTML-mode iframe rendering.

## Templates

### Using a built-in template

```typescript
import { TEMPLATES, getTemplateCSS } from '@docwise/renderer';

const css = getTemplateCSS('stripe', { fontSize: 16 });
```

### Creating a custom template

```typescript
import type { TemplateConfig, TemplateVars } from '@docwise/renderer';
import { generateCSS as asomeCSS } from '@docwise/renderer/src/templates/asome';

const myTemplate: TemplateConfig = {
  id: 'custom',
  name: 'My Brand',
  color: '#1E1E2E',
  accent: '#F5A623',
  font: 'Georgia',
};

// Use the Asome base CSS with your accent/font
const css = asomeCSS({
  accent: myTemplate.accent,
  font: `${myTemplate.font}, serif`,
  fontSize: 18,
});
```

## PDF Export

```typescript
import { createMarkdownProcessor, exportToPdf, TEMPLATES } from '@docwise/renderer';

const processor = createMarkdownProcessor();
const result = await processor.process(markdownContent);

const pdfBlob = await exportToPdf(result.html, {
  filename: 'quarterly-report',
  template: TEMPLATES.apple,
  templateVars: { fontSize: 16, isDark: false, padding: 40 },
});

// Upload, save, or download the blob
```

## iframe Rendering

The iframe approach renders Markdown in an isolated environment with full CSS control:

```typescript
import {
  createMarkdownProcessor,
  generateIframeStyles,
  createIframeSrcDoc,
  TEMPLATES,
} from '@docwise/renderer';

const processor = createMarkdownProcessor();
const result = await processor.process(markdownContent);
const css = generateIframeStyles(TEMPLATES.stripe, { fontSize: 18, isDark: true });
const srcDoc = createIframeSrcDoc(result.html, css);

// In your framework:
// React:  <iframe srcDoc={srcDoc} />
// Vanilla: iframe.srcdoc = srcDoc;
// Vue:    <iframe :srcdoc="srcDoc" />
```

## Architecture

```
                  +-------------------+
                  |   Markdown Input  |
                  +--------+----------+
                           |
                  +--------v----------+
                  |  createMarkdown-  |
                  |  Processor()      |
                  |                   |
                  |  remark-parse     |
                  |  remark-gfm       |
                  |  remark-rehype    |
                  |  rehype-raw       |
                  |  rehype-highlight |
                  |  rehype-stringify |
                  +--------+----------+
                           |
                     ParseResult
                   (html, stats, headings)
                           |
          +----------------+----------------+
          |                |                |
  +-------v------+  +-----v------+  +------v------+
  | Templates    |  | exportPdf  |  | exportHtml  |
  | (6 built-in) |  | (jsPDF +   |  | (standalone |
  |              |  |  html2c.)  |  |  document)  |
  | getTemplate- |  +-----+------+  +------+------+
  | CSS()        |        |                |
  +-------+------+        |                |
          |          PDF Blob         HTML string
          |
  +-------v----------+
  | iframe/renderer  |
  | createIframeSrc- |
  | Doc()            |
  +------------------+
          |
    iframe srcDoc
```

## Types

```typescript
interface ParseResult {
  html: string;
  wordCount: number;
  charCount: number;
  lineCount: number;
  headings: { level: number; text: string }[];
}

interface TemplateConfig {
  id: string;
  name: string;
  color: string;
  accent: string;
  font: string;
}

interface TemplateVars {
  accent?: string;
  fontSize?: number;
  lineHeight?: number;
  padding?: number;
  isDark?: boolean;
  font?: string;
}

interface ExportOptions {
  filename?: string;
  template?: TemplateConfig;
  templateVars?: TemplateVars;
}
```

## License

MIT
