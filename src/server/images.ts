/**
 * Server-only Image Studio logic: validation, quotas, Gemini via Netlify AI
 * Gateway, Blobs storage and per-device records in Netlify Database.
 */
import { createHash, randomUUID } from 'node:crypto'
import { GoogleGenAI, type Part } from '@google/genai'
import { getStore } from '@netlify/blobs'
import { and, count, desc, eq, gte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { images, type ImageRecord } from '../../db/schema'
import { IMAGE_LIMITS, type StudioImage } from '@/lib/studio-shared'

export const IMAGE_MODEL = 'gemini-3.1-flash-image'

export class StudioError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const store = () => getStore({ name: 'studio-images', consistency: 'strong' })

export const deviceSchema = z.string().uuid()

export function deviceFrom(request: Request) {
  const parsed = deviceSchema.safeParse(request.headers.get('x-device-id'))
  if (!parsed.success)
    throw new StudioError('Missing or invalid device id.', 400)
  return parsed.data
}

function ipHash(request: Request) {
  const ip =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  return createHash('sha256').update(`nextgen:${ip}`).digest('hex').slice(0, 32)
}

export function toClient(r: ImageRecord): StudioImage {
  return {
    id: r.id,
    tool: r.tool as StudioImage['tool'],
    prompt: r.prompt,
    style: r.style,
    ratio: r.ratio,
    model: r.model,
    saved: r.saved,
    createdAt: r.createdAt.toISOString(),
    url: `/api/images/${r.id}`,
  }
}

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000)

export async function usage(deviceId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(images)
    .where(
      and(eq(images.deviceId, deviceId), gte(images.createdAt, since24h())),
    )
  const used = Number(row?.n ?? 0)
  return {
    used,
    limit: IMAGE_LIMITS.perDevice,
    remaining: Math.max(0, IMAGE_LIMITS.perDevice - used),
  }
}

export async function listImages(deviceId: string) {
  const rows = await db
    .select()
    .from(images)
    .where(eq(images.deviceId, deviceId))
    .orderBy(desc(images.createdAt))
    .limit(100)
  return rows.map(toClient)
}

const requestSchema = z.object({
  tool: z.enum(['generate', 'edit', 'background', 'enhance', 'variations']),
  prompt: z.string().trim().max(2000).default(''),
  style: z.string().max(40).default('None'),
  ratio: z.enum(['1:1', '3:4', '16:9', '9:16']).default('1:1'),
})

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function buildInstruction(
  tool: z.infer<typeof requestSchema>['tool'],
  prompt: string,
  style: string,
  index: number,
) {
  const styleLine = style && style !== 'None' ? ` Style: ${style}.` : ''
  switch (tool) {
    case 'generate':
      return `${prompt}.${styleLine}`
    case 'edit':
      return `Edit this image: ${prompt}. Keep everything else unchanged and preserve the original composition.`
    case 'background':
      return 'Remove the background from this image. Keep the main subject exactly as it is, with clean edges, and place it on a plain pure white background.'
    case 'enhance':
      return 'Enhance this image: increase clarity and sharpness, reduce noise and compression artefacts, and balance exposure and colour naturally. Do not change the content or composition.'
    case 'variations':
      return `Create a new variation of this image (variation ${index + 1}) that keeps its subject and overall mood but changes composition, angle or details.${prompt ? ` Guidance: ${prompt}.` : ''}`
  }
}

async function callModel(parts: Part[], ratio: string | undefined) {
  const ai = new GoogleGenAI({
    apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
    httpOptions: {
      baseUrl: process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, ''),
    },
  })
  let response
  try {
    response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        ...(ratio ? { imageConfig: { aspectRatio: ratio } } : {}),
      },
    })
  } catch (err) {
    console.error('Image model request failed', err)
    const status = (err as { status?: number }).status
    if (status === 429)
      throw new StudioError(
        'The image service is busy right now. Please try again in a minute.',
        503,
      )
    throw new StudioError(
      'The image service could not be reached. No image was created.',
      502,
    )
  }
  const out = response.candidates?.[0]?.content?.parts ?? []
  const img = out.find((p) => p.inlineData?.data)
  if (!img?.inlineData?.data) {
    const text = out
      .map((p) => p.text)
      .filter(Boolean)
      .join(' ')
      .slice(0, 300)
    throw new StudioError(
      text
        ? `The model didn’t return an image: ${text}`
        : 'The model didn’t return an image for this request. Try rephrasing the prompt.',
      422,
    )
  }
  return {
    data: Buffer.from(img.inlineData.data, 'base64'),
    mimeType: img.inlineData.mimeType ?? 'image/png',
  }
}

