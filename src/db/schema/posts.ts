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
    index('article_authorId_idx').on(table.authorId),
    index('article_slug_idx').on(table.slug),
    index('article_published_idx').on(table.published),
  ],
)

export const articleRelations = relations(post, ({ one }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
}))

export type Post = typeof post.$inferSelect
export type NewArticle = typeof post.$inferInsert
export type ArticleId = Post['id']
export type ArticleWithAuthor = Post & { author: UserBasicInfo }

export type UserBasicInfo = {
  id: string
  name: string
  image: string | null
}
