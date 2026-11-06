import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown, History, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Composer } from '@/components/chat/composer'
import { MessageView } from '@/components/chat/message'
import { ModeIcon } from '@/components/chat/mode-icon'
import { ConversationList } from '@/components/shell/conversation-list'
import {
  createConversation,
  regenerate,
  sendMessage,
  setConversationMode,
  stopReply,
  useConversation,
} from '@/lib/chat-store'
import {
  MODES,
  MODE_ORDER,
  PROVIDER_STATUS,
  type AssistantMode,
} from '@/lib/fixtures'
import { cn } from '@/lib/utils'

type ChatSearch = { c?: string; new?: number; mode?: AssistantMode }

export const Route = createFileRoute('/_app/chat')({
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    c: typeof s.c === 'string' ? s.c : undefined,
    new: s.new ? 1 : undefined,
    mode:
      typeof s.mode === 'string' && s.mode in MODES
        ? (s.mode as AssistantMode)
        : undefined,
  }),
  head: () => ({ meta: [{ title: 'Chat · NEXTGEN AI' }] }),
  component: ChatPage,
})

function ChatPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { ready, conversation, generating } = useConversation(search.c)
  const [pickedMode, setPickedMode] = useState<{
    mode: AssistantMode
    from?: AssistantMode
  } | null>(null)
  // A ?mode= link wins until the user picks a different mode on this screen.
  const draftMode: AssistantMode =
    pickedMode && pickedMode.from === search.mode
      ? pickedMode.mode
      : (search.mode ?? 'chat')
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  const mode = conversation?.mode ?? draftMode
  const info = MODES[mode]
  const messages = conversation?.messages ?? []
  const lastContent = messages.at(-1)?.content.length ?? 0

  // Unknown conversation id (e.g. deleted elsewhere) → fresh chat.
  useEffect(() => {
    if (ready && search.c && !conversation)
      void navigate({ to: '/chat', search: {}, replace: true })
  }, [ready, search.c, conversation, navigate])

  useEffect(() => {
    stickToBottom.current = true
  }, [search.c])

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight })
  }, [messages.length, lastContent, search.c])

  function changeMode(next: AssistantMode) {
    if (conversation) setConversationMode(conversation.id, next)
    else setPickedMode({ mode: next, from: search.mode })
  }

  function handleSend(
    text: string,
    attachments: Parameters<typeof sendMessage>[2],
  ) {
    stickToBottom.current = true
    if (conversation) {
      sendMessage(conversation.id, text, attachments)
      return
    }
    const id = createConversation(mode)
    sendMessage(id, text, attachments)
    void navigate({ to: '/chat', search: { c: id } })
  }

  const modePicker = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full text-muted-foreground"
        >
          <ModeIcon mode={mode} className="size-4 text-primary" />
          {info.short}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Assistant mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODE_ORDER.map((m) => (
          <DropdownMenuItem
            key={m}
            onSelect={() => changeMode(m)}
            className="items-start gap-3 py-2"
          >
            <ModeIcon mode={m} className="mt-0.5 size-4" />
            <span>
              <span className="block font-medium">{MODES[m].label}</span>
              <span className="block text-xs text-muted-foreground">
                {MODES[m].tagline}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground lg:hidden"
          onClick={() => setHistoryOpen(true)}
          aria-label="Conversation history"
        >
          <History />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {conversation ? conversation.title : 'New conversation'}
        </h1>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <ModeIcon mode={mode} className="size-3.5" /> {info.label}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={() => navigate({ to: '/chat', search: { new: 1 } })}
          aria-label="New chat"
        >
          <SquarePen />
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
      >
        {!ready ? (
          <div
            className="mx-auto max-w-reading space-y-6 px-4 py-10"
            aria-label="Loading conversation"
          >
            <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            mode={mode}
            onMode={changeMode}
            onPick={(t) => handleSend(t, [])}
          />
        ) : (
          <div className="mx-auto max-w-reading space-y-7 px-4 pt-8 pb-6">
            {conversation?.sample ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
                This is a sample conversation to show how answers look.
              </p>
            ) : null}
            {messages.map((m, i) => (
              <MessageView
                key={m.id}
                message={m}
                isLast={i === messages.length - 1}
                canRegenerate={!generating && m.role === 'assistant'}
                onRegenerate={() => conversation && regenerate(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pt-2 pb-3 sm:px-4">
        <Composer
          key={search.c ?? 'new'}
          placeholder={info.placeholder}
          generating={generating}
          onSend={handleSend}
          onStop={() => conversation && stopReply(conversation.id)}
          leading={modePicker}
        />
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-sm bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Saved on this device.</SheetDescription>
          </SheetHeader>
          <div className="scrollbar-thin overflow-y-auto px-2 pb-6">
            <ConversationList onNavigate={() => setHistoryOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function EmptyState({
  mode,
  onMode,
  onPick,
}: {
  mode: AssistantMode
  onMode: (m: AssistantMode) => void
  onPick: (text: string) => void
}) {
  const info = MODES[mode]
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div
        className="aurora pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
      />
      <div className="relative w-full max-w-reading text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          {info.label}
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          What are we working on?
        </h2>
        <p className="mt-2 text-muted-foreground">{info.tagline}</p>

        <div
          className="mt-6 flex flex-wrap justify-center gap-2"
          role="radiogroup"
          aria-label="Assistant mode"
        >
          {MODE_ORDER.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={m === mode}
              onClick={() => onMode(m)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                m === mode
                  ? 'border-primary/50 bg-primary/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
            >
              <ModeIcon mode={m} className="size-3.5" />
              {MODES[m].short}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-2 text-left sm:grid-cols-3">
          {info.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="glass rounded-2xl p-4 text-sm leading-snug transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              {s}
            </button>
          ))}
        </div>
        {PROVIDER_STATUS.demo ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Demo mode: replies are sample text until an AI provider is
            connected.
          </p>
        ) : null}
      </div>
    </div>
  )
}
