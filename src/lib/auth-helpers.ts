import { db } from '@/db'
import { user } from '@/db/schema/auth'
import { auth } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

export const checkAdminAuth = createServerFn().handler(
  async ({ request }: { request: Request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return { authenticated: false, isAdmin: false }
    }

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const isAdmin = userData[0] && userData[0].role === 'admin'

    return {
      authenticated: true,
      isAdmin,
      userId: session.user.id,
    }
  },
)
