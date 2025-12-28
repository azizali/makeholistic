import { db } from '@/db'
import { article } from '@/db/schema/articles'
import { user } from '@/db/schema/auth'
import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

// GET /api/articles/:id - Get single article
// PUT /api/articles/:id - Update article (admin only)
// DELETE /api/articles/:id - Delete article (admin only)
export const Route = createFileRoute('/api/articles/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { id } = params

          const result = await db
            .select({
              id: article.id,
              title: article.title,
              slug: article.slug,
              content: article.content,
              excerpt: article.excerpt,
              published: article.published,
              createdAt: article.createdAt,
              updatedAt: article.updatedAt,
              author: {
                id: user.id,
                name: user.name,
                image: user.image,
              },
            })
            .from(article)
            .leftJoin(user, eq(article.authorId, user.id))
            .where(eq(article.id, id))
            .limit(1)

          if (result.length === 0) {
            return Response.json(
              { error: 'Article not found' },
              { status: 404 },
            )
          }

          return Response.json(result[0])
        } catch (error) {
          console.error('Error fetching article:', error)
          return Response.json(
            { error: 'Failed to fetch article' },
            { status: 500 },
          )
        }
      },

      PUT: async ({ request, params }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const userData = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
          })

          if (userData?.role !== 'admin') {
            return Response.json(
              { error: 'Forbidden: Admin access required' },
              { status: 403 },
            )
          }

          const { id } = params
          const body = await request.json()
          const { title, content, excerpt, published } = body

          const updated = await db
            .update(article)
            .set({
              ...(title && { title }),
              ...(content && { content }),
              ...(excerpt !== undefined && { excerpt }),
              ...(published !== undefined && { published }),
              updatedAt: new Date(),
            })
            .where(eq(article.id, id))
            .returning()

          if (updated.length === 0) {
            return Response.json(
              { error: 'Article not found' },
              { status: 404 },
            )
          }

          return Response.json(updated[0])
        } catch (error) {
          console.error('Error updating article:', error)
          return Response.json(
            { error: 'Failed to update article' },
            { status: 500 },
          )
        }
      },

      DELETE: async ({ request, params }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const userData = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
          })

          if (userData?.role !== 'admin') {
            return Response.json(
              { error: 'Forbidden: Admin access required' },
              { status: 403 },
            )
          }

          const { id } = params

          const deleted = await db
            .delete(article)
            .where(eq(article.id, id))
            .returning()

          if (deleted.length === 0) {
            return Response.json(
              { error: 'Article not found' },
              { status: 404 },
            )
          }

          return Response.json({ message: 'Article deleted successfully' })
        } catch (error) {
          console.error('Error deleting article:', error)
          return Response.json(
            { error: 'Failed to delete article' },
            { status: 500 },
          )
        }
      },
    },
  },
})
