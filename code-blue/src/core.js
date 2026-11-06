'use strict';
// ============================================================
// CODE BLUE: HEALTHCARE SHOWDOWN — core utilities, settings, input, audio
// ============================================================
const W = 1280, H = 720;
const FLOOR = 640;          // world-space floor line
const STAGE_W = 1800;       // world width
const TAU = Math.PI * 2;
const FPS = 60;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function rr(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
const FONT = "'Bangers', 'Impact', 'Arial Black', sans-serif";
const FONT2 = "'Russo One', 'Arial Black', 'Segoe UI', sans-serif";
function font(size, f = FONT) { return `${size}px ${f}`; }

// Big outlined cartoon text
function bigText(c, text, x, y, size, fill = '#fff', stroke = '#0b1530', align = 'center', f = FONT) {
  c.save();
  c.font = font(size, f);
  c.textAlign = align; c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = Math.max(3, size / 7);
  c.strokeStyle = stroke;
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
  c.restore();
}

// ------------------------------------------------------------
// Settings (persisted per viewer when storage is available)
// ------------------------------------------------------------
const DIFFS = ['Easy', 'Normal', 'Hard', 'Nightmare Shift'];
const Settings = {
  difficulty: 1, music: 0.5, sfx: 0.8, voice: true, popups: true, roundTime: 99, touch: 'auto',
  load() {
    try { const s = JSON.parse(localStorage.getItem('codeblue.settings') || '{}'); Object.assign(this, s); } catch (e) { /* storage unavailable */ }
  },
  save() {
    try {
      const { difficulty, music, sfx, voice, popups, roundTime, touch } = this;
      localStorage.setItem('codeblue.settings', JSON.stringify({ difficulty, music, sfx, voice, popups, roundTime, touch }));
    } catch (e) { /* ignore */ }
  }
};
Settings.load();

// ------------------------------------------------------------
// Input: keyboard (two layouts), gamepads, touch
// ------------------------------------------------------------
const BTN = ['left', 'right', 'up', 'down', 'lp', 'hp', 'lk', 'hk', 'sp', 'ult'];
const KEYMAP_P1 = {
  left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
  lp: ['KeyJ'], hp: ['KeyK'], lk: ['KeyU'], hk: ['KeyI'], sp: ['KeyL'], ult: ['KeyO']
};
const KEYMAP_P2 = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
  lp: ['Numpad1', 'Comma'], hp: ['Numpad2', 'Period'], lk: ['Numpad4', 'Semicolon'], hk: ['Numpad5', 'Quote'],
  sp: ['Numpad3', 'Slash'], ult: ['Numpad6', 'BracketRight']
};
const Input = {
  keys: new Set(), pressedKeys: new Set(), touch: {}, touchPressed: {},
  pads: [], padPrev: [[], []], anyPressed: false, mouse: null,
  init() {
    addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Slash', 'Quote'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressedKeys.add(e.code);
      this.keys.add(e.code);
      AudioSys.unlock();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  },
  down(code) { return this.keys.has(code); },
  pressed(code) { return this.pressedKeys.has(code); },
  // menu-level helpers
  menu(action) {
    const k = this.pressedKeys;
    const pad = this.padMenu;
    switch (action) {
      case 'up': return k.has('KeyW') || k.has('ArrowUp') || pad.up;
      case 'down': return k.has('KeyS') || k.has('ArrowDown') || pad.down;
      case 'left': return k.has('KeyA') || k.has('ArrowLeft') || pad.left;
      case 'right': return k.has('KeyD') || k.has('ArrowRight') || pad.right;
      case 'ok': return k.has('Enter') || k.has('Space') || k.has('KeyJ') || k.has('NumpadEnter') || pad.ok;
      case 'back': return k.has('Escape') || k.has('Backspace') || pad.back;
      case 'pause': return k.has('Escape') || k.has('KeyP') || pad.start;
    }
    return false;
  },
  padMenu: {},
  pollPads() {
    const gp = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    this.pads = gp;
    this.padMenu = {};
    gp.slice(0, 2).forEach((p, i) => {
      const prev = this.padPrev[i] || [];
      const cur = p.buttons.map(b => b.pressed);
      const ax = p.axes || [];
      cur[100] = (ax[0] || 0) < -0.5; cur[101] = (ax[0] || 0) > 0.5; cur[102] = (ax[1] || 0) < -0.5; cur[103] = (ax[1] || 0) > 0.5;
      const pr = idx => cur[idx] && !prev[idx];
      if (pr(12) || pr(102)) this.padMenu.up = true;
      if (pr(13) || pr(103)) this.padMenu.down = true;
      if (pr(14) || pr(100)) this.padMenu.left = true;
      if (pr(15) || pr(101)) this.padMenu.right = true;
      if (pr(0)) this.padMenu.ok = true;
      if (pr(1)) this.padMenu.back = true;
      if (pr(9)) this.padMenu.start = true;
      this.padPrev[i] = cur;
      p._cur = cur; p._prev = prev;
    });
  },
  // Build a per-player control frame. layouts: array of keymaps; padIndex; useTouch
  read(layouts, padIndex, useTouch) {
    const held = {}, pressed = {};
    for (const b of BTN) {
      held[b] = false; pressed[b] = false;
      for (const map of layouts) for (const code of map[b]) {
        if (this.keys.has(code)) held[b] = true;
        if (this.pressedKeys.has(code)) pressed[b] = true;
      }
      if (useTouch) {
        if (this.touch[b]) held[b] = true;
        if (this.touchPressed[b]) pressed[b] = true;
      }
    }
    const p = this.pads[padIndex];
    if (p && p._cur) {
      const c = p._cur, pv = p._prev;
      const map = { left: [14, 100], right: [15, 101], up: [12, 102, 3 /*Y*/ ], down: [13, 103, 6], lp: [2], hp: [3], lk: [0], hk: [1], sp: [5, 4], ult: [7] };
      // Y used for HP; jump on up/stick only
      map.up = [12, 102];
      for (const b of BTN) for (const i of map[b]) {
        if (c[i]) held[b] = true;
        if (c[i] && !pv[i]) pressed[b] = true;
      }
    }
    return { held, pressed };
  },
  endFrame() { this.pressedKeys.clear(); this.touchPressed = {}; this.mouse = null; }
};
Input.init();

