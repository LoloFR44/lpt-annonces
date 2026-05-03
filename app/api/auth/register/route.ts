import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma, UserProfile } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const VALID_PROFILES = new Set<UserProfile>([
  UserProfile.FOUNDER,
  UserProfile.REPRENEUR,
  UserProfile.FREELANCE,
  UserProfile.INVESTOR,
  UserProfile.PARTNER,
  UserProfile.OTHER,
])

interface RegisterPayload {
  email?: unknown
  password?: unknown
  firstName?: unknown
  lastName?: unknown
  profile?: unknown
}

export async function POST(req: Request) {
  let body: RegisterPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 })
  }

  const email     = typeof body.email     === 'string' ? body.email.trim().toLowerCase() : ''
  const password  = typeof body.password  === 'string' ? body.password  : ''
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName  = typeof body.lastName  === 'string' ? body.lastName.trim()  : ''
  const profileRaw = typeof body.profile  === 'string' ? body.profile.toUpperCase() : ''

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum' }, { status: 400 })
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'Prénom et nom obligatoires' }, { status: 400 })
  }

  const profile = VALID_PROFILES.has(profileRaw as UserProfile)
    ? (profileRaw as UserProfile)
    : UserProfile.OTHER

  const passwordHash = await bcrypt.hash(password, 10)
  const name = `${firstName} ${lastName}`

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash, profile },
      select: { id: true, email: true, name: true },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 409 })
    }
    console.error('register error', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
