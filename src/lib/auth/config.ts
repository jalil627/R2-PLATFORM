import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { OAuthConfig } from 'next-auth/providers'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { reserveMemberNo } from '@/lib/member-no'
import { rateLimit } from '@/lib/rate-limit'

interface GoogleProfile {
  sub: string
  name?: string | null
  email?: string | null
  picture?: string | null
  email_verified?: boolean
}

function googleOAuth(options: { clientId: string; clientSecret: string }): OAuthConfig<GoogleProfile> {
  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    issuer: 'https://accounts.google.com',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    // Google asserts ownership of the address (we additionally require
    // profile.email_verified below), so an existing same-email account may be
    // linked instead of failing with OAuthAccountNotLinked.
    allowDangerousEmailAccountLinking: true,
    authorization: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: { scope: 'email profile' },
    },
    token: {
      url: 'https://oauth2.googleapis.com/token',
    },
    userinfo: {
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name || profile.email?.split('@')[0] || '',
        email: profile.email,
        image: profile.picture,
        // Carried through so signIn can refuse to link an unverified address
        // to an existing account (pre-account-takeover).
        emailVerified: profile.email_verified === true ? new Date() : null,
      }
    },
    checks: ['state', 'pkce'],
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
    csrfToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
    callbackUrl: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          googleOAuth({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).trim().toLowerCase()

        // Throttle per account: without this, credential-stuffing can try
        // passwords at full speed. Keyed by email since authorize() has no request.
        const attempt = rateLimit(`login:${email}`, { windowMs: 15 * 60_000, max: 10 })
        if (!attempt.ok) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash || !user.isActive || user.isBanned) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!isValid) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
  ],
  events: {
    // Runs right after Auth.js core creates + links an OAuth user (Google).
    // Completing a Google flow proves address ownership, so the address is
    // marked verified and the platform row (memberNo/profile) is provisioned.
    // Event errors never break login; signIn backfills anything missing.
    async createUser({ user }) {
      const userId = user.id
      if (!userId) return
      try {
        await prisma.$transaction(async (tx) => {
          const memberNo = await reserveMemberNo(tx)
          await tx.user.update({
            where: { id: userId },
            data: { memberNo, emailVerified: new Date(), lastLoginAt: new Date() },
          })
          await tx.profile.upsert({
            where: { userId },
            update: {},
            create: { userId },
          })
        })
      } catch (error) {
        console.error('[Auth] createUser provisioning failed for', userId, error)
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id || token.id
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(userId) },
          select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, isBanned: true },
        })
        // Re-checked on every request: a ban, deactivation or deletion must take
        // effect immediately instead of when the 30-day JWT finally expires.
        // Returning null invalidates the session.
        if (!dbUser || dbUser.isBanned || !dbUser.isActive) return null
        token.id = dbUser.id
        token.role = dbUser.role
        token.avatar = dbUser.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        const sUser = session.user as { id?: string; role?: string; avatar?: string | null }
        sUser.id = token.id as string
        sUser.role = token.role as string
        sUser.avatar = token.avatar as string | null
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Decide from the FRESH Google assertion, never from the stored
        // user row: for returning users `user` is the DB record whose
        // emailVerified may be null, which used to lock them out forever.
        const googleProfile = profile as { email_verified?: boolean } | null
        if (googleProfile?.email_verified !== true) return false

        const email = (user.email || '').trim().toLowerCase()
        if (!email) return false

        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, memberNo: true, isActive: true, isBanned: true, profile: { select: { id: true } } },
        })
        // Banned/deactivated accounts must not be reachable via OAuth either.
        if (existingUser && (existingUser.isBanned || !existingUser.isActive)) return false
        if (existingUser) {
          user.id = existingUser.id
          await prisma.user.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } })
          await prisma.$transaction(async (tx) => {
            if (!existingUser.memberNo) {
              const memberNo = await reserveMemberNo(tx)
              await tx.user.update({ where: { id: existingUser.id }, data: { memberNo } })
            }
            if (!existingUser.profile) {
              await tx.profile.create({ data: { userId: existingUser.id } })
            }
          })
        }
        // New users: return true and let Auth.js core create + link the
        // account. Provisioning (memberNo/profile/emailVerified) happens in
        // events.createUser. Creating the row here would make core throw
        // OAuthAccountNotLinked and break every new Google signup.
        return true
      }
      return true
    },
  },
})
