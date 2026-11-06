import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Download,
  Eraser,
  ImagePlus,
  Layers,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageScroll } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  PROVIDER_STATUS,
  SAMPLE_GALLERY,
  type GalleryItem,
} from '@/lib/fixtures'
import { ACCEPT_IMAGES, validateFile } from '@/lib/files'
import {
  deleteStudioImage,
  fetchStudio,
  runStudio,
  saveStudioImage,
} from '@/lib/studio-client'
import type { StudioImage, StudioTool, StudioUsage } from '@/lib/studio-shared'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/studio')({
  head: () => ({ meta: [{ title: 'Image Studio · NEXTGEN AI' }] }),
  component: StudioPage,
})

type Tool = StudioTool
const TOOLS: {
  id: Tool
  label: string
  icon: LucideIcon
  needsImage: boolean
  action: string
}[] = [
  {
    id: 'generate',
    label: 'Generate',
    icon: Sparkles,
    needsImage: false,
    action: 'Generate image',
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: Wand2,
    needsImage: true,
    action: 'Apply edit',
  },
  {
    id: 'background',
    label: 'Remove BG',
    icon: Eraser,
    needsImage: true,
    action: 'Remove background',
  },
  {
    id: 'enhance',
    label: 'Enhance',
    icon: ImagePlus,
    needsImage: true,
    action: 'Enhance image',
  },
  {
    id: 'variations',
    label: 'Variations',
    icon: Layers,
    needsImage: true,
    action: 'Create variations',
  },
]
const STYLES = [
  'None',
  'Photographic',
  'Cinematic',
  '3D render',
  'Illustration',
  'Anime',
  'Watercolor',
]
const RATIOS = ['1:1', '3:4', '16:9', '9:16']

const cdn = (src: string, w: number) =>
  `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}&fm=webp`

