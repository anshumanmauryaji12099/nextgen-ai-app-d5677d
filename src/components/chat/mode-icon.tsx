import {
  BookOpenText,
  Code2,
  GraduationCap,
  Sparkles,
  Telescope,
} from 'lucide-react'
import type { AssistantMode } from '@/lib/fixtures'

const ICONS = {
  chat: Sparkles,
  study: GraduationCap,
  code: Code2,
  docs: BookOpenText,
  research: Telescope,
} satisfies Record<AssistantMode, unknown>

export function ModeIcon({
  mode,
  className,
}: {
  mode: AssistantMode
  className?: string
}) {
  const Icon = ICONS[mode]
  return <Icon className={className} aria-hidden />
}
