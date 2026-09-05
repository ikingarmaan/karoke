/**
 * Contact Page Interactive Logic
 * Handles contact form validation, submission simulation, and mini player status.
 */

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const btnSubmit = document.getElementById("btn-submit-contact");

  // Contact Form Submission
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("contact-name").value.trim();
      const email = document.getElementById("contact-email").value.trim();
      const subject = document.getElementById("contact-subject").value.trim();
      const message = document.getElementById("contact-message").value.trim();

      if (!name || !email || !message) {
        showStatus("Please complete all required fields.", "error");
        return;
      }

      // Basic email regex
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        showStatus("Please provide a valid email address.", "error");
        return;
      }

      // Button loading state
      const originalText = btnSubmit.innerHTML;
      btnSubmit.innerHTML = `
        <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; margin-right: 8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        Sending...
      `;
      btnSubmit.disabled = true;

      // Simulate asynchronous send
      setTimeout(() => {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        contactForm.reset();
        showStatus(`Thank you, ${name}! Your message regarding "${subject || 'General'}" has been received.`, "success");
      }, 900);
    });
  }

  function showStatus(text, type) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.className = `form-status ${type}`;
    formStatus.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (type === "success") {
      setTimeout(() => {
        formStatus.className = "form-status";
        formStatus.textContent = "";
      }, 7000);
    }
  }

  // Mini Player Bar Logic on Contact Page
  const miniAudio = new Audio();
  const miniPlayBtn = document.getElementById("mini-play-btn");
  const miniIconPlay = document.getElementById("mini-icon-play");
  const miniIconPause = document.getElementById("mini-icon-pause");
  const miniTitle = document.getElementById("mini-track-title");
  const miniArtist = document.getElementById("mini-track-artist");
  const miniArt = document.getElementById("mini-track-art");

  if (miniPlayBtn && typeof getPlaylistTracks === "function") {
    const tracks = getPlaylistTracks();
    const firstTrack = tracks[0] || {};

    if (firstTrack.url) {
      miniAudio.src = firstTrack.url;
      if (miniTitle) miniTitle.textContent = firstTrack.title || "No Track Selected";
      if (miniArtist) miniArtist.textContent = firstTrack.artist || "Cloud Player";
      if (miniArt && firstTrack.cover) miniArt.src = firstTrack.cover;

      let isMiniPlaying = false;

      miniPlayBtn.addEventListener("click", () => {
        if (isMiniPlaying) {
          miniAudio.pause();
          isMiniPlaying = false;
          if (miniIconPlay) miniIconPlay.style.display = "block";
          if (miniIconPause) miniIconPause.style.display = "none";
        } else {
          miniAudio.play().then(() => {
            isMiniPlaying = true;
            if (miniIconPlay) miniIconPlay.style.display = "none";
            if (miniIconPause) miniIconPause.style.display = "block";
          }).catch(e => console.warn(e));
        }
      });

      miniAudio.addEventListener("ended", () => {
        isMiniPlaying = false;
        if (miniIconPlay) miniIconPlay.style.display = "block";
        if (miniIconPause) miniIconPause.style.display = "none";
      });
    }
  }
});
