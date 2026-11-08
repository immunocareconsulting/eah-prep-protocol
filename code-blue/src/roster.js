'use strict';
// ============================================================
// Current roster: Martel, Ruben, Cesar (ImmunoCare Health), Gordon, Maddy (Equity Alliance
// Health) and Dhvani. Reuses special-move implementations from BASE_ROSTER (fighters.js).
// ============================================================
const SP = (name, over = {}) => {
  const s = BASE_ROSTER.flatMap(r => r.specials).find(x => x.name === name);
  return Object.assign({}, s, over);
};

// ---------- fallback looks (used only if a fighter's sprites fail to load) ----------
LOOKS.gordon = Object.assign({}, LOOKS.admin, { id: 'gordon', top: '#1d1d22', topD: '#141418', pants: '#1d1d22', pantsD: '#141418', hair: '#cfcfd6' });
LOOKS.dhvani = Object.assign({}, LOOKS.nova, { id: 'dhvani', outfit: 'coat', top: '#f5f7fa', topD: '#d6dde6', under: '#e6338f', pants: '#e6338f', pantsD: '#b8246f', hair: '#7a2a1a', skin: '#d9a07a', skinD: '#b9805a' });
LOOKS.maddy = Object.assign({}, LOOKS.admin, { id: 'maddy', hairStyle: 'pony', hair: '#7a5232', glasses: false, top: '#2b2d4a', topD: '#1f2038', pants: '#2b2d4a', pantsD: '#1f2038', under: '#e8d5c0', skin: '#f0c9a8', smile: 'soft' });

// ---------- extra item art ----------
ITEMS.virus = (c, s = 1, col = '#b07cff') => {
  c.save(); c.scale(s, s);
  c.strokeStyle = col; c.lineWidth = 3;
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.beginPath(); c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); c.stroke(); dot(c, Math.cos(a) * 21, Math.sin(a) * 21, 3, col, null); }
  dot(c, 0, 0, 13, col, INK, 2.5); dot(c, -4, -3, 3, 'rgba(255,255,255,.6)', null);
  c.restore();
};
let EahLogoImg = null;
if (typeof EAH_LOGO !== 'undefined' && EAH_LOGO) loadImg(EAH_LOGO, im => { EahLogoImg = im; });
ITEMS.briefcase = (c, s = 1) => {
  c.save(); c.scale(s, s);
  rr(c, -24, -78, 48, 18, 6); c.strokeStyle = '#111'; c.lineWidth = 7; c.stroke();
  rr(c, -90, -64, 180, 124, 10); c.fillStyle = '#17171b'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-84, -58, 168, 10);
  if (EahLogoImg) { const w = 140, h = w * EahLogoImg.height / EahLogoImg.width; c.drawImage(EahLogoImg, -w / 2, -2 - h / 2, w, h); c.restore(); return; }
  dot(c, 0, -14, 18, '#2678d2', '#dbe9ff', 3);
  c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(0, -14, 9, 0.5, 5.2); c.stroke();
  c.fillStyle = '#eaf2ff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('EQUITY ALLIANCE', 0, 22); c.font = 'bold 10px sans-serif'; c.fillText('H E A L T H', 0, 38);
  c.restore();
};
ITEMS.paper = (c, s = 1) => {
  c.save(); c.scale(s, s);
  c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(-16, -21, 32, 42); c.strokeRect(-16, -21, 32, 42);
  c.fillStyle = '#9fb3c8'; for (let i = 0; i < 5; i++) c.fillRect(-11, -14 + i * 7, 22 - (i % 2) * 8, 2.5);
  c.fillStyle = '#1f8a46'; c.font = 'bold 12px sans-serif'; c.fillText('✓', 6, 16);
  c.restore();
};
ITEMS.checklist = (c, s = 1, a = 1) => {
  c.save(); c.scale(s, s); c.globalAlpha *= a;
  c.shadowColor = '#7fd6ff'; c.shadowBlur = 20;
  rr(c, -70, -50, 140, 100, 8); c.fillStyle = 'rgba(40,120,220,.35)'; c.fill(); c.shadowBlur = 0; c.strokeStyle = '#9fe0ff'; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 3; i++) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(-56, -34 + i * 26, 16, 16); c.strokeStyle = '#7cf28b'; c.lineWidth = 4; c.beginPath(); c.moveTo(-53, -27 + i * 26); c.lineTo(-48, -22 + i * 26); c.lineTo(-38, -36 + i * 26); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-30, -28 + i * 26, 80 - i * 14, 5); }
  c.restore();
};

