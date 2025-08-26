# Loud Librarian (Online) — PWA

A simple, online party game inspired by word-shouting games. Create a room, invite friends, and keep score live.
This repository is **static** (client-only) and uses **Firebase Firestore** for real‑time sync (no servers to run).

## Features
- Create/join room with 6‑letter code (or share URL with `?room=CODE`)
- Live round timer, random letter, random category (English list included)
- Two teams (A/B), tap to add points or penalties
- Host controls rounds; everyone sees the same state instantly
- Installable PWA (works offline for UI; needs internet for multiplayer)

---

## 1) Create your Firebase project
1. Go to https://console.firebase.google.com and click **Add project**.
2. Enable **Firestore Database** (Start in production mode is fine).
3. In **Project settings → General → Your apps**, add a **Web App**.
4. Copy the app config and paste it into `firebase.js` replacing the placeholders:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. In **Firestore → Rules**, you can start with the (lenient) test rules while learning:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomId} {
         allow read, write: if true;
       }
     }
   }
   ```
   Later, tighten these rules (e.g., write only for participants of the room).

> No authentication is required; players are identified by a random local ID stored in the browser.

---

## 2) Put the code on GitHub
1. Create a new GitHub repo (e.g., `loud-librarian`).
2. Download the zip from ChatGPT, unzip it, and drop the files into the repo folder.
3. Commit and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Loud Librarian PWA"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/loud-librarian.git
   git push -u origin main
   ```

---

## 3) Deploy to Netlify
1. Go to https://app.netlify.com and **New site from Git** → choose your GitHub repo.
2. **Build command:** _leave empty_ (static site)
3. **Publish directory:** `/` (root)
4. Deploy. You will get a live URL like `https://your-site-name.netlify.app`.

**Tip:** Set a custom site name under **Site settings → Domain management**.

---

## 4) Invite friends and play
- Share the site link. One person clicks **Create Room** (becomes Host).
- Share the 6‑letter room code or click **Copy** to share the `?room=CODE` link.
- Everyone else enters their name and **Join**.
- Host adjusts settings (round length, letter mode) and clicks **Start Round**.
- A big letter and a category appear for everyone. Host taps **+1** for correct answers and **Penalty** if needed.
- Click **Next Round** to keep going. Highest total wins.

---

## Common Questions

**Q: Do we need accounts?**  
No. This uses Firestore without auth for simplicity (IDs are generated per browser). For serious use, add Firebase Auth and tighten rules.

**Q: Can we play offline?**  
The UI installs offline (PWA), but real-time sync needs internet.

**Q: Can I change the categories?**  
Yes—edit `categories.js` or add other languages to the exported object.

**Q: Is there audio or chat?**  
Not yet. You’ll typically be on a group call (Zoom/Meet/Discord) while playing. We can add in-app voice later using WebRTC if you want.

---

## Local testing
You can open `index.html` directly, but for best results serve locally (service workers prefer HTTP):
```bash
# Option 1: Python 3
python -m http.server 8000
# Option 2: Node
npx serve .
```
Then open http://localhost:8000

---

## PWA
- `manifest.webmanifest`, `sw.js` included.
- Click **Install** in the top-right. Icons provided (maskable).

Enjoy!
