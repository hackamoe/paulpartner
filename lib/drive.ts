import { google } from 'googleapis'

function getDriveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
}

export async function listFiles(): Promise<DriveFile[]> {
  const drive = getDriveClient()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  })

  return (res.data.files as DriveFile[]) || []
}

export async function getFileContent(fileId: string): Promise<string> {
  const drive = getDriveClient()
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  )
  return res.data as string
}

export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  const drive = getDriveClient()
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
  })
  return res.data as DriveFile
}
