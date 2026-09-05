#!/usr/bin/env python3
"""
KaraokePlayer - Flask Web Service with Live Google Drive Auto-Sync
Designed for local execution and production deployment on Render.
Streams audio live directly from Google Drive without local file storage.
"""

import os
import re
import ssl
import time
import json
import urllib.request
from flask import Flask, send_from_directory, jsonify, request

app = Flask(__name__, static_folder=".", static_url_path="")

# Default target Google Drive folder (Karaoke songs)
DRIVE_FOLDER_ID = os.environ.get("DRIVE_FOLDER_ID", "1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh")

# In-memory cache for live folder tracks
CACHE_TTL_SECONDS = 30  # Auto-refreshes every 30 seconds
cache = {
    "tracks": [],
    "last_fetched": 0
}

def clean_song_metadata(raw_filename: str):
    """Parses clean title and artist from raw file name."""
    base = re.sub(r'\.(mp3|m4a|wav|ogg|flac|aac)$', '', raw_filename, flags=re.IGNORECASE)
    base = re.sub(r'\s*[\(\[](?:MP3|AAC|160K|320K|128K|_|\s|-)+[\)\]]', '', base, flags=re.IGNORECASE)

    parts = re.split(r'\s*[-_]\s*', base)
    if len(parts) >= 2:
        title = parts[0].strip()
        artist = " ".join([p.strip() for p in parts[1:] if p.strip()])
        if re.search(r'karaoke|instrumental', artist, re.IGNORECASE):
            artist_clean = re.sub(r'\b(karaoke|instrumental)\b', '', artist, flags=re.IGNORECASE).strip(" _-")
            return f"{title} (Karaoke Instrumental)", (artist_clean or "Karaoke Edition")
        return title, artist

    return base.strip(), "Karaoke Artist"

def fetch_live_drive_tracks(folder_id: str):
    """Fetches audio files live from the Google Drive folder without downloading."""
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    )

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[DriveSync] Error connecting to Google Drive: {e}")
        return []

    # Attempt to extract the initial data blob
    ivd_match = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'((?:\\'|[^'])*)';", html)
    if not ivd_match:
        # Fallback to data-id attributes in HTML
        data_ids = re.findall(r'data-id="([a-zA-Z0-9_-]{25,})"[^>]*?data-tooltip="([^"]+?)"', html)
        tracks = []
        for fid, tooltip in data_ids:
            if re.search(r'\.(mp3|m4a|wav|ogg|flac|aac)', tooltip, re.IGNORECASE):
                title, artist = clean_song_metadata(tooltip)
                tracks.append(create_track_record(fid, title, artist, tooltip))
        return tracks

    ivd_str = ivd_match.group(1).replace(r"\/", "/")
    try:
        decoded = bytes(ivd_str, "utf-8").decode("unicode_escape")
        data = json.loads(decoded)
        files = data[0] if data and len(data) > 0 and isinstance(data[0], list) else []
    except Exception as e:
        print(f"[DriveSync] Error parsing folder JSON: {e}")
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
            tracks.append(create_track_record(file_id, title, artist, filename))

    return tracks

def create_track_record(file_id: str, title: str, artist: str, filename: str):
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
        "originalFile": filename
    }

def get_current_tracks(force_refresh: bool = False):
    """Retrieves tracks from cache or fetches live from Google Drive."""
    now = time.time()
    if not force_refresh and cache["tracks"] and (now - cache["last_fetched"]) < CACHE_TTL_SECONDS:
        return cache["tracks"]

    print(f"[DriveSync] Querying Google Drive folder {DRIVE_FOLDER_ID}...")
    live_tracks = fetch_live_drive_tracks(DRIVE_FOLDER_ID)
    if live_tracks:
        cache["tracks"] = live_tracks
        cache["last_fetched"] = now
        # Update local playlist.json as a backup cache
        try:
            with open("playlist.json", "w", encoding="utf-8") as f:
                json.dump(live_tracks, f, indent=2)
        except Exception:
            pass
        return live_tracks

    # Fallback to local playlist.json if Google Drive temporarily throttles
    if not cache["tracks"]:
        try:
            if os.path.exists("playlist.json"):
                with open("playlist.json", "r", encoding="utf-8") as f:
                    cache["tracks"] = json.load(f)
                    cache["last_fetched"] = now
        except Exception:
            pass

    return cache["tracks"]

# --------------------------------------------------------------------------
# Web Routes
# --------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/contact")
@app.route("/contact.html")
def contact():
    return send_from_directory(".", "contact.html")

@app.route("/healthz")
def healthz():
    return jsonify({
        "status": "ok",
        "service": "karaoke-player",
        "folder_id": DRIVE_FOLDER_ID,
        "tracks_cached": len(cache["tracks"])
    }), 200

@app.route("/api/tracks")
def api_tracks():
    """Live tracks endpoint. Any new song added to the Drive folder is returned automatically!"""
    force = request.args.get("refresh", "").lower() in ["1", "true", "yes"]
    tracks = get_current_tracks(force_refresh=force)
    return jsonify({
        "success": True,
        "folder_id": DRIVE_FOLDER_ID,
        "count": len(tracks),
        "cached_at": cache["last_fetched"],
        "tracks": tracks
    })

@app.route("/<path:path>")
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory(".", path)
    return send_from_directory(".", "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Starting KaraokePlayer server on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
