import { authClient, useSession } from '@/lib/auth-client'
import { Link } from '@tanstack/react-router'

export default function Header() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              makeHolistic
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/posts"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Posts
            </Link>
            {session ? (
              <>
                <Link
                  to="/admin/posts"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manage
                </Link>
                <div className="flex items-center gap-3 pl-2 ml-2 border-l">
                  <span className="text-sm text-muted-foreground">
                    {session?.user?.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/auth/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
