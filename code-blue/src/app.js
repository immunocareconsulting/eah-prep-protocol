'use strict';
// ============================================================
// App: scenes (title, menus, select, VS, fight, results), touch controls, main loop
// ============================================================

// ---------- UI helpers ----------
function drawButton(c, x, y, w, h, label, sel, sub) {
  c.save();
  const pulse = sel ? Math.sin(App.t * 0.15) * 3 : 0;
  rr(c, x - pulse, y - pulse / 2, w + pulse * 2, h + pulse, 12);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, sel ? '#ffd23f' : 'rgba(30,60,130,.9)'); g.addColorStop(1, sel ? '#ff9f1c' : 'rgba(15,30,80,.9)');
  c.fillStyle = g; c.fill(); c.strokeStyle = sel ? '#fff' : '#5f8fe0'; c.lineWidth = 3; c.stroke();
  bigText(c, label, x + w / 2, y + h / 2 + (sub ? -8 : 1), Math.min(34, h * 0.55), sel ? '#13284f' : '#fff', sel ? '#fff' : INK);
  if (sub) { c.fillStyle = sel ? '#13284f' : '#bcd3ff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText(sub, x + w / 2, y + h - 10); }
  c.restore();
}
function menuNav(n, i, rectFn, horizontal = false) {
  let ok = false;
  if (Input.menu(horizontal ? 'left' : 'up')) { i = (i - 1 + n) % n; AudioSys.sfx('select'); }
  if (Input.menu(horizontal ? 'right' : 'down')) { i = (i + 1) % n; AudioSys.sfx('select'); }
  if (Input.menu('ok')) ok = true;
  if (Input.mouse) {
    for (let k = 0; k < n; k++) { const r = rectFn(k); if (Input.mouse.x >= r.x && Input.mouse.x <= r.x + r.w && Input.mouse.y >= r.y && Input.mouse.y <= r.y + r.h) { if (k === i) ok = true; else { i = k; ok = true; } } }
  }
  return { i, ok };
}
function tapped(r) { const m = Input.mouse; return m && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h; }
function backBtn(c) { drawButton(c, 24, H - 76, 150, 52, '◀ BACK', false); }
function backTapped() { return tapped({ x: 24, y: H - 76, w: 150, h: 52 }); }
function ratingStars(c, x, y, n, col = '#ffd23f') { for (let i = 0; i < 5; i++) star(c, x + i * 22, y, 9, i < n ? col : 'rgba(255,255,255,.2)'); }
function bgGrad(c, a = '#0b1a45', b = '#1f5fd1') {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // ECG line
  c.save(); c.strokeStyle = 'rgba(127,214,255,.25)'; c.lineWidth = 4; c.beginPath();
  for (let x = 0; x <= W; x += 6) { const ph = (x + App.t * 6) % 300; const y = ph > 140 && ph < 170 ? -90 * Math.sin((ph - 140) / 30 * Math.PI) * (ph < 155 ? 1 : -0.4) : 0; x ? c.lineTo(x, H * 0.55 + y) : c.moveTo(x, H * 0.55 + y); }
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 12; i++) { c.save(); c.translate((i * 173 + App.t * 0.5) % (W + 100) - 50, (i * 97) % H); c.rotate(App.t * 0.01 + i); c.fillRect(-12, -40, 24, 80); c.fillRect(-40, -12, 80, 24); c.restore(); }
  c.restore();
}
function logo(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.save(); c.rotate(-0.04);
  bigText(c, 'CODE BLUE', 0, 0, 150, '#7fd6ff', '#0b1530');
  c.globalAlpha = 0.25 + Math.sin(App.t * 0.1) * 0.15; bigText(c, 'CODE BLUE', 0, 0, 150, '#fff', 'rgba(0,0,0,0)'); c.globalAlpha = 1;
  c.restore();
  rr(c, -300, 64, 600, 56, 10); c.fillStyle = '#d0121b'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
  bigText(c, 'HEALTHCARE SHOWDOWN', 0, 93, 46, '#fff', '#5a0a0f');
  c.restore();
}
function lineup(c, y, scale, t, highlight = -1) {
  ROSTER.forEach((r, i) => {
    const x = W / 2 + (i - (ROSTER.length - 1) / 2) * Math.min(230, 1150 / ROSTER.length);
    const b = Math.sin(t * 0.09 + i) * 0.06;
    const pose = Object.assign({}, i === highlight ? POSES.win : POSES.idle, { fK: POSES.idle.fK + b * 2, bK: POSES.idle.bK + b * 2 });
    drawCharacter(c, r.look, x, y, { pose, facing: i < ROSTER.length / 2 ? 1 : -1, t, scale: scale * (r.size || 1) / 1.13, expr: i === highlight ? 'happy' : 'normal', blink: (t + i * 50) % 220 < 6 });
  });
}

