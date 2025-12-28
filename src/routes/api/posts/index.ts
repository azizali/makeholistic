import { db } from '@/db'
import { user } from '@/db/schema/auth'
import { post } from '@/db/schema/posts'
import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'

// GET /api/posts - List all published posts (public)
// POST /api/posts - Create post (admin only)
export const Route = createFileRoute('/api/posts/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const posts = await db
            .select({
              id: post.id,
              title: post.title,
              slug: post.slug,
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
            .where(eq(post.published, true))
            .orderBy(desc(post.createdAt))

          return Response.json(posts)
        } catch (error) {
          console.error('Error fetching posts:', error)
          return Response.json(
            { error: 'Failed to fetch posts' },
            { status: 500 },
          )
        }
      },

      POST: async ({ request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const userData = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1)

          if (!userData[0] || userData[0].role !== 'admin') {
            return Response.json(
              { error: 'Forbidden: Admin access required' },
              { status: 403 },
            )
          }

          const body = await request.json()
          const { title, content, excerpt, published = false } = body

          if (!title || !content) {
            return Response.json(
              { error: 'Title and content are required' },
              { status: 400 },
            )
          }

          // Generate slug from title
          const slug =
            title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') +
            '-' +
            randomUUID().slice(0, 8)

          const newArticle = await db
            .insert(post)
            .values({
              id: randomUUID(),
              title,
              slug,
              content,
              excerpt,
              published,
              authorId: session.user.id,
            })
            .returning()

          return Response.json(newArticle[0], { status: 201 })
        } catch (error) {
          console.error('Error creating post:', error)
          return Response.json(
            { error: 'Failed to create post' },
            { status: 500 },
          )
        }
      },
    },
  },
})
