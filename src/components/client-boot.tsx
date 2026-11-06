import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { initTheme, useTheme } from '@/lib/theme'
import { initChats } from '@/lib/chat-store'
import { startPwa } from '@/pwa/pwa-store'

/** Starts client-only systems after hydration and hosts the toast container. */
export function ClientBoot() {
  const theme = useTheme()
  useEffect(() => {
    initTheme()
    initChats()
    startPwa()
  }, [])
  return (
    <Toaster
      theme={theme}
      position="top-center"
      toastOptions={{ classNames: { toast: 'glass rounded-2xl!' } }}
    />
  )
}
