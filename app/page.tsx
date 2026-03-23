'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './portal.module.css'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
}

interface Comment {
  id: string
  fileId: string
  text: string
  author: string
  createdAt: string
}

type View = 'login' | 'files' | 'viewer'

export default function Portal() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [files, setFiles] = useState<DriveFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [activeFile, setActiveFile] = useState<DriveFile | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [fileLoading, setFileLoading] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check if already logged in
  useEffect(() => {
    fetch('/api/files').then(r => {
      if (r.ok) {
        setView('files')
        loadFiles()
      }
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setView('files')
        loadFiles()
      } else {
        setLoginError('Falsches Passwort.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  async function loadFiles() {
    setFilesLoading(true)
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setFiles(data.files || [])
    } finally {
      setFilesLoading(false)
    }
  }

  async function openFile(file: DriveFile) {
    setActiveFile(file)
    setView('viewer')
    setFileLoading(true)
    setFileContent('')
    setComments([])
    try {
      const [fileRes, commentsRes] = await Promise.all([
        fetch(`/api/files/${file.id}`),
        fetch(`/api/comments?fileId=${file.id}`),
      ])
      const fileData = await fileRes.json()
      const commentsData = await commentsRes.json()
      setFileContent(fileData.content || '')
      setComments(commentsData.comments || [])
    } finally {
      setFileLoading(false)
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !activeFile) return
    setCommentLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: activeFile.id, text: newComment, author: 'Paul' }),
      })
      const data = await res.json()
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
    } finally {
      setCommentLoading(false)
    }
  }

  async function deleteComment(commentId: string) {
    if (!activeFile) return
    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: activeFile.id, commentId }),
    })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  function getFileIcon(mimeType: string) {
    if (mimeType === 'text/html') return '◻'
    if (mimeType.includes('pdf')) return '◼'
    if (mimeType.includes('image')) return '◈'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '◧'
    if (mimeType.includes('document') || mimeType.includes('word')) return '◨'
    return '◦'
  }

  function getFileType(mimeType: string) {
    if (mimeType === 'text/html') return 'HTML'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('image')) return 'IMG'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'DOC'
    return 'FILE'
  }

  function formatDate(iso?: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function formatSize(bytes?: string) {
    if (!bytes) return ''
    const n = parseInt(bytes)
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
    if (n > 1024) return `${(n / 1024).toFixed(0)} KB`
    return `${n} B`
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  // ─── LOGIN SCREEN ───
  if (view === 'login') {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>
            <span className={styles.loginLogoDot} />
            dpk ventures
          </div>
          <h1 className={styles.loginTitle}>Workspace</h1>
          <p className={styles.loginSub}>Nur für interne Nutzung.</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              placeholder="Passwort eingeben"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.loginInput}
              autoFocus
            />
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button type="submit" className={styles.loginBtn} disabled={loginLoading}>
              {loginLoading ? 'Einen Moment…' : 'Einloggen →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── FILE BROWSER ───
  if (view === 'files') {
    return (
      <div className={styles.filesWrap}>
        <div className={styles.filesHeader}>
          <div className={styles.filesHeaderLeft}>
            <div className={styles.logo}>
              <span className={styles.logoDot} />
              dpk ventures <span className={styles.logoSep}>·</span> Workspace
            </div>
          </div>
          <div className={styles.filesHeaderRight}>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                placeholder="Datei suchen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className={styles.refreshBtn} onClick={loadFiles}>↻</button>
          </div>
        </div>

        <div className={styles.filesBody}>
          <div className={styles.filesCount}>
            {filesLoading ? 'Lade Dateien…' : `${filtered.length} Dateien`}
          </div>
          {filesLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingDot} />
            </div>
          ) : (
            <div className={styles.fileGrid}>
              {filtered.map(file => (
                <div
                  key={file.id}
                  className={styles.fileCard}
                  onClick={() => openFile(file)}
                >
                  <div className={styles.fileCardTop}>
                    <span className={styles.fileIcon}>{getFileIcon(file.mimeType)}</span>
                    <span className={styles.fileType}>{getFileType(file.mimeType)}</span>
                  </div>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileMeta}>
                    <span>{formatDate(file.modifiedTime)}</span>
                    {file.size && <span>{formatSize(file.size)}</span>}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !filesLoading && (
                <div className={styles.empty}>Keine Dateien gefunden.</div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── FILE VIEWER ───
  return (
    <div className={styles.viewerWrap}>
      {/* Top bar */}
      <div className={styles.viewerTopbar}>
        <button className={styles.backBtn} onClick={() => setView('files')}>
          ← Zurück
        </button>
        <div className={styles.viewerFileName}>{activeFile?.name}</div>
        <div className={styles.viewerActions}>
          <span className={styles.viewerType}>
            {activeFile ? getFileType(activeFile.mimeType) : ''}
          </span>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? 'Kommentare ausblenden' : `Kommentare (${comments.length})`}
          </button>
        </div>
      </div>

      <div className={styles.viewerBody}>
        {/* Main content */}
        <div className={styles.viewerMain}>
          {fileLoading ? (
            <div className={styles.loading}><div className={styles.loadingDot} /></div>
          ) : activeFile?.mimeType === 'text/html' ? (
            <iframe
              ref={iframeRef}
              
              className={styles.viewerIframe}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={activeFile.name}
            />
          ) : activeFile?.mimeType.includes('image') ? (
            <div className={styles.imageWrap}>
              <img
                src={`/api/files/${activeFile.id}/html`}
                alt={activeFile.name}
                className={styles.viewerImage}
              />
            </div>
          ) : (
            <div className={styles.rawContent}>
              <pre>{fileContent}</pre>
            </div>
          )}
        </div>

        {/* Comments sidebar */}
        {sidebarOpen && (
          <div className={styles.commentsSidebar}>
            <div className={styles.commentsHeader}>
              <span className={styles.commentsTitle}>Kommentare</span>
              <span className={styles.commentsCount}>{comments.length}</span>
            </div>

            <form onSubmit={addComment} className={styles.commentForm}>
              <textarea
                className={styles.commentInput}
                placeholder="Kommentar schreiben…"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(e)
                }}
              />
              <button
                type="submit"
                className={styles.commentBtn}
                disabled={commentLoading || !newComment.trim()}
              >
                {commentLoading ? '…' : 'Senden ↵'}
              </button>
              <p className={styles.commentHint}>⌘+Enter zum Senden</p>
            </form>

            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>Noch keine Kommentare.</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{comment.author}</span>
                      <span className={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <button
                        className={styles.deleteComment}
                        onClick={() => deleteComment(comment.id)}
                        title="Löschen"
                      >×</button>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
