import { Card } from '@/components/ui/card'
import { getArticles } from '@/lib/articles'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/articles/')({
  component: ArticlesList,
})

type Article = {
  id: string
  title: string
  slug: string
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

function ArticlesList() {
  const getArticlesFn = useServerFn(getArticles)

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['articles'],
    queryFn: () => getArticlesFn(),
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Articles</h1>

      {isLoading ? (
        <div>Loading articles...</div>
      ) : (
        <div className="grid gap-6">
          {articles?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No articles published yet.
            </Card>
          ) : (
            articles?.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h2 className="text-2xl font-semibold mb-2">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-muted-foreground mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {article.author.image && (
                      <img
                        src={article.author.image}
                        alt={article.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{article.author.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
