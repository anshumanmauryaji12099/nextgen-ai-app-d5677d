import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpenText,
  Code2,
  GraduationCap,
  ImagePlus,
  KeyRound,
  ListChecks,
  MessageSquare,
  Mic,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Telescope,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { Brand, BrandMark } from '@/components/brand'
import { InstallButton } from '@/components/shell/install-button'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { Button } from '@/components/ui/button'
import { SAMPLE_GALLERY } from '@/lib/fixtures'

export const Route = createFileRoute('/')({
  component: Home,
})

const cdn = (src: string, w: number) =>
  `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}&fm=webp`

const MODULES: {
  icon: LucideIcon
  title: string
  body: string
  to: '/chat' | '/studio' | '/study' | '/code' | '/tasks'
}[] = [
  {
    icon: MessageSquare,
    title: 'AI Chat',
    body: 'Streaming answers, markdown and code, file and image attachments, voice input — with every conversation saved.',
    to: '/chat',
  },
  {
    icon: ImagePlus,
    title: 'Image Studio',
    body: 'Text-to-image, photo edits, background removal, enhancement and variations, with a personal gallery.',
    to: '/studio',
  },
  {
    icon: GraduationCap,
    title: 'Study Assistant',
    body: 'Step-by-step explanations, math solutions, MCQs, notes and quizzes — in English or Hindi, Easy to Hard.',
    to: '/study',
  },
  {
    icon: Code2,
    title: 'Coding Assistant',
    body: 'Explain, debug and format HTML, CSS, JavaScript and Python. Plan projects from a single sentence.',
    to: '/code',
  },
  {
    icon: BookOpenText,
    title: 'Documents',
    body: 'Upload a PDF or notes and get summaries, extracted dates and action items you can trust.',
    to: '/chat',
  },
  {
    icon: Telescope,
    title: 'Research',
    body: 'Structured briefs that separate what’s known from what still needs checking.',
    to: '/chat',
  },
]

