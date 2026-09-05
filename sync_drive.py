#!/usr/bin/env python3
"""
DrivePlayer - Automated Google Drive Folder & Track Synchronizer
Fetches public Google Drive folder contents and creates direct streaming playlist entries.
Zero local audio storage: music streams 100% directly from Google Drive!
"""

import os
import re
import sys
import json
import ssl
import urllib.request

DEFAULT_FOLDER_ID = "1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PLAYLIST_JS_PATH = os.path.join(SCRIPT_DIR, "js", "playlist.js")
PLAYLIST_JSON_PATH = os.path.join(SCRIPT_DIR, "playlist.json")

def extract_folder_or_file_id(url_or_id: str) -> str:
    """Extracts the ID from a Google Drive folder or file URL."""
    url_or_id = url_or_id.strip()
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
    match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
    if re.match(r'^[a-zA-Z0-9_-]{25,}$', url_or_id):
        return url_or_id
    return ""

def clean_song_metadata(raw_filename: str):
    """Parses clean title and artist from filenames."""
    # Remove file extension
    base = re.sub(r'\.(mp3|m4a|wav|ogg|flac|aac)$', '', raw_filename, flags=re.IGNORECASE)
    # Remove bitrate and quality tags like (MP3_160K), [320kbps]
    base = re.sub(r'\s*[\(\[](?:MP3|AAC|160K|320K|128K|_|\s|-)+[\)\]]', '', base, flags=re.IGNORECASE)
    
    # Check for "Title - Artist" or "Artist - Title"
    parts = re.split(r'\s*[-_]\s*', base)
    if len(parts) >= 2:
        title = parts[0].strip()
        artist = " ".join([p.strip() for p in parts[1:] if p.strip()])
        # If "Karaoke" or "Instrumental" is in artist, reformat
        if re.search(r'karaoke|instrumental', artist, re.IGNORECASE):
            artist_clean = re.sub(r'\b(karaoke|instrumental)\b', '', artist, flags=re.IGNORECASE).strip(" _-")
            return f"{title} (Karaoke Instrumental)", (artist_clean or "Karaoke Edition")
        return title, artist
    
    return base.strip(), "Karaoke Artist"