// ---------- Touch controls ----------
const Touch = {
  btns: [
    { id: 'left', x: 95, y: 600, r: 52, label: '◀' }, { id: 'right', x: 245, y: 600, r: 52, label: '▶' },
    { id: 'up', x: 170, y: 525, r: 46, label: '▲' }, { id: 'down', x: 170, y: 670, r: 46, label: '▼' },
    { id: 'lp', x: 960, y: 560, r: 44, label: 'LP' }, { id: 'hp', x: 1060, y: 540, r: 44, label: 'HP' }, { id: 'sp', x: 1165, y: 560, r: 46, label: 'SP' },
    { id: 'lk', x: 960, y: 665, r: 44, label: 'LK' }, { id: 'hk', x: 1060, y: 645, r: 44, label: 'HK' }, { id: 'ult', x: 1165, y: 665, r: 46, label: 'ULT' },
    { id: 'pause', x: W / 2, y: 132, r: 26, label: 'II' }
  ],
  active: new Map(),
  enabled() { return Settings.touch === 'on' || (Settings.touch === 'auto' && App.touchSeen); },
  find(x, y) { for (const b of this.btns) if (Math.hypot(x - b.x, y - b.y) < b.r * 1.25) return b; return null; },
  press(id, b) {
    if (b.id === 'pause') { Input.pressedKeys.add('Escape'); return; }
    this.active.set(id, b.id); Input.touch[b.id] = true; Input.touchPressed[b.id] = true;
  },
  release(id) { const b = this.active.get(id); if (b) { this.active.delete(id); if (![...this.active.values()].includes(b)) Input.touch[b] = false; } },
  draw(c) {
    c.save();
    for (const b of this.btns) {
      const on = Input.touch[b.id];
      c.globalAlpha = on ? 0.75 : 0.38;
      dot(c, b.x, b.y, b.r, b.id === 'ult' ? '#ffd23f' : b.id === 'sp' ? '#ff5a8a' : '#1f5fd1', '#fff', 3);
      c.globalAlpha = on ? 1 : 0.8; bigText(c, b.label, b.x, b.y + 2, b.r * 0.6, '#fff');
    }
    c.restore();
  }
};
function toCanvas(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
canvas.addEventListener('pointerdown', e => {
  e.preventDefault(); AudioSys.unlock();
  if (e.pointerType === 'touch') App.touchSeen = true;
  const p = toCanvas(e);
  if (App.scene === 'fight' && Touch.enabled() && App.match && !App.match.paused) {
    const b = Touch.find(p.x, p.y); if (b) { Touch.press(e.pointerId, b); return; }
  }
  Input.mouse = p;
});
canvas.addEventListener('pointermove', e => {
  if (!Touch.active.has(e.pointerId)) return;
  const p = toCanvas(e); const b = Touch.find(p.x, p.y);
  const cur = Touch.active.get(e.pointerId);
  if (b && b.id !== cur && b.id !== 'pause') { Touch.release(e.pointerId); Touch.press(e.pointerId, b); }
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => canvas.addEventListener(ev, e => Touch.release(e.pointerId)));
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ---------- App / scenes ----------
const App = {
  scene: 'title', t: 0, st: 0, touchSeen: false, fx: [],
  sel: null, match: null, arcade: null, lastMatchOpts: null, result: null,
  go(scene) {
    this.scene = scene; this.st = 0; this.fx = []; Announcer.clear();
    if (['menu', 'title', 'instructions', 'settings', 'select', 'arena'].includes(scene)) AudioSys.playMusic('menu');
    if (scene !== 'fight') this.match = null;
  },
  startSelect(mode) {
    this.mode = mode;
    this.sel = { step: 0, cur: [0, 1], chosen: [null, null], arena: 0 };
    this.go('select');
  },
  beginMatch(p1, p2, arena) {
    const opts = { p1, p2, arena, mode: this.mode, onEnd: res => this.onMatchEnd(res) };
    this.lastMatchOpts = opts;
    this.vs = { p1, p2, arena }; this.go('vs');
  },
  restartMatch() { this.match = new Match(this.lastMatchOpts); this.scene = 'fight'; this.st = 0; },
  onMatchEnd(res) {
    this.result = res; this.resultSel = 0;
    this.later = 140; // linger on the arena briefly before results
  },
  nextArcade() {
    const a = this.arcade;
    this.beginMatch(this.sel.chosen[0], a.ladder[a.idx], a.arenas[a.idx]);
  },

  update() {
    this.t++; this.st++;
    const s = this.scene;
    this.fx = this.fx.filter(e => e.update());
    if (s === 'title') {
      if (this.st === 2) AudioSys.playMusic('menu');
      if (Input.menu('ok') || Input.mouse || Input.pressedKeys.size || Input.padMenu.ok || Input.padMenu.start) { AudioSys.unlock(); AudioSys.playMusic('menu'); AudioSys.sfx('confirm'); this.go('menu'); this.menuSel = 0; Announcer.say('CODE BLUE!', { size: 110, color: '#7fd6ff', dur: 70 }); }
      return;
    }
    if (s === 'menu') {
      const items = MAIN_MENU;
      const r = menuNav(items.length, this.menuSel || 0, i => ({ x: 70, y: 200 + i * 66, w: 420, h: 56 }));
      this.menuSel = r.i;
      if (r.ok) { AudioSys.sfx('confirm'); items[r.i].go(); }
      if (Input.menu('back')) this.go('title');
      return;
    }
    if (s === 'instructions') { if (Input.menu('back') || Input.menu('ok') || backTapped()) { AudioSys.sfx('back'); this.go('menu'); } return; }
    if (s === 'settings') return updateSettings();
    if (s === 'select') return updateSelect();
    if (s === 'arena') return updateArenaSelect();
    if (s === 'vs') {
      if (this.st === 8) { Announcer.say('CODE BLUE!', { size: 110, color: '#7fd6ff', dur: 70, y: H - 110, speak: 'Code blue! ' + this.vs.p1.name.toLowerCase() + ' versus ' + this.vs.p2.name.toLowerCase() }); AudioSys.sfx('alarm'); }
      if (this.st > 230 || (this.st > 40 && (Input.menu('ok') || Input.mouse))) { this.match = new Match(Object.assign({}, this.lastMatchOpts)); this.scene = 'fight'; this.st = 0; Announcer.clear(); }
      return;
    }
    if (s === 'fight') {
      this.match.update();
      if (this.later != null && --this.later <= 0) { this.later = null; this.go('result'); this.scene = 'result'; }
      return;
    }
    if (s === 'result') return updateResult();
    if (s === 'ending') {
      if (this.st % 40 === 1) confetti({ fx: this.fx }, W / 2, 200, 40);
      if (this.st > 90 && (Input.menu('ok') || Input.mouse)) { AudioSys.sfx('confirm'); this.go('menu'); }
      return;
    }
  },

  draw(c) {
    const s = this.scene;
    if (s === 'title') drawTitle(c);
    else if (s === 'menu') drawMenu(c);
    else if (s === 'instructions') drawInstructions(c);
    else if (s === 'settings') drawSettings(c);
    else if (s === 'select') drawSelect(c);
    else if (s === 'arena') drawArenaSelect(c);
    else if (s === 'vs') drawVS(c);
    else if (s === 'fight') this.match.draw(c);
    else if (s === 'result') drawResult(c);
    else if (s === 'ending') drawEnding(c);
    if (s !== 'fight') { for (const e of this.fx) e.draw(c); Announcer.draw(c); }
  }
};

const MAIN_MENU = [
  { label: 'START GAME', sub: 'Arcade run vs. the whole hospital', go: () => App.startSelect('arcade') },
  { label: 'CHARACTER SELECTION', sub: 'Pick your fighter & opponent (vs CPU)', go: () => App.startSelect('cpu') },
  { label: 'ARCADE MODE', sub: '5 fights. Final boss: Gordon in Quality & Operations.', go: () => App.startSelect('arcade') },
  { label: 'VERSUS MODE', sub: 'Local 2-player (keyboard / gamepads)', go: () => App.startSelect('versus') },
  { label: 'TRAINING MODE', sub: 'Practice combos on a dummy', go: () => App.startSelect('training') },
  { label: 'INSTRUCTIONS', sub: 'Controls, specials & tips', go: () => App.go('instructions') },
  { label: 'SETTINGS', sub: 'Difficulty, audio, pop-ups, touch', go: () => { App.setSel = 0; App.go('settings'); } }
];

function drawTitle(c) {
  bgGrad(c);
  lineup(c, H + 40, 1.0, App.t);
  c.fillStyle = 'rgba(5,10,30,.35)'; c.fillRect(0, 0, W, H);
  logo(c, W / 2, 190, 1);
  if (App.t % 60 < 40) bigText(c, 'PRESS ENTER • TAP • PRESS START', W / 2, 400, 40, '#ffd23f');
  c.fillStyle = '#bcd3ff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center';
  c.fillText('An ImmunoCare Health workplace-comedy fighting game • No patients were harmed.', W / 2, 440);
}
function drawMenu(c) {
  bgGrad(c);
  const hi = (App.menuSel || 0) % ROSTER.length;
  c.save(); c.translate(260, 0); lineup(c, H + 10, 0.85, App.t, -1); c.restore();
  if (!drawShowcase(c, ROSTER[hi].id, 720, 110, 400, 530, { fy: 0.4, glow: ROSTER[hi].color, flip: true }))
    drawCharacter(c, ROSTER[hi].look, 900, 640, { pose: POSES.win, facing: -1, t: App.t, scale: 1.45, expr: 'happy', spriteKey: 'win' });
  c.fillStyle = 'rgba(5,10,30,.45)'; c.fillRect(0, 0, 560, H);
  logo(c, 290, 70, 0.48);
  MAIN_MENU.forEach((m, i) => drawButton(c, 70, 200 + i * 66, 420, 56, m.label, i === App.menuSel, i === App.menuSel ? m.sub : null));
  c.fillStyle = '#bcd3ff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'left';
  c.fillText('W/S or ↑/↓ to move • Enter/J to select • Esc to go back', 70, H - 20);
  bigText(c, `DIFFICULTY: ${DIFFS[Settings.difficulty].toUpperCase()}`, W - 30, 40, 26, '#ffd23f', INK, 'right');
}

// ---------- Instructions ----------
function drawInstructions(c) {
  bgGrad(c, '#0b1a45', '#13284f');
  bigText(c, 'HOW TO CLOCK IN', W / 2, 52, 64, '#ffd23f');
  const col = (x, title, rows) => {
    rr(c, x, 100, 580, 520, 14); c.fillStyle = 'rgba(255,255,255,.07)'; c.fill(); c.strokeStyle = '#5f8fe0'; c.lineWidth = 2; c.stroke();
    bigText(c, title, x + 290, 128, 30, '#7fd6ff');
    rows.forEach((r, i) => {
      c.fillStyle = r[1] ? '#fff' : '#ffd23f'; c.font = r[1] ? 'bold 16px sans-serif' : 'bold 17px sans-serif'; c.textAlign = 'left'; c.fillText(r[0], x + 20, 168 + i * 29);
      if (r[1]) { c.fillStyle = '#7fd6ff'; c.textAlign = 'right'; c.fillText(r[1], x + 560, 168 + i * 29); }
    });
  };
  col(40, 'CONTROLS', [
    ['PLAYER 1 (keyboard)', ''], ['Move / Jump / Block', 'A D / W / S'], ['Light / Heavy Punch', 'J / K'], ['Light / Heavy Kick', 'U / I'], ['Special / Ultimate', 'L / O'],
    ['PLAYER 2 (versus)', ''], ['Move / Jump / Block', 'Arrow keys'], ['Punches  LP / HP', 'Num1 / Num2  or  , / .'], ['Kicks  LK / HK', 'Num4 / Num5  or  ; / \''], ['Special / Ultimate', 'Num3 / Num6  or  / / ]'],
    ['GAMEPADS & TOUCH', ''], ['Pad: X/Y punch, A/B kick, RB special, RT ult', ''], ['Touch: on-screen D-pad and buttons appear', ''], ['Pause: Esc / P / Start / II button', '']
  ]);
  col(660, 'SHIFT RULES', [
    ['Best 2 of 3 rounds. Empty their health bar!', ''], ['Specials: L + direction', ''], ['  L / →+L / ←+L / S+L / L in air', ''],
    ['Each special has a cooldown (see the icons)', ''], ['Energy fills as you hit, block & get hit', ''], ['Full energy → O for a cinematic ULTIMATE', ''],
    ['TIPS', ''], ['Hit-confirm: normals cancel into specials', ''], ['Heavy Kick launches → juggle in the air!', ''], ['Hold S to block; S + ←/→ to dodge-roll', ''],
    ['Watch out for hospital pop-ups…', ''], ['…some actually affect the fight.', ''], ['Projectiles clash and cancel each other.', ''], ['Vein Finder = +damage & crit chance', '']
  ]);
  backBtn(c);
}

// ---------- Settings ----------
const SETTINGS_ROWS = [
  { label: 'DIFFICULTY', get: () => DIFFS[Settings.difficulty], change: d => Settings.difficulty = (Settings.difficulty + d + 4) % 4 },
  { label: 'ROUND TIME', get: () => Settings.roundTime ? Settings.roundTime + ' sec' : '∞', change: d => { const o = [60, 99, 0]; Settings.roundTime = o[(o.indexOf(Settings.roundTime) + d + 3) % 3]; } },
  { label: 'MUSIC VOLUME', get: () => Math.round(Settings.music * 10) + ' / 10', change: d => { Settings.music = clamp(Math.round(Settings.music * 10 + d) / 10, 0, 1); AudioSys.applyVolumes(); } },
  { label: 'SFX VOLUME', get: () => Math.round(Settings.sfx * 10) + ' / 10', change: d => { Settings.sfx = clamp(Math.round(Settings.sfx * 10 + d) / 10, 0, 1); AudioSys.applyVolumes(); AudioSys.sfx('hitL'); } },
  { label: 'ANNOUNCER VOICE', get: () => Settings.voice ? 'ON' : 'OFF', change: () => Settings.voice = !Settings.voice },
  { label: 'HOSPITAL POP-UPS', get: () => Settings.popups ? 'ON' : 'OFF', change: () => Settings.popups = !Settings.popups },
  { label: 'TOUCH CONTROLS', get: () => Settings.touch.toUpperCase(), change: d => { const o = ['auto', 'on', 'off']; Settings.touch = o[(o.indexOf(Settings.touch) + d + 3) % 3]; } },
  { label: 'BACK', get: () => '', change: null }
];
function updateSettings() {
  const r = menuNav(SETTINGS_ROWS.length, App.setSel || 0, i => ({ x: W / 2 - 360, y: 130 + i * 66, w: 720, h: 56 }));
  App.setSel = r.i; const row = SETTINGS_ROWS[r.i];
  if (row.change) {
    if (Input.menu('left')) { row.change(-1); AudioSys.sfx('select'); Settings.save(); }
    if (Input.menu('right') || r.ok) { row.change(1); AudioSys.sfx('select'); Settings.save(); }
  } else if (r.ok) { AudioSys.sfx('back'); App.go('menu'); }
  if (Input.menu('back')) { Settings.save(); AudioSys.sfx('back'); App.go('menu'); }
}
function drawSettings(c) {
  bgGrad(c, '#0b1a45', '#13284f');
  bigText(c, 'SETTINGS', W / 2, 70, 70, '#ffd23f');
  SETTINGS_ROWS.forEach((row, i) => {
    const sel = i === App.setSel, y = 130 + i * 66;
    rr(c, W / 2 - 360, y, 720, 56, 12); c.fillStyle = sel ? 'rgba(255,210,63,.95)' : 'rgba(30,60,130,.85)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    bigText(c, row.label, W / 2 - 330, y + 29, 30, sel ? '#13284f' : '#fff', sel ? '#fff' : INK, 'left');
    if (row.change) bigText(c, `◀  ${row.get()}  ▶`, W / 2 + 330, y + 29, 30, sel ? '#13284f' : '#7fd6ff', sel ? '#fff' : INK, 'right');
  });
  c.fillStyle = '#bcd3ff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('←/→ to change • Nightmare Shift: CPU blocks everything and hits harder. Good luck.', W / 2, H - 22);
}

// ---------- Character select ----------
function selectCardRect(i) { const n = ROSTER.length, cw = n > 6 ? 140 : n > 5 ? 158 : 172, gap = n > 6 ? 10 : n > 5 ? 12 : 18, x0 = Math.max(190, W / 2 - (n * cw + (n - 1) * gap) / 2); return { x: x0 + i * (cw + gap), y: 486, w: cw, h: 200 }; }
function updateSelect() {
  const S = App.sel, mode = App.mode;
  const humanPicksP2 = mode !== 'arcade';
  const k = S.step;
  if (Input.menu('left')) { S.cur[k] = (S.cur[k] + ROSTER.length - 1) % ROSTER.length; AudioSys.sfx('select'); }
  if (Input.menu('right')) { S.cur[k] = (S.cur[k] + 1) % ROSTER.length; AudioSys.sfx('select'); }
  let ok = Input.menu('ok');
  if (Input.mouse) for (let i = 0; i < ROSTER.length; i++) if (tapped(selectCardRect(i))) { if (S.cur[k] === i) ok = true; else { S.cur[k] = i; AudioSys.sfx('select'); } }
  if (backTapped() || Input.menu('back')) {
    AudioSys.sfx('back');
    if (S.step > 0) { S.step--; S.chosen[S.step] = null; } else App.go('menu');
    return;
  }
  if (ok) {
    AudioSys.sfx('confirm');
    S.chosen[k] = ROSTER[S.cur[k]];
    Announcer.say(S.chosen[k].name, { size: 80, color: S.chosen[k].color, dur: 50, y: 420, speak: S.chosen[k].name.toLowerCase() });
    if (k === 0 && humanPicksP2) { S.step = 1; if (S.cur[1] === S.cur[0]) S.cur[1] = (S.cur[0] + 1) % ROSTER.length; return; }
    if (mode === 'arcade') {
      const others = ROSTER.filter(r => r !== S.chosen[0]);
      const boss = others.find(r => r.id === 'gordon') || others[others.length - 1];
      const rest = others.filter(r => r !== boss).sort(() => Math.random() - 0.5);
      App.arcade = { ladder: [...rest, boss], arenas: others.map((_, i) => i === others.length - 1 ? 4 : i % 4), idx: 0 };
      App.nextArcade();
    } else { App.arenaSel = randi(0, 4); App.go('arena'); }
  }
}
function drawSelect(c) {
  const S = App.sel, mode = App.mode, k = S.step;
  bgGrad(c, '#0b1a45', '#1d3d8a');
  const title = { arcade: 'ARCADE — CHOOSE YOUR FIGHTER', cpu: k === 0 ? 'CHOOSE YOUR FIGHTER' : 'CHOOSE YOUR OPPONENT', versus: k === 0 ? 'PLAYER 1 — CHOOSE' : 'PLAYER 2 — CHOOSE', training: k === 0 ? 'TRAINING — YOUR FIGHTER' : 'CHOOSE A TRAINING DUMMY' }[mode];
  bigText(c, title, W / 2, 40, 48, '#ffd23f');
  const def = ROSTER[S.cur[k]];
  // big preview
  const flip = k === 1 ? -1 : 1;
  const px = k === 1 ? 1060 : 200;
  c.save(); c.globalAlpha = 0.25; c.fillStyle = def.color; c.beginPath(); c.arc(px, 330, 170, 0, TAU); c.fill(); c.restore();
  const b = Math.sin(App.t * 0.09) * 0.06;
  if (!drawShowcase(c, def.id, px - 150, 85, 300, 395, { fy: 0.35, glow: def.color, border: def.color }))
    drawCharacter(c, def.look, px, 470, { pose: Object.assign({}, POSES.idle, { fK: POSES.idle.fK + b * 2, bK: POSES.idle.bK + b * 2 }), facing: flip, t: App.t, scale: 1.25, blink: App.t % 200 < 6 });
  // info panel
  const ix = k === 1 ? 70 : 390;
  rr(c, ix, 80, 820, 390, 16); c.fillStyle = 'rgba(5,10,30,.6)'; c.fill(); c.strokeStyle = def.color; c.lineWidth = 3; c.stroke();
  bigText(c, def.name, ix + 24, 122, 56, def.color, INK, 'left');
  bigText(c, `“${def.title}”`, ix + 24, 170, 28, '#fff', INK, 'left');
  c.fillStyle = '#bcd3ff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'left'; c.fillText(def.role.toUpperCase() + (def.org ? '  •  ' + def.org.toUpperCase() : ''), ix + 26, 205);
  const R = def.rating;
  [['POWER', R.power], ['SPEED', R.speed], ['DEFENSE', R.defense], ['DIFFICULTY', R.difficulty]].forEach(([n, v], i) => {
    c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'left'; c.fillText(n, ix + 26, 246 + i * 34);
    ratingStars(c, ix + 150, 241 + i * 34, v, i === 3 ? '#ff5a8a' : '#ffd23f');
  });
  c.fillStyle = '#ffd23f'; c.font = 'bold 16px sans-serif'; c.fillText('SIGNATURE ATTACKS', ix + 400, 236);
  def.specials.forEach((s, i) => {
    c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'left'; c.fillText(s.name, ix + 400, 264 + i * 28);
    c.fillStyle = '#7fd6ff'; c.textAlign = 'right'; c.fillText({ N: 'L', F: '→L', B: '←L', D: '↓L', AIR: 'air L' }[s.input], ix + 800, 264 + i * 28);
  });
  c.fillStyle = '#ff5a8a'; c.font = 'bold 15px sans-serif'; c.textAlign = 'left'; c.fillText('ULT: ' + def.ult.name, ix + 400, 264 + def.specials.length * 28);
  c.fillStyle = '#bcd3ff'; c.font = 'italic 16px sans-serif'; c.fillText(`"${def.intro}"`, ix + 26, 445);
  // cards
  ROSTER.forEach((r, i) => {
    const R2 = selectCardRect(i);
    const isCur = S.cur[k] === i, isP1 = S.chosen[0] === r;
    c.save();
    rr(c, R2.x, R2.y, R2.w, R2.h, 14); c.fillStyle = isCur ? r.color : 'rgba(20,40,90,.9)'; c.fill();
    c.save(); rr(c, R2.x, R2.y, R2.w, R2.h, 14); c.clip();
    if (hasShowcase(r.id)) drawShowcase(c, r.id, R2.x, R2.y, R2.w, R2.h, Object.assign({ border: false, radius: 0 }, r.face));
    else if (PortraitImages[r.id]) { const im = PortraitImages[r.id]; const s = Math.max(R2.w / im.width, R2.h / im.height); c.drawImage(im, R2.x + (R2.w - im.width * s) / 2, R2.y, im.width * s, im.height * s); }
    else drawBust(c, r.look, R2.x + R2.w / 2 - 6, R2.y + 72, 2.3, isCur ? 'happy' : 'normal', App.t);
    c.restore();
    c.lineWidth = isCur ? 6 : 2; c.strokeStyle = isCur ? '#fff' : '#5f8fe0'; rr(c, R2.x, R2.y, R2.w, R2.h, 14); c.stroke();
    rr(c, R2.x, R2.y + R2.h - 40, R2.w, 40, 0); c.fillStyle = 'rgba(5,10,30,.8)'; c.fill();
    bigText(c, r.name, R2.x + R2.w / 2, R2.y + R2.h - 24, r.name.length > 8 ? 20 : 26, '#fff');
    c.fillStyle = '#bcd3ff'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillText(r.role.toUpperCase(), R2.x + R2.w / 2, R2.y + R2.h - 6);
    if (isCur) bigText(c, k === 0 ? 'P1' : (mode === 'versus' ? 'P2' : 'CPU'), R2.x + 24, R2.y + 20, 26, k === 0 ? '#3bb3ff' : '#ff3b3b');
    if (isP1 && k === 1) bigText(c, 'P1', R2.x + R2.w - 24, R2.y + 20, 26, '#3bb3ff');
    c.restore();
  });
  backBtn(c);
  c.fillStyle = '#bcd3ff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'right'; c.fillText('←/→ choose • Enter/J confirm • tap a card twice', W - 24, H - 10);
}

// ---------- Arena select ----------
function arenaRect(i) { return { x: 50, y: 110 + i * 92, w: 420, h: 78 }; }
function updateArenaSelect() {
  const r = menuNav(ARENAS.length, App.arenaSel, arenaRect);
  App.arenaSel = r.i;
  if (Input.menu('back') || backTapped()) { AudioSys.sfx('back'); App.sel.step = App.mode === 'arcade' ? 0 : 1; App.sel.chosen[App.sel.step] = null; App.go('select'); return; }
  if (r.ok) { AudioSys.sfx('confirm'); App.beginMatch(App.sel.chosen[0], App.sel.chosen[1], r.i); }
}
function drawArenaPreview(c, i, x, y, w, h, t) {
  c.save(); rr(c, x, y, w, h, 12); c.clip();
  if (ArenaImages[i]) { const im = ArenaImages[i], s = Math.max(w / im.width, h / im.height); c.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s); c.restore(); return; }
  const z = w / W; c.translate(x, y); c.scale(z, z);
  c.translate(W / 2, 640); c.translate(-STAGE_W / 2, -FLOOR);
  ARENAS[i].draw(c, { x: STAGE_W / 2, zoom: 1 }, t);
  c.restore();
}
function drawArenaSelect(c) {
  bgGrad(c, '#0b1a45', '#13284f');
  bigText(c, 'CHOOSE YOUR WORKPLACE', W / 2, 50, 54, '#ffd23f');
  ARENAS.forEach((a, i) => drawButton(c, arenaRect(i).x, arenaRect(i).y, arenaRect(i).w, arenaRect(i).h, a.name, i === App.arenaSel, `Stage ${i + 1}`));
  drawArenaPreview(c, App.arenaSel, 510, 110, 720, 405, App.t);
  c.strokeStyle = '#fff'; c.lineWidth = 4; rr(c, 510, 110, 720, 405, 12); c.stroke();
  const [p1, p2] = App.sel.chosen;
  if (p1 && p2) { drawBust(c, p1.look, 600, 560, 1.6, 'fierce', App.t, 1); drawBust(c, p2.look, 1140, 560, 1.6, 'fierce', App.t, -1); bigText(c, `${p1.name}  VS  ${p2.name}`, 870, 610, 40, '#fff'); }
  backBtn(c);
}

// ---------- VS screen ----------
function drawVS(c) {
  const { p1, p2, arena } = App.vs; const t = App.st;
  c.fillStyle = p1.color; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.56, 0); c.lineTo(W * 0.44, H); c.lineTo(0, H); c.fill();
  c.fillStyle = p2.color; c.beginPath(); c.moveTo(W * 0.56, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W * 0.44, H); c.fill();
  c.fillStyle = 'rgba(5,10,30,.45)'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 24; i++) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(((i * 211 + t * 30) % (W + 300)) - 150, (i * 53) % H, 200, 4); }
  const sl = Math.min(1, t / 25);
  const es = easeOutBack(sl);
  if (!drawShowcase(c, p1.id, lerp(-450, 90, es), 168, 400, 530, { fy: 0.4, glow: p1.color }))
    drawCharacter(c, p1.look, lerp(-300, 300, es), 690, { pose: POSES.armsx, facing: 1, t, scale: 1.7, expr: 'fierce', spriteKey: 'idle' });
  if (!drawShowcase(c, p2.id, lerp(W + 50, W - 490, es), 168, 400, 530, { fy: 0.4, glow: p2.color, flip: true }))
    drawCharacter(c, p2.look, lerp(W + 300, W - 300, es), 690, { pose: POSES.armsx, facing: -1, t, scale: 1.7, expr: 'fierce', spriteKey: 'idle' });
  const vs = 1 + Math.sin(t * 0.2) * 0.06;
  c.save(); c.translate(W / 2, H / 2 - 40); c.scale(vs, vs); burst(c, 110, 14, '#ffd23f'); bigText(c, 'VS', 0, 4, 130, '#d0121b', '#fff'); c.restore();
  if (t > 20) {
    bigText(c, p1.name, 40, 60, 60, '#fff', INK, 'left'); bigText(c, p1.title, 40, 110, 26, '#ffd23f', INK, 'left');
    bigText(c, p2.name, W - 40, 60, 60, '#fff', INK, 'right'); bigText(c, p2.title, W - 40, 110, 26, '#ffd23f', INK, 'right');
    c.fillStyle = '#fff'; c.font = 'italic bold 17px sans-serif'; c.textAlign = 'left'; c.fillText(`"${p1.intro}"`, 40, 146);
    c.textAlign = 'right'; c.fillText(`"${p2.intro}"`, W - 40, 146);
  }
  rr(c, W / 2 - 260, H - 60, 520, 44, 10); c.fillStyle = 'rgba(5,10,30,.8)'; c.fill();
  bigText(c, `📍 ${ARENAS[arena].name}`, W / 2, H - 38, 26, '#7fd6ff');
  if (App.mode === 'arcade') bigText(c, `PATIENT ${App.arcade.idx + 1} OF ${App.arcade.ladder.length}${App.arcade.idx === App.arcade.ladder.length - 1 ? ' — FINAL BOSS' : ''}`, W / 2, 180, 30, '#fff');
}

