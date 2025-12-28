import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const post = pgTable(
  'post',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    published: boolean('published').default(false).notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('post_authorId_idx').on(table.authorId),
    index('post_slug_idx').on(table.slug),
    index('post_published_idx').on(table.published),
  ],
)

export const postRelations = relations(post, ({ one }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
}))

export type Post = typeof post.$inferSelect
export type NewPost = typeof post.$inferInsert
export type PostId = Post['id']
export type PostWithAuthor = Post & { author: UserBasicInfo }

export type UserBasicInfo = {
  id: string
  name: string
  image: string | null
}
