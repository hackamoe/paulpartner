import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive'],
    })
    await auth.authorize()
    const token = await auth.getAccessToken()

    const bytes = await file.arrayBuffer()
    const metadata = JSON.stringify({ name: file.name, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] })

    const body = new FormData()
    body.append('metadata', new Blob([metadata], { type: 'application/json' }))
    body.append('file', new Blob([bytes], { type: file.type || 'application/octet-stream' }))

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.token}` },
      body,
    })

    const data = await res.json()
    return NextResponse.json({ file: data })
  } catch (err: any) {
    console.error('Upload error:', err?.message || err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen', detail: err?.message }, { status: 500 })
  }
}
