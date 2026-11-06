import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  deleteConversation,
  renameConversation,
  useChats,
  type Conversation,
} from '@/lib/chat-store'
import { MODES } from '@/lib/fixtures'
import { cn } from '@/lib/utils'

function groupLabel(ts: number) {
  const day = 86_400_000
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  if (ts >= startOfToday) return 'Today'
  if (ts >= startOfToday - day) return 'Yesterday'
  if (ts >= startOfToday - 7 * day) return 'Previous 7 days'
  return 'Older'
}

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const { ready, conversations, generating } = useChats()
  const search = useSearch({ strict: false }) as { c?: string }
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState<Conversation | null>(null)
  const [deleting, setDeleting] = useState<Conversation | null>(null)
  const [title, setTitle] = useState('')

  if (!ready) {
    return (
      <div className="space-y-2 px-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        No conversations yet. Start one and it’ll be saved here.
      </p>
    )
  }

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)
  const groups = new Map<string, Conversation[]>()
  for (const c of sorted) {
    const g = groupLabel(c.updatedAt)
    groups.set(g, [...(groups.get(g) ?? []), c])
  }

  return (
    <>
      <nav aria-label="Conversation history" className="space-y-4">
        {[...groups].map(([label, items]) => (
          <div key={label}>
            <h3 className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {label}
            </h3>
            <ul className="space-y-0.5">
              {items.map((c) => {
                const active = search.c === c.id
                return (
                  <li key={c.id} className="group relative">
                    <Link
                      to="/chat"
                      search={{ c: c.id }}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2 rounded-lg py-2 pr-9 pl-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {generating[c.id] ? (
                        <span
                          className="relative flex size-2 shrink-0"
                          aria-label="Replying"
                        >
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                          <span className="relative inline-flex size-2 rounded-full bg-primary" />
                        </span>
                      ) : null}
                      <span className="truncate">{c.title}</span>
                      <span className="sr-only">({MODES[c.mode].short})</span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-100 transition-opacity hover:bg-background/60 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring lg:opacity-0 lg:group-hover:opacity-100 data-[state=open]:opacity-100"
                          aria-label={`Options for ${c.title}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() => {
                            setTitle(c.title)
                            setRenaming(c)
                          }}
                        >
                          <Pencil /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(c)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (renaming) renameConversation(renaming.id, title)
              setRenaming(null)
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>
                Give this chat a name you’ll recognise later.
              </DialogDescription>
            </DialogHeader>
            <Input
              className="my-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
              aria-label="Conversation name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenaming(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this conversation?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed from this device. This can’t
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return
                deleteConversation(deleting.id)
                if (search.c === deleting.id)
                  void navigate({ to: '/chat', search: {} })
                setDeleting(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
