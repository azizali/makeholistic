import { Card } from '@/components/ui/card'
import { getArticleBySlug } from '@/lib/articles'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/articles/$slug')({
  component: ArticleDetail,
})

type Article = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    image: string | null
  }
}

function ArticleDetail() {
  const { slug } = Route.useParams()
  const getArticleBySlugFn = useServerFn(getArticleBySlug)

  const {
    data: article,
    isLoading,
    error,
  } = useQuery<Article>({
    queryKey: ['article-by-slug', slug],
    queryFn: () => getArticleBySlugFn({ data: { slug } }),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        Loading article...
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="p-8 text-center text-muted-foreground">
          Article not found
        </Card>
      </div>
    )
  }

  return (
    <article className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          {article.author.image && (
            <img
              src={article.author.image}
              alt={article.author.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="font-medium text-foreground">
              {article.author.name}
            </div>
            <div>{new Date(article.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          {article.content.split('\n').map((paragraph, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Card>
    </article>
  )
}
