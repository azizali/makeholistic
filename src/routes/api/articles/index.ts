import { db } from '@/db'
import { article } from '@/db/schema/articles'
import { user } from '@/db/schema/auth'
import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'

// GET /api/articles - List all published articles (public)
// POST /api/articles - Create article (admin only)
export const Route = createFileRoute('/api/articles/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const articles = await db
            .select({
              id: article.id,
              title: article.title,
              slug: article.slug,
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
            .where(eq(article.published, true))
            .orderBy(desc(article.createdAt))

          return Response.json(articles)
        } catch (error) {
          console.error('Error fetching articles:', error)
          return Response.json(
            { error: 'Failed to fetch articles' },
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
            .insert(article)
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
          console.error('Error creating article:', error)
          return Response.json(
            { error: 'Failed to create article' },
            { status: 500 },
          )
        }
      },
    },
  },
})
