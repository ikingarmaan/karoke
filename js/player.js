/**
 * Core Media Player Engine
 * Controls playback, playlist rendering, UI state, seeking, and Drive track additions.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const audio = new Audio();
  audio.preload = "metadata";

  const vinylDisc = document.getElementById("vinyl-disc");
  const vinylArt = document.getElementById("vinyl-art");
  const trackTitle = document.getElementById("track-title");
  const trackArtist = document.getElementById("track-artist");
  const trackBadge = document.getElementById("track-badge");
  
  const btnPlay = document.getElementById("btn-play");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnShuffle = document.getElementById("btn-shuffle");
  const btnRepeat = document.getElementById("btn-repeat");
  
  const progressBarWrapper = document.getElementById("progress-bar-wrapper");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressScrubber = document.getElementById("progress-scrubber");
  const timeCurrent = document.getElementById("time-current");
  const timeTotal = document.getElementById("time-total");
  
  const volumeSlider = document.getElementById("volume-slider");
  const btnVolume = document.getElementById("btn-volume");
  
  const trackListContainer = document.getElementById("track-list");
  const trackCountBadge = document.getElementById("track-count");
  const searchInput = document.getElementById("playlist-search");
  
  // Modal Elements
  const modalOverlay = document.getElementById("drive-modal");
  const btnOpenModal = document.getElementById("btn-open-modal");
  const btnNavSync = document.getElementById("btn-nav-sync");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const formAddDrive = document.getElementById("form-add-drive");

  // Visualizer
  const visualizerCanvas = document.getElementById("visualizer-canvas");
  const visualizer = new AudioVisualizer(visualizerCanvas, audio);

  // State
  let tracks = getPlaylistTracks();
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  // repeatMode: 'none' | 'all' | 'one'
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

  // Format Seconds to MM:SS
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Render Playlist UI
  function renderPlaylist(filterQuery = "") {
    trackListContainer.innerHTML = "";
    trackCountBadge.textContent = `${tracks.length} tracks`;

    const filtered = tracks.filter(t => 
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (t.album && t.album.toLowerCase().includes(filterQuery.toLowerCase()))
    );

    if (filtered.length === 0) {
      trackListContainer.innerHTML = `
        <li style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          No matching tracks found.
        </li>
      `;
      return;
    }

    filtered.forEach((track) => {
      const realIndex = tracks.findIndex(t => t.id === track.id);
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
        <img class="track-thumb" src="${track.cover}" alt="${track.title}" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'">
        <div class="track-details">
          <div class="track-name">${track.title}</div>
          <div class="track-meta-row">
            <span>${track.artist}</span>
            <span class="track-source-tag">${track.source || "Cloud"}</span>
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

    audio.src = currentTrack.url;
    audio.load();

    trackTitle.textContent = currentTrack.title;
    trackArtist.textContent = currentTrack.artist;
    trackBadge.textContent = currentTrack.source || "Google Drive";
    vinylArt.src = currentTrack.cover;

    // Reset progress
    progressBarFill.style.width = "0%";
    progressScrubber.style.left = "0%";
    timeCurrent.textContent = "0:00";
    timeTotal.textContent = currentTrack.duration || "--:--";

    // Update MediaSession
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Google Drive Music",
        artwork: [
          { src: currentTrack.cover, sizes: "512x512", type: "image/jpeg" }
        ]
      });
    }

    renderPlaylist(searchInput.value);
  }

  // Playback Control
  function playTrack() {
    visualizer.initWebAudio();
    audio.play()
      .then(() => {
        isPlaying = true;
        vinylDisc.classList.add("playing");
        iconPlay.style.display = "none";
        iconPause.style.display = "block";
        visualizer.start();
        renderPlaylist(searchInput.value);
      })
      .catch(err => {
        console.warn("Autoplay / stream error:", err);
      });
  }

  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    vinylDisc.classList.remove("playing");
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

  // Buttons
  btnPlay.addEventListener("click", togglePlay);
  btnNext.addEventListener("click", nextTrack);
  btnPrev.addEventListener("click", prevTrack);

  // Shuffle Toggle
  btnShuffle.addEventListener("click", () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle("active", isShuffle);
  });

  // Repeat Toggle
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
      cover: cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80"
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
    // Avoid interfering with typing in input fields
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
});
