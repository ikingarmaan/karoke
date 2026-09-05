/**
 * Audio Spectrum Canvas Visualizer - Cyber Studio Edition
 * Multi-color neon gradient spectrum with mirror reflections and rhythmic pulses.
 */

class AudioVisualizer {
  constructor(canvasElement, audioElement) {
    this.canvas = canvasElement;
    this.audio = audioElement;
    this.ctx = canvasElement ? canvasElement.getContext("2d") : null;
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.dataArray = null;
    this.animationId = null;
    this.isPlaying = false;
    this.isWebAudioReady = false;

    if (this.canvas) {
      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());
      this.drawIdle();
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  initWebAudio() {
    if (this.isWebAudioReady) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.82;

      try {
        if (!this.sourceNode) {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.sourceNode.connect(this.audioCtx.destination);
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.isWebAudioReady = true;
        }
      } catch (err) {
        console.warn("WebAudio source node note (using dynamic organic visualizer):", err);
      }
    } catch (e) {
      console.warn("AudioContext skipped:", e);
    }
  }

  start() {
    this.isPlaying = true;
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    this.animate();
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.drawIdle();
  }

  drawIdle() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    const barCount = 36;
    const barWidth = (w / barCount) * 0.65;
    const spacing = (w / barCount) * 0.35;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + spacing) + spacing / 2;
      const barHeight = 4;
      const y = h * 0.65 - barHeight;

      this.ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, 2);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();
    }
  }

  animate() {
    if (!this.isPlaying) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    const barCount = 36;
    const barWidth = (w / barCount) * 0.68;
    const spacing = (w / barCount) * 0.32;
    const now = Date.now() / 160;

    let hasRealData = false;
    if (this.isWebAudioReady && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      hasRealData = this.dataArray.some(val => val > 0);
    }

    // Neon Aurora Spectrum Gradient
    const gradient = this.ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "#00f2fe");
    gradient.addColorStop(0.35, "#4facfe");
    gradient.addColorStop(0.7, "#9b51e0");
    gradient.addColorStop(1, "#ff007f");

    const baselineY = h * 0.72;

    for (let i = 0; i < barCount; i++) {
      let percent = 0;
      if (hasRealData && this.dataArray) {
        const binIndex = Math.floor((i / barCount) * this.dataArray.length);
        percent = (this.dataArray[binIndex] || 0) / 255;
      } else {
        // Multi-frequency wave simulation with harmonic resonance
        const wave1 = Math.sin(now + i * 0.38);
        const wave2 = Math.cos(now * 0.85 + i * 0.25);
        const wave3 = Math.sin(now * 1.4 - i * 0.45);
        percent = Math.abs(wave1 * 0.5 + wave2 * 0.35 + wave3 * 0.15);
      }

      const barHeight = Math.max(5, percent * (h * 0.65));
      const x = i * (barWidth + spacing) + spacing / 2;
      const y = baselineY - barHeight;

      // Primary Bar
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = "rgba(0, 242, 254, 0.5)";
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, 3);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();

      // Mirror reflection below baseline
      const reflectHeight = barHeight * 0.32;
      this.ctx.fillStyle = "rgba(0, 242, 254, 0.12)";
      this.ctx.shadowBlur = 0;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, baselineY + 2, barWidth, reflectHeight, 2);
      } else {
        this.ctx.rect(x, baselineY + 2, barWidth, reflectHeight);
      }
      this.ctx.fill();
    }
  }
}
