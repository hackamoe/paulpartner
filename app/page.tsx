'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './portal.module.css'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
}

interface FileMeta {
  fileId: string
  customName?: string
  description?: string
}

interface Comment {
  id: string
  fileId: string
  text: string
  author: string
  createdAt: string
}

interface Link {
  id: string
  name: string
  url: string
  createdAt: string
  addedBy: string
}

type View = 'login' | 'files' | 'viewer'

export default function Portal() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [files, setFiles] = useState<DriveFile[]>([])
  const [fileMetas, setFileMetas] = useState<Record<string, FileMeta>>({})
  const [filesLoading, setFilesLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Links
  const [links, setLinks] = useState<Link[]>([])
  const [showAddLink, setShowAddLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)

  const [activeFile, setActiveFile] = useState<DriveFile | null>(null)
  const [activeMeta, setActiveMeta] = useState<FileMeta | null>(null)
  const [fileLoading, setFileLoading] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [editNameVal, setEditNameVal] = useState('')
  const [editDescVal, setEditDescVal] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch('/api/files').then(r => {
      if (r.ok) { setView('files'); loadFiles(); loadLinks() }
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
      if (res.ok) { setView('files'); loadFiles(); loadLinks() }
      else setLoginError('Falsches Passwort.')
    } finally { setLoginLoading(false) }
  }

  async function loadFiles() {
    setFilesLoading(true)
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      const fileList: DriveFile[] = data.files || []
      setFiles(fileList)
      const metas = await Promise.all(
        fileList.map(f => fetch(`/api/filemeta?fileId=${f.id}`).then(r => r.json()))
      )
      const metaMap: Record<string, FileMeta> = {}
      metas.forEach((m, i) => { if (m.meta) metaMap[fileList[i].id] = m.meta })
      setFileMetas(metaMap)
    } finally { setFilesLoading(false) }
  }

  async function loadLinks() {
    const res = await fetch('/api/links')
    const data = await res.json()
    setLinks(data.links || [])
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    if (!newLinkName.trim() || !newLinkUrl.trim()) return
    setLinkLoading(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLinkName, url: newLinkUrl, addedBy: 'Daniel' }),
      })
      const data = await res.json()
      setLinks(prev => [data.link, ...prev])
      setNewLinkName('')
      setNewLinkUrl('')
      setShowAddLink(false)
    } finally { setLinkLoading(false) }
  }

  async function deleteLink(id: string) {
    await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      setUploadProgress(`Uploading ${file.name}…`)
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/upload', { method: 'POST', body: fd })
    }
    setUploadProgress('')
    setUploading(false)
    loadFiles()
  }

  async function openFile(file: DriveFile) {
    setActiveFile(file)
    setView('viewer')
    setFileLoading(true)
    setComments([])
    setEditingName(false)
    setEditingDesc(false)
    const meta = fileMetas[file.id] || null
    setActiveMeta(meta)
    setEditNameVal(meta?.customName || file.name)
    setEditDescVal(meta?.description || '')
    try {
      const commentsRes = await fetch(`/api/comments?fileId=${file.id}`)
      const commentsData = await commentsRes.json()
      setComments(commentsData.comments || [])
    } finally { setFileLoading(false) }
  }

  async function saveMeta() {
    if (!activeFile) return
    setSavingMeta(true)
    const res = await fetch('/api/filemeta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: activeFile.id, customName: editNameVal, description: editDescVal }),
    })
    const data = await res.json()
    setActiveMeta(data.meta)
    setFileMetas(prev => ({ ...prev, [activeFile.id]: data.meta }))
    setEditingName(false)
    setEditingDesc(false)
    setSavingMeta(false)
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
    } finally { setCommentLoading(false) }
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

  function getDomain(url: string) {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  }

  const filtered = files.filter(f => {
    const meta = fileMetas[f.id]
    const s = search.toLowerCase()
    return f.name.toLowerCase().includes(s) ||
      meta?.customName?.toLowerCase().includes(s) ||
      meta?.description?.toLowerCase().includes(s)
  })

  // ─── LOGIN ───
  if (view === 'login') {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}><span className={styles.loginLogoDot} />dpk ventures</div>
          <h1 className={styles.loginTitle}>Workspace</h1>
          <p className={styles.loginSub}>Nur für interne Nutzung.</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input type="password" placeholder="Passwort eingeben" value={password}
              onChange={e => setPassword(e.target.value)} className={styles.loginInput} autoFocus />
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
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            dpk ventures <span className={styles.logoSep}>·</span> Workspace
          </div>
          <div className={styles.filesHeaderRight}>
            <input className={styles.searchInput} placeholder="Suchen…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className={styles.refreshBtn} onClick={loadFiles}>↻</button>
          </div>
        </div>

        <div className={styles.filesLayout}>
          {/* Left: Files */}
          <div className={styles.filesMain}>
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneDrag : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={e => handleUpload(e.target.files)} />
              {uploading
                ? <span className={styles.uploadStatus}>{uploadProgress}</span>
                : <span className={styles.uploadHint}>
                    <span className={styles.uploadIcon}>↑</span>
                    Dateien reinziehen oder klicken — direkt in Google Drive
                  </span>
              }
            </div>

            <div className={styles.filesCount}>
              {filesLoading ? 'Lade Dateien…' : `${filtered.length} Dateien`}
            </div>

            {filesLoading ? (
              <div className={styles.loading}><div className={styles.loadingDot} /></div>
            ) : (
              <div className={styles.fileGrid}>
                {filtered.map(file => {
                  const meta = fileMetas[file.id]
                  return (
                    <div key={file.id} className={styles.fileCard} onClick={() => openFile(file)}>
                      <div className={styles.fileCardTop}>
                        <span className={styles.fileIcon}>{getFileIcon(file.mimeType)}</span>
                        <span className={styles.fileType}>{getFileType(file.mimeType)}</span>
                      </div>
                      <div className={styles.fileName}>{meta?.customName || file.name}</div>
                      {meta?.description && <div className={styles.fileDesc}>{meta.description}</div>}
                      <div className={styles.fileMeta}>
                        <span>{formatDate(file.modifiedTime)}</span>
                        {file.size && <span>{formatSize(file.size)}</span>}
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && !filesLoading && (
                  <div className={styles.empty}>Keine Dateien gefunden.</div>
                )}
              </div>
            )}
          </div>

          {/* Right: Links */}
          <div className={styles.linksSidebar}>
            <div className={styles.linksHeader}>
              <span className={styles.linksTitle}>Links</span>
              <button className={styles.addLinkBtn} onClick={() => setShowAddLink(v => !v)}>
                {showAddLink ? '✕' : '+ Link'}
              </button>
            </div>

            {showAddLink && (
              <form onSubmit={addLink} className={styles.addLinkForm}>
                <input
                  className={styles.linkInput}
                  placeholder="Name des Links"
                  value={newLinkName}
                  onChange={e => setNewLinkName(e.target.value)}
                  autoFocus
                />
                <input
                  className={styles.linkInput}
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                />
                <button type="submit" className={styles.linkSubmitBtn} disabled={linkLoading}>
                  {linkLoading ? '…' : 'Hinzufügen'}
                </button>
              </form>
            )}

            <div className={styles.linksList}>
              {links.length === 0 ? (
                <p className={styles.noLinks}>Noch keine Links.</p>
              ) : links.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkItem}
                >
                  <div className={styles.linkItemLeft}>
                    <div className={styles.linkFavicon}>
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${getDomain(link.url)}&sz=16`}
                        width={14} height={14} alt=""
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div>
                      <div className={styles.linkName}>{link.name}</div>
                      <div className={styles.linkDomain}>{getDomain(link.url)}</div>
                    </div>
                  </div>
                  <button
                    className={styles.deleteLinkBtn}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); deleteLink(link.id) }}
                    title="Löschen"
                  >×</button>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── VIEWER ───
  return (
    <div className={styles.viewerWrap}>
      <div className={styles.viewerTopbar}>
        <button className={styles.backBtn} onClick={() => setView('files')}>← Zurück</button>
        <div className={styles.viewerFileName}>
          {editingName ? (
            <input className={styles.editNameInput} value={editNameVal}
              onChange={e => setEditNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveMeta(); if (e.key === 'Escape') setEditingName(false) }}
              autoFocus />
          ) : (
            <span className={styles.viewerFileNameText} onClick={() => setEditingName(true)}>
              {activeMeta?.customName || activeFile?.name}
              <span className={styles.editHint}> ✎</span>
            </span>
          )}
        </div>
        <div className={styles.viewerActions}>
          <span className={styles.viewerType}>{activeFile ? getFileType(activeFile.mimeType) : ''}</span>
          {(editingName || editingDesc) && (
            <button className={styles.saveBtn} onClick={saveMeta} disabled={savingMeta}>
              {savingMeta ? '…' : 'Speichern'}
            </button>
          )}
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? 'Kommentare ausblenden' : `Kommentare (${comments.length})`}
          </button>
        </div>
      </div>

      <div className={styles.viewerBody}>
        <div className={styles.viewerMain}>
          <div className={styles.descBar}>
            {editingDesc ? (
              <input className={styles.editDescInput} value={editDescVal}
                onChange={e => setEditDescVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveMeta(); if (e.key === 'Escape') setEditingDesc(false) }}
                placeholder="Kurze Beschreibung…" autoFocus />
            ) : (
              <span className={styles.descText} onClick={() => setEditingDesc(true)}>
                {activeMeta?.description || <span className={styles.descPlaceholder}>+ Beschreibung hinzufügen</span>}
                <span className={styles.editHint}> ✎</span>
              </span>
            )}
          </div>

          {fileLoading ? (
            <div className={styles.loading}><div className={styles.loadingDot} /></div>
          ) : activeFile?.mimeType === 'text/html' ? (
            <iframe ref={iframeRef} src={`/api/files/${activeFile.id}/html`}
              className={styles.viewerIframe} title={activeFile.name} />
          ) : activeFile?.mimeType.includes('image') ? (
            <div className={styles.imageWrap}>
              <img src={`/api/files/${activeFile.id}`} alt={activeFile?.name} className={styles.viewerImage} />
            </div>
          ) : (
            <div className={styles.rawContent}><pre>Vorschau nicht verfügbar</pre></div>
          )}
        </div>

        {sidebarOpen && (
          <div className={styles.commentsSidebar}>
            <div className={styles.commentsHeader}>
              <span className={styles.commentsTitle}>Kommentare</span>
              <span className={styles.commentsCount}>{comments.length}</span>
            </div>
            <form onSubmit={addComment} className={styles.commentForm}>
              <textarea className={styles.commentInput} placeholder="Kommentar schreiben…"
                value={newComment} onChange={e => setNewComment(e.target.value)} rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(e as any) }} />
              <button type="submit" className={styles.commentBtn} disabled={commentLoading || !newComment.trim()}>
                {commentLoading ? '…' : 'Senden ↵'}
              </button>
              <p className={styles.commentHint}>⌘+Enter zum Senden</p>
            </form>
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>Noch keine Kommentare.</p>
              ) : comments.map(comment => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{comment.author}</span>
                    <span className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <button className={styles.deleteComment} onClick={() => deleteComment(comment.id)}>×</button>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
