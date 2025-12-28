import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { deleteArticle, getArticlesAdmin } from '@/lib/articles'
import { checkAdminAuth } from '@/lib/auth-helpers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

export const Route = createFileRoute('/admin/articles/')({
  loader: async () => {
    const authResult = await checkAdminAuth()

    if (!authResult.authenticated) {
      throw redirect({ to: '/auth/$authView', params: { authView: 'sign-in' } })
    }

    if (!authResult.isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }
  },
  component: AdminArticles,
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

function AdminArticles() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getArticlesAdminFn = useServerFn(getArticlesAdmin)
  const deleteArticleFn = useServerFn(deleteArticle)

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['admin-articles'],
    queryFn: () => getArticlesAdminFn(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArticleFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] })
      setDeleteId(null)
    },
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Articles</h1>
        <Button
          onClick={() =>
            navigate({ to: '/admin/articles/$id', params: { id: 'new' } })
          }
        >
          Create New Article
        </Button>
      </div>

      {isLoading ? (
        <div>Loading articles...</div>
      ) : (
        <div className="grid gap-4">
          {articles?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No articles yet. Create your first article!
            </Card>
          ) : (
            articles?.map((article) => (
              <Card key={article.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{article.title}</h2>
                      {article.published ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      by {article.author.name} •{' '}
                      {new Date(article.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/admin/articles/$id',
                          params: { id: article.id },
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(article.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
