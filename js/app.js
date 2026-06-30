// ============================================
// Ethereal — Main App
// ============================================

(function init() {
  const audio = document.getElementById('audio');
  const canvas = document.getElementById('visualizer');

  const ui = {
    playBtn:     document.getElementById('playBtn'),
    prevBtn:     document.getElementById('prevBtn'),
    nextBtn:     document.getElementById('nextBtn'),
    shuffleBtn:  document.getElementById('shuffleBtn'),
    repeatBtn:   document.getElementById('repeatBtn'),
    muteBtn:     document.getElementById('muteBtn'),
    volume:      document.getElementById('volume'),
    volumeIcon:  document.getElementById('volumeIcon'),
    progressBar: document.getElementById('progressBar'),
    progressFill:document.getElementById('progressFill'),
    progressThumb:document.getElementById('progressThumb'),
    curTime:     document.getElementById('curTime'),
    durTime:     document.getElementById('durTime'),
    likeBtn:     document.getElementById('likeBtn'),
    playIcon:    document.getElementById('playIcon'),
    playerArt:   document.getElementById('playerArt'),
    playerTitle: document.getElementById('playerTitle'),
    playerArtist:document.getElementById('playerArtist')
  };

  // Visualizer
  window.__visualizer = new Visualizer(canvas, audio);
  audio.volume = 0.7;

  // Player
  const player = new Player(TRACKS, audio, ui);
  window.__player = player;

  // Render track grid
  const grid = document.getElementById('trackGrid');
  function render(filter = 'all') {
    grid.innerHTML = '';
    const list = filter === 'all' ? TRACKS : TRACKS.filter(t => t.mood === filter);
    list.forEach((t) => {
      const realIndex = TRACKS.indexOf(t);
      const card = document.createElement('div');
      card.className = 'track-card';
      card.dataset.index = realIndex;
      card.dataset.mood = t.mood;
      card.innerHTML = `
        <div class="track-art" style="background:${t.art}">
          <span class="art-emoji">${t.emoji}</span>
          <button class="track-play" aria-label="Play">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div class="track-name">${t.title}</div>
        <div class="track-artist">${t.artist}</div>
        <div class="track-meta">
          <span class="track-tag">${t.mood}</span>
          <span>${t.duration}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        player.load(realIndex);
        player.play();
      });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      grid.appendChild(card);
    });
  }
  render();

  // Filter chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.filter);
    });
  });

  // Mood cards
  document.querySelectorAll('.mood-card').forEach(card => {
    card.addEventListener('click', () => {
      const mood = card.dataset.mood;
      document.querySelectorAll('.chip-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === mood));
      render(mood);
      document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hero play
  document.getElementById('playHero').addEventListener('click', () => {
    player.load(0);
    player.play();
    document.getElementById('player').scrollIntoView({ behavior: 'smooth', block: 'end' });
  });

  // Cursor glow
  const glow = document.getElementById('cursorGlow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }

  // Section reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.section').forEach(s => io.observe(s));

  // Smooth nav active link
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(a => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id && id.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      navLinks.forEach(l => l.classList.remove('active'));
      a.classList.add('active');
    }
  }));

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space')      { e.preventDefault(); player.toggle(); }
    else if (e.code === 'ArrowRight' && e.shiftKey) { player.next(); }
    else if (e.code === 'ArrowLeft' && e.shiftKey)  { player.prev(); }
    else if (e.code === 'ArrowUp')   { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); ui.volume.value = audio.volume * 100; player.updateVolumeIcon(); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); ui.volume.value = audio.volume * 100; player.updateVolumeIcon(); }
  });

  // Default volume icon
  player.updateVolumeIcon();
})();
