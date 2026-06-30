// ============================================
// Ethereal — Player Engine
// ============================================

class Player {
  constructor(tracks, audio, ui) {
    this.tracks = tracks;
    this.audio = audio;
    this.ui = ui;
    this.index = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.isRepeat = false;
    this.likes = new Set();
    this.bind();
  }

  bind() {
    const { playBtn, prevBtn, nextBtn, shuffleBtn, repeatBtn, muteBtn, volume,
            progressBar, progressFill, progressThumb, curTime, durTime,
            likeBtn, playIcon } = this.ui;

    playBtn.addEventListener('click', () => this.toggle());
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());
    shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    repeatBtn.addEventListener('click', () => this.toggleRepeat());
    muteBtn.addEventListener('click', () => this.toggleMute());
    likeBtn.addEventListener('click', () => this.toggleLike());

    volume.addEventListener('input', (e) => {
      this.audio.volume = e.target.value / 100;
      this.updateVolumeIcon();
    });

    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
    });

    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.handleEnd());
    this.audio.addEventListener('play', () => this.setPlaying(true));
    this.audio.addEventListener('pause', () => this.setPlaying(false));
    this.audio.addEventListener('error', () => this.handleError());
  }

  load(index) {
    if (index < 0) index = this.tracks.length - 1;
    if (index >= this.tracks.length) index = 0;
    this.index = index;
    const t = this.tracks[index];
    this.audio.src = t.src;
    const { playerTitle, playerArtist, playerArt } = this.ui;
    playerTitle.textContent = t.title;
    playerArtist.textContent = t.artist;
    playerArt.style.background = t.art;
    playerArt.innerHTML = `<span style="position:relative;z-index:1">${t.emoji}</span>`;
    this.highlightActive();
  }

  play() {
    if (!this.audio.src) this.load(this.index);
    const p = this.audio.play();
    if (p && p.catch) p.catch(() => {/* user gesture needed */});
  }

  pause() { this.audio.pause(); }

  toggle() {
    if (!this.audio.src) { this.load(this.index); }
    this.isPlaying ? this.pause() : this.play();
  }

  next() {
    let next;
    if (this.isShuffle) {
      do { next = Math.floor(Math.random() * this.tracks.length); }
      while (next === this.index && this.tracks.length > 1);
    } else {
      next = this.index + 1 >= this.tracks.length ? 0 : this.index + 1;
    }
    this.load(next);
    this.play();
  }

  prev() {
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
    const prev = this.index - 1 < 0 ? this.tracks.length - 1 : this.index - 1;
    this.load(prev);
    this.play();
  }

  handleEnd() {
    if (this.isRepeat) { this.audio.currentTime = 0; this.play(); return; }
    this.next();
  }

  handleError() {
    console.warn('Audio failed to load:', this.tracks[this.index]?.src);
  }

  setPlaying(state) {
    this.isPlaying = state;
    const { playIcon, playerArt } = this.ui;
    playIcon.innerHTML = state
      ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'  // pause
      : '<path d="M8 5v14l11-7z"/>';              // play
    playerArt.classList.toggle('playing', state);
    document.querySelectorAll('.track-card').forEach(c => c.classList.remove('playing'));
    const active = document.querySelector(`.track-card[data-index="${this.index}"]`);
    if (active && state) active.classList.add('playing');
    if (window.__visualizer) state ? window.__visualizer.start() : window.__visualizer.stop();
  }

  updateProgress() {
    const { progressFill, progressThumb, curTime, durTime } = this.ui;
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const pct = dur ? (cur / dur) * 100 : 0;
    progressFill.style.width = pct + '%';
    progressThumb.style.left = pct + '%';
    curTime.textContent = this.formatTime(cur);
    durTime.textContent = this.formatTime(dur);
  }

  formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.ui.shuffleBtn.classList.toggle('active', this.isShuffle);
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    this.ui.repeatBtn.classList.toggle('active', this.isRepeat);
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    const v = this.audio.muted ? 0 : this.audio.volume;
    const icon = this.ui.volumeIcon;
    if (v === 0) {
      icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    } else if (v < 0.5) {
      icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    } else {
      icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    }
  }

  toggleLike() {
    const t = this.tracks[this.index];
    if (!t) return;
    if (this.likes.has(t.id)) { this.likes.delete(t.id); this.ui.likeBtn.classList.remove('like-active'); }
    else { this.likes.add(t.id); this.ui.likeBtn.classList.add('like-active'); }
  }

  highlightActive() {
    document.querySelectorAll('.track-card').forEach(c => c.classList.remove('playing'));
    const active = document.querySelector(`.track-card[data-index="${this.index}"]`);
    if (active) active.classList.add('playing');
  }
}
