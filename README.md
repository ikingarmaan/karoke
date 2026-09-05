# DrivePlayer 🎧 — Google Drive Cloud Music Player & Contact Site

A modern, high-aesthetic two-page web application featuring:
1. **Home Page (`index.html`)**: A complete music media player designed to stream audio directly from Google Drive.
2. **Contact Page (`contact.html`)**: A dedicated contact page with an interactive message form, social channel badges, and a floating mini-player.

---

## ✨ Features

- ☁️ **Google Drive Streaming Engine**: Seamlessly converts Google Drive file links/IDs into direct audio streams (`.mp3`, `.m4a`, `.wav`, `.ogg`).
- 📀 **Animated Spinning Vinyl Record**: Dynamically rotates when audio is playing, showing album artwork and grooves.
- 📊 **Real-time Canvas Audio Spectrum**: Visualizer reacts to sound frequencies with neon cyan/purple gradients.
- 🎚️ **Full Playback Controls**:
  - Play / Pause (with keyboard `Space` support)
  - Previous / Next track
  - Shuffle mode & Repeat modes (Repeat All, Repeat Single Track)
  - Scrubber / Seek bar with elapsed and remaining time
  - Volume slider and one-click mute (`M`)
- 📋 **Interactive Playlist Vault**:
  - Instant search and song filtering
  - Equalizer animation on currently playing track
  - Persistent custom tracks via `localStorage`
- ➕ **In-Browser "Add Drive Track" Modal**: Paste any Google Drive link or file ID directly from your browser to immediately add it to your playlist.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile browsers.
- 📬 **Interactive Contact Page**: Form validation, feedback alerts, creator social links, and a bottom sticky mini-player so your music never stops.

---

## 🚀 How to Run Locally

### Option 1: Open Directly in Browser
You can open `index.html` directly in any web browser (Chrome, Safari, Firefox, Edge):
```bash
open /Users/ikingarmaan/Downloads/karoke/index.html
```

### Option 2: Run with Python's Local Web Server
```bash
cd /Users/ikingarmaan/Downloads/karoke
python3 -m http.server 8080
```
Then visit:
- **Home / Player:** `http://localhost:8080/index.html`
- **Contact Page:** `http://localhost:8080/contact.html`

---

## 📂 How to Play Music from Your Google Drive

### 1. Set Google Drive Sharing Permission
To allow the browser to stream your audio files without requiring a Google sign-in:
1. In Google Drive, right-click your audio file or folder.
2. Select **Share** → **Share**.
3. Under *General access*, change to **"Anyone with the link"** with **Viewer** permission.

### 2. Adding Songs to DrivePlayer

#### Method A: Using the In-Browser UI (Fastest)
1. Open `index.html`.
2. Click **"+ Add Drive Track"** in the top navigation or bottom of the playlist.
3. Paste your Google Drive file link (e.g. `https://drive.google.com/file/d/1A2b3C.../view?usp=sharing`).
4. Enter song title & artist.
5. Click **Add to Playlist & Play Now** — it will start playing immediately!

#### Method B: Share Your Folder Link in Chat
Whenever you're ready, simply paste your Google Drive folder link in this chat. We will parse all files and add them directly to your playlist configuration.

#### Method C: Using the Python Helper Tool
```bash
python3 sync_drive.py "https://drive.google.com/file/d/YOUR_FILE_ID/view" "Song Name" "Artist Name"
```

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
├── index.html              # Main Home Page (Music Media Player)
├── contact.html            # Contact Page (Form, creator links, mini player)
├── css/
│   └── style.css           # Glassmorphism, animations, responsive styles
├── js/
│   ├── playlist.js         # Playlist data & Google Drive URL converter
│   ├── player.js           # Playback engine, seeking, controls, shortcuts
│   ├── visualizer.js       # HTML5 Canvas spectrum visualizer
│   └── contact.js          # Contact form handler & mini-player preview
├── sync_drive.py           # Helper script for Google Drive links
└── README.md               # Documentation & usage guide
```
