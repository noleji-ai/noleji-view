# Noleji View

Launch-ready Markdown and HTML workspace for writing, previewing, exporting, and turning document folders into navigable knowledge.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vite.dev)
[![Electron](https://img.shields.io/badge/Electron-33-47848f.svg)](https://www.electronjs.org/)

Demo: https://noleji.synology.me/apps/noleji-view

Repository: https://github.com/noleji-ai/noleji-view

## What It Does

- Markdown and HTML editing with live preview, GFM tables, checklists, code blocks, and export-ready rendering.
- Six document design styles: Apple, Stripe, Linear, Vercel, Mistral, and Asome.
- Local-first workspace with folders, file import, search, autosave, recent external documents, and cloud-ready sync state.
- macOS desktop app packaged as a `.dmg`, with `.md`, `.markdown`, `.html`, and `.htm` file associations.
- First-run desktop tutorial for opening files, choosing a design style, and setting Noleji View as the default app.
- Karpathy Wiki-style knowledge generation that creates a `_지식체계` folder with `index.md`, `_overview.md`, `_entities.md`, `_concepts.md`, and `log.md`.
- Wiki usage guide now opens as a centered modal with backdrop, close button, Esc close, and internal scrolling so the full guide remains visible.
- Export to Markdown, standalone HTML, PDF, viewer windows, and share links.

## Plans

| Plan | Price | Included |
| --- | ---: | --- |
| Free | ₩0 | Markdown/HTML editing, local workspace, cloud-ready backup after sign-in, 3 folders, 10 files per folder, 2 design templates, 10 premium actions per day |
| Monthly | ₩5,000/month | Unlimited folders and files, 6 design templates, unlimited PDF/HTML export, Managed AI + Wiki generation, account-based share links |
| Lifetime | ₩30,000 once | Monthly features, custom design templates, priority support, early access, lifetime updates |

## macOS Build

The desktop build uses:

- Product name: `Noleji View`
- Bundle id: `com.noleji.view`
- Artifact: `Noleji-View-1.0.0-arm64.dmg`
- Document types: Markdown and HTML as viewer associations
- Ad-hoc signed `.dmg` distribution with a Korean getting-started guide and right-click Open instructions

## Development

```bash
cd app
npm install
npm run dev
```

The web app runs at `http://localhost:5173/`.

For the desktop build:

```bash
cd desktop
npm install
npm run build
npm run package:dmg
```

The DMG packaging script rebuilds the app bundle from `app/dist`, keeps `app/dist/downloads` out of the Electron resources, ad-hoc signs the app, creates a UDZO image, verifies it with `hdiutil`, and performs a quarantine simulation.

## Project Layout

```text
noleji-view/
  app/       React + Vite application
  desktop/   Electron shell, file associations, DMG packaging
```

## License

[MIT](LICENSE)