// ------------------------------------------------------------
// Audio: all sound is synthesized with Web Audio (no files needed)
// ------------------------------------------------------------
const AudioSys = {
  ac: null, master: null, musicGain: null, sfxGain: null, noiseBuf: null,
  musicOn: false, track: null, step: 0, nextTime: 0, timer: null,
  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      this.master = this.ac.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ac.destination);
      this.musicGain = this.ac.createGain(); this.musicGain.connect(this.master);
      this.sfxGain = this.ac.createGain(); this.sfxGain.connect(this.master);
      this.applyVolumes();
      const len = this.ac.sampleRate * 1.5;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.wantTrack) this.playMusic(this.wantTrack);
    } catch (e) { this.ac = null; }
  },
  applyVolumes() {
    if (!this.ac) return;
    this.musicGain.gain.value = Settings.music * 0.35;
    this.sfxGain.gain.value = Settings.sfx * 0.7;
  },
  tone(freq, dur, type = 'square', vol = 0.3, slide = null, delay = 0, dest = null) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, freq = 1200, type = 'lowpass', delay = 0, dest = null) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  sfx(name) {
    if (!this.ac) return;
    const T = this.tone.bind(this), N = this.noise.bind(this);
    switch (name) {
      case 'hitL': N(0.08, 0.5, 2500); T(180, 0.08, 'square', 0.25, 70); break;
      case 'hitH': N(0.18, 0.7, 1400); T(120, 0.2, 'sawtooth', 0.35, 40); T(60, 0.25, 'sine', 0.5, 30); break;
      case 'crit': N(0.3, 0.8, 900); T(90, 0.35, 'sawtooth', 0.4, 30); T(880, 0.25, 'square', 0.15, 1760, 0.05); break;
      case 'block': T(900, 0.06, 'square', 0.15, 600); N(0.05, 0.2, 5000, 'highpass'); break;
      case 'whoosh': N(0.15, 0.25, 900, 'bandpass'); break;
      case 'jump': T(300, 0.12, 'square', 0.12, 600); break;
      case 'land': N(0.06, 0.25, 400); break;
      case 'ding': T(1318, 0.18, 'sine', 0.3); T(1760, 0.35, 'sine', 0.3, null, 0.09); break;
      case 'notify': T(988, 0.1, 'triangle', 0.3); T(1318, 0.1, 'triangle', 0.3, null, 0.1); T(1976, 0.25, 'triangle', 0.3, null, 0.2); break;
      case 'stamp': T(80, 0.3, 'sine', 0.8, 40); N(0.2, 0.7, 600); break;
      case 'beep': T(1000, 0.09, 'sine', 0.25); break;
      case 'alarm': for (let i = 0; i < 4; i++) { T(880, 0.12, 'square', 0.18, null, i * 0.25); T(660, 0.12, 'square', 0.18, null, i * 0.25 + 0.12); } break;
      case 'phone': for (let i = 0; i < 6; i++) T(i % 2 ? 480 : 440, 0.05, 'square', 0.12, null, i * 0.05); break;
      case 'printer': for (let i = 0; i < 8; i++) N(0.04, 0.25, 3000, 'bandpass', i * 0.07); break;
      case 'ko': T(400, 0.9, 'sawtooth', 0.35, 50); N(0.6, 0.5, 700); break;
      case 'select': T(660, 0.05, 'square', 0.15); break;
      case 'confirm': T(523, 0.08, 'square', 0.2); T(784, 0.12, 'square', 0.2, null, 0.08); break;
      case 'back': T(392, 0.1, 'square', 0.15, 262); break;
      case 'magic': for (let i = 0; i < 6; i++) T(600 + i * 180, 0.12, 'triangle', 0.15, null, i * 0.04); break;
      case 'freeze': T(2000, 0.4, 'sine', 0.2, 500); N(0.3, 0.2, 6000, 'highpass'); break;
      case 'pop': T(500, 0.06, 'sine', 0.3, 900); break;
      case 'cash': T(2093, 0.08, 'square', 0.15); T(2637, 0.3, 'square', 0.15, null, 0.08); N(0.1, 0.3, 4000, 'highpass'); break;
      case 'tick': T(2000, 0.03, 'square', 0.12); break;
      case 'snip': N(0.05, 0.5, 6000, 'highpass'); N(0.05, 0.5, 6000, 'highpass', 0.08); break;
      case 'inflate': T(150, 0.6, 'sawtooth', 0.15, 600); break;
      case 'teleport': T(1500, 0.25, 'sine', 0.25, 200); T(200, 0.25, 'sine', 0.25, 1500, 0.1); break;
      case 'super': T(110, 1.2, 'sawtooth', 0.3, 880); N(1.2, 0.3, 800, 'bandpass'); break;
      case 'cheer': N(1.5, 0.35, 2500, 'bandpass'); break;
      case 'slam': T(55, 0.5, 'sine', 0.9, 30); N(0.35, 0.8, 500); break;
    }
  },
  // ---- music: tiny step sequencer ----
  TRACKS: {
    menu:  { bpm: 128, root: 57, scale: [0, 3, 5, 7, 10], bass: [0, 0, 7, 0, 5, 5, 3, 3], lead: [12, -1, 15, 12, 17, -1, 15, 10, 12, -1, 19, 17, 15, -1, 12, -1] },
    fight: { bpm: 150, root: 52, scale: [0, 3, 5, 7, 10], bass: [0, 0, 12, 0, 10, 0, 7, 5], lead: [12, 15, 17, 19, 17, 15, 12, -1, 10, 12, 15, 12, 10, 7, 10, -1] },
    boss:  { bpm: 160, root: 50, scale: [0, 1, 5, 7, 8], bass: [0, 12, 0, 13, 0, 12, 8, 7], lead: [12, -1, 13, 12, 8, -1, 7, 8, 12, 15, 13, 12, 8, 7, 5, -1] },
    win:   { bpm: 140, root: 60, scale: [0, 4, 7, 9, 12], bass: [0, 0, 5, 5, 7, 7, 0, 0], lead: [12, 16, 19, 24, -1, 19, 24, -1, 21, 19, 16, 12, 16, -1, 12, -1] }
  },
  playMusic(name) {
    this.wantTrack = name;
    if (!this.ac) return;
    if (this.track === name && this.timer) return;
    this.stopMusic();
    this.track = name; this.step = 0; this.nextTime = this.ac.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null; this.track = null; },
  schedule() {
    if (!this.ac || !this.track) return;
    const tr = this.TRACKS[this.track];
    const spb = 60 / tr.bpm / 4;  // 16th notes
    while (this.nextTime < this.ac.currentTime + 0.12) {
      const s = this.step, d = this.nextTime - this.ac.currentTime;
      const mf = n => 440 * Math.pow(2, (n - 69) / 12);
      const bar = Math.floor(s / 16) % 4;
      const shift = [0, 0, 5, 7][bar];
      // drums
      if (s % 4 === 0) { this.tone(140, 0.12, 'sine', 0.6, 40, d, this.musicGain); }
      if (s % 8 === 4) this.noise(0.12, 0.35, 1800, 'bandpass', d, this.musicGain);
      if (s % 2 === 1) this.noise(0.03, 0.12, 8000, 'highpass', d, this.musicGain);
      // bass (8th notes)
      if (s % 2 === 0) {
        const bn = tr.bass[(s / 2) % tr.bass.length];
        this.tone(mf(tr.root - 12 + bn + shift), spb * 1.8, 'sawtooth', 0.16, null, d, this.musicGain);
      }
      // lead
      const ln = tr.lead[s % tr.lead.length];
      if (ln >= 0 && (Math.floor(s / 32) % 2 === 1 || this.track !== 'fight' || s % 4 !== 2)) {
        this.tone(mf(tr.root + ln + shift), spb * 1.6, 'square', 0.07, null, d, this.musicGain);
      }
      this.nextTime += spb; this.step++;
    }
  }
};
['pointerdown', 'touchstart'].forEach(ev => addEventListener(ev, () => AudioSys.unlock(), { passive: true }));

