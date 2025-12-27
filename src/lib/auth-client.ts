import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
})

const { useSession, signOut, getSession } = authClient

export { getSession, signOut, useSession }
