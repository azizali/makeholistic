import { Link } from '@tanstack/react-router'

export default function Header() {
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
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
