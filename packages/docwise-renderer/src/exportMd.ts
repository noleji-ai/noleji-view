/**
 * Create a downloadable Blob from raw Markdown content.
 *
 * @param content  - The raw Markdown source text
 * @param filename - Desired filename (`.md` extension appended if missing)
 * @returns A `Blob` of type `text/markdown;charset=utf-8`
 *
 * @example
 * ```ts
 * const blob = exportToMd('# Hello World', 'readme.md');
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'readme.md';
 * a.click();
 * ```
 */
export function exportToMd(content: string, filename: string): Blob {
  return new Blob([content], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Convenience: export Markdown and trigger a browser download.
 */
export function downloadMd(content: string, filename: string): void {
  const blob = exportToMd(content, filename);
  const safeName = filename.endsWith('.md') ? filename : `${filename}.md`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.click();
  URL.revokeObjectURL(url);
}
