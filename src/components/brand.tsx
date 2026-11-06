import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/icons/logo-96.png"
      alt=""
      width={32}
      height={32}
      className={cn(
        'size-8 rounded-[10px] bg-[#0b0d10] ring-1 ring-white/10',
        className,
      )}
    />
  )
}

export function Brand({
  className,
  to = '/',
}: {
  className?: string
  to?: '/' | '/chat'
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="NEXTGEN AI home"
    >
      <BrandMark />
      <span className="font-display text-[17px] font-bold tracking-tight">
        NEXTGEN<span className="text-primary"> AI</span>
      </span>
    </Link>
  )
}
