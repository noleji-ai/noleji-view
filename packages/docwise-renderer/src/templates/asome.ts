import type { TemplateVars } from '../types';

/**
 * Asome Emerald template -- the full ~250-line CSS extracted from
 * docwise App.tsx `iframeMdStyles`.  All other templates derive from
 * this base with color / font overrides.
 */
export function generateCSS(vars: TemplateVars): string {
  const accent = vars.accent ?? '#10B981';
  const font = vars.font ?? "'Source Serif 4', serif";
  const fontSize = vars.fontSize ?? 18;
  const lh = vars.lineHeight ?? 1.8;
  const padding = vars.padding ?? 60;
  const dark = vars.isDark ?? false;

  const bg = dark ? '#1A202C' : '#FFFFFF';
  const fg = dark ? '#E2E8F0' : '#2D3748';
  const fgStrong = dark ? '#F7FAFC' : '#1A202C';
  const dimFg = dark ? '#A0AEC0' : '#718096';
  const subtleBg = dark ? '#2D3748' : '#F7FAFC';
  const borderClr = dark ? '#4A5568' : '#E2E8F0';
  const codeBg = dark ? '#0D1117' : '#1A202C';

  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: ${font};
  font-size: ${fontSize}px;
  line-height: ${lh};
  color: ${fg};
  background: ${bg};
  padding: ${padding}px;
  -webkit-font-smoothing: antialiased;
  word-break: keep-all;
  overflow-wrap: break-word;
}
::selection { background: ${accent}30; }

/* -- H1 -- */
h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 900; font-size: 2.6em; letter-spacing: -0.04em;
  color: ${fgStrong};
  border-bottom: 4px solid ${accent}; padding-bottom: 20px; margin-bottom: 32px; line-height: 1.15;
}
h1 + p::first-letter {
  font-size: 3em; font-weight: 700; float: left; line-height: 1;
  margin-right: 8px; margin-top: 4px; color: ${accent}; font-family: 'Inter', sans-serif;
}

/* -- H2 -- */
h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 800; font-size: 1.7em; letter-spacing: -0.03em;
  color: ${fgStrong};
  margin-top: 48px; margin-bottom: 16px;
  padding-bottom: 10px; border-bottom: 1px solid ${borderClr};
  display: flex; align-items: center;
}
h2::before {
  content: ""; width: 5px; height: 0.85em; background: ${accent};
  margin-right: 14px; border-radius: 3px; flex-shrink: 0;
}

/* -- H3 -- */
h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 700; font-size: 1.3em;
  color: ${fgStrong};
  margin-top: 36px; margin-bottom: 12px;
  display: flex; align-items: center;
}
h3::before {
  content: ""; width: 3px; height: 0.7em; background: ${accent}60;
  margin-right: 10px; border-radius: 2px; flex-shrink: 0;
}

/* -- H4 -- */
h4 {
  font-family: 'Inter', sans-serif;
  font-weight: 700; font-size: 0.88em;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: ${dimFg};
  margin-top: 28px; margin-bottom: 10px;
  display: flex; align-items: center;
}
h4::before {
  content: "●"; margin-right: 8px; color: ${accent}; font-size: 0.5em;
}

/* -- H5 -- */
h5 {
  font-family: 'Inter', sans-serif;
  font-weight: 700; font-size: 0.8em;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: ${dimFg}; opacity: 0.8;
  margin-top: 24px; margin-bottom: 8px;
}

/* -- H6 -- */
h6 {
  font-family: 'Inter', sans-serif;
  font-weight: 600; font-size: 0.75em;
  text-transform: uppercase; letter-spacing: 0.15em;
  color: ${dimFg}; opacity: 0.6;
  margin-top: 20px; margin-bottom: 6px;
}

/* -- Paragraph -- */
p { margin-bottom: 1.2em; line-height: ${lh}; }

/* -- Emphasis -- */
strong { color: ${fgStrong}; font-weight: 700; }
em { font-style: italic; color: ${dimFg}; }
del { text-decoration: line-through; color: ${dimFg}; opacity: 0.5; }

/* -- Links -- */
a { color: ${accent}; text-decoration: none; border-bottom: 1px solid ${accent}40; transition: all 0.2s; font-weight: 500; }
a:hover { border-bottom-color: ${accent}; }

/* -- Horizontal rule -- */
hr {
  border: none; height: 2px; margin: 2.5em 0; border-radius: 1px;
  background: linear-gradient(to right, transparent, ${accent}50, transparent);
}

/* -- Blockquote -- */
blockquote {
  margin: 1.5em 0; padding: 1em 1.5em;
  background: ${dark ? '#2D374820' : 'linear-gradient(135deg, #F0FFF4 0%, #F7FAFC 100%)'};
  border-left: 4px solid ${accent}; border-radius: 0 14px 14px 0;
  color: ${dimFg}; font-style: italic;
}
blockquote p { margin: 0; }
blockquote p + p { margin-top: 0.6em; }
blockquote blockquote {
  opacity: 0.75; border-left-color: ${accent}60;
  background: ${dark ? '#1A202C40' : '#F7FAFC'};
  margin-top: 0.8em;
}

/* -- Unordered list -- */
ul { margin: 1em 0 1.5em; padding-left: 0; list-style: none; }
ul > li { position: relative; padding-left: 1.5em; margin-bottom: 0.45em; line-height: 1.7; }
ul > li::before { content: '\\2726'; position: absolute; left: 0; color: ${accent}; font-size: 0.65em; top: 0.5em; }