function Home() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      {/* Nav */}
      <header className="pt-safe glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
          >
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#app" className="hover:text-foreground">
              Android app
            </a>
            <a href="#trust" className="hover:text-foreground">
              Privacy
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-muted-foreground" />
            <Button asChild className="rounded-full">
              <Link to="/chat">Open app</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="aurora pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div
          className="grid-fade pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-content items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />{' '}
              Chat · Images · Study · Code · Docs
            </p>
            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              One AI for everything you’re{' '}
              <span className="relative whitespace-nowrap text-primary">
                working on
                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  className="absolute -bottom-2 left-0 w-full text-primary/50"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9 C 80 2, 200 2, 298 8"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              NEXTGEN AI brings a chat assistant, image studio, study tutor,
              coding partner and document reader into a single fast app — on
              your Android phone and your laptop.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-6 text-base shadow-[0_10px_40px_-10px_var(--glow)]"
              >
                <Link to="/chat">
                  Start for free <ArrowRight />
                </Link>
              </Button>
              <InstallButton
                className="h-12 rounded-full px-6 text-base"
                label="Install on Android"
              />
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 rounded-full px-5 text-base"
              >
                <Link to="/studio">Try Image Studio</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              No sign-up needed to explore. Your chats stay on your device.
            </p>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* Modules */}
      <section id="features" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Six assistants, one workspace
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Switch tasks without losing your place.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every assistant keeps its own conversations. Start a document
              summary, jump into maths homework, then come back — nothing is
              lost.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ icon: Icon, title, body, to }, i) => (
              <Link
                key={title}
                to={to}
                className="group glass animate-rise relative overflow-hidden rounded-3xl p-6 transition-transform outline-none hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
                <ArrowRight className="absolute top-6 right-6 size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div className="glass rounded-3xl p-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-teal/15 text-teal ring-1 ring-teal/25">
                <ListChecks className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Task Manager
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Run several AI jobs side by side. Each one shows its own
                progress, status, errors and results.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-3xl">
              {SAMPLE_GALLERY.map((g) => (
                <img
                  key={g.id}
                  src={cdn(g.src, 360)}
                  alt={g.prompt}
                  loading="lazy"
                  className="aspect-[3/4] h-full w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App */}
      <section
        id="app"
        className="scroll-mt-20 border-t border-border bg-sidebar"
      >
        <div className="mx-auto grid max-w-content gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Built like a native app
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Install it on your phone in two taps.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              NEXTGEN AI installs from the browser — no app store, no large
              download. It opens full-screen with its own icon and splash
              screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <InstallButton
                variant="default"
                className="rounded-full"
                label="Install NEXTGEN AI"
              />
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/chat">Use in browser</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Smartphone,
                t: 'Home-screen icon',
                b: 'Launches full-screen with a splash screen.',
              },
              {
                icon: WifiOff,
                t: 'Works offline',
                b: 'Pages and saved chats open without a connection.',
              },
              {
                icon: RefreshCw,
                t: 'Instant updates',
                b: 'See “Update now” when a new version ships. Chats are kept.',
              },
              {
                icon: Mic,
                t: 'Voice input',
                b: 'Speak your question on supported devices.',
              },
            ].map(({ icon: Icon, t, b }) => (
              <li key={t} className="glass rounded-2xl p-5">
                <Icon className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Honest by design.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: KeyRound,
                t: 'Keys stay on the server',
                b: 'AI provider keys never reach your browser. Requests are checked and rate-limited.',
              },
              {
                icon: ShieldCheck,
                t: 'Clear about what’s live',
                b: 'If an AI service isn’t connected, NEXTGEN says so — it never fakes a result.',
              },
              {
                icon: ListChecks,
                t: 'Fair, visible limits',
                b: 'Free usage comes with daily limits you can see. No “unlimited” promises.',
              },
            ].map(({ icon: Icon, t, b }) => (
              <div key={t}>
                <Icon className="size-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="relative mx-auto max-w-content overflow-hidden px-4 py-20 text-center sm:px-6">
          <div
            className="aurora pointer-events-none absolute inset-0"
            aria-hidden
          />
          <BrandMark className="relative mx-auto size-16 rounded-2xl" />
          <h2 className="relative mt-6 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Ready when you are.
          </h2>
          <Button
            asChild
            size="lg"
            className="relative mt-8 h-12 rounded-full px-7 text-base"
          >
            <Link to="/chat">
              Open NEXTGEN AI <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Brand />
          <p>
            © {new Date().getFullYear()} NEXTGEN AI. AI can make mistakes —
            check important information.
          </p>
        </div>
      </footer>
    </div>
  )
}

function HeroPreview() {
  return (
    <div
      className="animate-rise relative mx-auto w-full max-w-lg [animation-delay:120ms]"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-2xl" />
      <div className="glass relative overflow-hidden rounded-[1.75rem] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <BrandMark className="size-6 rounded-md" />
          <span className="text-sm font-medium">Study Assistant</span>
          <span className="ml-auto rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Medium · English
          </span>
        </div>
        <div className="space-y-4 p-4 text-sm">
          <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2">
            Why does ice float on water?
          </div>
          <div className="flex gap-2.5">
            <BrandMark className="size-6 shrink-0 rounded-md" />
            <div className="space-y-2 leading-relaxed">
              <p>
                <strong>Step 1 —</strong> Density decides what floats: less
                dense things rise.
              </p>
              <p>
                <strong>Step 2 —</strong> When water freezes, molecules lock
                into a hexagonal lattice with more space between them.
              </p>
              <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 font-mono text-xs">
                ρ<sub>ice</sub> ≈ 0.92 g/cm³ &lt; ρ<sub>water</sub> ≈ 1.00 g/cm³
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {SAMPLE_GALLERY.slice(0, 3).map((g) => (
              <img
                key={g.id}
                src={cdn(g.src, 240)}
                alt=""
                className="aspect-square rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2.5 text-muted-foreground">
            <span className="flex-1 text-sm">Generate 10 MCQs on this…</span>
            <Mic className="size-4" />
            <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
              <ArrowRight className="size-4 -rotate-90" />
            </span>
          </div>
        </div>
      </div>
      <div className="glass absolute -bottom-5 -left-4 hidden rounded-2xl px-4 py-3 text-xs sm:block">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          <span className="font-medium">3 tasks running</span>
        </div>
        <p className="mt-0.5 text-muted-foreground">
          PDF summary · MCQs · Image edit
        </p>
      </div>
    </div>
  )
}
