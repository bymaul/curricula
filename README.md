# Curricula

An offline-first PWA resume/CV builder featuring an immaculate classic Harvard
table-layout typography for clean print and PDF generation.

Everything runs client-side: your CV data lives in `localStorage`, the editor
works offline, and printing to PDF uses your browser's own print engine — no
accounts, no cloud storage.

## Features

- **Harvard-style template** — classic table-layout typography tuned for clean,
  precise print/PDF output (A4)
- **Offline-first PWA** — installable, service worker caching, editing and
  autosave work without a connection
- **AI CV parsing** — paste plain text or upload a PDF
  - extracts structured fields (name, contact, experience, education, skills…)
  - **scanned-PDF support** — text layers are rendered to page images and read
    with vision when a PDF has no selectable text
  - tolerant output: JSON salvage + repair re-prompts, with review warnings
    when fields can't be found
- **AI CV adjusting** — rewrite your CV to match a job description, then review
  a summary of the changes before applying
- **Multi-resume management** — create, duplicate, rename, delete, and switch
  between resumes
- **Undo, redo & version history** — every edit (including AI adjustments and
  imports) is undoable, with an in-session version history to restore earlier
  states
- **Section control** — reorder and hide sections per resume
- **Import/export** — JSON backup, PDF import, JSON export, browser print
- **Backup & restore** — download every CV as a single backup file, or restore
  from one (data, section order, and visibility included)
- **Share links** — share any CV as a compressed link; the data travels in the
  URL itself and is opened as a new resume on the recipient's device

## Stack

- [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript
- [Zustand](https://zustand.docs.pmnd.rs) + `persist` for state
- [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev)
- [Base UI](https://base-ui.com) primitives, [Tailwind CSS v4](https://tailwindcss.com)
- [Serwist](https://serwist.pages.dev) service worker
- [AI SDK](https://ai-sdk.dev) with Google/OpenAI/Anthropic providers
- [pdf.js](https://mozilla.github.io/pdf.js) for PDF text + page-image extraction
- [Vitest](https://vitest.dev) for unit tests (see [Testing](#testing))

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

| Variable      | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| `AI_API_KEY`  | Server-side AI key used as a fallback for users without their own key                |
| `AI_PROVIDER` | Provider for the bundled key: `openai` \| `anthropic` \| `google` (default `google`) |
| `AI_MODEL`    | Optional model override (defaults to the provider default)                           |

The bundled key is read only in server route handlers and never sent to the
browser. Users can also supply their own key in **AI Settings**; that key is
stored in the browser and sent to the same-origin API routes.

### AI providers

- **Google** — `gemini-3-flash-preview` (default)
- **OpenAI** — `gpt-5.6-luna`
- **Anthropic** — `claude-haiku-4-5`

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
```

## Testing

Unit tests live next to their modules (`lib/*.test.ts`). The CI workflow runs
lint, formatting, type check, tests, and a coverage gate (80% lines/functions/
statements, 70% branches across `lib/**`).

## API routes

- `POST /api/parse-cv` — parse resume text and/or page images into `CVData`
- `POST /api/adjust-cv` — rewrite `CVData` to match a job description

Both return `{ data, warnings }` and enforce payload validation and a simple
per-IP rate limit.

## Deployment

Push to `main`; GitHub Actions runs CI and Vercel deploys previews and
production automatically (GitHub branch protection requires the CI checks to
pass).
