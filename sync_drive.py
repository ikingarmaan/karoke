#!/usr/bin/env python3
"""
DrivePlayer - Google Drive Folder & Track Synchronizer
Helper tool to convert Google Drive file and folder links into streamable tracks for the DrivePlayer website.
"""

import sys
import re
import json
import os
import urllib.request
import urllib.parse

PLAYLIST_JS_PATH = os.path.join(os.path.dirname(__file__), "js", "playlist.js")
PLAYLIST_JSON_PATH = os.path.join(os.path.dirname(__file__), "playlist.json")

def extract_gdrive_id(url_or_id: str) -> str:
    """Extracts the Google Drive file ID from various URL formats or raw ID."""
    url_or_id = url_or_id.strip()
    
    # Format: /file/d/FILE_ID/view...
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
        
    # Format: id=FILE_ID
    match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
        
    # Format: /folders/FOLDER_ID
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)
        
    # Raw ID
    if re.match(r'^[a-zA-Z0-9_-]{25,}$', url_or_id):
        return url_or_id
        
    return ""

def format_drive_stream_url(file_id: str) -> str:
    """Creates direct streaming URL for Google Drive audio."""
    return f"https://docs.google.com/uc?export=download&id={file_id}"

def build_track_entry(title: str, artist: str, file_id: str, cover: str = None, album: str = "Google Drive"):
    default_cover = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"
    return {
        "id": f"drive-{file_id[:10]}",
        "title": title or f"Track {file_id[:6]}",
        "artist": artist or "Cloud Artist",
        "album": album,
        "duration": "--:--",
        "cover": cover or default_cover,
        "source": "Google Drive",
        "url": format_drive_stream_url(file_id),
        "driveId": file_id
    }

def update_playlist_json(new_tracks):
    """Saves tracks to playlist.json for easy inspection."""
    with open(PLAYLIST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(new_tracks, f, indent=2)
    print(f"✅ Saved {len(new_tracks)} track(s) to playlist.json")

def main():
    print("=" * 60)
    print("🎧 DrivePlayer - Google Drive Track Sync Utility")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
        print(f"Input provided: {raw_input}")
        file_id = extract_gdrive_id(raw_input)
        if file_id:
            print(f"Extracted Google Drive ID: {file_id}")
            print(f"Direct Audio Stream URL: {format_drive_stream_url(file_id)}")
            track = build_track_entry(
                title=sys.argv[2] if len(sys.argv) > 2 else "New Drive Track",
                artist=sys.argv[3] if len(sys.argv) > 3 else "Google Drive",
                file_id=file_id
            )
            update_playlist_json([track])
            print("\nTo play this track on your website:")
            print("1. Open index.html in your browser.")
            print("2. Click '+ Add Drive Track' and paste the link or ID.")
        else:
            print("❌ Could not extract a valid Google Drive file/folder ID.")
            sys.exit(1)
    else:
        print("\nUsage options:")
        print("  1. Run with a link: python3 sync_drive.py '<Google_Drive_Link>' '<Song_Title>' '<Artist>'")
        print("  2. In your browser on index.html, click '+ Add Drive Track' to import interactively.")
        print("  3. Or provide your Google Drive folder link in the assistant chat and we will sync it for you!\n")

if __name__ == "__main__":
    main()
