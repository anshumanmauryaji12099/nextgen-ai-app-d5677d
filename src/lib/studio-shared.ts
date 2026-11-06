/** Types and limits shared by the Image Studio client and server. */
export const IMAGE_LIMITS = {
  perDevice: 10,
  perNetwork: 30,
  variations: 2,
  maxUploadBytes: 10 * 1024 * 1024,
}

export type StudioTool =
  'generate' | 'edit' | 'background' | 'enhance' | 'variations'

export type StudioImage = {
  id: string
  tool: StudioTool
  prompt: string
  style: string | null
  ratio: string | null
  model: string
  saved: boolean
  createdAt: string
  url: string
}

export type StudioUsage = { used: number; limit: number; remaining: number }
