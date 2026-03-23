import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { kv } from '@vercel/kv'

export interface Comment {
  id: string
  fileId: string
  text: string
  author: string
  createdAt: string
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const fileId = req.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ comments: [] })

  const comments = await kv.lrange<Comment>(`comments:${fileId}`, 0, -1)
  return NextResponse.json({ comments: comments.reverse() })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { fileId, text, author } = await req.json()
  if (!fileId || !text?.trim()) {
    return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 })
  }

  const comment: Comment = {
    id: crypto.randomUUID(),
    fileId,
    text: text.trim(),
    author: author || 'Paul',
    createdAt: new Date().toISOString(),
  }

  await kv.lpush(`comments:${fileId}`, comment)
  return NextResponse.json({ comment })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { fileId, commentId } = await req.json()
  const comments = await kv.lrange<Comment>(`comments:${fileId}`, 0, -1)
  const updated = comments.filter(c => c.id !== commentId)

  await kv.del(`comments:${fileId}`)
  if (updated.length > 0) {
    await kv.rpush(`comments:${fileId}`, ...updated)
  }

  return NextResponse.json({ ok: true })
}
