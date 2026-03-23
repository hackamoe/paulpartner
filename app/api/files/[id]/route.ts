import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getFileContent, getFileMetadata } from '@/lib/drive'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  try {
    const [content, meta] = await Promise.all([
      getFileContent(params.id),
      getFileMetadata(params.id),
    ])
    return NextResponse.json({ content, meta })
  } catch (err) {
    console.error('File fetch error:', err)
    return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 })
  }
}
