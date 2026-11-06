import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  ArrowUp,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Square,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { uid, type Attachment } from '@/lib/chat-store'
import {
  ACCEPT_ATTACHMENTS,
  IMAGE_TYPES,
  MAX_FILES,
  formatBytes,
  validateFile,
} from '@/lib/files'
import { getRecognitionCtor, type Recognition } from '@/lib/voice'
import { cn } from '@/lib/utils'

const noopSubscribe = () => () => {}

export function Composer({
  placeholder,
  generating,
  onSend,
  onStop,
  leading,
  autoFocus,
}: {
  placeholder: string
  generating: boolean
  onSend: (text: string, attachments: Attachment[]) => void
  onStop: () => void
  leading?: React.ReactNode
  autoFocus?: boolean
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [listening, setListening] = useState(false)
  const voiceSupported = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getRecognitionCtor()),
    () => false,
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const baseTextRef = useRef('')

  useEffect(() => () => recognitionRef.current?.stop(), [])

  // Auto-grow the textarea up to ~8 lines.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [text])

  const canSend = !generating && (text.trim().length > 0 || files.length > 0)

  function submit() {
    if (!canSend) return
    recognitionRef.current?.stop()
    onSend(text.trim(), files)
    setText('')
    setFiles([])
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next: Attachment[] = []
    for (const file of Array.from(list)) {
      if (files.length + next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files per message.`)
        break
      }
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        continue
      }
      const isImage = IMAGE_TYPES.includes(file.type)
      next.push({
        id: uid(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        kind: isImage ? 'image' : 'file',
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      })
    }
    setFiles((f) => [...f, ...next])
    if (fileRef.current) fileRef.current.value = ''
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = /[ऀ-ॿ]/.test(text) ? 'hi-IN' : navigator.language || 'en-IN'
    rec.continuous = false
    rec.interimResults = true
    baseTextRef.current = text ? `${text.trimEnd()} ` : ''
    rec.onresult = (e) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++)
        transcript += e.results[i][0].transcript
      setText(baseTextRef.current + transcript)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed')
        toast.error('Microphone permission was denied.')
      else if (e.error !== 'aborted' && e.error !== 'no-speech')
        toast.error('Voice input stopped unexpectedly.')
    }
    rec.onend = () => {
      setListening(false)
      textareaRef.current?.focus()
    }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  return (
    <div className="mx-auto w-full max-w-reading">
      <div
        className={cn(
          'glass rounded-3xl p-2 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.5)] transition-shadow focus-within:shadow-[0_0_0_1px_var(--ring),0_18px_50px_-20px_var(--glow)]',
          listening && 'shadow-[0_0_0_1px_var(--coral)]',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
      >
        {files.length ? (
          <ul
            className="flex flex-wrap gap-2 px-2 pt-2 pb-1"
            aria-label="Attachments"
          >
            {files.map((f) => (
              <li
                key={f.id}
                className="group relative flex items-center gap-2 rounded-xl border border-border bg-background/60 py-1.5 pr-8 pl-1.5 text-xs"
              >
                {f.previewUrl ? (
                  <img
                    src={f.previewUrl}
                    alt=""
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                )}
                <span className="max-w-32 truncate font-medium">{f.name}</span>
                <span className="text-muted-foreground">
                  {formatBytes(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((all) => all.filter((x) => x.id !== f.id))
                  }
                  className="absolute top-1/2 right-1.5 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          autoFocus={autoFocus}
          placeholder={listening ? 'Listening…' : placeholder}
          aria-label="Message"
          className="scrollbar-thin block max-h-[220px] w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center gap-1 px-1 pt-1">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT_ATTACHMENTS}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => addFiles(e.target.files)}
            aria-hidden
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach files or images"
              >
                <Paperclip />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach files or images (max 10 MB)</TooltipContent>
          </Tooltip>
          {voiceSupported ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'rounded-full text-muted-foreground',
                    listening && 'bg-coral/15 text-coral',
                  )}
                  onClick={toggleVoice}
                  aria-pressed={listening}
                  aria-label={listening ? 'Stop voice input' : 'Voice input'}
                >
                  {listening ? <MicOff /> : <Mic />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {listening ? 'Stop listening' : 'Speak your message'}
              </TooltipContent>
            </Tooltip>
          ) : null}
          {leading}
          <div className="ml-auto">
            {generating ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={onStop}
                aria-label="Stop generating"
              >
                <Square className="fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                className="rounded-full"
                disabled={!canSend}
                onClick={submit}
                aria-label="Send message"
              >
                <ArrowUp />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        NEXTGEN AI can make mistakes. Check important information.
      </p>
    </div>
  )
}
