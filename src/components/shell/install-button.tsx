import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { promptInstall, usePwa } from '@/pwa/pwa-store'

/** Shown only when the browser offers installation and the app isn't installed. */
export function InstallButton({
  className,
  variant = 'outline',
  label = 'Install app',
}: {
  className?: string
  variant?: 'outline' | 'default' | 'ghost' | 'secondary'
  label?: string
}) {
  const { canInstall, installed } = usePwa()
  if (!canInstall || installed) return null
  return (
    <Button
      variant={variant}
      className={className}
      onClick={async () => {
        const outcome = await promptInstall()
        if (outcome === 'dismissed')
          toast('No problem — you can install later from Settings.')
      }}
    >
      <Download /> {label}
    </Button>
  )
}
