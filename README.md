# KaraokePlayer 🎧 — Google Drive Cloud Music Player & Contact Site

A modern, high-aesthetic web application designed to stream karaoke and music tracks directly from your Google Drive folder:
1. **Home Page (`/` / `index.html`)**: A complete music media player streaming audio live from your Google Drive folder with live auto-sync.
2. **Contact Page (`/contact` / `contact.html`)**: An interactive contact page with a message form, social badges, and a floating mini-player.

> **Connected Google Drive Folder:** [Karaoke songs](https://drive.google.com/drive/folders/1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh) (`1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh`)
> **Zero Audio Download:** No songs are stored locally on disk; every track streams directly on demand from Google Drive.
> **Live Auto-Sync:** Any new song added to the Google Drive folder appears automatically on the site!

---

## ✨ Features

- ☁️ **Live Auto-Sync & Streaming**: Any song uploaded to your Google Drive folder is automatically detected and listed on the website live without manual rebuilding or local file storage.
- 📀 **Animated Spinning Vinyl Record**: Dynamically rotates when audio is playing, featuring album artwork and vinyl grooves.
- 📊 **Real-time Canvas Audio Spectrum**: Visualizer reacts to sound frequencies with glowing neon gradients.
- 🎚️ **Full Playback Controls**:
  - Play / Pause (with keyboard `Space` support)
  - Previous / Next track
  - Shuffle mode & Repeat modes (Repeat All, Repeat Single Track)
  - Scrubber / Seek bar with elapsed and total duration
  - Volume slider and one-click mute (`M`)
- 📋 **Karaoke Playlist Vault**:
  - Displays all songs from your Google Drive folder
  - Live search and song filtering
  - Equalizer animation on currently playing track
  - One-click **Auto-Sync** button to instantly refresh
- 🚀 **Render-Ready**: Native `render.yaml`, `Procfile`, and `requirements.txt` configured for 1-click cloud deployment.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile browsers.

---

## ☁️ How to Deploy on Render

### Step 1: Open Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service** (or **Blueprint** to use `render.yaml`).

### Step 2: Connect Your GitHub Repository
1. Select your repository: **`ikingarmaan/karoke`**.
2. Render automatically recognizes `render.yaml`!
   *(Or fill in the settings manually if creating a standard Web Service):*
   - **Environment:** `Python`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `python -m gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60`
   - **Health Check Path:** `/healthz`
   - **Plan:** Free

### Step 3: Click Deploy 🎉
Your site will be live on your personal Render URL (e.g. `https://karoke-xxxx.onrender.com`) in ~60 seconds!

---

## 🔄 How Auto-Sync Works

Your site is configured with a backend API endpoint (`/api/tracks`) that connects directly to your Google Drive folder:
`https://drive.google.com/drive/folders/1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh`

### When You Add New Songs to Google Drive:
1. Upload your audio file (`.mp3`, `.m4a`, `.wav`, `.ogg`) into your Google Drive folder.
2. Ensure the file sharing is set to **"Anyone with the link can view"**.
3. **That's it!**
   - When visitors open or refresh the site, the new songs appear automatically.
   - The player also checks every 30 seconds in the background and updates the song list live!
   - You can also click the **Auto-Sync** button on the page for an instant refresh.

---

## 🚀 How to Run Locally

### Start Local Python Server:
```bash
cd /Users/ikingarmaan/Downloads/karoke
python3 app.py
```
Then visit:
- **Player:** [http://localhost:8080](http://localhost:8080)
- **Contact Link:** [https://mohdarmaan.up.railway.app/contact](https://mohdarmaan.up.railway.app/contact)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `→` | Seek forward 5 seconds (or `Shift + →` for Next track) |
| `←` | Seek backward 5 seconds (or `Shift + ←` for Previous track) |
| `M` | Mute / Unmute volume |

---

## 📁 File Structure

```
karoke/
├── app.py                  # Flask web service with live Google Drive auto-sync
├── render.yaml             # Render infrastructure blueprint
├── Procfile                # Gunicorn process manager for Render
├── requirements.txt        # Production dependencies (Flask, Gunicorn)
├── .python-version         # Python version pin for Render (3.11.9)
├── index.html              # Main Home Page (Music Media Player)
├── css/
│   └── style.css           # Glassmorphism, animations, responsive styles
├── js/
│   ├── player.js           # Playback engine, seeking, live auto-sync
│   ├── playlist.js         # Fallback playlist data & URL converter
│   ├── visualizer.js       # HTML5 Canvas spectrum visualizer
├── sync_drive.py           # CLI sync tool for offline builds
├── playlist.json           # Cached JSON metadata of Drive tracks
└── README.md               # Documentation & usage guide
```
