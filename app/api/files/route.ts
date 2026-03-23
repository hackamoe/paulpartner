import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { listFiles } from '@/lib/drive'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  try {
    const files = await listFiles()
    return NextResponse.json({ files })
  } catch (err) {
    console.error('Drive error:', err)
    return NextResponse.json({ error: 'Drive-Fehler' }, { status: 500 })
  }
}
