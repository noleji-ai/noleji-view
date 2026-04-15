import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ExportOptions } from './types';
import { getTemplateCSS } from './templates';

/**
 * Export rendered HTML content to a PDF blob using html2canvas + jsPDF.
 *
 * This is a pure function with no React dependency.  It creates a temporary
 * off-screen container, renders the HTML into it with the template CSS,
 * captures it as a canvas, and produces a multi-page A4 PDF.
 *
 * @param htmlContent - The rendered HTML body content (e.g. from pipeline.process())
 * @param options - Export options (filename, template, templateVars)
 * @returns A Promise that resolves to a PDF Blob
 *
 * @example
 * ```ts
 * const blob = await exportToPdf(result.html, {
 *   filename: 'my-doc',
 *   template: TEMPLATES.stripe,
 *   templateVars: { fontSize: 16 },
 * });
 * // Download it
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'my-doc.pdf';
 * a.click();
 * ```
 */
export async function exportToPdf(
  htmlContent: string,
  options: ExportOptions = {},
): Promise<Blob> {
  const {
    template,
    templateVars = {},
  } = options;

  // Build CSS
  const templateId = template?.id ?? 'asome';
  const vars = {
    accent: template?.accent,
    font: template?.font ? `${template.font}, 'Source Serif 4', serif` : undefined,
    ...templateVars,
  };
  const css = getTemplateCSS(templateId, vars);

  // Create an off-screen container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;z-index:-1;';
  container.innerHTML = `<style>${css}</style><div style="padding:${vars.padding ?? 60}px">${htmlContent}</div>`;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convenience: export to PDF and trigger a browser download.
 */
export async function downloadPdf(
  htmlContent: string,
  options: ExportOptions = {},
): Promise<void> {
  const blob = await exportToPdf(htmlContent, options);
  const filename = (options.filename ?? 'document').replace(/\.pdf$/i, '') + '.pdf';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
