import {
  Code2,
  GraduationCap,
  ImagePlus,
  ListChecks,
  MessageSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: '/chat' | '/studio' | '/study' | '/code' | '/tasks' | '/settings'
  label: string
  icon: LucideIcon
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/studio', label: 'Studio', icon: ImagePlus },
  { to: '/study', label: 'Study', icon: GraduationCap },
  { to: '/code', label: 'Code', icon: Code2 },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
]

export const SETTINGS_NAV: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: Settings,
}