def fetch_folder_tracks(folder_id: str):
    """Fetches list of audio files from public Google Drive folder without downloading."""
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    print(f"Connecting to Google Drive folder: {url} ...")
    
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    )
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"❌ Error connecting to Google Drive: {e}")
        return []

    # Find the _DRIVE_ivd JavaScript data variable
    ivd_match = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'((?:\\'|[^'])*)';", html)
    if not ivd_match:
        # Fallback search with data-id attributes
        print("Falling back to DOM parsing...")
        data_ids = re.findall(r'data-id="([a-zA-Z0-9_-]{25,})"[^>]*?data-tooltip="([^"]+?)"', html)
        tracks = []
        for fid, tooltip in data_ids:
            if re.search(r'\.(mp3|m4a|wav|ogg|flac|aac)', tooltip, re.IGNORECASE):
                title, artist = clean_song_metadata(tooltip)
                tracks.append(build_track_dict(fid, title, artist, tooltip))
        return tracks

    ivd_str = ivd_match.group(1)
    try:
        # Unicode escape decode
        decoded = bytes(ivd_str.replace(r"\/", "/"), "utf-8").decode("unicode_escape")
        data = json.loads(decoded)
        files = data[0] if data and len(data) > 0 and isinstance(data[0], list) else []
    except Exception as e:
        print(f"Error parsing folder payload: {e}")
        return []

    tracks = []
    for item in files:
        if not isinstance(item, list) or len(item) < 4:
            continue
        file_id = item[0]
        filename = item[2]
        mime = item[3]
        if mime and ("audio" in mime or re.search(r'\.(mp3|m4a|wav|ogg|flac|aac)', filename, re.IGNORECASE)):
            title, artist = clean_song_metadata(filename)
            tracks.append(build_track_dict(file_id, title, artist, filename))

    return tracks

def build_track_dict(file_id: str, title: str, artist: str, raw_filename: str):
    return {
        "id": f"drive-{file_id[:12]}",
        "title": title,
        "artist": artist,
        "album": "Google Drive Karaoke",
        "duration": "--:--",
        "cover": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80",
        "source": "Google Drive",
        "url": f"https://docs.google.com/uc?export=download&id={file_id}",
        "driveId": file_id,
        "originalFile": raw_filename
    }

def update_playlist_js(tracks):
    """Updates js/playlist.js with the Google Drive tracks."""
    if not tracks:
        print("⚠️ No tracks found to update.")
        return

    tracks_json = json.dumps(tracks, indent=2)
    js_content = f"""/**
 * Google Drive Music Player - Playlist Configuration
 * Streamed directly from Google Drive folder: https://drive.google.com/drive/folders/{DEFAULT_FOLDER_ID}
 * Zero local audio files stored: all audio is streamed live from Google Drive!
 */

const DRIVE_FOLDER_ID = "{DEFAULT_FOLDER_ID}";

// Universal Google Drive stream URL builder
function convertDriveUrlToStream(urlOrId) {{
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  if (trimmed.includes("export=download") || trimmed.endsWith(".mp3") || trimmed.endsWith(".m4a") || trimmed.endsWith(".wav")) {{
    return trimmed;
  }}

  let fileId = null;
  const fileDMatch = trimmed.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {{
    fileId = fileDMatch[1];
  }}

  if (!fileId) {{
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {{
      fileId = idParamMatch[1];
    }}
  }}

  if (!fileId && /^[a-zA-Z0-9_-]{{25,}}$/.test(trimmed)) {{
    fileId = trimmed;
  }}

  if (fileId) {{
    return `https://docs.google.com/uc?export=download&id=${{fileId}}`;
  }}

  return trimmed;
}}

// Live Google Drive tracks from connected folder
const DEFAULT_TRACKS = {tracks_json};

// LocalStorage key for user-added Drive tracks
const STORAGE_KEY = "gdrive_custom_playlist";

function getPlaylistTracks() {{
  try {{
    const customData = localStorage.getItem(STORAGE_KEY);
    if (customData) {{
      const parsed = JSON.parse(customData);
      if (Array.isArray(parsed) && parsed.length > 0) {{
        return [...parsed, ...DEFAULT_TRACKS];
      }}
    }}
  }} catch (e) {{
    console.warn("Could not read custom tracks from localStorage:", e);
  }}
  return [...DEFAULT_TRACKS];
}}

function addGoogleDriveTrack(trackData) {{
  try {{
    const customData = localStorage.getItem(STORAGE_KEY);
    const existing = customData ? JSON.parse(customData) : [];
    
    const streamUrl = convertDriveUrlToStream(trackData.driveLink || trackData.url);
    const newTrack = {{
      id: "drive-" + Date.now(),
      title: trackData.title || "Google Drive Track " + (existing.length + 1),
      artist: trackData.artist || "Cloud Audio",
      album: trackData.album || "Google Drive Karaoke",
      duration: trackData.duration || "--:--",
      cover: trackData.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
      source: "Google Drive",
      url: streamUrl,
      driveOriginal: trackData.driveLink || trackData.url
    }};

    existing.unshift(newTrack);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return newTrack;
  }} catch (e) {{
    console.error("Error saving track:", e);
    return null;
  }}
}}

function resetPlaylistToDefault() {{
  localStorage.removeItem(STORAGE_KEY);
}}
"""

    with open(PLAYLIST_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✅ Successfully wrote {len(tracks)} live Google Drive track(s) to js/playlist.js")

    with open(PLAYLIST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2)
    print(f"✅ Saved playlist.json")

def main():
    print("=" * 65)
    print("🎧 DrivePlayer - Google Drive Synchronizer")
    print("=" * 65)

    folder_id = DEFAULT_FOLDER_ID
    if len(sys.argv) > 1:
        extracted = extract_folder_or_file_id(sys.argv[1])
        if extracted:
            folder_id = extracted

    print(f"Target Google Drive Folder ID: {folder_id}")
    tracks = fetch_folder_tracks(folder_id)

    if not tracks:
        print("❌ No audio tracks could be retrieved from the folder.")
        sys.exit(1)

    print(f"\nDiscovered {len(tracks)} song(s) in folder:")
    for idx, t in enumerate(tracks, 1):
        print(f"  {idx}. {t['title']} — {t['artist']}")
        print(f"     Direct Stream URL: {t['url']}")

    update_playlist_js(tracks)
    print("\n🎉 Live streaming connection complete! Songs will play directly from Drive.")

if __name__ == "__main__":
    main()
