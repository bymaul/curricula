# Curricula

An offline-first PWA resume/CV builder featuring an immaculate classic Harvard
table-layout typography for clean print and PDF generation.

Everything runs client-side: your CV data lives in your browser
(IndexedDB, with a `localStorage` fallback), the editor works offline, and
printing to PDF uses your browser's own print engine - no accounts, no cloud
storage.

## Features

- **Multiple templates** - Harvard, Modern, and Minimal layouts with a visual
  template picker; all tuned for clean, precise A4 print/PDF output
- **Per-resume design** - accent color, font family, and line density settings
  that apply to the whole document
- **Offline-first PWA** - installable, service worker caching, editing and
  autosave work without a connection
- **AI CV parsing** - paste plain text or upload a PDF
  - extracts structured fields (name, contact, experience, education, skills…)
  - **scanned-PDF support** - text layers are rendered to page images and read
    with vision when a PDF has no selectable text
  - tolerant output: JSON salvage + repair re-prompts, with review warnings
    when fields can't be found
- **AI CV adjusting** - rewrite your CV to match a job description, for the
  entire CV or a single section, then review a summary of the changes before
  applying
- **Multi-resume management** - create, duplicate, rename, delete, and switch
  between resumes, plus a built-in example CV to start from
- **Undo, redo & version history** - every edit (including AI adjustments and
  imports) is undoable, with an in-session version history to restore earlier
  states
- **Section control & custom sections** - reorder, hide, and create custom
  sections per resume
- **PDF import & print** - import CVs from PDF (AI) and print or save as PDF
  from the browser
- **Backup & restore** - download every CV as a single backup file, or
  restore from one (data, section order, and visibility included); single-CV
  JSON export/import lives here too (paste JSON text or upload a file)
- **Share links** - share any CV as a compressed link; the data travels in the
  URL itself and is opened as a new resume on the recipient's device
- **UI languages** - English and Bahasa Indonesia interface, plus per-resume
  language setting
- **Light & dark theme** - system-aware theme toggle with no flash on load
- **Keyboard shortcuts** - undo, redo, save, and print

## Stack

- [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript
- [Zustand](https://zustand.docs.pmnd.rs) + `persist` for state
- [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev)
- [Base UI](https://base-ui.com) primitives, [Tailwind CSS v4](https://tailwindcss.com)
- [Serwist](https://serwist.pages.dev) service worker
- [AI SDK](https://ai-sdk.dev) with Google/OpenAI/Anthropic providers
- [pdf.js](https://mozilla.github.io/pdf.js) for PDF text + page-image extraction
- [Vitest](https://vitest.dev) for unit tests and
  [Playwright](https://playwright.dev) for E2E tests (see [Testing](#testing))

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

| Variable               | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `AI_API_KEY`           | Server-side AI key used as a fallback for users without their own key                |
| `AI_PROVIDER`          | Provider for the bundled key: `openai` \| `anthropic` \| `google` (default `google`) |
| `AI_MODEL`             | Optional model override (defaults to the provider default)                           |
| `AI_ENFORCE_ORIGIN`    | Reject AI requests with a mismatched `Origin` header (default `true`)                |
| `AI_ALLOWED_ORIGINS`   | Comma-separated extra origins allowed through the origin gate                        |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin used for SEO tags (canonical URL, Open Graph, sitemap)         |

The bundled key is read only in server route handlers and never sent to the
browser. Users can also supply their own key in **AI Settings**; that key is
stored in the browser and sent to the same-origin API routes.

### AI providers

- **Google** - `gemini-3-flash-preview` (default)
- **OpenAI** - `gpt-5.6-luna`
- **Anthropic** - `claude-haiku-4-5`

## Scripts

```bash
pnpm dev            # development server
pnpm build          # production build
pnpm start          # serve the production build
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm format:check   # prettier --check
pnpm test           # vitest run
pnpm test:coverage  # vitest run with a coverage gate (lib/**)
pnpm test:e2e       # playwright E2E tests
pnpm test:e2e:ui    # playwright E2E tests in interactive UI mode
```

## Testing

Unit tests live next to their modules (`lib/*.test.ts`, `store/*.test.ts`).
E2E tests live in `e2e/` and run against a production build with Playwright
(Chromium). The CI workflow runs lint, formatting, type check, unit tests, the
coverage gate, a production build, and the E2E suite.

The coverage gate requires 80% lines/functions/statements and 70% branches
across `lib/**`.

## API routes

- `POST /api/parse-cv` - parse resume text and/or page images into `CVData`
- `POST /api/adjust-cv` - rewrite `CVData` to match a job description
- `GET /api/ai-status` - report whether a bundled key exists and which
  provider/model is active

The POST routes return `{ data, warnings }` and enforce payload validation and
a simple per-IP rate limit.

## Deployment

Push to `main`; GitHub Actions runs CI and Vercel deploys previews and
production automatically (GitHub branch protection requires the CI checks to
pass).
