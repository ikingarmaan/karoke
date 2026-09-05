/**
 * Google Drive Music Player - Playlist & Stream Converter
 * Handles track data, local storage cache, and Google Drive URL conversion.
 */

// Universal Google Drive stream URL builder
function convertDriveUrlToStream(urlOrId) {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();

  // If it's already an export/stream URL or direct mp3 URL, return it
  if (trimmed.includes("export=download") || trimmed.endsWith(".mp3") || trimmed.endsWith(".m4a") || trimmed.endsWith(".wav")) {
    return trimmed;
  }

  // Regex patterns to capture file ID from various Google Drive sharing formats
  let fileId = null;

  // Format 1: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  }

  // Format 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  if (!fileId) {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }

  // Format 3: Raw File ID (typical length 25-50 alphanumeric + dash/underscore)
  if (!fileId && /^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    fileId = trimmed;
  }

  if (fileId) {
    // Primary Google Drive audio streaming endpoint
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  // Fallback as raw string
  return trimmed;
}

// Default high-quality royalty-free demo tracks so the player works right out of the box
const DEFAULT_TRACKS = [
  {
    id: "track-1",
    title: "Midnight City Lights",
    artist: "Aura Sound Lab",
    album: "Neon Horizons",
    duration: "2:45",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    source: "Drive Demo",
    // Fast reliable CDN stream
    url: "https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3"
  },
  {
    id: "track-2",
    title: "Cyber Ambient Odyssey",
    artist: "Synthwave Collective",
    album: "Retroverse Vol. 1",
    duration: "3:12",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    source: "Drive Demo",
    url: "https://cdn.freesound.org/previews/689/689488_11861866-lq.mp3"
  },
  {
    id: "track-3",
    title: "Deep Space Chillout",
    artist: "Cosmic Frequency",
    album: "Solar Wind",
    duration: "2:18",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80",
    source: "Drive Demo",
    url: "https://cdn.freesound.org/previews/665/665181_11861866-lq.mp3"
  },
  {
    id: "track-4",
    title: "Sunset Lo-Fi Dreams",
    artist: "Velvet Beats",
    album: "Coffee & Rain",
    duration: "2:50",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
    source: "Drive Demo",
    url: "https://cdn.freesound.org/previews/573/573381_11861866-lq.mp3"
  }
];

// LocalStorage key for custom imported Drive tracks
const STORAGE_KEY = "gdrive_custom_playlist";

// Retrieve all tracks (Default + User Custom Tracks)
function getPlaylistTracks() {
  try {
    const customData = localStorage.getItem(STORAGE_KEY);
    if (customData) {
      const parsed = JSON.parse(customData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Return custom tracks combined with default fallback
        return [...parsed, ...DEFAULT_TRACKS];
      }
    }
  } catch (e) {
    console.warn("Could not read custom tracks from localStorage:", e);
  }
  return [...DEFAULT_TRACKS];
}

// Add a single custom Google Drive track
function addGoogleDriveTrack(trackData) {
  try {
    const customData = localStorage.getItem(STORAGE_KEY);
    const existing = customData ? JSON.parse(customData) : [];
    
    const streamUrl = convertDriveUrlToStream(trackData.driveLink || trackData.url);
    const newTrack = {
      id: "drive-" + Date.now(),
      title: trackData.title || "Google Drive Track " + (existing.length + 1),
      artist: trackData.artist || "Cloud Audio",
      album: trackData.album || "Google Drive Folder",
      duration: trackData.duration || "--:--",
      cover: trackData.cover || "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&auto=format&fit=crop&q=80",
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

// Reset playlist back to default demo
function resetPlaylistToDefault() {
  localStorage.removeItem(STORAGE_KEY);
}