// ---------- new ultimates ----------
ULTS.martel = {
  name: 'VIRAL SUPPRESSION', quote: 'YOUR VIRAL LOAD IS NOW UNDETECTABLE!', final: 'DISCHARGED!', pose: 'raise',
  dur: 250, hits: [70, 88, 106, 124, 142, 160, 178, 200], dmg: 330,
  drawWorld(c, t, k) {
    if (t < 40) return;
    const x = k.target.x, y = FLOOR - 170, p = Math.min(1, (t - 40) / 18);
    c.save(); c.translate(x, y); c.scale(p * 9, p * 9); c.globalAlpha = 0.55 + Math.sin(t * 0.2) * 0.1;
    drawLogo(c, 0, 0, 1); c.restore();
    c.save(); c.translate(x, y); c.strokeStyle = 'rgba(127,214,255,.7)'; c.lineWidth = 5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 90 + i * 40 + Math.sin(t * 0.15 + i) * 8, t * 0.05 + i, t * 0.05 + i + 4.5); c.stroke(); }
    // viruses spiral in and pop
    for (let i = 0; i < 14; i++) {
      const ph = ((t * 2 + i * 23) % 120) / 120, a = i * 2.4 + t * 0.03, r = 320 * (1 - ph);
      if (ph < 0.92) { c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r * 0.7); c.rotate(t * 0.1); ITEMS.virus(c, 1.3); c.restore(); }
      else { c.save(); c.globalAlpha = (1 - ph) * 10; burst(c, 26, 8, '#e0c4ff'); c.restore(); }
    }
    c.restore();
    bigText(c, 'VIRAL LOAD: ' + (t < 200 ? Math.max(0, 999999 - (t - 40) * 6300).toLocaleString() : 'UNDETECTABLE'), x, FLOOR - 470, 30, '#b07cff');
  },
  update(t) { if (t === 45) AudioSys.sfx('magic'); if (t > 50 && t % 14 === 0) AudioSys.sfx('pop'); }
};
Object.assign(ULTS.ruben, { name: 'BP CUFF SLAM', quote: "LET'S RECHECK THAT PRESSURE... ON YOUR FACE!" });
ULTS.gordon = {
  name: '340B POWER SLAM', quote: 'THIS MEETING IS ADJOURNED. PERMANENTLY.', final: 'POSITION ELIMINATED!', pose: 'armsx',
  dur: 250, hits: [62, 95, 112, 129, 146, 163, 180, 200], dmg: 335,
  drawWorld(c, t, k) {
    if (t < 30) return;
    const x = k.tx, dropT = Math.min(1, (t - 30) / 30), dy = lerp(-760, 0, dropT * dropT);
    if (t > 60) for (let i = 0; i < 3; i++) {
      const r = ((t - 60) * 9 + i * 120) % 700;
      c.save(); c.globalAlpha = Math.max(0, 1 - r / 700); c.strokeStyle = i % 2 ? '#ffd23f' : '#ff7a2b'; c.lineWidth = 10;
      c.beginPath(); c.ellipse(x, FLOOR, r, r * 0.18, 0, 0, TAU); c.stroke(); c.restore();
    }
    c.save(); c.translate(x, FLOOR - 60 + dy); ITEMS.briefcase(c, 1.6); c.restore();
  },
  update(t, k, g) {
    if (t === 60) { AudioSys.sfx('slam'); g.addShake(24); sparks(g, k.tx, FLOOR - 40, '#ffd23f', 40, 'spark'); }
    if (t > 85 && t < 200 && t % 5 === 0) {
      const side = Math.random() < 0.5 ? -1 : 1, it = pick(['manual', 'invite', 'invoice']);
      g.fx.push(new Particle(k.target.x + side * 700, FLOOR - rand(150, 400), { kind: 'item', item: it, size: 1.1, vx: -side * rand(22, 28), vy: rand(-2, 2), g: 0, life: 40, drag: 1 }));
    }
    if (t > 85 && t % 15 === 0 && t < 200) AudioSys.sfx(pick(['whoosh', 'cash']));
  }
};
ULTS.dhvani = {
  name: '340B PILL STORM', quote: 'TAKE AS DIRECTED. ALL OF THEM.', final: 'PRESCRIPTION FILLED!', pose: 'raise',
  dur: 250, hits: [70, 86, 102, 118, 134, 150, 166, 182, 200], dmg: 320,
  drawWorld(c, t, k) {
    if (t < 35) return;
    const x = k.target.x, a0 = Math.min(1, (t - 35) / 20);
    c.save(); c.globalAlpha = a0 * 0.35; c.fillStyle = '#ff3ea5'; c.beginPath(); c.ellipse(x, FLOOR - 160, 260, 200, 0, 0, TAU); c.fill(); c.restore();
    for (let i = 0; i < 42; i++) {
      const ang = t * (0.08 + (i % 5) * 0.01) + i * 1.3, h = (i * 53) % 330, r = (60 + h * 0.6) * a0;
      c.save(); c.globalAlpha = a0; c.translate(x + Math.cos(ang) * r, FLOOR - 20 - h + Math.sin(ang) * 20); c.rotate(ang * 2);
      ITEMS.pill(c, 0.9, ['#ff3ea5', '#3bb3ff', '#ffffff', '#ff8ad1'][i % 4]); c.restore();
    }
    bigText(c, '340B SAVINGS: 100%', x, FLOOR - 450, 30, '#ff8ad1');
  },
  update(t) { if (t === 40) AudioSys.sfx('magic'); if (t > 45 && t % 6 === 0) AudioSys.sfx('pop'); }
};
ULTS.maddy = {
  name: 'COMPLIANCE OVERLOAD', quote: 'YOUR DOCUMENTATION IS... NON-COMPLIANT.', final: 'AUDIT FAILED!', pose: 'slam',
  dur: 250, hits: [70, 88, 106, 124, 142, 160, 178, 200], dmg: 325,
  drawWorld(c, t, k) {
    if (t < 35) return;
    const x = k.target.x, a = Math.min(1, (t - 35) / 18);
    for (let i = 0; i < 5; i++) { const ang = i * TAU / 5 + t * 0.02; c.save(); c.translate(x + Math.cos(ang) * 230, FLOOR - 220 + Math.sin(ang) * 90); ITEMS.checklist(c, 0.9, a); c.restore(); }
    const stack = Math.min(14, Math.floor((t - 35) / 9));
    for (const side of [-1, 1]) for (let i = 0; i < stack; i++) { c.save(); c.translate(x + side * 120, FLOOR - 32 - i * 26); c.rotate(Math.PI / 2 + (i % 3 - 1) * 0.05); ITEMS.manual(c, 0.6, ['#1f5fd1', '#c0262d', '#2a7a35'][i % 3]); c.restore(); }
    bigText(c, `FINDINGS: ${Math.min(99, Math.floor((t - 35) / 2))}`, x, FLOOR - 470, 32, '#ffd23f');
  },
  update(t, k, g) {
    if (t > 50 && t < 200 && t % 4 === 0) g.fx.push(new Particle(k.target.x + rand(-160, 160), FLOOR - 650, { kind: 'item', item: pick(['paper', 'chart', 'paper']), size: 1.2, vx: rand(-2, 2), vy: rand(6, 12), g: 0.4, life: 60, drag: 1 }));
    if (t > 50 && t % 18 === 0 && t < 200) AudioSys.sfx(pick(['stamp', 'printer', 'ding']));
  }
};

