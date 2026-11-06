# NEXTGEN AI

An all-in-one AI workspace — chat assistant, image studio, study tutor, coding
assistant, document and research helpers, and a task manager — built as an
installable Progressive Web App that feels native on Android phones and works
beautifully on desktop.

## What works today

- **Landing page** (`/`) introducing the product.
- **Chat** (`/chat`): multiple conversations with history, rename/delete,
  streaming replies with Stop and Regenerate, copy, markdown with highlighted
  code, file and image attachments (validated, max 10 MB, 5 per message), voice
  input on supported browsers, and five assistant modes (Assistant, Study, Code,
  Docs, Research).
- **Study** (`/study`): explain, solve maths, science, practice questions, MCQs,
  notes, chapter help and quiz mode, with Easy/Medium/Hard and English/हिन्दी.
- **Code** (`/code`): explain, debug, format, generate and plan; open a code file
  to load it.
- **Image Studio** (`/studio`): generate/edit/remove background/enhance/variations
  interface with inspiration gallery and downloads.
- **Tasks** (`/tasks`): see every chat currently replying and stop it; task queue preview.
- **Settings** (`/settings`): theme, AI status, install, updates, export/delete data.
- **PWA**: install to home screen, splash screen, offline pages, automatic new
  version detection with an **Update now** button. Chats are kept across updates.

> **Demo mode.** No AI provider is connected yet. Chat replies are clearly
> labelled sample text, and Image Studio states that nothing was generated. Live
> AI arrives in milestone 3 (see [PLAN.md](PLAN.md)).

## Tech stack

TanStack Start (React 19, file-based routing, SSR) · Vite 8 · Tailwind CSS 4 ·
shadcn/ui (Radix) · lucide icons · react-markdown + highlight.js · a hand-written
service worker · Netlify (hosting, Image CDN; AI Gateway, Identity, Database and
Blobs in later milestones).

## Run locally

```bash
pnpm install
netlify dev          # or: pnpm dev  (Vite on :3000)
```

The service worker only registers in production builds, so test install/offline
/update behaviour on a deploy preview or with `pnpm build && pnpm preview`.

## Configuration

Nothing is required to open the app. See [`.env.example`](.env.example) for the
variables later milestones use; keys are only read server-side.

## Deploy

Push to the connected Git branch — Netlify builds with `vite build` and publishes
`dist/client` (see `netlify.toml`). Each build stamps a new version into the
service worker so installed apps are offered the update.

## Android

Install the PWA from Chrome, or build an APK with Bubblewrap (TWA) or Capacitor —
step-by-step in [docs/android.md](docs/android.md).

## Roadmap

1. ✅ Product surface, navigation and PWA foundation
2. Accounts (Netlify Identity) and synced history (Netlify Database)
3. Live AI through a secure streaming backend, rate limits and usage tracking
4. Deeper study and coding tools (quiz scoring, multi-file analysis)
5. Real image generation/editing and document analysis (Blobs + Image CDN)
6. Server-side multitasking with background jobs
7. Offline queue, security, performance and accessibility hardening
8. Production launch and optional Play Store APK

Details in [PLAN.md](PLAN.md).
