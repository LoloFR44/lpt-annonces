import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      verified: boolean
      profile: string | null
    }
  }
  interface User {
    verified?: boolean
    profile?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    verified?: boolean
    profile?: string | null
  }
}
