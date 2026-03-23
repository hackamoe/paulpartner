# Paul Portal — Deployment Guide

## Was das ist
Ein privates Workspace-Portal für Paul. Login mit Passwort, File-Browser aus Google Drive, HTML-Vorschau im iFrame, Kommentare per Datei.

---

## Setup in 4 Schritten

### Schritt 1 — Google Drive Service Account einrichten

1. Geh zu: https://console.cloud.google.com
2. Neues Projekt erstellen (z.B. "paul-portal")
3. APIs aktivieren: **Google Drive API** aktivieren
4. "IAM & Admin" → "Service Accounts" → "Service Account erstellen"
   - Name: `paul-portal`
   - Rolle: nicht nötig, einfach weiter
5. Den neuen Service Account anklicken → "Schlüssel" → "Schlüssel hinzufügen" → JSON
   - JSON-Datei wird heruntergeladen → darin findest du `client_email` und `private_key`
6. In Google Drive:
   - Erstelle einen Ordner (z.B. "dpk ventures Workspace")
   - Rechtsklick → Freigeben → die `client_email` des Service Accounts hinzufügen (Betrachter-Zugriff reicht)
   - Die Ordner-ID aus der URL kopieren: `drive.google.com/drive/folders/DIESE_ID_HIER`

### Schritt 2 — GitHub Repository erstellen

1. Geh zu https://github.com → "New repository"
2. Name: `paul-portal`, private
3. Diesen Ordner (`paul-portal/`) hochladen oder mit `git push` pushen:
   ```bash
   cd paul-portal
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/DEIN_USER/paul-portal.git
   git push -u origin main
   ```

### Schritt 3 — Vercel deployen

1. Geh zu https://vercel.com → "Add New Project"
2. GitHub Repo importieren
3. Framework: **Next.js** (wird automatisch erkannt)
4. **Vor dem Deploy**: Environment Variables setzen:

   | Key | Value |
   |-----|-------|
   | `PORTAL_PASSWORD` | z.B. `paul2025` (frei wählbar) |
   | `JWT_SECRET` | ein langer random string, z.B. `xK9mP2qR8vL4nJ7wE1tA5cF6hB3dG0y` |
   | `GOOGLE_CLIENT_EMAIL` | die `client_email` aus dem JSON |
   | `GOOGLE_PRIVATE_KEY` | den kompletten `private_key` aus dem JSON (mit `\n`) |
   | `GOOGLE_DRIVE_FOLDER_ID` | die Ordner-ID aus Google Drive |

5. "Deploy" klicken → fertig!

### Schritt 4 — Vercel KV aktivieren (für Kommentare)

1. Im Vercel Dashboard: Projekt → "Storage" Tab
2. "Create Database" → "KV (Redis)"
3. Name: `paul-portal-kv`
4. "Connect to Project" → dein Projekt auswählen
5. Die KV-Variablen werden **automatisch** zum Projekt hinzugefügt
6. Nochmal deployen: "Deployments" → "Redeploy"

---

## Dateien in Google Drive verwalten

Einfach Dateien in den freigegebenen Ordner legen — sie erscheinen sofort im Portal.
Unterstützte Formate: HTML, PDF, Bilder, Excel, Word, alle anderen Dateitypen (als Text/Raw).

Die HTML-Dateien aus diesem Projekt (landing page, system architecture) einfach in den Drive-Ordner hochladen.

---

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local
# .env.local mit echten Werten befüllen
npm run dev
```

Dann: http://localhost:3000

---

## Passwort ändern

In Vercel Dashboard → Projekt → Settings → Environment Variables → `PORTAL_PASSWORD` ändern → Redeploy.
