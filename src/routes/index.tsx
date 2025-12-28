import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Handle search logic here
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            makeHolistic
          </h1>
          <p className="text-muted-foreground text-lg">
            Find what you need, when you need it
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search makeHolistic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-2 focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-3 justify-center">
            <Button type="submit" variant="secondary" size="lg">
              Search
            </Button>
            <Button type="button" variant="secondary" size="lg">
              I'm Feeling Lucky
            </Button>
          </div>
        </form>

        {/* Quick Links */}
        <div className="pt-8">
          <p className="text-sm text-muted-foreground mb-3">Quick links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm">
              About
            </Button>
            <Button variant="outline" size="sm">
              Services
            </Button>
            <Button variant="outline" size="sm">
              Contact
            </Button>
            <Button variant="outline" size="sm">
              Blog
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
