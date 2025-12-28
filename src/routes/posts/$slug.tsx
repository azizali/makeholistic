import { Card } from '@/components/ui/card'
import { getPostBySlug } from '@/lib/posts'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/posts/$slug')({
  component: PostDetail,
})

type Post = {
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

function PostDetail() {
  const { slug } = Route.useParams()
  const getPostBySlugFn = useServerFn(getPostBySlug)

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<Post>({
    queryKey: ['post-by-slug', slug],
    queryFn: () => getPostBySlugFn({ data: { slug } }),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        Loading post...
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="p-8 text-center text-muted-foreground">
          Post not found
        </Card>
      </div>
    )
  }

  return (
    <article className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          {post.author.image && (
            <img
              src={post.author.image}
              alt={post.author.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="font-medium text-foreground">
              {post.author.name}
            </div>
            <div>{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          {/** biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </Card>
    </article>
  )
}
