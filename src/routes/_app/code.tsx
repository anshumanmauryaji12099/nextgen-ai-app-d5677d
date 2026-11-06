import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, FileCode2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageScroll } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CODE_LANGUAGES, CODE_TOOLS } from '@/lib/fixtures'
import { formatBytes } from '@/lib/files'
import { useLaunchAssistant } from '@/lib/launch'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/code')({
  head: () => ({ meta: [{ title: 'Code · NEXTGEN AI' }] }),
  component: CodePage,
})

type ToolId = (typeof CODE_TOOLS)[number]['id']
const CODE_FILE_LIMIT = 200 * 1024
const EXT_LANG: Record<string, (typeof CODE_LANGUAGES)[number]> = {
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  mjs: 'JavaScript',
  jsx: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  py: 'Python',
}

function CodePage() {
  const launch = useLaunchAssistant()
  const [tool, setTool] = useState<ToolId>('debug')
  const [language, setLanguage] =
    useState<(typeof CODE_LANGUAGES)[number]>('JavaScript')
  const [input, setInput] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const active = CODE_TOOLS.find((t) => t.id === tool)!
  const takesCode = tool === 'explain' || tool === 'debug' || tool === 'format'

  async function loadFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!(ext in EXT_LANG) && !['txt', 'json', 'md'].includes(ext)) {
      toast.error('Choose an HTML, CSS, JS, TS, Python, JSON or text file.')
      return
    }
    if (file.size > CODE_FILE_LIMIT) {
      toast.error(
        `${file.name} is ${formatBytes(file.size)} — code files are limited to 200 KB.`,
      )
      return
    }
    setInput(await file.text())
    setFileName(file.name)
    if (EXT_LANG[ext]) setLanguage(EXT_LANG[ext])
  }

  function start(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const body = takesCode
      ? `\`\`\`${language.toLowerCase()}\n${input.trim()}\n\`\`\``
      : input.trim()
    const prompt = `${active.template.replace('{topic}', body)}\n\nLanguage: ${language}.${fileName ? ` File: ${fileName}.` : ''}`
    launch('code', prompt)
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Coding Assistant"
        title="Understand, fix and ship your code."
        description="Paste code or open a file. NEXTGEN explains, debugs, formats and plans — with safe, commented output."
      />

      <form onSubmit={start} className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-6">
          <div className="space-y-2" role="radiogroup" aria-label="Coding task">
            {CODE_TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tool === t.id}
                onClick={() => setTool(t.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tool === t.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-border hover:bg-muted/60',
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <div className="flex flex-wrap gap-2">
              {CODE_LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={language === l}
                  onClick={() => setLanguage(l)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    language === l
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            Generated code is explained and never run automatically. Review it
            before using it.
          </p>
        </div>

        <div className="glass flex flex-col rounded-3xl p-2">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <Label htmlFor="code-input" className="text-sm">
              {takesCode ? 'Your code' : 'Describe what you need'}
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm,.css,.js,.mjs,.jsx,.ts,.tsx,.py,.json,.txt,.md"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void loadFile(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <FileCode2 /> {fileName ?? 'Open file'}
            </Button>
          </div>
          <Textarea
            id="code-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={16}
            placeholder={
              takesCode
                ? 'async function load() {\n  const data = fetch("/api/items")\n  return data.json()\n}'
                : 'e.g. A to-do list web app in HTML, CSS and JavaScript that saves tasks in localStorage'
            }
            className="min-h-72 flex-1 resize-y rounded-2xl border-0 bg-background/50 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
            <span className="text-xs text-muted-foreground">
              {input
                ? `${input.split('\n').length} lines`
                : 'Up to 200 KB per file'}
            </span>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={!input.trim()}
            >
              {active.label} <ArrowRight />
            </Button>
          </div>
        </div>
      </form>
    </PageScroll>
  )
}
