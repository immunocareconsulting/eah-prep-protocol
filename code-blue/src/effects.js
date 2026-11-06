'use strict';
// ============================================================
// Effects: particles, floating text, cartoon item drawers, projectiles, summons
// ============================================================

// ---------- Cartoon item drawers (all centered at 0,0) ----------
const ITEMS = {
  reviewCard(c, s = 1, glow = true) {
    c.save(); c.scale(s, s);
    if (glow) { c.shadowColor = '#ffd23f'; c.shadowBlur = 30; }
    rr(c, -70, -36, 140, 72, 12); c.fillStyle = '#fff'; c.fill(); c.shadowBlur = 0;
    c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#4285f4'; c.font = 'bold 13px sans-serif'; c.textAlign = 'left'; c.fillText('G', -60, -16);
    c.fillStyle = '#333'; c.font = 'bold 11px sans-serif'; c.fillText('Reviews', -48, -16);
    for (let i = 0; i < 5; i++) star(c, -48 + i * 24, 4, 10, i === 0 ? '#ffc107' : '#d5d5d5');
    c.fillStyle = '#666'; c.font = 'italic 9px sans-serif'; c.fillText('"Waited 3 hrs. Rude."', -58, 27);
    c.restore();
  },
  stamp(c, s = 1, text = 'DENIED') {
    c.save(); c.scale(s, s); c.rotate(-0.18);
    c.strokeStyle = '#d0121b'; c.lineWidth = 7; rr(c, -82, -30, 164, 60, 8); c.stroke();
    c.lineWidth = 2.5; rr(c, -74, -22, 148, 44, 5); c.stroke();
    c.fillStyle = '#d0121b'; c.font = `44px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 2);
    c.restore();
  },
  rxPad(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -22, -28, 44, 56, 4); c.fillStyle = '#fffdf0'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#1f5fd1'; c.fillRect(-22, -28, 44, 10);
    c.fillStyle = '#c4161c'; c.font = 'bold 20px serif'; c.textAlign = 'center'; c.fillText('℞', -8, 6);
    c.fillStyle = '#888'; for (let i = 0; i < 3; i++) c.fillRect(-14, 12 + i * 5, 28, 1.5);
    c.fillStyle = '#c4161c'; c.font = 'bold 8px sans-serif'; c.fillText('STAT', 10, -2);
    c.restore();
  },
  laptop(c, s = 1, lid = 1) { // lid: 1 open → 0 closed
    c.save(); c.scale(s, s);
    // base
    rr(c, -110, -10, 220, 20, 6); c.fillStyle = '#9aa3ad'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    // lid (rotates around hinge at y=-10)
    c.save(); c.translate(0, -10); c.scale(1, Math.max(0.04, lid) * (lid >= 0 ? 1 : -1));
    rr(c, -105, -150, 210, 150, 8); c.fillStyle = '#2a3140'; c.fill(); c.stroke();
    rr(c, -95, -140, 190, 128, 4); c.fillStyle = '#e9f3ff'; c.fill();
    c.fillStyle = '#1f5fd1'; c.fillRect(-95, -140, 190, 20);
    c.fillStyle = '#fff'; c.font = 'bold 12px sans-serif'; c.textAlign = 'left'; c.fillText('EHR • Chart', -88, -126);
    c.fillStyle = '#b8c7da'; for (let i = 0; i < 6; i++) c.fillRect(-85, -110 + i * 14, 120 - (i % 3) * 25, 6);
    c.fillStyle = '#d0121b'; c.font = 'bold 14px sans-serif'; c.fillText('CHART CLOSED', -40, -30);
    c.restore();
    c.restore();
  },
  bill(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -18, -10, 36, 20, 2); c.fillStyle = '#8fd694'; c.fill(); c.strokeStyle = '#2a7a35'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#2a7a35'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 1);
    c.restore();
  },
  invoice(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -16, -20, 32, 40, 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#d0121b'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('PAST DUE', 0, -8);
    c.fillStyle = '#333'; c.font = 'bold 10px sans-serif'; c.fillText('$$$', 0, 8);
    c.restore();
  },
  callLight(c, s = 1, on = true) {
    c.save(); c.scale(s, s);
    if (on) { c.shadowColor = '#ff5050'; c.shadowBlur = 25; }
    dot(c, 0, 0, 14, on ? '#ff4040' : '#702020', INK, 3); c.shadowBlur = 0;
    dot(c, -4, -4, 4, 'rgba(255,255,255,.7)', null);
    c.restore();
  },
  pill(c, s = 1, col = '#ff5a8a') {
    c.save(); c.scale(s, s); c.shadowColor = col; c.shadowBlur = 20;
    rr(c, -20, -9, 40, 18, 9); c.fillStyle = '#fff'; c.fill();
    c.save(); rr(c, -20, -9, 40, 18, 9); c.clip(); c.fillStyle = col; c.fillRect(0, -10, 22, 20); c.restore();
    c.shadowBlur = 0; rr(c, -20, -9, 40, 18, 9); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.restore();
  },
  medCart(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -40, -50, 80, 60, 5); c.fillStyle = '#5d8fd8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    for (let i = 0; i < 3; i++) { c.fillStyle = ['#ffd23f', '#ff7aa2', '#8fe388'][i]; c.fillRect(-34, -44 + i * 18, 68, 12); c.strokeRect(-34, -44 + i * 18, 68, 12); }
    dot(c, -28, 16, 7, '#333'); dot(c, 28, 16, 7, '#333');
    c.restore();
  },
  cuff(c, s = 1, inflate = 0) {
    c.save(); c.scale(s, s);
    const w = 70 + inflate * 40, h = 46 + inflate * 26;
    rr(c, -w / 2, -h / 2, w, h, 14); c.fillStyle = '#2e4c8a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = '#7fa3e6'; c.lineWidth = 2; c.setLineDash([5, 4]); rr(c, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 10); c.stroke(); c.setLineDash([]);
    // gauge
    c.translate(w / 2 + 22, -h / 2 - 8);
    dot(c, 0, 0, 20, '#fff', INK, 3);
    c.strokeStyle = '#d0121b'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0);
    const ang = -2.4 + inflate * 4.4; c.lineTo(Math.cos(ang) * 15, Math.sin(ang) * 15); c.stroke();
    c.fillStyle = '#333'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('mmHg', 0, 12);
    c.restore();
  },
  thermometer(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -40, -7, 70, 14, 7); c.fillStyle = '#f2f7fb'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#e8262d'; c.fillRect(-30, -2.5, 52, 5);
    dot(c, 32, 0, 11, '#e8262d', INK, 2.5); dot(c, 29, -3, 3, 'rgba(255,255,255,.6)', null);
    c.fillStyle = '#333'; for (let i = 0; i < 6; i++) c.fillRect(-28 + i * 9, -7, 1.5, 5);
    c.restore();
  },
  notification(c, s = 1, title = 'APPOINTMENT CANCELLED', body = 'Patient: NO-SHOW') {
    c.save(); c.scale(s, s);
    c.shadowColor = '#7fd6ff'; c.shadowBlur = 20;
    rr(c, -80, -26, 160, 52, 12); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill(); c.shadowBlur = 0;
    c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    rr(c, -72, -18, 22, 22, 5); c.fillStyle = '#e8262d'; c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('✕', -61, -2);
    c.textAlign = 'left'; c.fillStyle = '#111'; c.font = 'bold 9px sans-serif'; c.fillText(title, -44, -8);
    c.fillStyle = '#555'; c.font = '9px sans-serif'; c.fillText(body, -44, 6);
    c.restore();
  },
  butterfly(c, s = 1, flap = 0) {
    c.save(); c.scale(s, s);
    c.shadowColor = '#ff7ad9'; c.shadowBlur = 18;
    const f = 0.5 + Math.abs(Math.sin(flap)) * 0.6;
    for (const sgn of [-1, 1]) {
      c.save(); c.scale(1, sgn * f);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, -26, 6, -22); c.quadraticCurveTo(14, -10, 0, 0);
      c.fillStyle = sgn > 0 ? '#ff9ad5' : '#7ad1ff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.restore();
    }
    c.shadowBlur = 0;
    c.strokeStyle = '#ccc'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, 0); c.stroke();
    c.strokeStyle = '#7ad1ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-20, 8, -34, 2); c.stroke();
    c.restore();
  },
  tube(c, s = 1, cap = '#8e44ad') {
    c.save(); c.scale(s, s);
    rr(c, -6, -18, 12, 36, 6); c.fillStyle = 'rgba(230,240,255,.9)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#b3122a'; c.fillRect(-4, 0, 8, 14);
    rr(c, -7.5, -24, 15, 9, 3); c.fillStyle = cap; c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(-6, -10, 12, 7); c.fillStyle = '#333'; c.fillRect(-4, -8, 8, 1); c.fillRect(-4, -6, 6, 1);
    c.restore();
  },
  scissors(c, s = 1, open = 0.3) {
    c.save(); c.scale(s, s);
    for (const sgn of [-1, 1]) {
      c.save(); c.rotate(sgn * open);
      // spreadsheet blade
      c.beginPath(); c.moveTo(0, 0); c.lineTo(70, sgn * -4); c.lineTo(66, sgn * 8); c.closePath();
      c.fillStyle = '#e9f8ec'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = '#3aa655'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(i * 12, -6); c.lineTo(i * 12, 8); c.stroke(); }
      c.beginPath(); c.moveTo(4, sgn * 2); c.lineTo(68, sgn * 2); c.stroke();
      c.restore();
      ell(c, -16, sgn * 14, 13, 9, '#1f8a46', INK, 2.5); ell(c, -16, sgn * 14, 6, 4, '#13284f', null);
    }
    dot(c, 0, 0, 4, '#ddd', INK, 2);
    c.fillStyle = '#1f8a46'; c.font = 'bold 9px sans-serif'; c.fillText('FY26', 26, -12);
    c.restore();
  },
  conference(c, s = 1, a = 1) {
    c.save(); c.scale(s, s); c.globalAlpha *= a;
    rr(c, -95, -250, 190, 260, 10); c.fillStyle = 'rgba(160,210,255,.35)'; c.fill(); c.strokeStyle = '#d7ecff'; c.lineWidth = 5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-80 + i * 40, -240); c.lineTo(-60 + i * 40, -180); c.stroke(); }
    rr(c, -80, -275, 160, 34, 6); c.fillStyle = '#13284f'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ffd23f'; c.font = `18px ${FONT}`; c.textAlign = 'center'; c.fillText('MANDATORY MEETING', 0, -252);
    c.fillStyle = '#fff'; c.font = 'bold 10px sans-serif'; c.fillText('2:00 PM – 5:00 PM  (no agenda)', 0, -228);
    rr(c, -70, -40, 140, 14, 4); c.fillStyle = '#7a5130'; c.fill();
    c.restore();
  },
  form(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -80, -105, 160, 210, 6); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#13284f'; c.fillRect(-80, -105, 160, 30);
    c.fillStyle = '#fff'; c.font = `17px ${FONT}`; c.textAlign = 'center'; c.fillText('PERFORMANCE REVIEW', 0, -84);
    const rows = ['Teamwork', 'Charting', 'Attitude', 'Synergy'];
    c.textAlign = 'left'; c.font = 'bold 11px sans-serif';
    rows.forEach((r, i) => { c.fillStyle = '#333'; c.fillText(r, -68, -50 + i * 26); c.strokeStyle = '#333'; c.lineWidth = 1.5; c.strokeRect(40, -60 + i * 26, 14, 14); c.strokeStyle = '#d0121b'; c.lineWidth = 3; c.beginPath(); c.moveTo(42, -54 + i * 26); c.lineTo(47, -48 + i * 26); c.lineTo(58, -64 + i * 26); c.stroke(); });
    c.fillStyle = '#d0121b'; c.font = `22px ${FONT}`; c.textAlign = 'center'; c.fillText('NEEDS IMPROVEMENT', 0, 82);
    c.restore();
  },
  desk(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -170, -90, 340, 34, 6); c.fillStyle = '#6b3f22'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
    rr(c, -160, -58, 80, 58, 4); c.fillStyle = '#58331c'; c.fill(); c.stroke();
    rr(c, 80, -58, 80, 58, 4); c.fill(); c.stroke();
    c.fillStyle = '#d7b46a'; rr(c, -40, -118, 80, 26, 3); c.fill(); c.stroke();
    c.fillStyle = '#13284f'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('C.E.O.', 0, -100);
    c.restore();
  },
  manual(c, s = 1, col = '#c0262d') {
    c.save(); c.scale(s, s);
    rr(c, -22, -30, 44, 60, 3); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(-16, -20, 32, 14); c.fillStyle = '#111'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('POLICY', 0, -14); c.fillText('MANUAL', 0, -8);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(16, -30, 4, 60);
    c.restore();
  },
  invite(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -46, -20, 92, 40, 6); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#1f5fd1'; c.fillRect(-46, -20, 8, 40);
    c.fillStyle = '#111'; c.font = 'bold 8px sans-serif'; c.textAlign = 'left'; c.fillText('Meeting Invite', -34, -6); c.fillStyle = '#666'; c.font = '7px sans-serif'; c.fillText('Re: Re: Re: Sync', -34, 6);
    c.restore();
  },
  chart(c, s = 1) {
    c.save(); c.scale(s, s);
    rr(c, -24, -30, 48, 60, 3); c.fillStyle = '#cfe8ff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#999'; c.fillRect(-8, -34, 16, 8);
    c.fillStyle = '#333'; for (let i = 0; i < 5; i++) c.fillRect(-16, -18 + i * 8, 32 - (i % 2) * 10, 2);
    c.restore();
  },
  label(c, s = 1, k = 0) {
    c.save(); c.scale(s, s); c.rotate((k % 7 - 3) * 0.08);
    rr(c, -34, -14, 68, 28, 3); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#111'; for (let i = 0; i < 12; i++) c.fillRect(-28 + i * 3, -9, (i * 7) % 3 + 1, 12);
    c.font = 'bold 6px monospace'; c.fillText('SPECIMEN #' + (1000 + k * 37), -20, 11);
    c.restore();
  },
  decoy(c) { /* drawn via drawCharacter */ }
};
function star(c, x, y, r, fill) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
}
function burst(c, r, spikes = 12, fill = '#ffd23f') {
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = i * Math.PI / spikes, rad = i % 2 ? r * 0.62 : r; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
}

// ---------- Particles & floating text ----------
class Particle {
  constructor(x, y, o) {
    this.x = x; this.y = y; this.vx = o.vx ?? rand(-6, 6); this.vy = o.vy ?? rand(-8, -2);
    this.g = o.g ?? 0.35; this.life = this.max = o.life ?? 30; this.size = o.size ?? rand(3, 7);
    this.color = o.color || '#fff'; this.kind = o.kind || 'dot'; this.rot = rand(0, TAU); this.vr = rand(-0.3, 0.3);
    this.layer = o.layer || 'front'; this.item = o.item; this.drag = o.drag ?? 0.98;
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.g; this.vx *= this.drag; this.rot += this.vr; return --this.life > 0; }
  draw(c) {
    const a = Math.min(1, this.life / (this.max * 0.4));
    c.save(); c.globalAlpha = a; c.translate(this.x, this.y); c.rotate(this.rot);
    if (this.kind === 'dot') { c.fillStyle = this.color; c.beginPath(); c.arc(0, 0, this.size, 0, TAU); c.fill(); }
    else if (this.kind === 'spark') { c.strokeStyle = this.color; c.lineWidth = 3; c.beginPath(); c.moveTo(-this.size * 2, 0); c.lineTo(this.size * 2, 0); c.stroke(); }
    else if (this.kind === 'confetti') { c.fillStyle = this.color; c.fillRect(-this.size, -this.size / 2, this.size * 2, this.size); }
    else if (this.kind === 'star') { star(c, 0, 0, this.size, this.color); }
    else if (this.kind === 'item') { ITEMS[this.item](c, this.size); }
    else if (this.kind === 'smoke') { c.fillStyle = this.color; c.globalAlpha = a * 0.5; c.beginPath(); c.arc(0, 0, this.size * (2 - a), 0, TAU); c.fill(); }
    c.restore();
  }
}
class FloatText {
  constructor(x, y, text, color = '#fff', size = 34, life = 50) { this.x = x; this.y = y; this.text = text; this.color = color; this.size = size; this.life = this.max = life; this.layer = 'front'; }
  update() { this.y -= 1.2; return --this.life > 0; }
  draw(c) {
    const t = 1 - this.life / this.max; const s = t < 0.15 ? easeOutBack(t / 0.15) : 1;
    c.save(); c.globalAlpha = Math.min(1, this.life / 15); c.translate(this.x, this.y); c.scale(s, s);
    bigText(c, this.text, 0, 0, this.size, this.color); c.restore();
  }
}
class ComicBurst {
  constructor(x, y, text, color = '#ffd23f', size = 1) { this.x = x; this.y = y; this.text = text; this.color = color; this.s = size; this.life = 26; this.layer = 'front'; this.rot = rand(-0.3, 0.3); }
  update() { return --this.life > 0; }
  draw(c) {
    const t = 1 - this.life / 26; const s = (t < 0.2 ? easeOutBack(t / 0.2) : 1) * this.s;
    c.save(); c.globalAlpha = Math.min(1, this.life / 8); c.translate(this.x, this.y); c.rotate(this.rot); c.scale(s, s);
    burst(c, 52, 11, this.color); bigText(c, this.text, 0, 2, 30, '#fff', INK);
    c.restore();
  }
}
// Hit flash ring
class Ring {
  constructor(x, y, color = '#fff', max = 70, life = 14) { this.x = x; this.y = y; this.color = color; this.max = max; this.life = this.L = life; this.layer = 'front'; }
  update() { return --this.life > 0; }
  draw(c) { const t = 1 - this.life / this.L; c.save(); c.globalAlpha = 1 - t; c.strokeStyle = this.color; c.lineWidth = 8 * (1 - t) + 1; c.beginPath(); c.arc(this.x, this.y, this.max * t + 8, 0, TAU); c.stroke(); c.restore(); }
}

function sparks(g, x, y, color = '#fff', n = 12, kind = 'spark') {
  for (let i = 0; i < n; i++) g.fx.push(new Particle(x, y, { color, kind, size: rand(3, 7), life: randi(14, 26), vx: rand(-9, 9), vy: rand(-10, 3), g: 0.25 }));
}
function confetti(g, x, y, n = 60) {
  const cols = ['#ffd23f', '#ff5a8a', '#3bb3ff', '#7cf28b', '#ffffff', '#b07cff'];
  for (let i = 0; i < n; i++) g.fx.push(new Particle(x + rand(-200, 200), y + rand(-50, 50), { kind: 'confetti', color: pick(cols), vx: rand(-4, 4), vy: rand(-14, -4), g: 0.22, life: randi(70, 130), size: rand(4, 8), drag: 0.99 }));
}

// ---------- Projectiles ----------
// Generic projectile with a custom drawer. hit = hit definition passed to g.applyHit
class Projectile {
  constructor(g, owner, o) {
    this.g = g; this.owner = owner; this.x = o.x; this.y = o.y; this.vx = o.vx; this.vy = o.vy || 0; this.grav = o.grav || 0;
    this.w = o.w || 60; this.h = o.h || 50; this.hit = o.hit; this.drawFn = o.draw; this.life = o.life || 120; this.t = 0;
    this.wave = o.wave || 0; this.waveAmp = o.waveAmp || 0; this.baseY = o.y; this.spin = o.spin || 0; this.layer = 'front';
    this.isProjectile = true; this.noFlip = !!o.noFlip; this.dead = false; this.trail = o.trail || null; this.clash = o.clash !== false;
  }
  box() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  update() {
    if (this.dead) return false;
    this.t++; this.x += this.vx; this.vy += this.grav; this.y += this.vy;
    if (this.wave) this.y = this.baseY + Math.sin(this.t * this.wave) * this.waveAmp;
    if (this.trail && this.t % 2 === 0) this.g.fx.push(new Particle(this.x - Math.sign(this.vx) * 20, this.y, { kind: 'dot', color: this.trail, vx: rand(-1, 1), vy: rand(-1, 1), g: 0, life: 16, size: rand(3, 6) }));
    const opp = this.g.other(this.owner);
    if (opp.hittable() && overlap(this.box(), opp.hurtbox())) {
      this.g.applyHit(this.owner, opp, this.hit, this.x);
      this.dead = true;
      sparks(this.g, this.x, this.y, '#ffd23f', 10);
      return false;
    }
    if (this.y > FLOOR + 10 || this.x < -200 || this.x > STAGE_W + 200) return false;
    return --this.life > 0;
  }
  draw(c) {
    c.save(); c.translate(this.x, this.y);
    if (this.vx < 0 && !this.noFlip) c.scale(-1, 1);
    if (this.spin) c.rotate(this.t * this.spin);
    this.drawFn(c, this.t);
    c.restore();
  }
}

// Timed effect: arbitrary update/draw with frame counter (summons, auras, traps)
class Timed {
  constructor(dur, o) { this.t = 0; this.dur = dur; this.u = o.update || (() => {}); this.d = o.draw || (() => {}); this.layer = o.layer || 'front'; this.data = o.data || {}; }
  update() { this.u(this.t, this); return ++this.t < this.dur && !this.kill; }
  draw(c) { this.d(c, this.t, this); }
}

// ---------- Comedy pop-ups (screen space) ----------
const POPUPS = [
  { text: 'Insurance Has Denied Your Special Attack!', icon: '🚫', effect: 'cooldown' },
  { text: 'Your Patient Left Without Being Seen!', icon: '🚶' },
  { text: 'Critical Lab Result!', icon: '🧪', effect: 'energy' },
  { text: 'Your Documentation Is Overdue!', icon: '📋' },
  { text: 'Mandatory Staff Meeting in 5 Minutes!', icon: '📅' },
  { text: 'Your Prior Authorization Is Still Pending!', icon: '⏳' },
  { text: 'Your Google Rating Just Dropped!', icon: '⭐' },
  { text: 'Provider Running 45 Minutes Behind!', icon: '⏰' },
  { text: 'Your Appointment Has Been Double-Booked!', icon: '📆' },
  { text: 'Free Pizza in the Break Room! (It\'s Gone)', icon: '🍕', effect: 'heal' },
  { text: 'Fax Machine Is Down Again!', icon: '📠' },
  { text: 'Someone Microwaved Fish in the Break Room!', icon: '🐟' }
];
class Popup {
  constructor(p, who) { this.p = p; this.who = who; this.t = 0; this.dur = 200; }
  update() { return ++this.t < this.dur; }
  draw(c, slot) {
    const inT = Math.min(1, this.t / 14), outT = Math.max(0, (this.t - (this.dur - 14)) / 14);
    const x = W - 20 - 430 * easeOutBack(inT) + 450 * outT;
    const y = 150 + slot * 76;
    c.save(); c.translate(x, y);
    c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 12;
    rr(c, 0, 0, 430, 64, 12); c.fillStyle = 'rgba(255,255,255,.97)'; c.fill(); c.shadowBlur = 0;
    c.strokeStyle = '#1f5fd1'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#1f5fd1'; rr(c, 0, 0, 10, 64, 4); c.fill();
    c.font = '30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this.p.icon, 38, 33);
    c.textAlign = 'left'; c.fillStyle = '#7a869a'; c.font = 'bold 11px sans-serif'; c.fillText('HOSPITAL NOTIFICATION • now' + (this.who ? '  → ' + this.who : ''), 66, 18);
    c.fillStyle = '#111'; c.font = 'bold 15px sans-serif';
    wrapText(c, this.p.text, 66, 40, 350, 16);
    c.restore();
  }
}
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = ''; const lines = [];
  for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  lines.push(line);
  const y0 = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => c.fillText(l, x, y0 + i * lh));
  return lines.length;
}
