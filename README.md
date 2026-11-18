# UniSync — deploy guide

## Folder layout (already set up in the zip)

```
unisync/
├─ netlify.toml
├─ package.json
├─ netlify/functions/api.mjs     <- shared backend (this is what makes changes visible to every user)
└─ public/
   ├─ index.html
   ├─ style.css
   └─ app.js
```

## Deploy (pick one)

**A. GitHub (easiest, recommended)**
1. Put this folder in a GitHub repo.
2. Netlify → Add new site → Import from Git → choose the repo. Build settings are read from `netlify.toml`.

**B. Netlify CLI**
```
npm install
npm install -g netlify-cli
netlify login
netlify link          # or: netlify init
netlify deploy --prod
```

> Dragging only the `public` folder onto Netlify will still show the site, but WITHOUT the backend:
> the app then runs in "This device only" mode and other users will not see admin changes.

## Set your admin password (important)

Netlify → Site configuration → Environment variables → add `ADMIN_PASSWORD` with a strong password, then redeploy.
Until you do, the fallback password is `Admin@12345`. You can also change it inside the app (Admin → Password).
Your old password was visible in the public JavaScript of the previous version — treat it as compromised and do not reuse it.

## How it works
- Everyone loads data from `/api/db`; the page re-checks every 15 seconds, so admin changes appear for all users shortly.
- Only requests carrying the correct admin password can write. The check happens on the server.
- Assignment "Mark Done" and quiz scores are per student, saved in that student's own browser.
- Attachments (PDF/PNG/JPG/WEBP) are limited to 5 MB (Netlify Function request limit is ~6 MB).
- The Bus "GPS" is a manually updated status, not real GPS. Real tracking would need a GPS device/API feed.
