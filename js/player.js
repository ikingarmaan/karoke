/**
 * Core Media Player Engine with Turntable Tonearm, Ambient Glow & Random Album Art
 */

document.addEventListener("DOMContentLoaded", () => {
  // Audio Element
  const audio = new Audio();
  audio.preload = "metadata";
  audio.crossOrigin = "anonymous";

  // Turntable & Vinyl Elements
  const vinylDisc = document.getElementById("vinyl-disc");
  const vinylArt = document.getElementById("vinyl-art");
  const tonearm = document.getElementById("tonearm");
  const ambientGlow = document.getElementById("ambient-glow");
  const btnRandomArt = document.getElementById("btn-random-art");

  // Track Metadata Elements
  const trackTitle = document.getElementById("track-title");
  const trackArtist = document.getElementById("track-artist");
  const trackBadge = document.getElementById("track-badge");

  // Control Buttons
  const btnPlay = document.getElementById("btn-play");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnShuffle = document.getElementById("btn-shuffle");
  const btnRepeat = document.getElementById("btn-repeat");

  // Progress Bar
  const progressBarWrapper = document.getElementById("progress-bar-wrapper");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressScrubber = document.getElementById("progress-scrubber");
  const timeCurrent = document.getElementById("time-current");
  const timeTotal = document.getElementById("time-total");

  // Volume
  const volumeSlider = document.getElementById("volume-slider");
  const btnVolume = document.getElementById("btn-volume");

  // Playlist Elements
  const trackListContainer = document.getElementById("track-list");
  const trackCountBadge = document.getElementById("track-count");
  const searchInput = document.getElementById("playlist-search");
  const btnRefreshDrive = document.getElementById("btn-refresh-drive");

  // Modal Elements
  const modalOverlay = document.getElementById("drive-modal");
  const btnOpenModal = document.getElementById("btn-open-modal");
  const btnNavSync = document.getElementById("btn-nav-sync");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const formAddDrive = document.getElementById("form-add-drive");

  // Curated High-Res Album Artworks from Internet
  const CURATED_COVERS = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=85"
  ];

  // Visualizer
  const visualizerCanvas = document.getElementById("visualizer-canvas");
  const visualizer = new AudioVisualizer(visualizerCanvas, audio);

  // State
  let tracks = getPlaylistTracks();
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = "all";
  let lastVolume = 0.85;

  // Initialize Volume
  const savedVolume = localStorage.getItem("gdrive_player_volume");
  if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
    volumeSlider.value = audio.volume;
  } else {
    audio.volume = 0.85;
    volumeSlider.value = 0.85;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Render Playlist UI
  function renderPlaylist(filterQuery = "") {
    trackListContainer.innerHTML = "";
    trackCountBadge.textContent = `${tracks.length} track${tracks.length === 1 ? '' : 's'}`;

    const filtered = tracks.filter(t =>
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (t.album && t.album.toLowerCase().includes(filterQuery.toLowerCase()))
    );

    if (filtered.length === 0) {
      trackListContainer.innerHTML = `
        <li style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.92rem;">
          No matching tracks found in your vault.
        </li>
      `;
      return;
    }

    filtered.forEach((track) => {
      const realIndex = tracks.findIndex(t => t.id === track.id || t.url === track.url);
      const isActive = realIndex === currentIndex;

      const li = document.createElement("li");
      li.className = `track-item ${isActive ? "active" : ""}`;
      li.setAttribute("data-index", realIndex);

      li.innerHTML = `
        <div class="track-index">${realIndex + 1}</div>
        <div class="list-equalizer">
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
        </div>
        <img class="track-thumb" src="${track.cover}" alt="${track.title}" onerror="this.src='${CURATED_COVERS[0]}'">
        <div class="track-details">
          <div class="track-name">${track.title}</div>
          <div class="track-meta-row">
            <span>${track.artist}</span>
            <span class="track-source-tag">${track.source || "Google Drive"}</span>
          </div>
        </div>
        <div class="track-duration">${track.duration || "--:--"}</div>
      `;

      li.addEventListener("click", () => {
        if (currentIndex === realIndex && isPlaying) {
          pauseTrack();
        } else {
          loadTrack(realIndex);
          playTrack();
        }
      });

      trackListContainer.appendChild(li);
    });
  }

  // Load a track
  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    const currentTrack = tracks[currentIndex];

    // Determine target URL (prefer proxy if on web server)
    let streamUrl = currentTrack.url;
    if (window.location && window.location.protocol.startsWith("http") && currentTrack.driveId) {
      streamUrl = `/api/stream/${currentTrack.driveId}`;
    }

    audio.src = streamUrl;
    audio.load();

    trackTitle.textContent = currentTrack.title;
    trackArtist.textContent = currentTrack.artist;
    trackBadge.textContent = currentTrack.source || "Google Drive Live";
    vinylArt.src = currentTrack.cover;

    // Reset progress
    progressBarFill.style.width = "0%";
    progressScrubber.style.left = "0%";
    timeCurrent.textContent = "0:00";
    timeTotal.textContent = currentTrack.duration || "--:--";

    // MediaSession lock-screen support
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Google Drive Karaoke",
        artwork: [
          { src: currentTrack.cover, sizes: "512x512", type: "image/jpeg" }
        ]
      });
    }

    renderPlaylist(searchInput.value);
  }

  // Playback Control
  function playTrack() {
    try {
      visualizer.initWebAudio();
    } catch (e) {
      console.warn("Visualizer init note:", e);
    }

    audio.play()
      .then(() => {
        isPlaying = true;
        vinylDisc.classList.add("playing");
        if (tonearm) tonearm.classList.add("playing");
        if (ambientGlow) ambientGlow.classList.add("active");
        iconPlay.style.display = "none";
        iconPause.style.display = "block";
        visualizer.start();
        renderPlaylist(searchInput.value);
      })
      .catch(err => {
        console.warn("Audio play() interrupted:", err);
      });
  }

  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    vinylDisc.classList.remove("playing");
    if (tonearm) tonearm.classList.remove("playing");
    if (ambientGlow) ambientGlow.classList.remove("active");
    iconPlay.style.display = "block";
    iconPause.style.display = "none";
    visualizer.stop();
    renderPlaylist(searchInput.value);
  }

  function togglePlay() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  function nextTrack() {
    if (isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tracks.length);
      } while (tracks.length > 1 && randomIndex === currentIndex);
      loadTrack(randomIndex);
    } else {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= tracks.length) {
        nextIndex = 0;
      }
      loadTrack(nextIndex);
    }
    playTrack();
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = tracks.length - 1;
      }
      loadTrack(prevIndex);
    }
    playTrack();
  }

  // Randomize Album Cover Art Feature
  if (btnRandomArt) {
    btnRandomArt.addEventListener("click", () => {
      // Pick random cover
      let currentCover = vinylArt.src;
      let newCover;
      do {
        newCover = CURATED_COVERS[Math.floor(Math.random() * CURATED_COVERS.length)];
      } while (CURATED_COVERS.length > 1 && newCover === currentCover);

      // Subtle rotation animation on vinyl art
      vinylArt.style.transform = "scale(0.85) rotate(15deg)";
      setTimeout(() => {
        vinylArt.src = newCover;
        if (tracks[currentIndex]) {
          tracks[currentIndex].cover = newCover;
        }
        vinylArt.style.transform = "scale(1) rotate(0deg)";
        renderPlaylist(searchInput.value);
      }, 200);
    });
  }

  // Audio Event Listeners
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBarFill.style.width = `${percent}%`;
    progressScrubber.style.left = `${percent}%`;
    timeCurrent.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      playTrack();
    } else if (repeatMode === "all" || currentIndex < tracks.length - 1) {
      nextTrack();
    } else {
      pauseTrack();
    }
  });

  // Audio Error Handling & Auto-Recovery
  audio.addEventListener("error", (e) => {
    console.error("Audio playback error:", audio.error, e);
    const currentTrack = tracks[currentIndex];
    if (currentTrack) {
      if (audio.src.includes("/api/stream/") && currentTrack.directUrl) {
        console.warn("Retrying with direct Google Drive URL:", currentTrack.directUrl);
        audio.src = currentTrack.directUrl;
        audio.play().catch(err => console.error("Direct fallback failed:", err));
      } else if (!audio.src.includes("/api/stream/") && currentTrack.driveId) {
        console.warn("Retrying with proxy URL:", `/api/stream/${currentTrack.driveId}`);
        audio.src = `/api/stream/${currentTrack.driveId}`;
        audio.play().catch(err => console.error("Proxy fallback failed:", err));
      }
    }
  });

  // Seeking
  let isSeeking = false;
  function handleSeek(e) {
    const rect = progressBarWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clampedPercent = Math.max(0, Math.min(1, clickX / width));
    if (audio.duration) {
      audio.currentTime = clampedPercent * audio.duration;
      progressBarFill.style.width = `${clampedPercent * 100}%`;
      progressScrubber.style.left = `${clampedPercent * 100}%`;
    }
  }

  progressBarWrapper.addEventListener("mousedown", (e) => {
    isSeeking = true;
    handleSeek(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (isSeeking) handleSeek(e);
  });

  window.addEventListener("mouseup", () => {
    isSeeking = false;
  });

  // Controls Event Listeners
  btnPlay.addEventListener("click", togglePlay);
  btnNext.addEventListener("click", nextTrack);
  btnPrev.addEventListener("click", prevTrack);

  btnShuffle.addEventListener("click", () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle("active", isShuffle);
  });

  btnRepeat.addEventListener("click", () => {
    if (repeatMode === "none") {
      repeatMode = "all";
      btnRepeat.classList.add("active");
      btnRepeat.title = "Repeat All";
    } else if (repeatMode === "all") {
      repeatMode = "one";
      btnRepeat.classList.add("active");
      btnRepeat.title = "Repeat Current Track";
    } else {
      repeatMode = "none";
      btnRepeat.classList.remove("active");
      btnRepeat.title = "Repeat Off";
    }
  });

  // Volume
  volumeSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    audio.volume = val;
    localStorage.setItem("gdrive_player_volume", val);
  });

  btnVolume.addEventListener("click", () => {
    if (audio.volume > 0) {
      lastVolume = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
    } else {
      audio.volume = lastVolume || 0.85;
      volumeSlider.value = audio.volume;
    }
    localStorage.setItem("gdrive_player_volume", audio.volume);
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    renderPlaylist(e.target.value);
  });

  // --------------------------------------------------------------------------
  // Live Google Drive Auto-Sync
  // --------------------------------------------------------------------------
  async function syncLiveDriveTracks(force = false) {
    if (btnRefreshDrive) {
      btnRefreshDrive.classList.add("spinning");
    }

    try {
      const res = await fetch(`/api/tracks${force ? "?refresh=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          const currentIds = tracks.map(t => t.driveId || t.id).join(",");
          const newIds = data.tracks.map(t => t.driveId || t.id).join(",");

          if (currentIds !== newIds || force) {
            console.log(`[DriveSync] Live update: found ${data.tracks.length} track(s) in Google Drive folder!`);
            const currentTrackId = tracks[currentIndex] ? (tracks[currentIndex].driveId || tracks[currentIndex].id) : null;
            
            tracks = data.tracks;

            if (currentTrackId) {
              const matchedIdx = tracks.findIndex(t => (t.driveId || t.id) === currentTrackId);
              currentIndex = matchedIdx !== -1 ? matchedIdx : 0;
            } else {
              currentIndex = 0;
              loadTrack(0);
            }

            renderPlaylist(searchInput.value);
          }
        }
      }
    } catch (e) {
      // Graceful fallback
    } finally {
      if (btnRefreshDrive) {
        setTimeout(() => btnRefreshDrive.classList.remove("spinning"), 600);
      }
    }
  }

  // Refresh Button Listener
  if (btnRefreshDrive) {
    btnRefreshDrive.addEventListener("click", () => syncLiveDriveTracks(true));
  }

  // Auto-poll Google Drive folder every 30 seconds
  setInterval(() => {
    syncLiveDriveTracks(false);
  }, 30000);

  // Modal Handlers
  const openModal = () => modalOverlay.classList.add("open");
  const closeModal = () => modalOverlay.classList.remove("open");

  if (btnOpenModal) btnOpenModal.addEventListener("click", openModal);
  if (btnNavSync) btnNavSync.addEventListener("click", openModal);
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Form Submit: Add Google Drive Track
  formAddDrive.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("drive-title").value.trim();
    const artist = document.getElementById("drive-artist").value.trim();
    const link = document.getElementById("drive-link").value.trim();
    const cover = document.getElementById("drive-cover").value.trim();

    if (!link) {
      alert("Please provide a Google Drive file link or ID.");
      return;
    }

    const newTrack = addGoogleDriveTrack({
      title: title || "My Drive Track",
      artist: artist || "Cloud Audio",
      driveLink: link,
      cover: cover || CURATED_COVERS[Math.floor(Math.random() * CURATED_COVERS.length)]
    });

    if (newTrack) {
      tracks = getPlaylistTracks();
      closeModal();
      formAddDrive.reset();
      loadTrack(0);
      playTrack();
    }
  });

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowRight") {
      if (e.shiftKey) {
        nextTrack();
      } else {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      }
    } else if (e.code === "ArrowLeft") {
      if (e.shiftKey) {
        prevTrack();
      } else {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
      }
    } else if (e.code === "KeyM") {
      btnVolume.click();
    }
  });

  // MediaSession Actions
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", playTrack);
    navigator.mediaSession.setActionHandler("pause", pauseTrack);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined && audio.duration) {
        audio.currentTime = details.seekTime;
      }
    });
  }

  // Initial Boot
  loadTrack(0);
  renderPlaylist();

  // Kick off initial live sync check
  syncLiveDriveTracks(false);
});
