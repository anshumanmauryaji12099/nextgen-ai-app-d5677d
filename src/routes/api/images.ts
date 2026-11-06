import { createFileRoute } from '@tanstack/react-router'
import {
  createImages,
  deviceFrom,
  errorResponse,
  listImages,
  usage,
} from '@/server/images'

export const Route = createFileRoute('/api/images')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const deviceId = deviceFrom(request)
          const [list, u] = await Promise.all([
            listImages(deviceId),
            usage(deviceId),
          ])
          return Response.json(
            { images: list, usage: u },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        } catch (err) {
          return errorResponse(err)
        }
      },
      POST: async ({ request }) => {
        try {
          return Response.json(await createImages(request), { status: 201 })
        } catch (err) {
          return errorResponse(err)
        }
      },
    },
  },
})
