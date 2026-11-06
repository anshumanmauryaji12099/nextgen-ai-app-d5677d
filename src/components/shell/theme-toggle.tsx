import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setTheme, useTheme } from '@/lib/theme'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const isDark = theme !== 'light'
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
