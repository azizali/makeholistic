import { db } from '@/db'
import { media } from '@/db/schema/media'
import { getStore } from '@netlify/blobs'
import { createServerFn } from '@tanstack/react-start'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { checkAdminAuth } from './auth-helpers'

const uploadImageSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  base64Data: z.string(),
})

export const uploadImage = createServerFn({ method: 'POST' })
  .inputValidator(uploadImageSchema.parse)
  .handler(async ({ data }) => {
    // Check admin authentication
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      // Initialize Netlify Blobs store
      const store = getStore('media')

      // Generate unique filename
      const fileExt = data.filename.split('.').pop() || 'jpg'
      const uniqueFilename = `${randomUUID()}.${fileExt}`

      // Convert base64 to buffer
      const buffer = Buffer.from(data.base64Data, 'base64')

      // Check if we should use Blobs
      const useBlobs = process.env.VITE_USE_NETLIFY_BLOBS === 'true'

      let publicUrl: string

      if (!useBlobs) {
        // For local dev without Blobs enabled, use data URL (base64)
        publicUrl = `data:${data.contentType};base64,${data.base64Data}`
      } else {
        // Upload to Netlify Blobs
        await store.set(uniqueFilename, buffer.buffer, {
          metadata: {
            contentType: data.contentType,
            originalFilename: data.filename,
            uploadedBy: authResult.userId,
            uploadedAt: new Date().toISOString(),
          },
        })

        // Get the proper blob URL
        // We use our own API route to serve the blob, wrapped in Netlify Image CDN
        const sourceUrl = `/api/media/${uniqueFilename}`
        publicUrl = `/.netlify/images?url=${encodeURIComponent(sourceUrl)}`
      }

      // Save to database for tracking
      const [mediaRecord] = await db
        .insert(media)
        .values({
          id: randomUUID(),
          filename: uniqueFilename,
          originalFilename: data.filename,
          contentType: data.contentType,
          size: buffer.length,
          url: publicUrl,
          uploadedBy: authResult.userId,
        })
        .returning()

      return {
        success: true,
        url: publicUrl,
        id: mediaRecord.id,
      }
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })

const deleteMediaSchema = z.object({ id: z.string() })

export const deleteMedia = createServerFn({ method: 'POST' })
  .inputValidator(deleteMediaSchema.parse)
  .handler(async ({ data }) => {
    // Check admin authentication
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      // Get media record
      const [mediaRecord] = await db
        .select()
        .from(media)
        .where(eq(media.id, data.id))
        .limit(1)

      if (!mediaRecord) {
        throw new Error('Media not found')
      }

      // Delete from Netlify Blobs
      const store = getStore('media')
      await store.delete(mediaRecord.filename)

      // Delete from database
      await db.delete(media).where(eq(media.id, data.id))

      return { success: true }
    } catch (error) {
      console.error('Media deletion error:', error)
      throw new Error(
        `Failed to delete media: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })
