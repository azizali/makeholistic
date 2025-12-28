import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    originalFilename: text('original_filename').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(), // in bytes
    url: text('url').notNull(),
    uploadedBy: text('uploaded_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('media_uploaded_by_idx').on(table.uploadedBy),
    index('media_created_at_idx').on(table.createdAt),
  ],
)
