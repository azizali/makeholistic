import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { checkAdminAuth } from '@/lib/auth-helpers'
import {
  checkSlugAvailability,
  createArticle,
  getArticle,
  updateArticle,
} from '@/lib/posts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useId, useState } from 'react'

export const Route = createFileRoute('/admin/posts/$id')({
  loader: async () => {
    const authResult = await checkAdminAuth()

    if (!authResult.authenticated) {
      throw redirect({ to: '/auth/$authView', params: { authView: 'sign-in' } })
    }

    if (!authResult.isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }
  },
  component: EditArticle,
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
}

function EditArticle() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = id === 'new'

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [published, setPublished] = useState(false)
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean
    available?: boolean
    message?: string
  }>({ checking: false })

  const getArticleFn = useServerFn(getArticle)
  const createArticleFn = useServerFn(createArticle)
  const updateArticleFn = useServerFn(updateArticle)
  const checkSlugFn = useServerFn(checkSlugAvailability)

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus({ checking: false })
      return
    }

    setSlugStatus({ checking: true })
    const timer = setTimeout(async () => {
      try {
        const result = await checkSlugFn({
          data: { slug, excludeId: isNew ? undefined : id },
        })
        setSlugStatus({
          checking: false,
          available: result.available,
          message: result.message,
        })
      } catch (error) {
        setSlugStatus({
          checking: false,
          available: false,
          message: 'Error checking slug availability',
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [slug, id, isNew, checkSlugFn])

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: () => getArticleFn({ data: { id } }),
    enabled: !isNew,
  })

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setSlug(post.slug)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setPublished(post.published)
    }
  }, [post])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        return createArticleFn({
          data: { title, slug, content, excerpt, published },
        })
      }
      return updateArticleFn({
        data: { id, title, slug, content, excerpt, published },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', id] })
      navigate({ to: '/admin/posts' })
    },
  })

  if (isLoading && !isNew) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isNew ? 'Create Post' : 'Edit Post'}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/admin/posts' })}
        >
          Cancel
        </Button>
      </div>

      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id={`title-${useId}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id={`slug-${useId}`}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="post-url-slug"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              required
              className={
                slugStatus.available === false
                  ? 'border-destructive'
                  : slugStatus.available === true
                    ? 'border-green-500'
                    : ''
              }
            />
            {slugStatus.checking ? (
              <p className="text-xs text-muted-foreground">
                Checking availability...
              </p>
            ) : slugStatus.message ? (
              <p
                className={`text-xs ${
                  slugStatus.available ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {slugStatus.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Textarea
              id={`excerpt-${useId}`}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary of the post"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id={`content-${useId}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post content"
              rows={15}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={`published-${useId}`}
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published">Published</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={
                saveMutation.isPending ||
                slugStatus.available === false ||
                slugStatus.checking
              }
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Post'}
            </Button>
            {saveMutation.isError && (
              <p className="text-sm text-destructive">
                Error: {saveMutation.error?.message}
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
