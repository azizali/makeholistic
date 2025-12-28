import { db } from '@/db'
import { user } from '@/db/schema/auth'
import { post } from '@/db/schema/posts'
import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

// GET /api/posts/:id - Get single post
// PUT /api/posts/:id - Update post (admin only)
// DELETE /api/posts/:id - Delete post (admin only)
export const Route = createFileRoute('/api/posts/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { id } = params

          const result = await db
            .select({
              id: post.id,
              title: post.title,
              slug: post.slug,
              content: post.content,
              excerpt: post.excerpt,
              published: post.published,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              author: {
                id: user.id,
                name: user.name,
                image: user.image,
              },
            })
            .from(post)
            .leftJoin(user, eq(post.authorId, user.id))
            .where(eq(post.id, id))
            .limit(1)

          if (result.length === 0) {
            return Response.json({ error: 'Post not found' }, { status: 404 })
          }

          return Response.json(result[0])
        } catch (error) {
          console.error('Error fetching post:', error)
          return Response.json(
            { error: 'Failed to fetch post' },
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
            .update(post)
            .set({
              ...(title && { title }),
              ...(content && { content }),
              ...(excerpt !== undefined && { excerpt }),
              ...(published !== undefined && { published }),
              updatedAt: new Date(),
            })
            .where(eq(post.id, id))
            .returning()

          if (updated.length === 0) {
            return Response.json({ error: 'Post not found' }, { status: 404 })
          }

          return Response.json(updated[0])
        } catch (error) {
          console.error('Error updating post:', error)
          return Response.json(
            { error: 'Failed to update post' },
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
            .delete(post)
            .where(eq(post.id, id))
            .returning()

          if (deleted.length === 0) {
            return Response.json({ error: 'Post not found' }, { status: 404 })
          }

          return Response.json({ message: 'Post deleted successfully' })
        } catch (error) {
          console.error('Error deleting post:', error)
          return Response.json(
            { error: 'Failed to delete post' },
            { status: 500 },
          )
        }
      },
    },
  },
})
