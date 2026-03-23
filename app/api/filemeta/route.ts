import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { kv } from '@/lib/kv'

export interface FileMeta {
  fileId: string
  customName?: string
  description?: string
  updatedAt: string
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const fileId = req.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ meta: null })

  const meta = await kv.get<FileMeta>(`filemeta:${fileId}`)
  return NextResponse.json({ meta })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { fileId, customName, description } = await req.json()
  if (!fileId) return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })

  const meta: FileMeta = {
    fileId,
    customName: customName?.trim() || undefined,
    description: description?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  }
  await kv.set(`filemeta:${fileId}`, meta)
  return NextResponse.json({ meta })
}
