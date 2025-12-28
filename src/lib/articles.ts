import { db } from '@/db'
import { article } from '@/db/schema/articles'
import { user } from '@/db/schema/auth'
import { auth } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

// GET all published articles (public)
export const getArticles = createServerFn().handler(async () => {
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

  return articles
})

// GET all articles including unpublished (admin only)
export const getArticlesAdmin = createServerFn().handler(
  async ({ request }) => {
    await checkIsAdmin(request)

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
      .orderBy(desc(article.createdAt))

    return articles
  },
)

// GET single article by ID
const GetArticleSchema = z.object({
  id: z.string(),
})

export const getArticle = createServerFn()
  .inputValidator(GetArticleSchema.parse)
  .handler(async ({ data }) => {
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
      .where(eq(article.id, data.id))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Article not found')
    }

    return result[0]
  })

// Check if slug is available
const CheckSlugSchema = z.object({
  slug: z.string(),
  excludeId: z.string().optional(),
})

export const checkSlugAvailability = createServerFn()
  .inputValidator(CheckSlugSchema.parse)
  .handler(async ({ data, request }) => {
    await checkIsAdmin(request)

    const existing = await db
      .select({ id: article.id })
      .from(article)
      .where(eq(article.slug, data.slug))
      .limit(1)

    // If excludeId is provided (editing existing article), check if the found article is the same one
    if (existing.length > 0 && existing[0].id !== data.excludeId) {
      return { available: false, message: 'Slug is already taken' }
    }

    return { available: true, message: 'Slug is available' }
  })

// GET article by slug
const GetArticleBySlugSchema = z.object({
  slug: z.string(),
})

export const getArticleBySlug = createServerFn()
  .inputValidator(GetArticleBySlugSchema.parse)
  .handler(async ({ data }) => {
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
      .where(eq(article.slug, data.slug))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Article not found')
    }

    return result[0]
  })

// Helper to check if user is admin
async function checkIsAdmin(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!userData[0] || (userData[0] as any).role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  return session.user.id
}

// POST create article (admin only)
const CreateArticleSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug must be lowercase letters, numbers, and hyphens only',
    }),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
})

export const createArticle = createServerFn({ method: 'POST' })
  .inputValidator(CreateArticleSchema.parse)
  .handler(async ({ data, request }) => {
    const userId = await checkIsAdmin(request)

    const newArticle = await db
      .insert(article)
      .values({
        id: randomUUID(),
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        published: data.published,
        authorId: userId,
      })
      .returning()

    return newArticle[0]
  })

// PUT update article (admin only)
const UpdateArticleSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug must be lowercase letters, numbers, and hyphens only',
    })
    .optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  published: z.boolean().optional(),
})

export const updateArticle = createServerFn({ method: 'POST' })
  .inputValidator(UpdateArticleSchema.parse)
  .handler(async ({ data, request }) => {
    await checkIsAdmin(request)

    const { id, ...updates } = data

    const updated = await db
      .update(article)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(article.id, id))
      .returning()

    if (updated.length === 0) {
      throw new Error('Article not found')
    }

    return updated[0]
  })

// DELETE article (admin only)
const DeleteArticleSchema = z.object({
  id: z.string(),
})

export const deleteArticle = createServerFn({ method: 'POST' })
  .inputValidator(DeleteArticleSchema.parse)
  .handler(async ({ data, request }) => {
    await checkIsAdmin(request)

    const deleted = await db
      .delete(article)
      .where(eq(article.id, data.id))
      .returning()

    if (deleted.length === 0) {
      throw new Error('Article not found')
    }

    return { success: true, message: 'Article deleted successfully' }
  })
