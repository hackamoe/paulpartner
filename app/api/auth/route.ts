import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
  }

  const token = await createToken()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('portal_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
    path: '/',
  })
  return res
}