export async function createImages(request: Request) {
  const deviceId = deviceFrom(request)
  const ip = ipHash(request)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    throw new StudioError('Send the request as multipart form data.')
  }
  const parsed = requestSchema.safeParse({
    tool: form.get('tool'),
    prompt: form.get('prompt') ?? undefined,
    style: form.get('style') ?? undefined,
    ratio: form.get('ratio') ?? undefined,
  })
  if (!parsed.success) throw new StudioError('Invalid Image Studio request.')
  const { tool, prompt, style, ratio } = parsed.data

  if ((tool === 'generate' || tool === 'edit') && prompt.length < 3)
    throw new StudioError('Describe what you want in a few words.')

  let source: Part | null = null
  if (tool !== 'generate') {
    const file = form.get('image')
    if (!(file instanceof File) || file.size === 0)
      throw new StudioError('Upload a source image first.')
    if (!ALLOWED.includes(file.type))
      throw new StudioError('Use a PNG, JPG, WebP or GIF image.')
    if (file.size > IMAGE_LIMITS.maxUploadBytes)
      throw new StudioError('The source image is larger than 10 MB.', 413)
    source = {
      inlineData: {
        mimeType: file.type,
        data: Buffer.from(await file.arrayBuffer()).toString('base64'),
      },
    }
  }

  const n = tool === 'variations' ? IMAGE_LIMITS.variations : 1

  // Rolling 24h quotas, per device and per network.
  const since = since24h()
  const [[byDevice], [byIp]] = await Promise.all([
    db
      .select({ n: count() })
      .from(images)
      .where(and(eq(images.deviceId, deviceId), gte(images.createdAt, since))),
    db
      .select({ n: count() })
      .from(images)
      .where(and(eq(images.ipHash, ip), gte(images.createdAt, since))),
  ])
  const usedDevice = Number(byDevice?.n ?? 0)
  if (usedDevice + n > IMAGE_LIMITS.perDevice)
    throw new StudioError(
      usedDevice >= IMAGE_LIMITS.perDevice
        ? `You’ve used all ${IMAGE_LIMITS.perDevice} free images for the last 24 hours. Try again later.`
        : `This needs ${n} images but only ${IMAGE_LIMITS.perDevice - usedDevice} are left today.`,
      429,
    )
  if (Number(byIp?.n ?? 0) + n > IMAGE_LIMITS.perNetwork)
    throw new StudioError(
      'Too many images have been created from this network today. Try again later.',
      429,
    )

  const results = await Promise.allSettled(
    Array.from({ length: n }, (_, i) => {
      const text = buildInstruction(tool, prompt, style, i)
      const parts: Part[] = source ? [source, { text }] : [{ text }]
      return callModel(parts, tool === 'generate' ? ratio : undefined)
    }),
  )
  const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  if (ok.length === 0) {
    const first = results[0]
    throw first.status === 'rejected' && first.reason instanceof StudioError
      ? first.reason
      : new StudioError('No image was created. Please try again.', 502)
  }

  const blobs = store()
  const rows: ImageRecord[] = []
  for (const img of ok) {
    const id = randomUUID()
    const blobKey = `${deviceId}/${id}`
    await blobs.set(blobKey, new Blob([new Uint8Array(img.data)]), {
      metadata: { mimeType: img.mimeType },
    })
    const [row] = await db
      .insert(images)
      .values({
        id,
        deviceId,
        ipHash: ip,
        tool,
        prompt,
        style: tool === 'generate' ? style : null,
        ratio: tool === 'generate' ? ratio : null,
        model: IMAGE_MODEL,
        blobKey,
        mimeType: img.mimeType,
        bytes: img.data.byteLength,
      })
      .returning()
    rows.push(row)
  }
  return {
    images: rows.map(toClient),
    failed: n - ok.length,
    usage: await usage(deviceId),
  }
}

const idSchema = z.string().uuid()

async function findOwned(deviceId: string, id: string) {
  if (!idSchema.safeParse(id).success) throw new StudioError('Not found.', 404)
  const [row] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, id), eq(images.deviceId, deviceId)))
  if (!row) throw new StudioError('Not found.', 404)
  return row
}

/** Image bytes. Ids are unguessable UUIDs so <img src> works without headers. */
export async function readImage(id: string) {
  if (!idSchema.safeParse(id).success) throw new StudioError('Not found.', 404)
  const [row] = await db.select().from(images).where(eq(images.id, id))
  if (!row) throw new StudioError('Not found.', 404)
  const data = await store().get(row.blobKey, { type: 'arrayBuffer' })
  if (!data) throw new StudioError('Not found.', 404)
  return { data, mimeType: row.mimeType }
}

export async function setSaved(request: Request, id: string) {
  const deviceId = deviceFrom(request)
  await findOwned(deviceId, id)
  const body = z
    .object({ saved: z.boolean() })
    .safeParse(await request.json().catch(() => null))
  if (!body.success) throw new StudioError('Invalid request.')
  const [row] = await db
    .update(images)
    .set({ saved: body.data.saved })
    .where(and(eq(images.id, id), eq(images.deviceId, deviceId)))
    .returning()
  return toClient(row)
}

export async function deleteImage(request: Request, id: string) {
  const deviceId = deviceFrom(request)
  const row = await findOwned(deviceId, id)
  await store().delete(row.blobKey)
  await db
    .delete(images)
    .where(and(eq(images.id, id), eq(images.deviceId, deviceId)))
}

export function errorResponse(err: unknown) {
  if (err instanceof StudioError)
    return Response.json({ error: err.message }, { status: err.status })
  console.error('Image Studio error', err)
  return Response.json(
    { error: 'Image Studio hit an unexpected error. Please try again.' },
    { status: 500 },
  )
}
