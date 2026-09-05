/**
 * Google Drive Music Player - Playlist Configuration
 * Streamed directly from Google Drive folder: https://drive.google.com/drive/folders/1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh
 * Zero local audio files stored: all audio is streamed live from Google Drive!
 */

const DRIVE_FOLDER_ID = "1z92Bdm4MM8q-21Qd7VIlXWK0r5gK_Eqh";

// Universal Google Drive stream URL builder
function convertDriveUrlToStream(urlOrId) {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  if (trimmed.includes("export=download") || trimmed.endsWith(".mp3") || trimmed.endsWith(".m4a") || trimmed.endsWith(".wav")) {
    return trimmed;
  }

  let fileId = null;
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  }

  if (!fileId) {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }

  if (!fileId && /^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    fileId = trimmed;
  }

  if (fileId) {
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
}

// Live Google Drive tracks from connected folder
const DEFAULT_TRACKS = [
  {
    "id": "drive-1KoiOcb7AsfP",
    "title": "Glass Half Full (Karaoke Instrumental)",
    "artist": "Young Stunners JJ47",
    "album": "Google Drive Karaoke",
    "duration": "--:--",
    "cover": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80",
    "source": "Google Drive",
    "url": "https://docs.google.com/uc?export=download&id=1KoiOcb7AsfPbRNfosS_Ov1gRV-RxP4Kk",
    "driveId": "1KoiOcb7AsfPbRNfosS_Ov1gRV-RxP4Kk",
    "originalFile": "Glass Half Full - Young Stunners_ JJ47 _ Karaoke _ Instrumental(MP3_160K).mp3"
  }
];

// LocalStorage key for user-added Drive tracks
const STORAGE_KEY = "gdrive_custom_playlist";

function getPlaylistTracks() {
  try {
    const customData = localStorage.getItem(STORAGE_KEY);
    if (customData) {
      const parsed = JSON.parse(customData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...DEFAULT_TRACKS];
      }
    }
  } catch (e) {
    console.warn("Could not read custom tracks from localStorage:", e);
  }
  return [...DEFAULT_TRACKS];
}

function addGoogleDriveTrack(trackData) {
  try {
    const customData = localStorage.getItem(STORAGE_KEY);
    const existing = customData ? JSON.parse(customData) : [];
    
    const streamUrl = convertDriveUrlToStream(trackData.driveLink || trackData.url);
    const newTrack = {
      id: "drive-" + Date.now(),
      title: trackData.title || "Google Drive Track " + (existing.length + 1),
      artist: trackData.artist || "Cloud Audio",
      album: trackData.album || "Google Drive Karaoke",
      duration: trackData.duration || "--:--",
      cover: trackData.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
      source: "Google Drive",
      url: streamUrl,
      driveOriginal: trackData.driveLink || trackData.url
    };

    existing.unshift(newTrack);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return newTrack;
  } catch (e) {
    console.error("Error saving track:", e);
    return null;
  }
}

function resetPlaylistToDefault() {
  localStorage.removeItem(STORAGE_KEY);
}
