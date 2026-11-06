import { useState } from 'react'
import { Check, Copy, FileText, RotateCcw, Square } from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/brand'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Message } from '@/lib/chat-store'
import { formatBytes } from '@/lib/files'
import { Markdown } from './markdown'

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className="text-muted-foreground hover:text-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function MessageView({
  message,
  isLast,
  canRegenerate,
  onRegenerate,
}: {
  message: Message
  isLast: boolean
  canRegenerate: boolean
  onRegenerate: () => void
}) {
  const [copied, setCopied] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="animate-rise flex flex-col items-end gap-2">
        {message.attachments?.length ? (
          <div className="flex max-w-[85%] flex-wrap justify-end gap-2">
            {message.attachments.map((a) =>
              a.previewUrl ? (
                <img
                  key={a.id}
                  src={a.previewUrl}
                  alt={a.name}
                  className="size-24 rounded-xl border border-border object-cover"
                />
              ) : (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs"
                >
                  <FileText className="size-4 text-primary" />
                  <span className="max-w-40 truncate font-medium">
                    {a.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatBytes(a.size)}
                  </span>
                </span>
              ),
            )}
          </div>
        ) : null}
        {message.content ? (
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-secondary-foreground">
            {message.content}
          </div>
        ) : null}
      </div>
    )
  }

  const streaming = message.status === 'streaming'
  return (
    <div className="animate-rise flex gap-3">
      <BrandMark className="mt-0.5 size-7 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        {streaming && !message.content ? (
          <div
            className="flex h-7 items-center gap-1"
            role="status"
            aria-label="Thinking"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-bounce rounded-full bg-primary motion-reduce:animate-none"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <div
            aria-live={streaming ? 'polite' : undefined}
            className={streaming ? 'typing-caret' : undefined}
          >
            <Markdown className="text-[15px]">{message.content}</Markdown>
          </div>
        )}

        {!streaming ? (
          <div className="mt-2 flex items-center gap-0.5">
            <IconAction
              label={copied ? 'Copied' : 'Copy response'}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message.content)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                } catch {
                  toast.error('Couldn’t copy to the clipboard.')
                }
              }}
            >
              {copied ? <Check /> : <Copy />}
            </IconAction>
            {isLast && canRegenerate ? (
              <IconAction label="Regenerate response" onClick={onRegenerate}>
                <RotateCcw />
              </IconAction>
            ) : null}
            {message.status === 'stopped' ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Square className="size-3" /> Stopped
              </span>
            ) : null}
            {message.status === 'error' ? (
              <span className="ml-2 text-xs text-destructive">
                Something went wrong. Try regenerating.
              </span>
            ) : null}
            {message.demo ? (
              <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Demo
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
