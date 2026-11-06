import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Code2,
  GraduationCap,
  ImagePlus,
  Loader2,
  Square,
  Telescope,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader, PageScroll } from '@/components/page-header'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { stopReply, useChats } from '@/lib/chat-store'
import {
  MODES,
  SAMPLE_TASKS,
  type SampleTask,
  type TaskStatus,
} from '@/lib/fixtures'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/tasks')({
  head: () => ({ meta: [{ title: 'Tasks · NEXTGEN AI' }] }),
  component: TasksPage,
})

const KIND_ICON: Record<SampleTask['kind'], LucideIcon> = {
  document: BookOpenText,
  study: GraduationCap,
  image: ImagePlus,
  code: Code2,
  research: Telescope,
}

const STATUS: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  queued: {
    label: 'Queued',
    icon: Clock3,
    className: 'text-muted-foreground bg-muted',
  },
  running: {
    label: 'Running',
    icon: Loader2,
    className: 'text-primary bg-primary/10',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'text-destructive bg-destructive/10',
  },
}

type Filter = 'all' | TaskStatus

function TasksPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { conversations, generating } = useChats()
  const live = conversations.filter((c) => generating[c.id])
  const tasks = SAMPLE_TASKS.filter(
    (t) => filter === 'all' || t.status === filter,
  )

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Task Manager"
        title="Many jobs, one place."
        description="Run several AI jobs side by side — each one keeps its own progress, status, errors and results."
      />

      <section aria-labelledby="live-heading" className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <h2 id="live-heading" className="font-display text-lg font-semibold">
            Running now
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {live.length}
          </span>
        </div>
        {live.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No replies are being written right now. Start chats in different
            modes — each one runs independently and shows up here while it’s
            working.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {live.map((c) => (
              <li
                key={c.id}
                className="glass flex items-center gap-3 rounded-2xl p-4"
              >
                <Loader2 className="size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/chat"
                    search={{ c: c.id }}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {c.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {MODES[c.mode].label} · writing reply
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopReply(c.id)}
                >
                  <Square className="fill-current" /> Stop
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="queue-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="queue-heading"
              className="font-display text-lg font-semibold"
            >
              Task queue
            </h2>
            <p className="text-xs text-muted-foreground">
              Preview with sample tasks — long-running document, study and image
              jobs connect in a later update.
            </p>
          </div>
          <Segmented
            label="Filter tasks"
            value={filter}
            onChange={setFilter}
            className="self-start overflow-x-auto"
            options={[
              { value: 'all', label: 'All' },
              { value: 'running', label: 'Running' },
              { value: 'queued', label: 'Queued' },
              { value: 'done', label: 'Done' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        </div>

        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No {filter} tasks.
          </p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t, i) => (
              <TaskCard key={t.id} task={t} index={i} />
            ))}
          </ul>
        )}
      </section>
    </PageScroll>
  )
}

function TaskCard({ task, index }: { task: SampleTask; index: number }) {
  const Icon = KIND_ICON[task.kind]
  const s = STATUS[task.status]
  return (
    <li
      className="animate-rise glass rounded-2xl p-4 sm:p-5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">{task.title}</h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                s.className,
              )}
            >
              <s.icon
                className={cn(
                  'size-3.5',
                  task.status === 'running' &&
                    'animate-spin motion-reduce:animate-none',
                )}
              />
              {s.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {task.detail} ·{' '}
            {task.minutesAgo < 60
              ? `${task.minutesAgo} min ago`
              : `${Math.round(task.minutesAgo / 60)} h ago`}
          </p>
          {task.status === 'running' || task.status === 'queued' ? (
            <div className="mt-3 flex items-center gap-3">
              <Progress
                value={task.progress}
                className="h-1.5"
                aria-label={`${task.title} progress`}
              />
              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                {task.progress}%
              </span>
            </div>
          ) : null}
          {task.result ? (
            <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs">
              <span className="font-medium">Result:</span> {task.result}
            </p>
          ) : null}
          {task.error ? (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <span className="font-medium">Error:</span> {task.error}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  )
}