// ------------------------------------------------------------
// Announcer: on-screen callout + optional browser speech
// ------------------------------------------------------------
const Announcer = {
  queue: [], current: null,
  say(text, opts = {}) {
    const a = { text, t: 0, dur: opts.dur || 90, color: opts.color || '#ffd23f', size: opts.size || 96, y: opts.y || H * 0.42, sub: opts.sub || null };
    if (opts.queue) this.queue.push(a); else { this.current = a; this.queue = []; }
    if (Settings.voice && opts.voice !== false) this.speak(opts.speak || text);
  },
  speak(text) {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[—!]/g, m => m === '—' ? ',' : '!'));
      u.rate = 1.05; u.pitch = 0.55; u.volume = Math.min(1, Settings.sfx + 0.2);
      const v = speechSynthesis.getVoices().find(v => /en/i.test(v.lang) && /male|david|daniel|alex|fred|google uk english male/i.test(v.name));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable */ }
  },
  update() {
    if (this.current) { this.current.t++; if (this.current.t > this.current.dur) this.current = this.queue.shift() || null; }
    else if (this.queue.length) this.current = this.queue.shift();
  },
  draw(c) {
    const a = this.current; if (!a) return;
    const p = a.t / a.dur;
    const sIn = Math.min(1, a.t / 10);
    const scale = a.t < 10 ? easeOutBack(sIn) * 1.0 : 1 + Math.max(0, p - 0.85) * 0.6;
    const alpha = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
    c.save(); c.globalAlpha = Math.max(0, alpha);
    c.translate(W / 2, a.y); c.scale(scale, scale); c.rotate(-0.03);
    bigText(c, a.text, 0, 0, a.size, a.color, '#0b1530');
    if (a.sub) bigText(c, a.sub, 0, a.size * 0.75, a.size * 0.38, '#fff', '#0b1530');
    c.restore();
  },
  clear() { this.current = null; this.queue = []; try { speechSynthesis.cancel(); } catch (e) {} }
};
