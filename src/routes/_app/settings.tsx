import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CheckCircle2,
  Download,
  HardDriveDownload,
  Monitor,
  Moon,
  RefreshCw,
  Smartphone,
  Sun,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader, PageScroll } from '@/components/page-header'
import { InstallButton } from '@/components/shell/install-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clearAllConversations, useChats } from '@/lib/chat-store'
import { PROVIDER_STATUS } from '@/lib/fixtures'
import { setTheme, useTheme, type ThemePreference } from '@/lib/theme'
import { applyUpdate, checkForUpdates, usePwa } from '@/pwa/pwa-store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/settings')({
  head: () => ({ meta: [{ title: 'Settings · NEXTGEN AI' }] }),
  component: SettingsPage,
})

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="glass scroll-mt-6 rounded-3xl p-5 sm:p-6"
    >
      <h2 id={`${id}-h`} className="font-display text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Row({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          ok === false && 'text-muted-foreground',
        )}
      >
        {ok ? <CheckCircle2 className="size-4 text-primary" /> : null}
        {value}
      </span>
    </div>
  )
}

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

function SettingsPage() {
  const theme = useTheme()
  const pwa = usePwa()
  const { conversations } = useChats()
  const [confirmClear, setConfirmClear] = useState(false)

  function exportChats() {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nextgen-conversations-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Settings"
        title="Make it yours."
        description="Appearance, AI connection, app installation and your data."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          id="appearance"
          title="Appearance"
          description="Choose how NEXTGEN AI looks on this device."
        >
          <div
            className="grid grid-cols-3 gap-2"
            role="radiogroup"
            aria-label="Theme"
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  theme === value
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          id="ai"
          title="AI connection"
          description="Which AI services are answering, and the limits that apply."
        >
          <Row
            label="Mode"
            value={PROVIDER_STATUS.demo ? 'Demo (sample replies)' : 'Live'}
            ok={!PROVIDER_STATUS.demo}
          />
          <Row
            label="Text & chat model"
            value={PROVIDER_STATUS.textProvider ?? 'Not connected'}
            ok={Boolean(PROVIDER_STATUS.textProvider)}
          />
          <Row
            label="Image model"
            value={PROVIDER_STATUS.imageProvider ?? 'Not connected'}
            ok={Boolean(PROVIDER_STATUS.imageProvider)}
          />
          <Row
            label="Planned daily limit"
            value={`${PROVIDER_STATUS.dailyMessageLimit} messages · ${PROVIDER_STATUS.dailyImageLimit} images`}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            AI keys are kept on the server and never sent to your browser. Free
            usage has fair daily limits — it isn’t unlimited.
          </p>
        </Section>

        <Section
          id="app"
          title="App & updates"
          description="Install NEXTGEN AI on your phone and keep it up to date."
        >
          <Row
            label="Installed"
            value={pwa.installed ? 'Yes' : 'Not on this device'}
            ok={pwa.installed}
          />
          <Row
            label="Offline pages"
            value={
              pwa.offlineReady
                ? 'Ready'
                : 'Available after first load of the installed site'
            }
            ok={pwa.offlineReady}
          />
          <Row label="Version" value={__APP_VERSION__} />
          <div className="mt-4 flex flex-wrap gap-2">
            {pwa.updateReady ? (
              <Button onClick={applyUpdate}>
                <Download /> Update now
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={checkForUpdates}
                disabled={pwa.checking}
              >
                <RefreshCw className={cn(pwa.checking && 'animate-spin')} />{' '}
                Check for updates
              </Button>
            )}
            <InstallButton variant="default" label="Install on this device" />
          </div>
          {!pwa.installed && !pwa.canInstall ? (
            <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
              <Smartphone className="size-4 shrink-0" />
              On Android Chrome, open the ⋮ menu and choose “Add to Home
              screen”. On iPhone, use Share → “Add to Home Screen”.
            </p>
          ) : null}
        </Section>

        <Section
          id="data"
          title="Your data"
          description="Conversations are saved on this device and kept when the app updates."
        >
          <Row
            label="Saved conversations"
            value={String(conversations.length)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={exportChats}
              disabled={!conversations.length}
            >
              <HardDriveDownload /> Export as JSON
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmClear(true)}
              disabled={!conversations.length}
            >
              <Trash2 /> Delete all
            </Button>
          </div>
        </Section>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete all conversations?</DialogTitle>
            <DialogDescription>
              All {conversations.length} conversations will be removed from this
              device. Export them first if you want a copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAllConversations()
                setConfirmClear(false)
              }}
            >
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageScroll>
  )
}
