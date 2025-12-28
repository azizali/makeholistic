import { db } from '@/db'
import { user } from '@/db/schema/auth'
import { post } from '@/db/schema/posts'
import { auth } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

// GET all published posts (public)
export const getPosts = createServerFn().handler(async () => {
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

  return posts
})

// GET all posts including unpublished (admin only)
export const getPostsAdmin = createServerFn().handler(async ({ request }) => {
  await checkIsAdmin(request)

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
    .orderBy(desc(post.createdAt))

  return posts
})

// GET single post by ID
const GetPostSchema = z.object({
  id: z.string(),
})

export const getPost = createServerFn()
  .inputValidator(GetPostSchema.parse)
  .handler(async ({ data }) => {
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
      .where(eq(post.id, data.id))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Post not found')
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
      .select({ id: post.id })
      .from(post)
      .where(eq(post.slug, data.slug))
      .limit(1)

    // If excludeId is provided (editing existing post), check if the found post is the same one
    if (existing.length > 0 && existing[0].id !== data.excludeId) {
      return { available: false, message: 'Slug is already taken' }
    }

    return { available: true, message: 'Slug is available' }
  })

// GET post by slug
const GetPostBySlugSchema = z.object({
  slug: z.string(),
})

export const getPostBySlug = createServerFn()
  .inputValidator(GetPostBySlugSchema.parse)
  .handler(async ({ data }) => {
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
      .where(eq(post.slug, data.slug))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Post not found')
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

// POST create post (admin only)
const CreatePostSchema = z.object({
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

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema.parse)
  .handler(async ({ data, request }) => {
    const userId = await checkIsAdmin(request)

    const newPost = await db
      .insert(post)
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

    return newPost[0]
  })

// PUT update post (admin only)
const UpdatePostSchema = z.object({
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

export const updatePost = createServerFn({ method: 'POST' })
  .inputValidator(UpdatePostSchema.parse)
  .handler(async ({ data, request }) => {
    await checkIsAdmin(request)

    const { id, ...updates } = data

    const updated = await db
      .update(post)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(post.id, id))
      .returning()

    if (updated.length === 0) {
      throw new Error('Post not found')
    }

    return updated[0]
  })

// DELETE post (admin only)
const DeletePostSchema = z.object({
  id: z.string(),
})

export const deletePost = createServerFn({ method: 'POST' })
  .inputValidator(DeletePostSchema.parse)
  .handler(async ({ data, request }) => {
    await checkIsAdmin(request)

    const deleted = await db
      .delete(post)
      .where(eq(post.id, data.id))
      .returning()

    if (deleted.length === 0) {
      throw new Error('Post not found')
    }

    return { success: true, message: 'Post deleted successfully' }
  })
