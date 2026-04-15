/**
 * Result of parsing a Markdown string through the unified pipeline.
 */
export interface ParseResult {
  /** The rendered HTML string */
  html: string;
  /** Number of words (approximate, after stripping MD syntax) */
  wordCount: number;
  /** Total character count of the raw source */
  charCount: number;
  /** Number of lines in the raw source */
  lineCount: number;
  /** Extracted heading hierarchy */
  headings: { level: number; text: string }[];
}

/**
 * A design template configuration defining colors and font family.
 */
export interface TemplateConfig {
  /** Unique template identifier (e.g. 'apple', 'stripe') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Primary / base color (hex) */
  color: string;
  /** Accent color used for highlights, links, decorations (hex) */
  accent: string;
  /** CSS font-family string */
  font: string;
}

/**
 * Variables that control the rendering output for a given template.
 * These are typically user-configurable (font size, dark mode, etc.).
 */
export interface TemplateVars {
  /** Accent color override (hex). Falls back to template accent when omitted. */
  accent?: string;
  /** Base font size in pixels. Default: 18 */
  fontSize?: number;
  /** Line height multiplier. Default: 1.8 */
  lineHeight?: number;
  /** Document body padding in pixels. Default: 60 */
  padding?: number;
  /** Whether to render in dark mode. Default: false */
  isDark?: boolean;
  /** CSS font-family override */
  font?: string;
}

/**
 * Options for the various export functions.
 */
export interface ExportOptions {
  /** Output filename (without extension for PDF; with for MD/HTML) */
  filename?: string;
  /** Template to apply for styling */
  template?: TemplateConfig;
  /** Template variable overrides */
  templateVars?: TemplateVars;
}
