import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const article = pgTable(
  'article',
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

export const articleRelations = relations(article, ({ one }) => ({
  author: one(user, {
    fields: [article.authorId],
    references: [user.id],
  }),
}))

export type Article = typeof article.$inferSelect
export type NewArticle = typeof article.$inferInsert
export type ArticleId = Article['id']
export type ArticleWithAuthor = Article & { author: UserBasicInfo }

export type UserBasicInfo = {
  id: string
  name: string
  image: string | null
}
