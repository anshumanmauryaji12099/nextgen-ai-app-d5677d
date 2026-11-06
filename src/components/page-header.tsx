export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <header className="relative flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
      </div>
      {children}
    </header>
  )
}

export function PageScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div
        className="aurora pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60"
        aria-hidden
      />
      <div className="relative mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  )
}
