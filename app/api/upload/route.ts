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
    const drive = google.drive({ version: 'v3', auth })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const res = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: buffer,
      },
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
    })

    return NextResponse.json({ file: res.data })
  } catch (err: any) {
    console.error('Upload error:', err?.message || err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen', detail: err?.message }, { status: 500 })
  }
}
