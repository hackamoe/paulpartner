import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getFileContent } from '@/lib/drive'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticated())) return new NextResponse('Unauthorized', { status: 401 })
  try {
    const content = await getFileContent(params.id)
    return new NextResponse(content, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
