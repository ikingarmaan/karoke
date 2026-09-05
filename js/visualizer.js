/**
 * Audio Spectrum Canvas Visualizer
 * Reacts to playing audio using Web Audio API with smooth visual fallback.
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
      this.analyser.smoothingTimeConstant = 0.8;

      // Note: crossOrigin audio elements might be blocked from WebAudio Analyser due to CORS;
      // we wrap in try-catch to ensure zero playback blockage
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.isWebAudioReady = true;
      } catch (err) {
        console.warn("WebAudio MediaElementSource restricted by browser CORS, using high-fidelity reactive animation:", err);
      }
    } catch (e) {
      console.warn("AudioContext initialization skipped:", e);
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

    const barCount = 32;
    const barWidth = (w / barCount) * 0.6;
    const spacing = (w / barCount) * 0.4;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + spacing) + spacing / 2;
      const barHeight = 4;
      const y = h - barHeight - 4;

      this.ctx.fillStyle = "rgba(0, 242, 254, 0.2)";
      this.ctx.beginPath();
      this.ctx.roundRect ? this.ctx.roundRect(x, y, barWidth, barHeight, 2) : this.ctx.rect(x, y, barWidth, barHeight);
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

    const barCount = 32;
    const barWidth = (w / barCount) * 0.65;
    const spacing = (w / barCount) * 0.35;
    const now = Date.now() / 200;

    let hasRealData = false;
    if (this.isWebAudioReady && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      hasRealData = this.dataArray.some(val => val > 0);
    }

    const gradient = this.ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "#00f2fe");
    gradient.addColorStop(0.5, "#4facfe");
    gradient.addColorStop(1, "#9b51e0");

    for (let i = 0; i < barCount; i++) {
      let percent = 0;
      if (hasRealData && this.dataArray) {
        const binIndex = Math.floor((i / barCount) * this.dataArray.length);
        percent = (this.dataArray[binIndex] || 0) / 255;
      } else {
        // Dynamic rhythmic wave simulation
        const wave1 = Math.sin(now + i * 0.45);
        const wave2 = Math.cos(now * 0.8 + i * 0.3);
        percent = Math.abs(wave1 * 0.6 + wave2 * 0.4);
      }

      const barHeight = Math.max(4, percent * (h * 0.85));
      const x = i * (barWidth + spacing) + spacing / 2;
      const y = h - barHeight - 4;

      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = "rgba(0, 242, 254, 0.4)";
      this.ctx.shadowBlur = 8;

      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, 3);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }
}
