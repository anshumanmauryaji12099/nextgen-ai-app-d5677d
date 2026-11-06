import { toast } from 'sonner'
import { createStore, useStore } from '@/lib/external-store'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PwaState = {
  /** Browser offered an install prompt and the app isn't installed. */
  canInstall: boolean
  /** Running as an installed app, or installed from this browser. */
  installed: boolean
  /** A new version has been downloaded and is waiting. */
  updateReady: boolean
  /** Service worker registered and controlling this page. */
  offlineReady: boolean
  online: boolean
  checking: boolean
}

const INSTALLED_KEY = 'ng-installed'
const pwaStore = createStore<PwaState>({
  canInstall: false,
  installed: false,
  updateReady: false,
  offlineReady: false,
  online: true,
  checking: false,
})

let deferredPrompt: BeforeInstallPromptEvent | null = null
let registration: ServiceWorkerRegistration | null = null
let waitingWorker: ServiceWorker | null = null
let userRequestedReload = false
let started = false

const patch = (p: Partial<PwaState>) => pwaStore.set((s) => ({ ...s, ...p }))

function isStandalone() {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function announceUpdate(worker: ServiceWorker) {
  waitingWorker = worker
  patch({ updateReady: true })
  toast('A new version of NEXTGEN AI is ready', {
    id: 'ng-update',
    description: 'Your conversations stay saved on this device.',
    duration: Infinity,
    action: { label: 'Update now', onClick: applyUpdate },
  })
}

function watch(reg: ServiceWorkerRegistration) {
  if (reg.waiting && navigator.serviceWorker.controller)
    announceUpdate(reg.waiting)
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing
    if (!worker) return
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        announceUpdate(worker)
      }
      if (worker.state === 'activated') patch({ offlineReady: true })
    })
  })
}

export function startPwa() {
  if (started || typeof window === 'undefined') return
  started = true

  patch({
    installed: isStandalone() || localStorage.getItem(INSTALLED_KEY) === '1',
    online: navigator.onLine,
  })
  addEventListener('online', () => patch({ online: true }))
  addEventListener('offline', () => patch({ online: false }))

  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    // The browser only fires this when the app is not installed.
    localStorage.removeItem(INSTALLED_KEY)
    patch({ canInstall: true, installed: false })
  })
  addEventListener('appinstalled', () => {
    deferredPrompt = null
    localStorage.setItem(INSTALLED_KEY, '1')
    patch({ canInstall: false, installed: true })
    toast.success('NEXTGEN AI installed', {
      description: 'Open it from your home screen.',
    })
  })

  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (userRequestedReload) location.reload()
  })
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      registration = reg
      patch({ offlineReady: Boolean(reg.active) })
      watch(reg)
      // Look for new deploys when the app returns to the foreground and hourly.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
    })
    .catch(() => patch({ offlineReady: false }))
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable' as const
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  patch({ canInstall: false })
  return outcome
}

export function applyUpdate() {
  if (!waitingWorker) return
  userRequestedReload = true
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}

export async function checkForUpdates() {
  if (!registration) {
    toast.info('Updates are checked automatically in the installed app.')
    return
  }
  patch({ checking: true })
  try {
    await registration.update()
    if (!registration.waiting && !registration.installing) {
      toast.success('You’re on the latest version.')
    }
  } catch {
    toast.error('Couldn’t check for updates. Are you offline?')
  } finally {
    patch({ checking: false })
  }
}

export function usePwa() {
  return useStore(pwaStore)
}
