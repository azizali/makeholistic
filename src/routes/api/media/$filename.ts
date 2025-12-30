import { getStore } from '@netlify/blobs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/media/$filename')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { filename } = params

        try {
          const store = getStore('media')
          const blob = await store.get(filename, { type: 'stream' })
          const metadata = await store.getMetadata(filename)

          if (!blob) {
            return new Response('Image not found', { status: 404 })
          }

          const headers = new Headers()
          if (metadata?.metadata?.contentType) {
            headers.set('Content-Type', metadata.metadata.contentType)
          }
          headers.set('Cache-Control', 'public, max-age=31536000, immutable')

          return new Response(blob, { headers })
        } catch (error) {
          console.error('Error serving media:', error)
          return new Response('Internal Server Error', { status: 500 })
        }
      },
    },
  },
})
