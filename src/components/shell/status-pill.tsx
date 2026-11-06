import { Link } from '@tanstack/react-router'
import { WifiOff } from 'lucide-react'
import { PROVIDER_STATUS } from '@/lib/fixtures'
import { usePwa } from '@/pwa/pwa-store'
import { cn } from '@/lib/utils'

/** Always-visible honesty indicator: offline, or demo mode (no AI provider). */
export function StatusPill({ className }: { className?: string }) {
  const { online } = usePwa()
  if (!online) {
    return (
      <span
        role="status"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-2.5 py-1 text-xs font-medium text-coral',
          className,
        )}
      >
        <WifiOff className="size-3.5" /> Offline
      </span>
    )
  }
  if (!PROVIDER_STATUS.demo) return null
  return (
    <Link
      to="/settings"
      hash="ai"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      title="No AI provider is connected yet. Replies are sample text."
    >
      <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
      Demo mode
    </Link>
  )
}