// ---------- new specials ----------
const S_DIAGNOSIS_SHOCK = { input: 'N', name: 'DIAGNOSIS SHOCK', cd: 140, dur: 30, at: 11, pose: 'cast', run(f, g) {
  AudioSys.sfx('beep');
  shoot(f, g, { speed: 12, w: 90, h: 90, life: 120, draw: (c, t) => {
    c.shadowColor = '#7fd6ff'; c.shadowBlur = 18;
    for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(127,214,255,${0.9 - i * 0.25})`; c.lineWidth = 6 - i; c.beginPath(); c.arc(-10, 0, 18 + i * 14 + (t * 2) % 14, -1.1, 1.1); c.stroke(); }
    c.shadowBlur = 0; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, 0); c.lineTo(-14, 0); c.lineTo(-8, -20); c.lineTo(0, 18); c.lineTo(6, -8); c.lineTo(12, 0); c.lineTo(36, 0); c.stroke();
  }, hit: { dmg: 85, stun: 20, kb: 8, sfx: 'hitH', text: 'DIAGNOSED!', textColor: '#7fd6ff', shake: 5 } });
} };
const S_PREP_PROTECT = { input: 'D', name: 'PrEP PROTECT', cd: 600, dur: 26, at: 8, pose: 'raise', run(f, g) {
  AudioSys.sfx('magic'); f.status.shield = 360; g.floatText(f.x, f.y - 320, 'PrEP PROTECT!', '#7fd6ff');
} };
const S_CUFF_WHIP = { input: 'N', name: 'BP CUFF WHIP', cd: 120, dur: 32, at: 9, pose: 'cast', run(f, g) {
  AudioSys.sfx('whoosh'); const opp = g.other(f);
  const box = { x: f.facing > 0 ? f.x + 30 : f.x - 290, y: f.y - 240, w: 260, h: 190 };
  if (opp.hittable() && overlap(box, opp.hurtbox())) g.applyHit(f, opp, { dmg: 80, stun: 20, kb: 9, sfx: 'hitH', text: 'WHIP!', textColor: '#7fa3e6', shake: 5 }, f.x);
  g.fx.push(new Timed(14, { draw(c, t) {
    const len = 250 * Math.sin(Math.min(1, t / 7) * Math.PI / 2), sx = f.x + f.facing * 50, sy = f.y - 175;
    c.save(); c.strokeStyle = '#222'; c.lineWidth = 6; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + f.facing * len * 0.5, sy - 60, sx + f.facing * len, sy - 10); c.stroke();
    c.translate(sx + f.facing * len, sy - 10); c.rotate(t * 0.5); ITEMS.cuff(c, 0.55, 0.2); c.restore();
  } }));
} };
const S_DEFLATE = { input: 'B', name: 'DEFLATE & STUN', cd: 300, dur: 30, at: 12, pose: 'cast', run(f, g) {
  AudioSys.sfx('inflate');
  shoot(f, g, { speed: 9, w: 110, h: 80, life: 150, draw: (c, t) => { c.rotate(Math.sin(t * 0.4) * 0.2); ITEMS.cuff(c, 0.8, Math.abs(Math.sin(t * 0.15))); },
    hit: { dmg: 45, stun: 14, kb: 2, sfx: 'stamp', effect: { type: 'stun', dur: 75 }, text: 'DEFLATED!', textColor: '#7fa3e6' } });
} };
const S_DEALBREAKER = { input: 'N', name: 'EXECUTIVE DEALBREAKER', cd: 160, dur: 34, at: 11, pose: 'cast', run(f, g) {
  AudioSys.sfx('whoosh'); const opp = g.other(f);
  const box = { x: f.facing > 0 ? f.x : f.x - 240, y: f.y - 250, w: 240, h: 250 };
  if (opp.hittable() && overlap(box, opp.hurtbox())) g.applyHit(f, opp, { dmg: 95, stun: 24, kb: 13, sfx: 'hitH', text: 'DEAL BROKEN!', textColor: '#ff6b6b', shake: 8, burst: true }, f.x);
  g.fx.push(new Timed(16, { draw(c, t) {
    c.save(); c.strokeStyle = `rgba(110,170,255,${1 - t / 16})`; c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath(); c.arc(f.x, f.y - 140, 150, f.facing > 0 ? -1.2 : Math.PI - 0.6, f.facing > 0 ? 0.6 : Math.PI + 1.2); c.stroke(); c.restore();
  } }));
}, tick(f, g, t) {
  if (t < 11) f.vx = f.facing * 7;
  if (t < 14 && t % 3 === 0) { const x0 = f.x, y0 = f.y, fc = f.facing; g.fx.push(new Timed(12, { layer: 'back', draw(c, tt) { drawCharacter(c, LOOKS.gordon, x0, y0, { pose: POSES.cast, facing: fc, alpha: 0.35 * (1 - tt / 12), spriteKey: 'special' }); } })); }
} };
const S_STAFFING_G = { input: 'B', name: 'STAFFING SHORTAGE', cd: 300, dur: 34, at: 8, pose: 'armsx', run(f, g) {
  AudioSys.sfx('magic');
  [0, 9, 18].forEach((d, i) => g.later(d, () => {
    g.fx.push(new Projectile(g, f, { x: f.x + f.facing * 30, y: FLOOR - 110, vx: f.facing * 8.5, w: 70, h: 220, life: 120, clash: false,
      draw: (c, t) => drawCharacter(c, LOOKS.gordon, 0, 110, { pose: POSES.walk, facing: 1, alpha: 0.5, t, spriteKey: Math.floor(t / 8) % 2 ? 'walk2' : 'walk1' }),
      hit: { dmg: 28, stun: 15, kb: 5, sfx: 'hitL', text: i === 0 ? 'UNDERSTAFFED!' : null, textColor: '#ff6b6b' } }));
  }));
} };
const S_PILL_TOSS = { input: 'N', name: 'PILL TOSS', cd: 120, dur: 28, at: 9, pose: 'cast', run(f, g) {
  const cols = ['#ff3ea5', '#3bb3ff', '#ffffff'];
  [0, 5, 10].forEach((d, i) => g.later(d, () => { AudioSys.sfx('pop'); shoot(f, g, { speed: 14, dy: -195 + i * 10, w: 44, h: 28, spin: 0.3, life: 100, trail: cols[i], draw: c => ITEMS.pill(c, 1, cols[i]), hit: { dmg: 24, stun: 12, kb: 3, sfx: 'pop', text: i === 2 ? 'DOSED!' : null, textColor: '#ff3ea5' } }); }));
} };
const S_RX_DISPENSE = { input: 'F', name: 'RX DISPENSE', cd: 220, dur: 32, at: 10, pose: 'cast', run(f, g) {
  AudioSys.sfx('cash');
  for (let i = 0; i < 9; i++) { const a = -0.5 + i / 8; shoot(f, g, { speed: 12 * Math.cos(a), vy: 12 * Math.sin(a), dy: -170, w: 36, h: 24, spin: 0.4, life: 34, trail: i % 2 ? '#3bb3ff' : '#ff3ea5', draw: c => ITEMS.pill(c, 0.8, i % 2 ? '#3bb3ff' : '#ff3ea5'), hit: { dmg: 14, stun: 11, kb: 2, sfx: 'pop', text: i === 4 ? 'RX DISPENSED!' : null, textColor: '#ff8ad1' } }); }
} };
const S_340B_SAVINGS = { input: 'D', name: '340B SAVINGS', cd: 720, dur: 30, at: 10, pose: 'raise', run(f, g) {
  AudioSys.sfx('cash'); const heal = Math.min(90, f.maxHp - f.hp); f.hp += heal; f.energy = Math.min(100, f.energy + 20);
  g.floatText(f.x, f.y - 320, `+${heal} 340B SAVINGS!`, '#7cf28b');
  for (let i = 0; i < 16; i++) g.fx.push(new Particle(f.x + rand(-50, 50), f.y - rand(40, 260), { kind: 'item', item: 'bill', size: 0.8, vx: rand(-2, 2), vy: rand(-5, -2), g: 0.05, life: 40 }));
} };
const S_CHART_SWIPE = { input: 'N', name: 'CHART SWIPE', cd: 140, dur: 30, at: 9, pose: 'cast', run(f, g) {
  AudioSys.sfx('printer');
  [0, 6, 12].forEach((d, i) => g.later(d, () => shoot(f, g, { speed: 10, dy: -200 + i * 22, wave: 0.2, waveAmp: 24, w: 44, h: 52, spin: 0.25, life: 120, noFlip: true, draw: c => ITEMS.paper(c, 1.3), hit: { dmg: 28, stun: 14, kb: 3, sfx: 'hitL', text: i === 2 ? 'PAPER CUT!' : null, textColor: '#9fe0ff' } })));
} };
const S_AUDIT_REVIEW = { input: 'F', name: 'AUDIT REVIEW', cd: 300, dur: 42, at: 1, pose: 'block', run(f, g) {
  AudioSys.sfx('ding'); f.status.counter = 40; g.floatText(f.x, f.y - 320, 'UNDER REVIEW…', '#9fe0ff');
} };

const ROSTER = [
  Object.assign({}, byBase('martel'), {
    intro: "Let's review your chart.", win: ['Diagnosis: you just got schooled.', 'Viral load: undetectable. Your chances: also undetectable.', 'Discharged. No follow-up needed.'],
    specials: [S_DIAGNOSIS_SHOCK, SP('PRIOR AUTHORIZATION DENIED'), SP('STAT ORDER', { name: 'eRx BLAST' }), S_PREP_PROTECT, SP('ONE-STAR SMACKDOWN', { input: 'AIR' })],
    face: { fx: 0.45, fy: 0.115, zoom: 2.8 }, org: 'ImmunoCare Health'
  }),
  Object.assign({}, byBase('ruben'), {
    role: 'Certified Medical Assistant',
    specials: [S_CUFF_WHIP, SP('ROOMING RUSH'), S_DEFLATE, SP('BLOOD PRESSURE BLAST', { name: 'HYPERTENSION HOLD' })],
    face: { fx: 0.46, fy: 0.125, zoom: 2.4 }, org: 'ImmunoCare Health'
  }),
  Object.assign({}, byBase('cesar'), { face: { fx: 0.44, fy: 0.11, zoom: 3.0 }, org: 'ImmunoCare Health' }),
  {
    id: 'gordon', name: 'GORDON', role: 'Executive Director', title: 'THE EXECUTIVE', color: '#e0383b', org: 'Equity Alliance Health',
    stats: { power: 1.1, speed: 0.93, defense: 1.1 }, rating: { power: 4, speed: 2, defense: 5, difficulty: 3 },
    intro: "I've scheduled your defeat for 2 PM.", win: ["Let's take this offline. Permanently.", 'Your position has been eliminated.', "I don't lose. I restructure."],
    specials: [S_DEALBREAKER, SP('MANDATORY MEETING'), S_STAFFING_G, SP('BUDGET CUT', { input: 'D' })],
    face: { fx: 0.5, fy: 0.17, zoom: 1.5 }
  },
  {
    id: 'dhvani', name: 'DHVANI', role: 'Pharmacist / COO', title: 'THE PHARMACIST', color: '#ff3ea5', org: 'ImmunoCare Health',
    stats: { power: 0.95, speed: 1.12, defense: 0.95 }, rating: { power: 3, speed: 5, defense: 2, difficulty: 3 },
    intro: 'Let me count out your losses... by fives.', win: ["Take as directed. Don't call me in the morning.", 'Prescription filled.', '340B savings: one hundred percent beatdown.'],
    specials: [S_PILL_TOSS, S_RX_DISPENSE, SP('MED PASS MADNESS'), S_340B_SAVINGS],
    face: { fx: 0.53, fy: 0.18, zoom: 1.45 }
  },
  {
    id: 'maddy', name: 'MADDY', role: 'Chief Nursing Officer', title: 'THE CHIEF NURSING OFFICER', color: '#8e7dff', org: 'Equity Alliance Health',
    stats: { power: 1.0, speed: 1.05, defense: 1.05 }, rating: { power: 3, speed: 4, defense: 4, difficulty: 4 },
    intro: "I'll be reviewing your charts. All of them.", win: ['Audit complete. You failed.', "That's a corrective action plan.", 'Compliance: restored.'],
    specials: [S_CHART_SWIPE, S_AUDIT_REVIEW, SP('CALL LIGHT CHAOS'), SP('SHIFT CHANGE')],
    face: { fx: 0.53, fy: 0.17, zoom: 1.45 }
  }
];
function byBase(id) { return BASE_ROSTER.find(r => r.id === id); }
// Drawn height: sprites are authored at 300 units; everyone is scaled up, Martel (6'4") the most.
const HEIGHTS = { martel: 1.25, gordon: 1.15, ruben: 1.13, cesar: 1.14, dhvani: 1.08, maddy: 1.1 };
ROSTER.forEach(r => { r.look = LOOKS[r.id]; r.ult = ULTS[r.id]; r.size = HEIGHTS[r.id] || 1.12; });
const byId = id => ROSTER.find(r => r.id === id);
