import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { kv } from '@/lib/kv'

export interface Link {
  id: string
  name: string
  url: string
  createdAt: string
  addedBy: string
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const links = await kv.lrange<Link>('links', 0, -1)
  return NextResponse.json({ links: links || [] })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, url, addedBy } = await req.json()
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'Name und URL sind Pflicht' }, { status: 400 })
  }

  let finalUrl = url.trim()
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl
  }

  const link: Link = {
    id: crypto.randomUUID(),
    name: name.trim(),
    url: finalUrl,
    createdAt: new Date().toISOString(),
    addedBy: addedBy || 'Daniel',
  }

  await kv.lpush('links', link)
  return NextResponse.json({ link })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await req.json()
  const links = await kv.lrange<Link>('links', 0, -1)
  const updated = links.filter(l => l.id !== id)
  await kv.del('links')
  if (updated.length > 0) await kv.rpush('links', ...updated)
  return NextResponse.json({ ok: true })
}
