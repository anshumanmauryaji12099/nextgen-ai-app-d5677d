import type { StudioImage, StudioTool, StudioUsage } from '@/lib/studio-shared'

const DEVICE_KEY = 'nextgen.device-id'

/** Anonymous per-browser id that scopes Image Studio records until accounts exist. Client only. */
export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('x-device-id', getDeviceId())
  let res: Response
  try {
    res = await fetch(path, { ...init, headers })
  } catch {
    throw new Error('You appear to be offline. No image was created.')
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status}).`)
  return body as T
}

export const fetchStudio = () =>
  call<{ images: StudioImage[]; usage: StudioUsage }>('/api/images')

export function runStudio(input: {
  tool: StudioTool
  prompt: string
  style: string
  ratio: string
  image?: File | null
}) {
  const form = new FormData()
  form.set('tool', input.tool)
  form.set('prompt', input.prompt)
  form.set('style', input.style)
  form.set('ratio', input.ratio)
  if (input.image) form.set('image', input.image)
  return call<{ images: StudioImage[]; failed: number; usage: StudioUsage }>(
    '/api/images',
    { method: 'POST', body: form },
  )
}

export const saveStudioImage = (id: string, saved: boolean) =>
  call<StudioImage>(`/api/images/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ saved }),
  })

export const deleteStudioImage = (id: string) =>
  call<void>(`/api/images/${id}`, { method: 'DELETE' })
