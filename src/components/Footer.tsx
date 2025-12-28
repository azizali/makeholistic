import { Link } from '@tanstack/react-router'

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:underline">
              About
            </Link>
            <Link to="/" className="hover:underline">
              Privacy
            </Link>
            <Link to="/" className="hover:underline">
              Terms
            </Link>
            <Link to="/" className="hover:underline">
              Contact
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} makeHolistic. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
