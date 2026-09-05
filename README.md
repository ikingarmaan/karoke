# KaraokePlayer 🎧 — Google Drive Cloud Music Player & Contact Site

A modern, high-aesthetic two-page web application designed to stream karaoke and music tracks directly from Google Drive:
1. **Home Page (`index.html`)**: A complete music media player streaming audio live from your Google Drive folder.
2. **Contact Page (`contact.html`)**: An interactive contact page with a message form, social badges, and a floating mini-player.

> **Connected Google Drive Folder:** [Karaoke songs](https://drive.google.com/drive/folders/1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh) (`1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh`)
> **Zero Audio Download:** No songs are stored locally on disk; every track streams directly on demand from Google Drive.

---

## ✨ Features

- ☁️ **Direct Google Drive Streaming Engine**: Converts Google Drive file IDs into streaming endpoints with zero local file downloads.
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
  - Instant search and song filtering
  - Equalizer animation on currently playing track
  - Direct link to your Google Drive folder
- 🔄 **1-Click Google Drive Folder Synchronizer**:
  - Run `python3 sync_drive.py` anytime you add new songs to your Google Drive folder, and the site automatically updates!
- ➕ **In-Browser "Add Drive Track" Modal**: Paste any Google Drive file link directly into the website to play immediately.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile browsers.
- 📬 **Interactive Contact Page**: Form validation, feedback alerts, creator social links, and bottom sticky mini-player.

---

## 🚀 How to Run Locally

### Option 1: Open Directly in Browser
```bash
open /Users/ikingarmaan/Downloads/karoke/index.html
```

### Option 2: Run with Python's Local Web Server
```bash
cd /Users/ikingarmaan/Downloads/karoke
python3 -m http.server 8080
```
Then visit:
- **Player:** [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Contact Page:** [http://localhost:8080/contact.html](http://localhost:8080/contact.html)

---

## 📂 Synchronizing Songs from Google Drive

Your site is connected to:
`https://drive.google.com/drive/folders/1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh`

### When You Add New Songs to Your Google Drive Folder:
1. Upload your `.mp3`, `.m4a`, `.wav`, or `.ogg` audio files to the folder in Google Drive.
2. In your terminal, run:
   ```bash
   cd /Users/ikingarmaan/Downloads/karoke
   python3 sync_drive.py
   ```
3. The script scans your Google Drive folder, formats the song names, updates `js/playlist.js`, and makes all new tracks immediately playable on the website!

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
│   ├── playlist.js         # Connected Google Drive playlist configuration
│   ├── player.js           # Playback engine, seeking, controls, shortcuts
│   ├── visualizer.js       # HTML5 Canvas spectrum visualizer
│   └── contact.js          # Contact form handler & mini-player preview
├── sync_drive.py           # Automated Google Drive folder synchronizer
├── playlist.json           # Cached JSON metadata of Drive tracks
└── README.md               # Documentation & usage guide
```
