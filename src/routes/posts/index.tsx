import { Card } from '@/components/ui/card'
import { getArticles } from '@/lib/posts'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/posts/')({
  component: ArticlesList,
})

type Post = {
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

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: () => getArticlesFn(),
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>

      {isLoading ? (
        <div>Loading posts...</div>
      ) : (
        <div className="grid gap-6">
          {posts?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No posts published yet.
            </Card>
          ) : (
            posts?.map((post) => (
              <Link
                key={post.id}
                to="/posts/$slug"
                params={{ slug: post.slug }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {post.author.image && (
                      <img
                        src={post.author.image}
                        alt={post.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{post.author.name}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
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
