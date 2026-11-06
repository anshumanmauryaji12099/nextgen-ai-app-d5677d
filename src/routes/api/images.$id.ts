import { createFileRoute } from '@tanstack/react-router'
import {
  deleteImage,
  errorResponse,
  readImage,
  setSaved,
} from '@/server/images'

export const Route = createFileRoute('/api/images/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { data, mimeType } = await readImage(params.id)
          return new Response(data, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'private, max-age=31536000, immutable',
            },
          })
        } catch (err) {
          return errorResponse(err)
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          return Response.json(await setSaved(request, params.id))
        } catch (err) {
          return errorResponse(err)
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          await deleteImage(request, params.id)
          return new Response(null, { status: 204 })
        } catch (err) {
          return errorResponse(err)
        }
      },
    },
  },
})
