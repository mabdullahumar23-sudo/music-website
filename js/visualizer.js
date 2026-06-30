// ============================================
// Ethereal — Audio Visualizer (Web Audio API)
// ============================================

class Visualizer {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.running = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = 100 * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '90px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  init() {
    if (this.audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AC();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.source = this.audioCtx.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  draw() {
    if (!this.running) return;
    requestAnimationFrame(() => this.draw());

    const W = this.canvas.clientWidth;
    const H = 90;
    this.ctx.clearRect(0, 0, W, H);

    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(this.dataArray);

    const bars = 96;
    const step = Math.floor(this.dataArray.length / bars);
    const barW = W / bars;
    const gradient = this.ctx.createLinearGradient(0, 0, W, 0);
    gradient.addColorStop(0, '#a78bfa');
    gradient.addColorStop(0.5, '#ec4899');
    gradient.addColorStop(1, '#f0abfc');

    for (let i = 0; i < bars; i++) {
      const v = this.dataArray[i * step] / 255;
      const h = Math.max(2, v * H);
      const x = i * barW;
      const y = H - h;

      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = '#ec4899';
      this.ctx.shadowBlur = 12;
      const r = Math.min(4, (barW - 2) / 2, h / 2);
      this.ctx.beginPath();
      if (typeof this.ctx.roundRect === 'function') {
        this.ctx.roundRect(x + 1, y, barW - 2, h, r);
      } else {
        this.ctx.rect(x + 1, y, barW - 2, h);
      }
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  start() {
    if (!this.audioCtx) this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.running = true;
    this.draw();
  }

  stop() {
    this.running = false;
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, 90);
  }
}
