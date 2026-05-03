import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/connexion' },
})

// Pages that require an authenticated session.
export const config = {
  matcher: [
    '/compte/:path*',
    '/messagerie/:path*',
    '/deposer/:path*',
  ],
}
