# AGENTS.md

Guide for AI agents and developers working on **NEXTGEN AI**, an all-in-one AI
workspace PWA. **Read [PLAN.md](PLAN.md) first** — it is the roadmap. Milestone 1
(product surface + PWA) is done; continue with the next unchecked milestone.

## Stack

TanStack Start (React 19, SSR, file routes) · Vite 8 · Tailwind 4 (tokens in
`src/styles.css`) · shadcn/ui in `src/components/ui` · lucide-react · sonner ·
react-markdown + remark-gfm + rehype-highlight · Netlify.

## Layout

```
pwa/sw.js                 Service-worker TEMPLATE (not served directly)
public/                   manifest.webmanifest, offline.html, icons/, img/ (sample art)
src/routes/
  __root.tsx              <head> (manifest, fonts, theme boot script), ClientBoot
  index.tsx               Landing page
  _app.tsx                App shell: desktop sidebar, mobile top bar + bottom nav
  _app/chat.tsx           Chat (search params: c, new, mode)
  _app/study.tsx          Study workspace → launches a study-mode chat
  _app/code.tsx           Coding workspace → launches a code-mode chat
  _app/studio.tsx         Image Studio
  _app/tasks.tsx          Task manager
  _app/settings.tsx       Settings
src/components/chat/      composer, message, markdown, mode-icon
src/components/shell/     nav, conversation-list, theme-toggle, status-pill, install-button
src/lib/
  fixtures.ts             ALL stubbed data (modes, samples, tasks, PROVIDER_STATUS)
  demo-engine.ts          Demo reply streamer; `StreamReply` is the contract for the real API
  chat-store.ts           Conversations store (localStorage), concurrent replies, stop/regenerate
  external-store.ts       Tiny useSyncExternalStore helper
  theme.ts                Theme preference (dark default) + no-flash boot script
  files.ts                Upload validation (types, 10 MB, 5 files)
  launch.ts               useLaunchAssistant(mode, prompt) → new chat
  studio-shared.ts        Image Studio types + limits (client & server)
  studio-client.ts        Device id + fetch client for /api/images
src/server/images.ts      Server-only: Gemini via AI Gateway, Blobs, quotas
src/routes/api/images*.ts GET list / POST create; GET bytes / PATCH saved / DELETE
db/schema.ts, db/index.ts Drizzle schema (`images`) + client; migrations in netlify/database/migrations
src/pwa/pwa-store.ts      SW registration, update detection/apply, install prompt state
docs/android.md           PWA install, Bubblewrap TWA, Capacitor APK
capacitor.config.json     Capacitor wrapper pointing at the deployed site
```

## Non-obvious decisions

- **Service worker versioning**: `vite.config.ts` (`nextgenServiceWorker`) reads
  `pwa/sw.js`, injects `BUILD_VERSION` and the hashed client asset list, and emits
  `/sw.js` in the client build. Every deploy = new worker bytes = update detected.
  The same version is exposed as `__APP_VERSION__` (`src/env.d.ts`).
- Updates wait for the user: the waiting worker gets `SKIP_WAITING` only from
  **Update now**; the page reloads on `controllerchange` only after that click.
- The SW never caches `/api/*`, `/_serverFn*` or `/.netlify/functions*`.
  Navigations are network-first with per-route cached shells, then `offline.html`.
- SW registers only when `import.meta.env.PROD`.
- Client-only systems (theme, chats, PWA) start in `ClientBoot` `useEffect` to
  avoid hydration mismatches. Never read localStorage during render.
- Honesty rules (from the product brief): never fake AI or image results; show
  "Demo mode" while `PROVIDER_STATUS.demo`; never promise unlimited usage.
- Study/Code screens don't have their own engines — they compose prompts and
  open a chat in the matching mode.
- Images under `public/img` are served via Netlify Image CDN
  (`/.netlify/images?url=…&w=…&fm=webp`).

## Swapping stubs for real services

- Chat: replace `streamReply` in `chat-store.ts` with a client for `/api/chat`
  that implements `StreamReply`. Move persistence to Netlify Database per user.
- Status: replace `PROVIDER_STATUS` with data from a server endpoint.
- Studio: **live** (milestone 5). Records are keyed by an anonymous
  `x-device-id` (localStorage `nextgen.device-id`); swap for the user id when
  accounts land. Image bytes are served by unguessable UUID at `/api/images/:id`.
  Failures show the "No image was created" alert with the server's message.
- Install packages with **pnpm** (npm errors on this lockfile). Never apply
  migrations yourself; generate with `npx drizzle-kit generate --name …`.
- Tasks: replace `SAMPLE_TASKS` with server task records.

## Conventions

- Use theme tokens (`bg-primary`, `text-muted-foreground`, `glass`, `aurora`),
  not raw colours. `font-display` for headings.
- Components PascalCase, hooks/utils camelCase, `@/` imports.
- Icon-only buttons need `aria-label`; respect `motion-reduce`.
- TypeScript is strict with no unused locals.