/* -- Ordered list -- */
ol { margin: 1em 0 1.5em; padding-left: 0; list-style: none; counter-reset: ol-counter; }
ol > li { position: relative; padding-left: 2.2em; margin-bottom: 0.45em; line-height: 1.7; counter-increment: ol-counter; }
ol > li::before {
  content: counter(ol-counter); position: absolute; left: 0; top: 0.1em;
  width: 1.5em; height: 1.5em; background: ${fgStrong}; color: ${bg};
  border-radius: 50%; font-size: 0.72em; font-weight: 700;
  display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
}

/* -- Checklist -- */
ul:has(> li > input[type="checkbox"]) > li { padding-left: 0.5em; }
ul:has(> li > input[type="checkbox"]) > li::before { display: none; }
input[type="checkbox"] {
  appearance: none; width: 17px; height: 17px;
  border: 2px solid ${borderClr}; border-radius: 4px;
  vertical-align: middle; margin-right: 8px; position: relative;
  cursor: default; transition: all 0.2s;
}
input[type="checkbox"]:checked { background: ${accent}; border-color: ${accent}; }
input[type="checkbox"]:checked::after {
  content: '\\2713'; color: white; font-size: 11px; font-weight: 700;
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
}

/* -- Inline code -- */
code:not(pre code) {
  font-family: 'JetBrains Mono', monospace; font-size: 0.86em;
  background: ${dark ? '#2D3748' : '#EDF2F7'}; color: ${dark ? '#FC8181' : '#E53E3E'};
  padding: 0.15em 0.5em; border-radius: 6px; font-weight: 500;
  border: 1px solid ${borderClr};
}

/* -- Code block -- */
pre {
  margin: 1.5em 0; border-radius: 14px; overflow: hidden; position: relative;
  background: ${codeBg}; border: 1px solid ${dark ? '#30363D' : '#2D3748'};
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
pre code {
  display: block; padding: 1.2em 1.5em; padding-top: 2.2em;
  font-family: 'JetBrains Mono', monospace; font-size: 0.86em; line-height: 1.7;
  color: #E2E8F0; overflow-x: auto; background: transparent;
  border: none;
}
/* Language label */
pre code[class*="language-"]::before,
pre code[class*="hljs"]::before {
  position: absolute; top: 0; right: 0;
  padding: 3px 12px; font-size: 0.65em; font-weight: 700;
  background: ${accent}; color: white; border-radius: 0 14px 0 8px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
pre code.language-typescript::before, pre code.hljs.language-typescript::before { content: "TypeScript"; }
pre code.language-javascript::before, pre code.hljs.language-javascript::before { content: "JavaScript"; }
pre code.language-python::before, pre code.hljs.language-python::before { content: "Python"; }
pre code.language-html::before, pre code.hljs.language-html::before { content: "HTML"; }
pre code.language-css::before, pre code.hljs.language-css::before { content: "CSS"; }
pre code.language-json::before, pre code.hljs.language-json::before { content: "JSON"; }
pre code.language-bash::before, pre code.hljs.language-bash::before { content: "Bash"; }
pre code.language-sql::before, pre code.hljs.language-sql::before { content: "SQL"; }
pre code.language-yaml::before, pre code.hljs.language-yaml::before { content: "YAML"; }
pre code.language-markdown::before, pre code.hljs.language-markdown::before { content: "Markdown"; }
pre code.language-go::before, pre code.hljs.language-go::before { content: "Go"; }
pre code.language-rust::before, pre code.hljs.language-rust::before { content: "Rust"; }
pre code.language-java::before, pre code.hljs.language-java::before { content: "Java"; }

/* hljs syntax colors */
.hljs-keyword { color: #B794F4; }
.hljs-string { color: #68D391; }
.hljs-number { color: #F6AD55; }
.hljs-comment { color: #718096; font-style: italic; }
.hljs-function, .hljs-title { color: #63B3ED; }
.hljs-built_in, .hljs-type { color: #F6AD55; }
.hljs-literal { color: #FC8181; }
.hljs-attr { color: #B794F4; }
.hljs-variable, .hljs-params { color: #E2E8F0; }
.hljs-meta { color: #718096; }
.hljs-property { color: #63B3ED; }

/* -- Table -- */
table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  margin: 1.5em 0; font-size: 0.92em; overflow: hidden;
  border-radius: 12px; border: 1px solid ${borderClr};
  font-family: 'Inter', sans-serif;
}
thead { background: ${subtleBg}; }
th {
  padding: 12px 16px; text-align: left; font-weight: 700;
  color: ${fgStrong}; border-bottom: 2px solid ${borderClr};
  font-size: 0.82em; text-transform: uppercase; letter-spacing: 0.05em;
}
td { padding: 12px 16px; border-bottom: 1px solid ${dark ? '#2D3748' : '#EDF2F7'}; color: ${dimFg}; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: ${dark ? '#2D374830' : '#F0FFF4'}; transition: background 0.15s; }

/* -- Image -- */
img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid ${borderClr}; }

/* -- Print -- */
@media print {
  @page { margin: 2cm; size: A4; }
  body { font-size: 12pt !important; color: #000 !important; background: #fff !important; padding: 0 !important; }
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; color: #000 !important; }
  h1 { border-bottom-color: #000 !important; }
  h2::before, h3::before { background: #000 !important; }
  pre, blockquote, table, img { page-break-inside: avoid; }
  pre { background: #F7FAFC !important; border: 1px solid #E2E8F0 !important; box-shadow: none !important; }
  pre code { color: #1A202C !important; }
  a { color: #000 !important; text-decoration: underline !important; }
  a[href]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: #666; }
  img { box-shadow: none !important; }
}
`.trim();
}
