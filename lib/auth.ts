import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

/**
 * NextAuth (v4) configuration.
 *
 * - Strategy: JWT — required for the Credentials provider; the Prisma
 *   adapter is still wired so we can layer LinkedIn / Google later
 *   (those providers will create rows in `Account`).
 * - The session token carries `id`, `verified` and `profile` so the UI
 *   can render the LPT-vérifié badge without an extra round-trip.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/connexion',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email + mot de passe',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null
        const user = await prisma.user.findUnique({
          where: { email: creds.email.toLowerCase() },
        })
        if (!user?.passwordHash) return null
        const ok = await bcrypt.compare(creds.password, user.passwordHash)
        if (!ok) return null
        return {
          id:       user.id,
          email:    user.email,
          name:     user.name,
          image:    user.image,
          verified: user.verified,
          profile:  user.profile,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.verified = user.verified
        token.profile = user.profile
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.verified = (token.verified as boolean) ?? false
        session.user.profile = (token.profile as string | null) ?? null
      }
      return session
    },
  },
}
