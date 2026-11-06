import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, FileUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageScroll } from '@/components/page-header'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uid, type Attachment } from '@/lib/chat-store'
import { STUDY_TOOLS } from '@/lib/fixtures'
import { formatBytes, validateFile } from '@/lib/files'
import { useLaunchAssistant } from '@/lib/launch'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/study')({
  head: () => ({ meta: [{ title: 'Study · NEXTGEN AI' }] }),
  component: StudyPage,
})

type ToolId = (typeof STUDY_TOOLS)[number]['id']
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type Lang = 'en' | 'hi'

function StudyPage() {
  const launch = useLaunchAssistant()
  const [tool, setTool] = useState<ToolId>('explain')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [lang, setLang] = useState<Lang>('en')
  const [doc, setDoc] = useState<Attachment | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const active = STUDY_TOOLS.find((t) => t.id === tool)!

  function start(e: React.FormEvent) {
    e.preventDefault()
    const subject =
      topic.trim() || (doc ? `the attached document “${doc.name}”` : '')
    if (!subject) return
    const prompt = [
      active.template.replace('{topic}', subject),
      `Difficulty: ${difficulty}.`,
      'Explain the reasoning clearly, not only the final answer.',
      lang === 'hi'
        ? 'कृपया उत्तर सरल हिन्दी में दें।'
        : 'Answer in clear English.',
    ].join('\n')
    launch('study', prompt, doc ? [doc] : [])
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Study Assistant"
        title="Learn it properly, step by step."
        description="Pick how you want to study, set the level and language, and NEXTGEN walks you through it."
      />

      <form onSubmit={start} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="sr-only">
            Study tools
          </h2>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Study tool"
          >
            {STUDY_TOOLS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tool === t.id}
                onClick={() => setTool(t.id)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  'animate-rise glass rounded-2xl p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                  tool === t.id
                    ? 'shadow-[0_0_0_1.5px_var(--primary),0_12px_30px_-16px_var(--glow)]'
                    : 'hover:-translate-y-0.5',
                )}
              >
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t.hint}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="glass space-y-5 rounded-3xl p-5"
          aria-label="Study request"
        >
          <div className="space-y-2">
            <Label htmlFor="topic">
              {tool === 'math' ? 'Problem' : 'Topic or chapter'}
            </Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder={
                tool === 'math'
                  ? 'e.g. Find x: 3x + 7 = 22'
                  : 'e.g. Class 10 Science — Chapter 6: Life Processes'
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Segmented
              label="Difficulty"
              className="flex w-full"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Segmented
              label="Language"
              className="flex w-full"
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'हिन्दी' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label>Study material (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.docx"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const err = validateFile(f)
                if (err) toast.error(err)
                else
                  setDoc({
                    id: uid(),
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    kind: 'file',
                  })
                e.target.value = ''
              }}
            />
            {doc ? (
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                <FileUp className="size-4 text-primary" />
                <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(doc.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDoc(null)}
                  aria-label="Remove document"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp /> Upload notes or a chapter (PDF, DOCX, TXT)
              </Button>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={!topic.trim() && !doc}
          >
            Start: {active.label} <ArrowRight />
          </Button>
        </section>
      </form>
    </PageScroll>
  )
}
