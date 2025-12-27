import { authClient } from '@/lib/auth-client'
import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
      },
    },
  })
  return {
    queryClient,
  }
}

// Provider for the Wrap component (without router context)
export function QueryProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>{children}</AuthQueryProvider>
    </QueryClientProvider>
  )
}

// Auth UI Provider that needs router context - use inside routes
export function AuthUIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <AuthUIProviderTanstack
      credentials={false}
      social={{ providers: ['google'] }}
      authClient={authClient}
      navigate={(href) => router.navigate({ to: href })}
      replace={(href) => router.navigate({ to: href, replace: true })}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
    >
      {children}
    </AuthUIProviderTanstack>
  )
}
