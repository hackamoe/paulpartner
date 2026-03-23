import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
)

export async function createToken() {
  return new SignJWT({ auth: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const token = cookieStore.get('portal_auth')?.value
  if (!token) return false
  return verifyToken(token)
}
