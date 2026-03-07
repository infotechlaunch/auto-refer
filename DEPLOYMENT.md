# ITL AutoPilot™ — Deployment Guide

---

## Backend Setup (Local / VPS / Railway / Render)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your real values:
#   DATABASE_URL  — Neon PostgreSQL connection string
#   JWT_SECRET    — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#   CORS_ORIGIN   — your Bluehost domain, e.g. https://yourdomain.com
#   GEMINI_API_KEY— from https://aistudio.google.com/app/apikey
```

### 3. Initialize database & seed
```bash
npm run seed
```

### 4. Start server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The backend API runs on **http://localhost:3000/api** by default.

---

## Frontend — Deploy to Bluehost

### 1. Set your production API URL
Edit `frontend/.env.production` and set `VITE_API_URL` to your deployed backend URL:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. Build the frontend
```bash
cd frontend
npm install
npm run build
```
This creates a `frontend/dist/` folder with all static files.

### 3. Upload to Bluehost
1. Log in to **Bluehost cPanel → File Manager**
2. Navigate to `public_html/` (or a subfolder if deploying to a subdirectory)
3. Upload **all files and folders from `frontend/dist/`** into `public_html/`
   - You can also use FTP (FileZilla) — host: `ftp.yourdomain.com`
4. The `.htaccess` file is automatically included in the dist build (copied from `public/.htaccess`)

### 4. Verify
Visit `https://yourdomain.com` — the app should load.
If you refresh a page and get a 404, double-check the `.htaccess` file is in `public_html/`.

---

## Project Structure Summary

```
auto-refer/
├── backend/          ← Node.js / Express API (deploy to VPS, Railway, Render, etc.)
│   ├── .env.example  ← copy to .env and fill in real values
│   └── src/
│       └── server.js
└── frontend/         ← React + Vite (deploy static build to Bluehost)
    ├── .env.production  ← set VITE_API_URL to your backend URL
    └── dist/            ← upload contents of this folder to Bluehost public_html/
```

---

## Where to host the Backend

Bluehost shared hosting **cannot** run Node.js. Host your backend on one of:
- **Railway** — https://railway.app (free tier available)
- **Render** — https://render.com (free tier available)
- **VPS** (DigitalOcean, Linode, Hetzner) — full control
- **Bluehost VPS / Cloud** plan — supports Node.js via cPanel Node.js Selector
