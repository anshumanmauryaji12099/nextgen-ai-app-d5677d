# NEXTGEN AI — Product roadmap

NEXTGEN AI is an all-in-one AI workspace (chat, images, study, code, documents,
research, tasks) delivered as an installable PWA for Android and desktop.
It is being built in milestones. Each one is small, self-contained and ships
something a user can see.

## ✅ Milestone 1 — Product surface, navigation and PWA foundation

- Branded landing page, dark/light themes, desktop sidebar + mobile bottom nav.
- **Chat**: multiple conversations, history grouped by date, rename/delete,
  copy, regenerate, stop, streaming, markdown + code highlighting, file/image
  attachments (validated), voice input (Web Speech API), five assistant modes.
  Replies come from a clearly-labelled demo engine.
- **Study** and **Code** workspaces that launch structured requests into chat
  (difficulty, English/Hindi, tool presets, code file loading).
- **Image Studio** UI (generate, edit, remove background, enhance, variations,
  gallery/history tabs). It says plainly that no image model is connected.
- **Tasks**: live list of chats currently replying (real) + sample task queue.
- **Settings**: theme, AI connection status, install/update, export/delete data.
- **PWA**: manifest, icons, splash, service worker with per-build version,
  offline app shell, “Update now” prompt, install button that hides once
  installed. Capacitor/TWA instructions in `docs/android.md`.

Stubbed data lives in `src/lib/fixtures.ts` and `src/lib/demo-engine.ts`.
Conversations are stored in the browser (`src/lib/chat-store.ts`).

## Milestone 2 — Accounts and synced history

- Netlify Identity sign-up/login (email + Google), protected API routes.
- Netlify Database (Drizzle) tables: `users`, `conversations`, `messages`,
  `usage_events`, `images`, `tasks`; every query scoped to the signed-in user.
- Move `chat-store` persistence to the database behind the same API; one-time
  import of a device's local conversations after first login.
- Guest mode keeps working with local storage.

## Milestone 3 — Live AI and secure backend

- `POST /api/chat` server route streaming tokens via Netlify AI Gateway
  (Anthropic / OpenAI / Gemini), selected by `AI_TEXT_PROVIDER`.
- Replace `streamDemoReply` with a fetch-stream client implementing the same
  `StreamReply` contract; AbortController drives Stop.
- Zod request validation, per-user + per-IP rate limits, daily quotas recorded
  in `usage_events`, friendly errors when a provider is down.
- `/api/status` feeds `PROVIDER_STATUS` (demo vs live) to the UI.
- Mode-specific system prompts (study, code, docs, research).

## Milestone 4 — Study and coding depth

- Interactive quiz mode UI with scoring, MCQ answer reveal, saved notes.
- Hindi-first prompts and output checks; difficulty-aware explanations.
- Code: syntax-aware formatting, multi-file analysis, safe-generation guardrails.

## Milestone 5 — Image Studio and file analysis

- ✅ `/api/images` using `gemini-3.1-flash-image` through AI Gateway: generate,
  edit, variations (2 per run), enhance, background removal.
- ✅ Server-side upload validation (type, 10 MB); results stored in Netlify
  Blobs (`studio-images`) with records in the `images` table; history + saved
  gallery, download, delete, "edit this image". Rolling 24 h quota: 10 per
  device, 30 per network. Scoped to an anonymous device id until milestone 2
  (then re-key `device_id` → user id).
- Document extraction (PDF/DOCX/TXT) for chat attachments and Study material.

## Milestone 6 — Multitasking

- Server-side task records with status/progress/error/result.
- Long jobs (big documents, batches of images) on Netlify Background Functions;
  the Tasks screen polls or streams progress. Replace `SAMPLE_TASKS`.

## Milestone 7 — Hardening

- Offline queue for messages typed while offline; IndexedDB for large history.
- Security review (CSP, auth on every route), Lighthouse/perf budget for
  low-end Android, accessibility audit, automated tests for core flows.

## Milestone 8 — Launch

- Custom domain, production env vars, monitoring.
- Optional Play Store release via Bubblewrap (TWA) or Capacitor (`docs/android.md`).