// ---------- Results ----------
function resultOptions() {
  const res = App.result;
  if (App.mode === 'arcade') return res.winner === 0 ? [App.arcade.idx >= App.arcade.ladder.length - 1 ? 'FINISH SHIFT' : 'NEXT PATIENT', 'MAIN MENU'] : ['CONTINUE', 'MAIN MENU'];
  return ['REMATCH', 'CHARACTER SELECT', 'MAIN MENU'];
}
function updateResult() {
  if (App.st === 1) { const w = App.result.fighters[App.result.winner]; App.quote = pick(w.def.win); if (Settings.voice) Announcer.speak(App.quote); confetti({ fx: App.fx }, 300, 200, 60); }
  if (App.st < 40) return;
  const opts = resultOptions();
  const r = menuNav(opts.length, App.resultSel, i => ({ x: 720 + i * 0, y: 560 + i * 0, w: 0, h: 0 }), true);
  // horizontal buttons
  let ok = r.ok; App.resultSel = r.i;
  if (Input.mouse) opts.forEach((o, i) => { if (tapped(resultBtnRect(i, opts.length))) { App.resultSel = i; ok = true; } });
  if (!ok) return;
  const o = opts[App.resultSel]; AudioSys.sfx('confirm');
  if (o === 'NEXT PATIENT') { App.arcade.idx++; App.nextArcade(); }
  else if (o === 'FINISH SHIFT') { App.go('ending'); AudioSys.playMusic('win'); Announcer.say('SHIFT COMPLETE!', { size: 110, color: '#7cf28b', dur: 150 }); }
  else if (o === 'CONTINUE') App.nextArcade();
  else if (o === 'REMATCH') { App.beginMatch(App.lastMatchOpts.p1, App.lastMatchOpts.p2, App.lastMatchOpts.arena); }
  else if (o === 'CHARACTER SELECT') App.startSelect(App.mode);
  else App.go('menu');
}
function resultBtnRect(i, n) { const w = 300, gap = 20, x0 = W / 2 - (n * w + (n - 1) * gap) / 2; return { x: x0 + i * (w + gap), y: H - 86, w, h: 62 }; }
function drawResult(c) {
  const res = App.result; const w = res.fighters[res.winner], l = res.fighters[1 - res.winner];
  bgGrad(c, '#0b1a45', w.def.color);
  c.fillStyle = 'rgba(5,10,30,.35)'; c.fillRect(0, 0, W, H);
  const humanWon = res.winner === 0 || App.mode === 'versus';
  bigText(c, App.mode === 'versus' ? `PLAYER ${res.winner + 1} WINS!` : humanWon ? 'SHIFT COMPLETE!' : 'YOU\'VE BEEN DISCHARGED…', W / 2, 54, 70, humanWon ? '#ffd23f' : '#ff3b3b');
  if (!drawShowcase(c, w.def.id, 70, 155, 360, 300, { fy: 0.3, glow: w.def.color }))
    drawCharacter(c, w.L, 250, 600, { pose: w.winPose(), facing: 1, t: App.t, scale: 1.45, expr: 'happy', spriteKey: 'win' });
  c.save(); c.globalAlpha = 0.85; drawCharacter(c, l.L, 1150, 600, { pose: POSES.lose, facing: -1, t: App.t, scale: 1.0, expr: 'hurt', spriteKey: 'lose' }); c.restore();
  bigText(c, w.def.name, 250, 130, 50, w.def.color);
  rr(c, 80, 470, 340, 70, 12); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#13284f'; c.font = 'italic bold 17px sans-serif'; c.textAlign = 'center'; wrapText(c, `"${App.quote || ''}"`, 250, 505, 310, 20);
  // stats table
  const tx = 470, ty = 110;
  rr(c, tx, ty, 560, 410, 14); c.fillStyle = 'rgba(5,10,30,.7)'; c.fill(); c.strokeStyle = '#5f8fe0'; c.lineWidth = 2; c.stroke();
  bigText(c, 'END-OF-SHIFT REPORT', tx + 280, ty + 32, 32, '#7fd6ff');
  const [a, b] = res.fighters;
  bigText(c, a.def.name, tx + 330, ty + 72, 22, a.def.color); bigText(c, b.def.name, tx + 470, ty + 72, 22, b.def.color);
  const acc = f => f.stats.attacks ? Math.round(f.stats.hits / Math.max(f.stats.hits, f.stats.attacks + f.stats.specials) * 100) + '%' : '—';
  const rows = [['Damage dealt', f => f.stats.dmg], ['Hits landed', f => f.stats.hits], ['Accuracy', acc], ['Max combo', f => f.stats.maxCombo], ['Specials used', f => f.stats.specials], ['Ultimates', f => f.stats.ults], ['Blocks', f => f.stats.blocks], ['Rounds won', f => res.match.wins[f.side]]];
  rows.forEach((r, i) => {
    const y = ty + 110 + i * 36;
    if (i % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(tx + 10, y - 20, 540, 34); }
    c.fillStyle = '#fff'; c.font = 'bold 17px sans-serif'; c.textAlign = 'left'; c.fillText(r[0], tx + 24, y + 2);
    c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.fillText(String(r[1](a)), tx + 330, y + 2); c.fillText(String(r[1](b)), tx + 470, y + 2);
  });
  c.fillStyle = '#bcd3ff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText(`Shift length: ${(res.time / 60).toFixed(1)}s of actual fighting (plus 3 hrs of charting)`, tx + 280, ty + 400);
  const opts = resultOptions();
  if (App.st > 40) opts.forEach((o, i) => { const R = resultBtnRect(i, opts.length); drawButton(c, R.x, R.y, R.w, R.h, o, i === App.resultSel); });
}
function drawEnding(c) {
  bgGrad(c, '#0b1a45', '#2c8a5a');
  const p = App.sel.chosen[0];
  if (!drawShowcase(c, p.id, W / 2 - 170, 280, 340, 380, { fy: 0.35, glow: p.color }))
    drawCharacter(c, p.look, W / 2, 640, { pose: POSES.win, facing: 1, t: App.t, scale: 1.6, expr: 'happy', spriteKey: 'win' });
  bigText(c, 'SHIFT COMPLETE!', W / 2, 80, 96, '#ffd23f');
  bigText(c, `${p.name} SURVIVED THE HEALTHCARE SHOWDOWN!`, W / 2, 160, 36, '#fff');
  c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center';
  ['All charts closed. All prior auths… still pending.', 'The Boardroom has approved your PTO request (effective 2031).', 'Thank you to every nurse, NP, MA, phlebotomist — and yes, even admin.'].forEach((l, i) => c.fillText(l, W / 2, 205 + i * 26));
  if (App.st > 90 && App.t % 60 < 40) bigText(c, 'PRESS ENTER / TAP TO CLOCK OUT', W / 2, H - 30, 30, '#7fd6ff');
}

// ---------- Main loop & sizing ----------
let renderScale = 1;
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  renderScale = Math.max(0.5, Math.min(2, s * dpr));
  canvas.width = Math.round(W * renderScale); canvas.height = Math.round(H * renderScale);
}
addEventListener('resize', resize); resize();

let lastTime = performance.now(), acc = 0;
const STEP = 1000 / FPS;
function frame(now) {
  acc += Math.min(100, now - lastTime); lastTime = now;
  let steps = 0;
  while (acc >= STEP && steps < 5) {
    Input.pollPads();
    try { App.update(); } catch (e) { console.error(e); }
    Announcer.update();
    Input.endFrame();
    acc -= STEP; steps++;
  }
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  try { App.draw(ctx); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
loadPortraitImages(ROSTER.map(r => r.id));
if (window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) {} }
requestAnimationFrame(frame);
// test hook
window.__codeblue = { App, Match, ROSTER, ARENAS, Settings };
