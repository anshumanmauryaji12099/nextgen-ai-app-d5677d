import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { SquarePen } from 'lucide-react'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { ConversationList } from '@/components/shell/conversation-list'
import { InstallButton } from '@/components/shell/install-button'
import { PRIMARY_NAV, SETTINGS_NAV } from '@/components/shell/nav'
import { StatusPill } from '@/components/shell/status-pill'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const navLinkClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors outline-none hover:bg-sidebar-accent/70 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring'

function AppLayout() {
  const navigate = useNavigate()
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Brand to="/chat" />
          <ThemeToggle className="text-muted-foreground" />
        </div>
        <div className="px-3">
          <Button
            className="w-full justify-start gap-2 rounded-xl shadow-[0_0_0_1px_var(--glass-border),0_8px_24px_-12px_var(--glow)]"
            onClick={() => navigate({ to: '/chat', search: { new: 1 } })}
          >
            <SquarePen /> New chat
          </Button>
        </div>
        <nav aria-label="Main" className="mt-4 space-y-0.5 px-3">
          {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={navLinkClass}
              activeOptions={{ includeSearch: false }}
              activeProps={{
                className: 'bg-sidebar-accent text-sidebar-foreground',
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('size-[18px]', isActive && 'text-primary')}
                  />
                  {label}
                </>
              )}
            </Link>
          ))}
        </nav>
        <div className="mx-4 my-4 h-px bg-sidebar-border" />
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <ConversationList />
        </div>
        <div className="space-y-2 border-t border-sidebar-border p-3">
          <InstallButton className="w-full rounded-xl" />
          <div className="flex items-center justify-between gap-2">
            <Link
              to={SETTINGS_NAV.to}
              className={cn(navLinkClass, 'flex-1')}
              activeProps={{
                className: 'bg-sidebar-accent text-sidebar-foreground',
              }}
            >
              <SETTINGS_NAV.icon className="size-[18px]" /> Settings
            </Link>
            <StatusPill />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="pt-safe glass sticky top-0 z-30 border-x-0 border-t-0 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Brand to="/chat" />
            <div className="flex items-center gap-1">
              <StatusPill />
              <ThemeToggle className="text-muted-foreground" />
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground"
              >
                <Link to="/settings" aria-label="Settings">
                  <SETTINGS_NAV.icon />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Main"
          className="glass pb-safe relative z-30 border-x-0 border-b-0 lg:hidden"
        >
          <ul className="grid grid-cols-5">
            {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ includeSearch: false }}
                  className="group flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground outline-none focus-visible:text-foreground data-[status=active]:text-foreground"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'grid h-7 w-12 place-items-center rounded-full transition-colors motion-reduce:transition-none',
                          isActive && 'bg-primary/15 text-primary',
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      {label}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