function StudioPage() {
  const [tool, setTool] = useState<Tool>('generate')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('None')
  const [ratio, setRatio] = useState('1:1')
  const [source, setSource] = useState<{
    url: string
    name: string
    file: File
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<StudioImage[] | null>(null)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [usage, setUsage] = useState<StudioUsage | null>(null)
  const [latest, setLatest] = useState<string[]>([])
  const [tab, setTab] = useState('samples')
  const fileRef = useRef<HTMLInputElement>(null)
  const current = TOOLS.find((t) => t.id === tool)!

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url)
    },
    [source],
  )

  useEffect(() => {
    let live = true
    fetchStudio()
      .then((r) => {
        if (!live) return
        setLibrary(r.images)
        setUsage(r.usage)
      })
      .catch((e: Error) => {
        if (!live) return
        setLibrary([])
        setLibraryError(e.message)
      })
    return () => {
      live = false
    }
  }, [])

  function pickFile(file: File | undefined) {
    if (!file) return
    const err = validateFile(file, { imagesOnly: true })
    if (err) return toast.error(err)
    setSource({ url: URL.createObjectURL(file), name: file.name, file })
    setError(null)
  }

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!canRun || busy) return
    setBusy(true)
    setError(null)
    try {
      const r = await runStudio({
        tool,
        prompt,
        style,
        ratio,
        image: current.needsImage ? source?.file : null,
      })
      setLibrary((prev) => [...r.images, ...(prev ?? [])])
      setLatest(r.images.map((i) => i.id))
      setUsage(r.usage)
      toast.success(
        r.images.length > 1
          ? `${r.images.length} images created`
          : 'Image created',
        {
          description: r.failed
            ? `${r.failed} variation could not be created.`
            : undefined,
        },
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleSaved(img: StudioImage) {
    try {
      const next = await saveStudioImage(img.id, !img.saved)
      setLibrary(
        (prev) => prev?.map((i) => (i.id === img.id ? next : i)) ?? null,
      )
      toast.success(
        next.saved ? 'Saved to your gallery' : 'Removed from gallery',
      )
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function remove(img: StudioImage) {
    try {
      await deleteStudioImage(img.id)
      setLibrary((prev) => prev?.filter((i) => i.id !== img.id) ?? null)
      setLatest((prev) => prev.filter((id) => id !== img.id))
      toast.success('Image deleted')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function editThis(img: StudioImage) {
    try {
      const res = await fetch(img.url)
      if (!res.ok) throw new Error('Could not load that image.')
      const blob = await res.blob()
      const file = new File([blob], `nextgen-${img.id}.png`, {
        type: blob.type || 'image/png',
      })
      setTool('edit')
      setPrompt('')
      setSource({ url: URL.createObjectURL(file), name: file.name, file })
      setError(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const latestImages = (library ?? []).filter((i) => latest.includes(i.id))
  const outOfQuota = usage ? usage.remaining <= 0 : false
  const cost = tool === 'variations' ? 2 : 1

  const canRun = current.needsImage
    ? Boolean(source) && (tool !== 'edit' || prompt.trim())
    : prompt.trim().length > 0

  return (
    <PageScroll>
      <PageHeader
        eyebrow="Image Studio"
        title="Create and edit images with AI."
        description="Generate from a prompt, or upload a photo to edit, remove its background, enhance it or explore variations."
      >
        <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1">
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />{' '}
          {PROVIDER_STATUS.imageProvider}
        </Badge>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <form
          onSubmit={run}
          className="glass h-fit space-y-5 rounded-3xl p-5 lg:sticky lg:top-6"
        >
          <div
            className="grid grid-cols-5 gap-1 rounded-2xl bg-muted/60 p-1"
            role="radiogroup"
            aria-label="Studio tool"
          >
            {TOOLS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={tool === id}
                onClick={() => {
                  setTool(id)
                  setError(null)
                }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tool === id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', tool === id && 'text-primary')} />
                {label}
              </button>
            ))}
          </div>

          {current.needsImage ? (
            <div className="space-y-2">
              <Label>Source image</Label>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT_IMAGES}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  pickFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {source ? (
                <div className="relative overflow-hidden rounded-2xl border border-border">
                  <img
                    src={source.url}
                    alt={source.name}
                    className="max-h-64 w-full object-contain bg-muted"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => setSource(null)}
                    aria-label="Remove source image"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    pickFile(e.dataTransfer.files[0])
                  }}
                  className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition-colors outline-none hover:border-primary/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Upload className="size-5" />
                  Drop an image or tap to upload
                  <span className="text-xs">
                    PNG, JPG, WebP or GIF · up to 10 MB
                  </span>
                </button>
              )}
            </div>
          ) : null}

          {tool === 'generate' || tool === 'edit' || tool === 'variations' ? (
            <div className="space-y-2">
              <Label htmlFor="prompt">
                {tool === 'edit'
                  ? 'What should change?'
                  : tool === 'variations'
                    ? 'Guidance (optional)'
                    : 'Prompt'}
              </Label>
              <Textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  tool === 'edit'
                    ? 'e.g. Make the sky a warm sunset and add soft fog'
                    : 'e.g. A cozy reading nook by a rainy window, warm lamp light, film photo'
                }
              />
            </div>
          ) : null}

          {tool === 'generate' ? (
            <>
              <div className="space-y-2">
                <Label>Style</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={style === s}
                      onClick={() => setStyle(s)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        style === s
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aspect ratio</Label>
                <div className="grid grid-cols-4 gap-2">
                  {RATIOS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={ratio === r}
                      onClick={() => setRatio(r)}
                      className={cn(
                        'rounded-xl border py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        ratio === r
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTriangle />
              <AlertTitle>No image was created</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={!canRun || busy || outOfQuota}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin motion-reduce:animate-none" />{' '}
                Working…
              </>
            ) : (
              <>
                <current.icon /> {current.action}
              </>
            )}
          </Button>
          <p
            className="text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            {usage
              ? `${usage.remaining} of ${usage.limit} free images left in the last 24 hours${cost > 1 ? ` · uses ${cost}` : ''}`
              : `Free limit: ${PROVIDER_STATUS.dailyImageLimit} images per day`}
          </p>
        </form>

        <div className="min-w-0 space-y-6">
          {busy || latestImages.length ? (
            <section aria-label="Latest result" aria-busy={busy}>
              <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">
                {busy ? 'Creating…' : 'Latest result'}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {busy
                  ? Array.from({ length: cost }, (_, i) => (
                      <div
                        key={i}
                        className="shimmer aspect-square rounded-2xl border border-border bg-muted"
                      />
                    ))
                  : latestImages.map((img, i) => (
                      <StudioCard
                        key={img.id}
                        img={img}
                        index={i}
                        onToggleSaved={toggleSaved}
                        onDelete={remove}
                        onEdit={editThis}
                        onUsePrompt={usePrompt}
                      />
                    ))}
              </div>
            </section>
          ) : null}
          <Gallery
            tab={tab}
            onTab={setTab}
            library={library}
            libraryError={libraryError}
            onUsePrompt={usePrompt}
            onToggleSaved={toggleSaved}
            onDelete={remove}
            onEdit={editThis}
          />
        </div>
      </div>
    </PageScroll>
  )

  function usePrompt(p: string) {
    setTool('generate')
    setPrompt(p)
    setError(null)
  }
}

type CardActions = {
  onToggleSaved: (img: StudioImage) => void
  onDelete: (img: StudioImage) => void
  onEdit: (img: StudioImage) => void
  onUsePrompt: (p: string) => void
}

function Gallery({
  tab,
  onTab,
  library,
  libraryError,
  ...actions
}: {
  tab: string
  onTab: (t: string) => void
  library: StudioImage[] | null
  libraryError: string | null
} & CardActions) {
  const saved = (library ?? []).filter((i) => i.saved)
  const grid = (items: StudioImage[]) => (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((img, i) => (
        <StudioCard key={img.id} img={img} index={i} {...actions} />
      ))}
    </div>
  )
  const loading = (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="shimmer aspect-square rounded-2xl bg-muted" />
      ))}
    </div>
  )
  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList>
        <TabsTrigger value="samples">Inspiration</TabsTrigger>
        <TabsTrigger value="mine">
          My gallery{saved.length ? ` · ${saved.length}` : ''}
        </TabsTrigger>
        <TabsTrigger value="history">
          History{library?.length ? ` · ${library.length}` : ''}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="samples" className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {SAMPLE_GALLERY.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={i}
              onUsePrompt={actions.onUsePrompt}
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="mine" className="mt-4">
        {library === null ? (
          loading
        ) : saved.length ? (
          grid(saved)
        ) : (
          <EmptyGallery
            title="Your saved images live here"
            body={
              libraryError ??
              'Tap the bookmark on any image you create to keep it in your gallery.'
            }
          />
        )}
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        {library === null ? (
          loading
        ) : library.length ? (
          grid(library)
        ) : (
          <EmptyGallery
            title="No image history yet"
            body={
              libraryError ??
              'Every generation and edit you run will be listed here with its prompt and settings.'
            }
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

const TOOL_LABEL: Record<StudioTool, string> = {
  generate: 'Generated',
  edit: 'Edited',
  background: 'BG removed',
  enhance: 'Enhanced',
  variations: 'Variation',
}

function StudioCard({
  img,
  index,
  onToggleSaved,
  onDelete,
  onEdit,
  onUsePrompt,
}: { img: StudioImage; index: number } & CardActions) {
  const caption = img.prompt || TOOL_LABEL[img.tool]
  const btn = 'text-white hover:bg-white/20 hover:text-white'
  return (
    <figure
      className="animate-rise group relative overflow-hidden rounded-2xl border border-border bg-muted"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <img
        src={img.url}
        alt={caption}
        loading={index > 3 ? 'lazy' : 'eager'}
        className="aspect-square w-full object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
        <p className="line-clamp-2 text-xs leading-snug">{caption}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            {TOOL_LABEL[img.tool]}
          </span>
          {img.style && img.style !== 'None' ? (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
              {img.style}
            </span>
          ) : null}
          <div className="ml-auto flex gap-0.5">
            <Button
              size="icon-xs"
              variant="ghost"
              className={btn}
              onClick={() => onToggleSaved(img)}
              aria-label={img.saved ? 'Remove from gallery' : 'Save to gallery'}
              aria-pressed={img.saved}
              title={img.saved ? 'Saved' : 'Save'}
            >
              {img.saved ? <BookmarkCheck /> : <Bookmark />}
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className={btn}
              onClick={() => onEdit(img)}
              aria-label="Edit this image"
              title="Edit this image"
            >
              <Pencil />
            </Button>
            {img.tool === 'generate' && img.prompt ? (
              <Button
                size="icon-xs"
                variant="ghost"
                className={btn}
                onClick={() => onUsePrompt(img.prompt)}
                aria-label="Reuse this prompt"
                title="Reuse prompt"
              >
                <Sparkles />
              </Button>
            ) : null}
            <Button size="icon-xs" variant="ghost" className={btn} asChild>
              <a
                href={img.url}
                download={`nextgen-${img.id}.png`}
                aria-label="Download image"
                title="Download"
              >
                <Download />
              </a>
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className={btn}
              onClick={() => onDelete(img)}
              aria-label="Delete image"
              title="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </figcaption>
    </figure>
  )
}

function GalleryCard({
  item,
  index,
  onUsePrompt,
}: {
  item: GalleryItem
  index: number
  onUsePrompt: (p: string) => void
}) {
  return (
    <figure
      className="animate-rise group relative overflow-hidden rounded-2xl border border-border bg-muted"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <img
        src={cdn(item.src, 640)}
        srcSet={`${cdn(item.src, 400)} 400w, ${cdn(item.src, 640)} 640w, ${cdn(item.src, 960)} 960w`}
        sizes="(min-width: 1024px) 30vw, 50vw"
        alt={item.prompt}
        loading={index > 1 ? 'lazy' : 'eager'}
        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
        <p className="line-clamp-2 text-xs leading-snug">{item.prompt}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            {item.style}
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            Sample
          </span>
          <div className="ml-auto flex gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => onUsePrompt(item.prompt)}
              aria-label="Use this prompt"
              title="Use this prompt"
            >
              <Sparkles />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <a
                href={item.src}
                download={`nextgen-${item.id}.jpg`}
                aria-label="Download image"
                title="Download"
              >
                <Download />
              </a>
            </Button>
          </div>
        </div>
      </figcaption>
    </figure>
  )
}

function EmptyGallery({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ImagePlus className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
