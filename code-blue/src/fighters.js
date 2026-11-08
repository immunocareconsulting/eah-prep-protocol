'use strict';
// ============================================================
// Roster, move data, fighter state machine, CPU AI
// ============================================================
const GRAV = 0.78;
const NORMALS = {
  lp:  { s: 4, a: 3, r: 8, dmg: 32, box: [20, -235, 95, 36], stun: 13, kb: 3, rank: 1, sfx: 'hitL', pose: 'lp', energy: 6 },
  hp:  { s: 8, a: 4, r: 15, dmg: 70, box: [20, -245, 108, 44], stun: 19, kb: 7, rank: 2, sfx: 'hitH', pose: 'hp', energy: 10, shake: 4, burst: true },
  lk:  { s: 6, a: 4, r: 10, dmg: 42, box: [20, -130, 112, 46], stun: 15, kb: 4, rank: 1, sfx: 'hitL', pose: 'lk', energy: 7 },
  hk:  { s: 11, a: 5, r: 19, dmg: 82, box: [20, -235, 130, 70], stun: 22, kb: 5, launch: -12, rank: 2, sfx: 'hitH', pose: 'hk', energy: 11, shake: 6, burst: true },
  jlp: { s: 4, a: 6, r: 6, dmg: 30, box: [10, -215, 90, 50], stun: 14, kb: 2, rank: 1, sfx: 'hitL', pose: 'jlp', energy: 6, air: true },
  jhp: { s: 7, a: 6, r: 10, dmg: 60, box: [10, -220, 100, 70], stun: 18, kb: 5, rank: 2, sfx: 'hitH', pose: 'jhp', energy: 9, air: true },
  jlk: { s: 5, a: 7, r: 6, dmg: 36, box: [10, -150, 100, 60], stun: 15, kb: 3, rank: 1, sfx: 'hitL', pose: 'jlk', energy: 6, air: true },
  jhk: { s: 8, a: 8, r: 10, dmg: 68, box: [10, -160, 115, 80], stun: 19, kb: 6, rank: 2, sfx: 'hitH', pose: 'jhk', energy: 10, air: true, burst: true }
};

// ---------- helpers used by specials ----------
function handPos(f, dy = -190) { const s = f.size || 1; return { x: f.x + f.facing * 70 * s, y: f.y + dy * s }; }
function shoot(f, g, o) {
  const p = handPos(f, o.dy ?? -190);
  const pr = new Projectile(g, f, Object.assign({ x: p.x, y: p.y, vx: f.facing * (o.speed || 10) }, o));
  g.fx.push(pr); return pr;
}
function nearX(opp, x, r) { return Math.abs(opp.x - x) < r; }

// ---------- Ultimate cinematics ----------
// Each: dur (frames), hits (frames when damage lands), quote, final, and optional world/screen drawers.
const ULTS = {
  martel: {
    name: 'THE FINAL DIAGNOSIS', quote: 'YOUR PRIOR AUTH HAS BEEN DENIED!', final: 'DISCHARGED!', prop: 'tablet', pose: 'raise',
    dur: 250, hits: [70, 85, 100, 115, 130, 145, 160, 175, 195], dmg: 330,
    update(t, k, g) {
      if (t > 50 && t < 190 && t % 3 === 0) {
        const items = ['chart', 'stamp', 'reviewCard', 'invoice', 'notification', 'rxPad'];
        const it = pick(items);
        g.fx.push(new Particle(k.target.x + rand(-140, 140), FLOOR - 650, { kind: 'item', item: it, size: it === 'stamp' ? 0.5 : it === 'reviewCard' ? 0.6 : it === 'notification' ? 0.6 : 0.9, vx: rand(-2, 2), vy: rand(8, 14), g: 0.5, life: 60, drag: 1 }));
      }
      if (t === 60) AudioSys.sfx('notify');
      if (t % 20 === 0 && t > 60 && t < 190) AudioSys.sfx(pick(['stamp', 'ding', 'printer']));
    }
  },
  nova: {
    name: 'THE 12-HOUR SHIFT', quote: 'TWELVE HOURS. NO BREAKS. YOUR TURN.', final: 'OVERTIME!', pose: 'pointy',
    dur: 260, hits: [70, 90, 110, 125, 140, 155, 170, 185, 200], dmg: 320,
    drawWorld(c, t, k) {
      if (t < 40) return;
      const x = k.target.x, y = FLOOR - 330, p = Math.min(1, (t - 40) / 20);
      c.save(); c.translate(x, y); c.scale(p, p); c.globalAlpha = 0.92;
      dot(c, 0, 0, 170, '#fffdf2', INK, 10);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillStyle = INK; c.font = `28px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i || 12), Math.sin(a) * 135, -Math.cos(a) * 135); }
      const sp = Math.pow(Math.max(0, t - 40) / 160, 2) * 60;
      c.strokeStyle = INK; c.lineCap = 'round';
      c.lineWidth = 12; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(sp / 12) * 80, -Math.cos(sp / 12) * 80); c.stroke();
      c.lineWidth = 7; c.strokeStyle = '#d0121b'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(sp) * 125, -Math.cos(sp) * 125); c.stroke();
      dot(c, 0, 0, 10, '#d0121b');
      const hr = Math.min(12, Math.floor((t - 40) / 13.3));
      bigText(c, `HOUR ${hr}`, 0, 60, 36, '#1f5fd1');
      c.restore();
      // call lights + growing paperwork piles
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 0.03; c.save(); c.translate(x + Math.cos(a) * 230, FLOOR - 170 + Math.sin(a) * 120); ITEMS.callLight(c, 1.3, (t + i * 5) % 16 < 8); c.restore(); }
      const pile = Math.min(18, Math.floor((t - 40) / 9));
      for (const side of [-1, 1]) for (let i = 0; i < pile; i++) { c.fillStyle = i % 2 ? '#fff' : '#eef3ff'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(x + side * 95 - 38, FLOOR - 12 - i * 11, 76, 10); c.strokeRect(x + side * 95 - 38, FLOOR - 12 - i * 11, 76, 10); }
    },
    update(t) { if (t > 40 && t % 8 === 0) AudioSys.sfx('tick'); if (t === 60 || t === 140) AudioSys.sfx('alarm'); }
  },
  ruben: {
    name: 'VITAL SIGNS CRITICAL!', quote: 'YOUR VITALS ARE... NOT VITAL!', final: 'PATIENT NEEDS FOLLOW-UP!', pose: 'pointy',
    dur: 260, hits: [80, 100, 120, 140, 160, 180, 205], dmg: 320, spinTarget: true,
    drawScreen(c, t) {
      if (t < 40 || t > 225) return;
      const p = Math.min(1, (t - 40) / 15);
      c.save(); c.translate(W / 2, 230); c.scale(p, p);
      rr(c, -330, -150, 660, 300, 20); c.fillStyle = '#2a3140'; c.fill(); c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
      rr(c, -310, -130, 620, 260, 8); c.fillStyle = '#04120a'; c.fill();
      const flash = t % 20 < 10;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      const vit = [['HR', `${180 + (t * 7) % 260}`, '#3dff6e'], ['BP', `${250 + t % 70}/${160 + t % 40}`, '#ff4d4d'], ['SpO2', ['lol', '???', '420%', 'yes'][Math.floor(t / 15) % 4], '#4dd2ff'], ['TEMP', `${(104 + (t % 50) / 10).toFixed(1)}°F`, '#ffd23f']];
      vit.forEach((v, i) => { c.fillStyle = v[2]; c.font = 'bold 20px monospace'; c.fillText(v[0], 150, -95 + i * 58); c.font = `40px ${FONT2}`; c.fillText(v[1], 210, -95 + i * 58); });
      // ECG
      c.strokeStyle = '#3dff6e'; c.lineWidth = 3; c.beginPath();
      for (let x = 0; x < 430; x += 3) { const ph = (x + t * 9) % 90; const y = ph > 40 && ph < 50 ? -70 * Math.sin((ph - 40) / 10 * Math.PI) * (1 + Math.sin(x)) : Math.sin((x + t) * 0.2) * 5; x === 0 ? c.moveTo(-290 + x, 40 + y * 0.8 - 40) : c.lineTo(-290 + x, 40 + y * 0.8 - 40); }
      c.stroke();
      if (flash) { c.fillStyle = '#ff2b2b'; c.font = `30px ${FONT}`; c.textAlign = 'center'; c.fillText('⚠ CRITICAL ⚠', -70, 95); }
      c.restore();
    },
    update(t, k, g) {
      if (t > 60 && t < 220) {
        k.target.x = clamp(k.tx + Math.sin((t - 60) * 0.05) * 330, 80, STAGE_W - 80);
        k.target.spin = (t - 60) * 0.35;
      }
      if (t === 50 || t === 130) AudioSys.sfx('alarm');
      if (t % 12 === 0 && t > 40) AudioSys.sfx('beep');
    }
  },
  cesar: {
    name: 'THE DIFFICULT STICK', quote: 'HOLD STILL. THIS WILL ONLY PINCH... A LOT.', final: 'SPECIMEN COLLECTED!', pose: 'pointy', prop: 'needle',
    dur: 270, hits: [100, 150, 158, 166, 174, 182, 190, 210], dmg: 330,
    drawWorld(c, t, k) {
      if (t < 40 || t > 200) return;
      const x = k.target.x, y = k.target.y - 140;
      c.save(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(-500, -800, STAGE_W + 1000, 1800);
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, 150, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(x, y);
      c.strokeStyle = '#ff3b3b'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 70 + Math.sin(t * 0.3) * 8, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-100, 0); c.lineTo(-40, 0); c.moveTo(40, 0); c.lineTo(100, 0); c.moveTo(0, -100); c.lineTo(0, -40); c.moveTo(0, 40); c.lineTo(0, 100); c.stroke();
      // cartoon "veins" grid
      c.strokeStyle = 'rgba(80,140,255,.8)'; c.lineWidth = 3;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-60, -30 + i * 30); c.bezierCurveTo(-20, -50 + i * 30, 20, -10 + i * 30, 60, -30 + i * 30); c.stroke(); }
      bigText(c, t < 100 ? 'SEARCHING FOR VEIN...' : 'VEIN FOUND!', 0, -170, 30, t < 100 ? '#9fd0ff' : '#7cf28b');
      c.restore();
    },
    drawScreen(c, t, k) {
      if (t < 160) return;
      // giant specimen label printer spewing labels over the screen
      const p = Math.min(1, (t - 160) / 12);
      c.save(); c.translate(W / 2, -60 + 140 * p);
      rr(c, -200, -60, 400, 100, 16); c.fillStyle = '#e9edf2'; c.fill(); c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
      rr(c, -150, 20, 300, 14, 4); c.fillStyle = '#222'; c.fill();
      bigText(c, 'LABEL-O-MATIC 9000', 0, -15, 28, '#1f5fd1');
      c.restore();
      const n = Math.min(70, (t - 165) * 1.2);
      for (let i = 0; i < n; i++) {
        const sx = ((i * 197) % (W - 80)) + 40, sy = 140 + ((i * 131) % (H - 200));
        c.save(); c.translate(sx, sy); ITEMS.label(c, 1.6, i); c.restore();
      }
    },
    update(t, k) {
      if (t > 40 && t < 100) { k.target.x = clamp(k.tx + Math.sin(t * 0.25) * 60, 80, STAGE_W - 80); }
      if (t === 100) { AudioSys.sfx('crit'); }
      if (t > 165 && t % 4 === 0) AudioSys.sfx('printer');
    }
  },
  admin: {
    name: 'CORPORATE RESTRUCTURING', quote: "IT'S NOT PERSONAL. IT'S A BUDGET LINE.", final: 'POSITION ELIMINATED!', pose: 'armsx',
    dur: 260, hits: [62, 100, 115, 130, 145, 160, 175, 195], dmg: 330,
    drawWorld(c, t, k) {
      if (t < 30) return;
      const x = k.tx;
      const dropT = Math.min(1, (t - 30) / 30);
      const dy = lerp(-700, 0, dropT * dropT);
      c.save(); c.translate(x, FLOOR + dy); ITEMS.desk(c, 1.2); c.restore();
    },
    update(t, k, g) {
      if (t === 60) { AudioSys.sfx('slam'); g.addShake(22); sparks(g, k.tx, FLOOR - 40, '#d7b46a', 30, 'dot'); }
      if (t > 85 && t < 200 && t % 5 === 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const it = Math.random() < 0.5 ? 'manual' : 'invite';
        g.fx.push(new Particle(k.target.x + side * 700, FLOOR - rand(150, 400), { kind: 'item', item: it, size: 1.1, vx: -side * rand(22, 28), vy: rand(-2, 2), g: 0, life: 40, drag: 1 }));
      }
      if (t > 85 && t % 15 === 0 && t < 200) AudioSys.sfx(pick(['whoosh', 'notify']));
    }
  }
};

// ---------- Roster ----------
// Move library: the playable ROSTER (roster.js) picks and re-themes these.
const BASE_ROSTER = [
  {
    id: 'martel', name: 'MARTEL', role: 'Nurse Practitioner', title: 'THE DIAGNOSIS DESTROYER', color: '#3bb3ff',
    stats: { power: 1.1, speed: 1.0, defense: 1.0 }, rating: { power: 4, speed: 3, defense: 3, difficulty: 2 },
    intro: 'Let\'s review your chart.', win: ['Diagnosis: you just got schooled.', 'Discharged. No follow-up needed.', 'Your prior auth has been denied!'],
    specials: [
      { input: 'N', name: 'ONE-STAR SMACKDOWN', cd: 150, dur: 30, at: 12, pose: 'cast', run(f, g) {
          AudioSys.sfx('notify');
          shoot(f, g, { speed: 11, w: 120, h: 70, noFlip: true, life: 140, draw: (c, t) => { c.rotate(Math.sin(t * 0.3) * 0.08); ITEMS.reviewCard(c, 0.85); },
            hit: { dmg: 95, stun: 22, kb: 9, sfx: 'ding', text: '★☆☆☆☆', textColor: '#ffd23f', announce: 'ONE-STAR REVIEW!', shake: 6 } });
        } },
      { input: 'F', name: 'PRIOR AUTHORIZATION DENIED', cd: 300, dur: 34, at: 14, pose: 'slam', run(f, g) {
          AudioSys.sfx('whoosh');
          shoot(f, g, { speed: 9, w: 140, h: 60, noFlip: true, dy: -180, life: 150, draw: (c, t) => { c.rotate(Math.sin(t * 0.25) * 0.15); ITEMS.stamp(c, 0.8); },
            hit: { dmg: 65, stun: 18, kb: 3, sfx: 'stamp', effect: { type: 'stun', dur: 80 }, text: 'DENIED!', textColor: '#ff3b3b', announce: 'PRIOR AUTH DENIED!', shake: 10 } });
        } },
      { input: 'B', name: 'STAT ORDER', cd: 170, dur: 30, at: 10, pose: 'cast', run(f, g) {
          AudioSys.sfx('printer');
          [-2.2, 0, 2.2].forEach((vy, i) => shoot(f, g, { speed: 10 + i * 0.6, vy, w: 46, h: 56, dy: -200, spin: 0.15, noFlip: true, life: 100, draw: c => ITEMS.rxPad(c, 1.1),
            hit: { dmg: 34, stun: 13, kb: 3, sfx: 'hitL', text: 'STAT!', textColor: '#ff5a8a' } }));
        } },
      { input: 'D', name: 'THE CHART IS CLOSED', cd: 300, dur: 34, at: 8, pose: 'raise', run(f, g) {
          const opp = g.other(f); const tx = opp.x; let done = false;
          AudioSys.sfx('beep');
          g.fx.push(new Timed(60, {
            update(t) {
              if (t === 30 && !done) {
                done = true; AudioSys.sfx('slam'); g.addShake(12);
                if (nearX(opp, tx, 120) && opp.hittable()) g.applyHit(f, opp, { dmg: 110, stun: 30, kd: true, kb: 4, sfx: 'hitH', text: 'CHART CLOSED!', textColor: '#7fd6ff', shake: 14, unblockable: false }, tx);
              }
            },
            draw(c, t) {
              const a = Math.min(1, t / 10); const lid = t < 22 ? 1 : Math.max(-1, 1 - (t - 22) / 8 * 2);
              c.save(); c.globalAlpha = t > 48 ? (60 - t) / 12 : a; c.translate(tx, t < 22 ? FLOOR - 420 + t * 2 : FLOOR - 376 + Math.min(1, (t - 22) / 8) * 300);
              ITEMS.laptop(c, 1, lid); c.restore();
            }
          }));
        } },
      { input: 'AIR', name: 'COPAY COLLECTION', cd: 360, dur: 26, at: 8, pose: 'cast', run(f, g) {
          const opp = g.other(f); AudioSys.sfx('cash');
          const tor = { x: opp.x };
          g.fx.push(new Timed(110, {
            update(t) {
              tor.x = lerp(tor.x, opp.x, 0.04);
              if (t === 16 && nearX(opp, tor.x, 120) && opp.hittable() && !opp.isBlockingFrom(tor.x)) { opp.status.root = 100; g.floatText(opp.x, opp.y - 300, 'COPAY DUE!', '#7cf28b'); }
              if (t > 16 && t % 15 === 0 && nearX(opp, tor.x, 120) && opp.hittable()) g.applyHit(f, opp, { dmg: 14, stun: 10, kb: 0, sfx: 'cash', chip: true }, tor.x);
            },
            draw(c, t) {
              const a = Math.min(1, t / 12) * (t > 95 ? (110 - t) / 15 : 1);
              c.save(); c.globalAlpha = a;
              for (let i = 0; i < 22; i++) {
                const ang = t * 0.25 + i * 1.7, h = (i / 22) * 260, r = 40 + h * 0.35;
                c.save(); c.translate(tor.x + Math.cos(ang) * r, FLOOR - 10 - h); c.rotate(ang);
                i % 4 === 0 ? ITEMS.invoice(c, 0.9) : ITEMS.bill(c, 1); c.restore();
              }
              c.restore();
            }
          }));
        } }
    ]
  },
  {
    id: 'nova', name: 'NOVA', role: 'Registered Nurse', title: 'THE IV AVENGER', color: '#2ee6c9',
    stats: { power: 0.95, speed: 1.15, defense: 0.95 }, rating: { power: 3, speed: 5, defense: 2, difficulty: 3 },
    intro: 'Call light\'s on. Guess I\'m answering it with my fists.', win: ['I\'ve done harder things before my first coffee.', 'Twelve hours. Zero breaks. Still won.', 'Charting this as a WIN.'],
    specials: [
      { input: 'N', name: 'IV POLE SPIN', cd: 200, dur: 46, at: 2, pose: 'spin', prop: 'ivpole', run(f, g) {
          AudioSys.sfx('whoosh'); f.spinning = 44;
        }, tick(f, g, t) {
          f.vx = f.facing0 * 3.2;
          if (t % 11 === 5) {
            AudioSys.sfx('whoosh');
            const opp = g.other(f);
            if (Math.abs(opp.x - f.x) < 150 && opp.y > f.y - 260 && opp.hittable()) g.applyHit(f, opp, { dmg: 24, stun: 14, kb: t > 35 ? 12 : 2, sfx: 'hitL', text: t > 35 ? 'SPIN!' : null }, f.x);
          }
        } },
      { input: 'F', name: 'CALL LIGHT CHAOS', cd: 280, dur: 30, at: 10, pose: 'pointy', run(f, g) {
          const opp = g.other(f); const tx = opp.x; AudioSys.sfx('alarm');
          g.fx.push(new Timed(80, {
            update(t) { if (t > 10 && t % 10 === 0 && nearX(opp, tx, 140) && opp.hittable()) g.applyHit(f, opp, { dmg: 14, stun: 14, kb: 0, sfx: 'beep', text: t === 20 ? 'DING DING!' : null }, tx); },
            draw(c, t) {
              const a = Math.min(1, t / 10) * (t > 66 ? (80 - t) / 14 : 1);
              c.save(); c.globalAlpha = a;
              for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + t * 0.04; c.save(); c.translate(tx + Math.cos(ang) * 110, FLOOR - 140 + Math.sin(ang) * 110); ITEMS.callLight(c, 1.1, (t + i * 3) % 10 < 5); c.restore(); }
              c.restore();
            }
          }));
        } },
      { input: 'B', name: 'MED PASS MADNESS', cd: 190, dur: 32, at: 12, pose: 'cast', run(f, g) {
          AudioSys.sfx('pop');
          const cols = ['#ff5a8a', '#ffd23f', '#7cf28b'];
          [[-11, 7], [-9, 9], [-7, 11]].forEach(([vy, sp], i) => shoot(f, g, { speed: sp, vy, grav: 0.45, w: 44, h: 30, spin: 0.2, life: 120, trail: cols[i], draw: c => ITEMS.pill(c, 1, cols[i]),
            hit: { dmg: 30, stun: 13, kb: 3, sfx: 'pop', text: 'MEDS!', textColor: cols[i] } }));
          shoot(f, g, { speed: 8, dy: -40, w: 80, h: 70, life: 140, draw: c => ITEMS.medCart(c, 1), hit: { dmg: 45, stun: 18, kb: 8, sfx: 'hitH', text: 'MED CART!' } });
        } },
      { input: 'D', name: 'SHIFT CHANGE', cd: 230, dur: 22, at: 6, pose: 'raise', run(f, g) {
          const opp = g.other(f); AudioSys.sfx('teleport');
          g.poof(f.x, f.y - 120);
          const side = f.x < opp.x ? 1 : -1;
          f.x = clamp(opp.x + side * 95, 60, STAGE_W - 60);
          f.facing = f.x < opp.x ? 1 : -1;
          f.invuln = 20;
          g.poof(f.x, f.y - 120);
          g.floatText(f.x, f.y - 300, 'SHIFT CHANGE!', '#2ee6c9');
        } }
    ]
  },
  {
    id: 'ruben', name: 'RUBEN', role: 'Medical Assistant', title: 'THE VITAL SIGN VIGILANTE', color: '#ffb547',
    stats: { power: 1.0, speed: 1.05, defense: 1.05 }, rating: { power: 3, speed: 4, defense: 4, difficulty: 2 },
    intro: 'Have a seat. Let\'s get your vitals.', win: ['Vitals stable. Your chances? Not so much.', 'Roomed, vitaled, and defeated.', 'The provider will see you... never.'],
    specials: [
      { input: 'N', name: 'THERMOMETER TORPEDO', cd: 140, dur: 28, at: 10, pose: 'cast', run(f, g) {
          AudioSys.sfx('whoosh');
          shoot(f, g, { speed: 13, w: 90, h: 34, life: 110, trail: '#ff6b3b', draw: c => ITEMS.thermometer(c, 1.4), hit: { dmg: 80, stun: 20, kb: 8, sfx: 'hitH', text: '104°F!', textColor: '#ff6b3b', shake: 5 } });
        } },
      { input: 'F', name: 'ROOMING RUSH', cd: 220, dur: 30, at: 4, pose: 'sit', prop: null, run(f, g) { AudioSys.sfx('whoosh'); f.rush = true; f.hitThis = false; },
        tick(f, g, t) {
          if (t < 4 || t > 26) { f.vx *= 0.7; return; }
          f.vx = f.facing * 15;
          if (t % 3 === 0) g.fx.push(new Particle(f.x - f.facing * 30, FLOOR - 6, { kind: 'smoke', color: '#ddd', vx: -f.facing * 2, vy: -1, g: 0, life: 20, size: 8 }));
          const opp = g.other(f);
          const box = { x: f.facing > 0 ? f.x : f.x - 90, y: f.y - 190, w: 90, h: 190 };
          if (!f.hitThis && opp.hittable() && overlap(box, opp.hurtbox())) { f.hitThis = true; g.applyHit(f, opp, { dmg: 90, stun: 26, kb: 13, kd: true, sfx: 'hitH', text: 'ROOMED!', shake: 8 }, f.x); f.vx = -f.facing * 4; f.specT = Math.max(f.specT, 22); }
        } },
      { input: 'B', name: 'NO-SHOW SPECIAL', cd: 300, dur: 30, at: 12, pose: 'cast', run(f, g) {
          AudioSys.sfx('notify');
          shoot(f, g, { speed: 8, w: 150, h: 54, life: 160, noFlip: true, draw: (c, t) => ITEMS.notification(c, 0.9), hit: { dmg: 40, stun: 14, kb: 2, sfx: 'freeze', effect: { type: 'freeze', dur: 80 }, text: 'NO-SHOW!', textColor: '#7fd6ff' } });
        } },
      { input: 'D', name: 'BLOOD PRESSURE BLAST', cd: 280, dur: 32, at: 8, pose: 'pointy', run(f, g) {
          const opp = g.other(f); const k = { x: opp.x, done: false }; AudioSys.sfx('inflate');
          g.fx.push(new Timed(56, {
            update(t) {
              if (t < 12) k.x = lerp(k.x, opp.x, 0.4);
              if (t === 34 && !k.done) { k.done = true; if (nearX(opp, k.x, 95) && opp.hittable() && opp.grounded()) g.applyHit(f, opp, { dmg: 100, stun: 30, launch: -18, kb: 2, sfx: 'hitH', text: '250/160!', textColor: '#ff4d4d', shake: 10, unblockable: true }, k.x); else g.floatText(k.x, FLOOR - 200, 'MISSED!', '#ccc'); }
            },
            draw(c, t) {
              const inf = Math.min(1, t / 34); const a = t > 40 ? (56 - t) / 16 : 1;
              c.save(); c.globalAlpha = Math.max(0, a); c.translate(k.x, FLOOR - 120 - (t > 34 ? (t - 34) * 18 : 0)); ITEMS.cuff(c, 1.3, inf); c.restore();
            }
          }));
        } }
    ]
  },
  {
    id: 'cesar', name: 'CESAR', role: 'Phlebotomist', title: 'THE VEIN HUNTER', color: '#ff4d6d',
    stats: { power: 1.05, speed: 1.0, defense: 1.05 }, rating: { power: 4, speed: 3, defense: 4, difficulty: 4 },
    intro: 'Make a fist. This won\'t take long.', win: ['One stick. That\'s all it takes.', 'Specimen collected. Label applied.', 'Next patient, please!'],
    specials: [
      { input: 'N', name: 'BUTTERFLY STRIKE', cd: 150, dur: 30, at: 8, pose: 'cast', run(f, g) {
          AudioSys.sfx('magic');
          [0, 7, 14].forEach((d, i) => g.later(d, () => shoot(f, g, { speed: 9, dy: -200 + i * 25, wave: 0.18, waveAmp: 28, w: 50, h: 40, life: 130, trail: '#ff9ad5', draw: (c, t) => ITEMS.butterfly(c, 1.2, t * 0.4), hit: { dmg: 30, stun: 14, kb: 3, sfx: 'hitL', text: i === 2 ? 'BUTTERFLY!' : null, textColor: '#ff9ad5' } })));
        } },
      { input: 'F', name: 'TOURNIQUET TORNADO', cd: 220, dur: 36, at: 6, pose: 'cast', run(f, g) {
          const opp = g.other(f); AudioSys.sfx('whoosh'); let caught = false;
          g.fx.push(new Timed(30, {
            update(t) {
              const len = t < 14 ? t / 14 * 400 : Math.max(0, 400 - (t - 14) * 30);
              const tip = { x: f.x + f.facing * (60 + len), y: f.y - 180 };
              if (!caught && t < 16 && opp.hittable() && overlap({ x: tip.x - 30, y: tip.y - 60, w: 60, h: 120 }, opp.hurtbox())) {
                caught = true; g.applyHit(f, opp, { dmg: 55, stun: 40, kb: 0, sfx: 'hitL', text: 'SNAP!', textColor: '#3b8be8' }, f.x);
                if (opp.state === 'hit') opp.pullTo = f.x + f.facing * 100;
              }
            },
            draw(c, t) {
              const len = t < 14 ? t / 14 * 400 : Math.max(0, 400 - (t - 14) * 30);
              const sx = f.x + f.facing * 60, sy = f.y - 185;
              c.save(); c.strokeStyle = '#3b8be8'; c.lineWidth = 9; c.lineCap = 'round';
              c.beginPath(); c.moveTo(sx, sy);
              c.quadraticCurveTo(sx + f.facing * len * 0.5, sy - 40 * Math.sin(t * 0.6), sx + f.facing * len, sy); c.stroke();
              c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
              c.translate(sx + f.facing * len, sy); c.rotate(t * 0.8);
              c.strokeStyle = '#3b8be8'; c.lineWidth = 8; c.beginPath(); c.ellipse(0, 0, 30, 16, 0, 0, TAU); c.stroke();
              c.restore();
            }
          }));
        } },
      { input: 'B', name: 'VEIN FINDER VISION', cd: 600, dur: 28, at: 10, pose: 'raise', run(f, g) {
          AudioSys.sfx('magic'); f.status.vein = 420; f.energy = Math.min(100, f.energy + 10);
          g.floatText(f.x, f.y - 320, 'VEIN FINDER ON!', '#ff4d4d');
        } },
      { input: 'D', name: 'SPECIMEN STORM', cd: 300, dur: 40, at: 6, pose: 'raise', run(f, g) {
          AudioSys.sfx('magic'); const opp = g.other(f);
          const caps = ['#8e44ad', '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#95a5a6'];
          g.fx.push(new Timed(80, {
            update(t) { if (t % 10 === 5 && Math.abs(opp.x - f.x) < 170 && opp.hittable()) g.applyHit(f, opp, { dmg: 16, stun: 13, kb: t > 70 ? 10 : 1, sfx: 'pop', text: t === 25 ? 'SPECIMEN STORM!' : null, textColor: '#b07cff' }, f.x); },
            draw(c, t) {
              const a = Math.min(1, t / 8) * (t > 68 ? (80 - t) / 12 : 1);
              c.save(); c.globalAlpha = a;
              for (let i = 0; i < 18; i++) { const ang = t * 0.22 + i * (TAU / 18), r = 90 + (i % 3) * 30, h = 40 + (i * 37) % 200; c.save(); c.translate(f.x + Math.cos(ang) * r, f.y - h + Math.sin(ang) * 18); c.rotate(ang * 2); ITEMS.tube(c, 1.2, caps[i % caps.length]); c.restore(); }
              c.restore();
            }
          }));
        } }
    ]
  },
  {
    id: 'admin', name: 'CHAD LEDGER', role: 'Hospital Administrator', title: 'THE BUDGET BOSS', color: '#b07cff',
    stats: { power: 1.08, speed: 0.92, defense: 1.1 }, rating: { power: 4, speed: 2, defense: 5, difficulty: 3 },
    intro: 'Let\'s circle back to your termination.', win: ['Your position has been eliminated.', 'Let\'s take this offline. Permanently.', 'Great synergy. For me.'],
    specials: [
      { input: 'N', name: 'BUDGET CUT', cd: 150, dur: 30, at: 12, pose: 'cast', run(f, g) {
          AudioSys.sfx('snip');
          shoot(f, g, { speed: 10, w: 110, h: 50, life: 130, draw: (c, t) => ITEMS.scissors(c, 1, 0.1 + Math.abs(Math.sin(t * 0.3)) * 0.35), hit: { dmg: 88, stun: 20, kb: 8, sfx: 'snip', text: 'BUDGET CUT!', textColor: '#7cf28b', shake: 6 } });
        } },
      { input: 'F', name: 'MANDATORY MEETING', cd: 360, dur: 30, at: 10, pose: 'pointy', run(f, g) {
          const opp = g.other(f); const k = { x: opp.x, trapped: false }; AudioSys.sfx('notify');
          g.fx.push(new Timed(130, {
            update(t, self) {
              if (t === 18) { if (nearX(opp, k.x, 85) && opp.hittable()) { k.trapped = true; g.applyHit(f, opp, { dmg: 40, stun: 10, kb: 0, sfx: 'stamp', effect: { type: 'trap', dur: 100 }, text: 'MEETING!', textColor: '#ffd23f', unblockable: true }, k.x); } else self.t = 110; }
              if (k.trapped) opp.x = lerp(opp.x, k.x, 0.3);
              if (k.trapped && opp.status.trap <= 0 && t > 22) self.t = Math.max(self.t, 115);
            },
            draw(c, t) { const a = Math.min(1, t / 18) * (t > 115 ? (130 - t) / 15 : 1); c.save(); c.translate(k.x, FLOOR); ITEMS.conference(c, 1, Math.max(0, a)); c.restore(); }
          }));
        } },
      { input: 'B', name: 'STAFFING SHORTAGE', cd: 300, dur: 34, at: 8, pose: 'armsx', run(f, g) {
          AudioSys.sfx('magic');
          [0, 9, 18].forEach((d, i) => g.later(d, () => {
            const pr = new Projectile(g, f, { x: f.x + f.facing * 30, y: FLOOR - 110, vx: f.facing * 8.5, w: 70, h: 220, life: 120, clash: false,
              draw: (c, t) => { drawCharacter(c, LOOKS.admin, 0, 110, { pose: Object.assign({}, POSES.walk, { fT: Math.sin(t * 0.4) * 0.5, bT: -Math.sin(t * 0.4) * 0.5, fK: 0.3, bK: 0.3 }), facing: 1, alpha: 0.5, t, prop: 'clipboard' }); },
              hit: { dmg: 28, stun: 15, kb: 5, sfx: 'hitL', text: i === 0 ? 'UNDERSTAFFED!' : null, textColor: '#b07cff' } });
            g.fx.push(pr);
          }));
        } },
      { input: 'D', name: 'PERFORMANCE REVIEW', cd: 280, dur: 30, at: 8, pose: 'raise', run(f, g) {
          const opp = g.other(f); const k = { x: opp.x, y: -500, done: false }; AudioSys.sfx('printer');
          g.fx.push(new Timed(60, {
            update(t) {
              if (t < 30) { k.x = lerp(k.x, opp.x, 0.08); k.y = lerp(FLOOR - 900, FLOOR - 110, Math.pow(t / 30, 2)); }
              if (t === 30 && !k.done) { k.done = true; AudioSys.sfx('slam'); g.addShake(10); if (nearX(opp, k.x, 105) && opp.hittable()) g.applyHit(f, opp, { dmg: 100, stun: 30, kd: true, kb: 3, sfx: 'hitH', text: 'NEEDS IMPROVEMENT!', textColor: '#ff4d4d', shake: 12 }, k.x); }
            },
            draw(c, t) { c.save(); c.globalAlpha = t > 44 ? (60 - t) / 16 : 1; c.translate(k.x, k.y); ITEMS.form(c, 1); c.restore(); }
          }));
        } }
    ]
  }
];
BASE_ROSTER.forEach(r => { r.look = LOOKS[r.id]; r.ult = ULTS[r.id]; });

// ============================================================
// Fighter
// ============================================================
class Fighter {
  constructor(def, side, g) {
    this.def = def; this.L = def.look; this.side = side; this.g = g; this.size = def.size || 1;
    this.maxHp = 1000; this.pose = Object.assign({}, POSES.idle);
    this.stats = { dmg: 0, hits: 0, attacks: 0, maxCombo: 0, specials: 0, ults: 0, blocks: 0, taken: 0 };
    this.resetRound(side === 0 ? STAGE_W / 2 - 260 : STAGE_W / 2 + 260);
  }
  resetRound(x) {
    this.x = x; this.y = FLOOR; this.vx = 0; this.vy = 0; this.facing = this.side === 0 ? 1 : -1;
    this.hp = this.maxHp; this.dispHp = this.maxHp; this.energy = this.energy ? Math.min(this.energy, 50) : 0;
    this.state = 'intro'; this.st = 0; this.atk = null; this.atkHit = false; this.combo = 0; this.comboT = 0; this.juggle = 0;
    this.status = { stun: 0, freeze: 0, root: 0, trap: 0, vein: 0 };
    this.cd = {}; this.invuln = 0; this.hitstun = 0; this.spec = null; this.specT = 0; this.flash = 0; this.spin = 0; this.spinning = 0;
    this.blink = 0; this.pullTo = null; this.ko = false; this.airAttackUsed = false; this.expr = 'normal'; this.shakeX = 0;
    this.dodgeCd = 0; this.lastHitBy = null;
  }
  grounded() { return this.y >= FLOOR - 0.5; }
  hurtbox() {
    const s = this.size;
    if (this.state === 'down') return { x: this.x - 90 * s, y: this.y - 40, w: 180 * s, h: 40 };
    if (this.state === 'dodge') return { x: this.x - 34 * s, y: this.y - 160 * s, w: 68 * s, h: 160 * s };
    return { x: this.x - 36 * s, y: this.y - 262 * s, w: 72 * s, h: 262 * s };
  }
  hittable() { return !this.ko && this.invuln <= 0 && !['down', 'getup', 'win', 'lose', 'intro', 'ult'].includes(this.state) && !(this.state === 'dodge' && this.st > 2 && this.st < 18); }
  isBlockingFrom(srcX) {
    if (!(this.state === 'block' || this.state === 'blockstun')) return false;
    const fromFront = (srcX - this.x) * this.facing > -10;
    return fromFront;
  }
  canAct() { return ['idle', 'walk', 'block', 'jump'].includes(this.state); }
  faceOpp() { const o = this.g.other(this); if (Math.abs(o.x - this.x) > 8) this.facing = o.x > this.x ? 1 : -1; }
  set(state) { this.state = state; this.st = 0; }

  startAttack(name) {
    const air = !this.grounded();
    const key = air ? 'j' + name : name;
    if (air && this.airAttackUsed) return false;
    this.atk = Object.assign({ name: key }, NORMALS[key]);
    this.atkHit = false; this.set('attack');
    if (air) this.airAttackUsed = true;
    this.stats.attacks++;
    AudioSys.sfx('whoosh');
    return true;
  }
  startSpecial(slotInput) {
    let sp = this.def.specials.find(s => s.input === slotInput);
    if (!sp) sp = this.def.specials.find(s => s.input === 'N');
    if (this.cd[sp.name] > 0) { if (this.ctrlHuman) this.g.floatText(this.x, this.y - 300, 'COOLDOWN', '#9aa'); return false; }
    this.cd[sp.name] = Math.round(sp.cd * (this.g.cdMult ? this.g.cdMult(this) : 1));
    this.spec = sp; this.specT = sp.dur; this.set('cast'); this.rush = false; this.facing0 = this.facing;
    this.stats.specials++;
    this.g.specialFlash(this, sp.name);
    if (!this.grounded()) { this.vy = Math.min(this.vy, -2); }
    return true;
  }
  startUlt() {
    if (this.energy < 100) return false;
    this.energy = 0; this.stats.ults++;
    this.g.startCine(this);
    return true;
  }

  update(ctl) {
    const g = this.g, opp = g.other(this);
    this.st++;
    for (const k in this.cd) if (this.cd[k] > 0) this.cd[k]--;
    for (const k in this.status) if (this.status[k] > 0) this.status[k]--;
    if (this.invuln > 0) this.invuln--;
    if (this.flash > 0) this.flash--;
    if (this.dodgeCd > 0) this.dodgeCd--;
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;
    this.blink = (g.frame + this.side * 97) % 200 < 6;
    const H_ = ctl ? ctl.held : {}, Pr = ctl ? ctl.pressed : {};
    const fwd = this.facing > 0 ? 'right' : 'left', back = this.facing > 0 ? 'left' : 'right';
    const spd = 4.3 * this.def.stats.speed;
    this.expr = 'normal';

    switch (this.state) {
      case 'intro': case 'win': case 'lose': case 'ult': case 'ulthit':
        this.vx *= 0.8; break;

      case 'idle': case 'walk': case 'block': {
        this.faceOpp(); this.airAttackUsed = false;
        if (Pr.ult && this.startUlt()) break;
        if (Pr.sp) {
          const dir = H_.down ? 'D' : H_[fwd] ? 'F' : H_[back] ? 'B' : 'N';
          if (this.startSpecial(dir)) break;
        }
        const atk = ['lp', 'hp', 'lk', 'hk'].find(b => Pr[b]);
        if (atk) { this.startAttack(atk); break; }
        if (H_.down) {
          if ((Pr[fwd] || Pr[back]) && this.dodgeCd <= 0) { this.set('dodge'); this.dodgeDir = Pr[fwd] ? this.facing : -this.facing; this.dodgeCd = 40; AudioSys.sfx('whoosh'); break; }
          if (this.state !== 'block') this.set('block');
          this.vx = 0; break;
        }
        if (H_.up && this.status.root <= 0) {
          this.vy = -17.5; this.vx = H_[fwd] ? this.facing * spd * 1.15 : H_[back] ? -this.facing * spd * 1.0 : 0;
          this.set('jump'); this.y -= 1; AudioSys.sfx('jump'); break;
        }
        if (this.status.root > 0) { this.vx = 0; this.state = 'idle'; break; }
        if (H_[fwd]) { this.vx = this.facing * spd; if (this.state !== 'walk') this.set('walk'); }
        else if (H_[back]) { this.vx = -this.facing * spd * 0.8; if (this.state !== 'walk') this.set('walk'); }
        else { this.vx = 0; if (this.state !== 'idle') this.set('idle'); }
        break;
      }
      case 'jump': {
        if (Pr.ult && this.startUlt()) break;
        if (Pr.sp) { const air = this.def.specials.find(s => s.input === 'AIR'); if (this.startSpecial(air ? 'AIR' : 'N')) break; }
        const atk = ['lp', 'hp', 'lk', 'hk'].find(b => Pr[b]);
        if (atk) this.startAttack(atk);
        break;
      }
      case 'attack': {
        const a = this.atk, f = this.st;
        this.expr = 'fierce';
        if (this.grounded() && !a.air) this.vx *= 0.7;
        if (f === a.s && a.name === 'hp') this.vx += this.facing * 3;
        if (f >= a.s && f < a.s + a.a && !this.atkHit) {
          const b = a.box;
          const s = this.size, box = { x: this.facing > 0 ? this.x + b[0] * s : this.x - (b[0] + b[2]) * s, y: this.y + b[1] * s, w: b[2] * s, h: b[3] * s };
          if (opp.hittable() && overlap(box, opp.hurtbox())) {
            this.atkHit = true;
            g.applyHit(this, opp, { dmg: a.dmg, stun: a.stun, kb: a.kb, launch: a.launch, sfx: a.sfx, shake: a.shake, energy: a.energy, burst: a.burst, normal: true }, this.x);
          }
        }
        // cancels on hit
        if (this.atkHit && f >= a.s + 1) {
          if (Pr.ult && this.startUlt()) break;
          if (Pr.sp && this.grounded()) { const dir = H_.down ? 'D' : H_[fwd] ? 'F' : H_[back] ? 'B' : 'N'; if (this.startSpecial(dir)) break; }
          const nx = ['lp', 'hp', 'lk', 'hk'].find(b => Pr[b]);
          if (nx && this.grounded() && (NORMALS[nx].rank >= a.rank || this.combo < 4) && nx !== a.name) { this.startAttack(nx); break; }
        }
        if (a.air) { if (this.grounded()) { this.set('idle'); this.atk = null; } }
        else if (f >= a.s + a.a + a.r) { this.set('idle'); this.atk = null; }
        break;
      }
      case 'cast': {
        const sp = this.spec; this.expr = 'shout';
        if (this.grounded()) this.vx *= 0.75;
        if (this.st === sp.at) sp.run(this, g);
        if (sp.tick) sp.tick(this, g, this.st);
        if (this.st >= this.specT) { if (sp.pose === 'spin') this.facing = this.facing0; this.set(this.grounded() ? 'idle' : 'jump'); this.spec = null; this.spinning = 0; }
        break;
      }
      case 'dodge': {
        this.vx = this.dodgeDir * 9 * (1 - this.st / 26);
        if (this.st >= 22) this.set('idle');
        break;
      }
      case 'hit': case 'blockstun': {
        this.expr = this.state === 'hit' ? 'hurt' : 'fierce';
        this.vx *= 0.85;
        if (this.pullTo != null) { this.x = lerp(this.x, this.pullTo, 0.25); if (Math.abs(this.x - this.pullTo) < 4) this.pullTo = null; }
        if (--this.hitstun <= 0) { this.pullTo = null; this.set(this.state === 'blockstun' && H_.down ? 'block' : 'idle'); }
        break;
      }
      case 'air': {
        this.expr = 'hurt';
        if (this.grounded() && this.st > 3) { this.set('down'); this.vx = 0; AudioSys.sfx('land'); g.addShake(5); g.dust(this.x); }
        break;
      }
      case 'down': {
        this.expr = 'ko'; this.vx *= 0.8; this.juggle = 0;
        if (this.ko) break;
        if (this.st > 42) { this.set('getup'); this.invuln = 16; }
        break;
      }
      case 'getup': { if (this.st > 12) this.set('idle'); break; }
      case 'stun': case 'freeze': case 'trap': {
        this.expr = this.state === 'freeze' ? 'shock' : 'hurt'; this.vx *= 0.8;
        if (this.status[this.state] <= 0) this.set('idle');
        break;
      }
    }

    // physics
    if (this.state !== 'ulthit' || !this.g.cine) {
      if (!this.grounded() || this.vy < 0) { this.vy += GRAV; this.y += this.vy; }
      if (this.y >= FLOOR) {
        this.y = FLOOR;
        if (this.vy > 0) {
          if (this.state === 'jump') { this.set('idle'); AudioSys.sfx('land'); this.vx = 0; }
          if (this.state === 'cast' && this.st > 4) { /* keep casting */ }
          if (this.state === 'attack' && this.atk && this.atk.air) { this.set('idle'); this.atk = null; this.vx = 0; }
        }
        this.vy = 0;
      }
      this.x += this.vx;
    }
    this.x = clamp(this.x, 50, STAGE_W - 50);
    if (this.spinning > 0) this.spinning--;
    this.updatePose();
  }

  updatePose() {
    const t = this.g.frame, s = this.state;
    let target = POSES.idle, k = 0.3;
    let air = !this.grounded();
    switch (s) {
      case 'idle': case 'intro': {
        const b = Math.sin(t * 0.09 + this.side) * 0.06;
        target = Object.assign({}, POSES.idle, { fK: POSES.idle.fK + b * 2, bK: POSES.idle.bK + b * 2, fE: POSES.idle.fE + b, bE: POSES.idle.bE - b });
        if (s === 'intro') target = this.st < 50 ? POSES.armsx : target;
        break;
      }
      case 'walk': {
        const ph = t * 0.22 * this.def.stats.speed * Math.sign(this.vx * this.facing || 1);
        target = Object.assign({}, POSES.walk, { fT: 0.1 + Math.sin(ph) * 0.42, bT: 0.1 - Math.sin(ph) * 0.42, fK: 0.25 + Math.max(0, Math.cos(ph)) * 0.55, bK: 0.25 + Math.max(0, -Math.cos(ph)) * 0.55 });
        break;
      }
      case 'jump': target = POSES.jump; break;
      case 'block': case 'blockstun': target = POSES.block; k = 0.5; break;
      case 'attack': {
        const a = this.atk; const f = this.st;
        target = POSES[a.pose]; k = f < a.s ? 0.45 : f < a.s + a.a ? 0.8 : 0.15;
        if (f >= a.s + a.a + a.r * 0.5 && !a.air) target = POSES.idle;
        break;
      }
      case 'cast': {
        target = POSES[this.spec.pose] || POSES.cast; k = 0.4;
        if (this.spec.pose === 'spin') { this.facing = (Math.floor(this.st / 5) % 2) ? -this.facing0 : this.facing0; }
        if (this.spec.pose === 'sit') air = false;
        break;
      }
      case 'dodge': target = POSES.dodge; k = 0.5; break;
      case 'hit': target = POSES.hit; k = 0.6; break;
      case 'air': target = POSES.airhit; k = 0.4; break;
      case 'down': target = POSES.down; k = 0.35; break;
      case 'getup': target = POSES.idle; k = 0.25; break;
      case 'stun': { target = Object.assign({}, POSES.stun, { lean: 0.1 + Math.sin(t * 0.15) * 0.18, head: 0.3 + Math.sin(t * 0.15) * 0.2 }); break; }
      case 'freeze': case 'trap': target = s === 'freeze' ? this.frozenPose || POSES.hit : POSES.block; k = s === 'freeze' ? 0 : 0.3; break;
      case 'ult': target = POSES[this.def.ult.pose] || POSES.raise; k = 0.25; break;
      case 'ulthit': target = POSES.hit; k = 0.5; break;
      case 'win': target = this.winPose(); k = 0.15; break;
      case 'lose': target = this.ko ? POSES.down : POSES.lose; k = 0.12; break;
    }
    if (s !== 'freeze') this.frozenPose = null; else if (!this.frozenPose) this.frozenPose = Object.assign({}, this.pose);
    blendPose(this.pose, target, k);
    this.airDraw = air && !['air', 'down'].includes(s);
  }
  // Which illustrated pose to show when this fighter has a sprite set
  spriteKey() {
    switch (this.state) {
      case 'walk': return Math.floor(this.g.frame / 10) % 2 ? 'walk2' : 'walk1';
      case 'jump': case 'dodge': return 'jump';
      case 'attack': return this.atk ? this.atk.name.replace(/^j/, '') : 'idle';
      case 'cast': return 'special';
      case 'block': case 'blockstun': return 'block';
      case 'hit': case 'stun': case 'freeze': case 'trap': case 'ulthit': case 'air': return 'hit';
      case 'down': return 'down';
      case 'ult': return 'ultimate';
      case 'win': return 'win';
      case 'lose': return this.ko ? 'down' : 'lose';
      default: return 'idle';
    }
  }
  winPose() {
    const t = this.g.frame;
    const id = this.def.id;
    if (id === 'martel') return Object.assign({}, POSES.win, { fA: 2.9 + Math.sin(t * 0.2) * 0.15 });
    if (id === 'admin') return Object.assign({}, POSES.armsx, { head: -0.15 });
    if (id === 'ruben') return Object.assign({}, POSES.pointy, { fA: 1.4 + Math.sin(t * 0.1) * 0.05 });
    if (id === 'nova') return Object.assign({}, POSES.win, { fA: 2.8, bA: 2.8, bE: 0.4, fE: 0.4 });
    return Object.assign({}, POSES.win, { fE: 0.3 + Math.abs(Math.sin(t * 0.25)) * 0.8 });
  }

  draw(c) {
    const g = this.g;
    // shadow
    const sh = clamp(1 - (FLOOR - this.y) / 400, 0.3, 1);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(this.x, FLOOR + 4, 60 * sh * this.size, 12 * sh, 0, 0, TAU); c.fill();

    // auras
    if (this.status.vein > 0) {
      c.save(); c.globalAlpha = 0.25 + Math.sin(g.frame * 0.3) * 0.1; c.fillStyle = '#ff2b4d';
      c.beginPath(); c.ellipse(this.x, this.y - 130, 80, 150, 0, 0, TAU); c.fill(); c.restore();
    }
    if (this.status.shield > 0) {
      c.save(); c.globalAlpha = 0.22 + Math.sin(g.frame * 0.2) * 0.08; c.fillStyle = '#7fd6ff'; c.strokeStyle = '#d7f3ff'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(this.x, this.y - 140, 95, 165, 0, 0, TAU); c.fill(); c.globalAlpha = 0.7; c.stroke(); c.restore();
    }
    if (this.status.counter > 0) {
      c.save(); c.globalAlpha = 0.5 + Math.sin(g.frame * 0.5) * 0.3; c.strokeStyle = '#9fe0ff'; c.lineWidth = 5; c.setLineDash([12, 8]);
      c.beginPath(); c.ellipse(this.x, this.y - 140, 90, 160, 0, 0, TAU); c.stroke(); c.restore();
    }
    if (this.status.root > 0) { c.save(); c.strokeStyle = '#7cf28b'; c.lineWidth = 4; c.setLineDash([8, 6]); c.beginPath(); c.ellipse(this.x, FLOOR, 70, 14, 0, 0, TAU); c.stroke(); c.restore(); }

    let prop = null;
    if (this.state === 'cast' && this.spec && this.spec.prop) prop = this.spec.prop;
    if (this.state === 'ult' && this.def.ult.prop) prop = this.def.ult.prop;
    const flicker = this.invuln > 0 && this.state !== 'getup' && g.frame % 4 < 2;
    let expr = this.expr;
    if (this.state === 'win') expr = 'happy';
    if (this.state === 'ult') expr = 'shout';
    if (this.state === 'ulthit') expr = g.frame % 30 < 15 ? 'shock' : 'hurt';
    if (this.state === 'lose' && !this.ko) expr = 'hurt';
    const x = this.x + (this.state === 'ulthit' || this.flash > 0 ? rand(-3, 3) : 0);

    c.save();
    if (this.spin) { c.translate(x, this.y - 130); c.rotate(this.spin); c.translate(-x, -(this.y - 130)); }
    // rolling stool for Rooming Rush
    if (this.state === 'cast' && this.spec && this.spec.pose === 'sit') {
      c.save(); c.translate(x - this.facing * 10, this.y);
      c.fillStyle = '#2b2f3a'; rr(c, -34, -78, 68, 16, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#9aa3ad'; c.fillRect(-4, -62, 8, 44);
      for (const dx of [-28, 0, 28]) dot(c, dx, -8, 8, '#222');
      c.restore();
    }
    if (this.flash > 4) c.filter = 'brightness(1.9) saturate(0.6)';
    drawCharacter(c, this.L, x, this.y - (this.state === 'cast' && this.spec && this.spec.pose === 'sit' ? 50 : 0), {
      pose: this.pose, facing: this.facing, expr, t: g.frame, spriteKey: this.spriteKey(), scale: this.size, blink: this.blink && expr === 'normal', prop, air: this.airDraw, alpha: flicker ? 0.4 : 1
    });
    c.restore();

    // status overlays
    if (this.state === 'freeze') {
      c.save(); c.globalAlpha = 0.45; c.fillStyle = '#9fe4ff'; rr(c, this.x - 70 * this.size, this.y - 300 * this.size, 140 * this.size, 300 * this.size, 20); c.fill();
      c.globalAlpha = 0.9; c.strokeStyle = '#e8fbff'; c.lineWidth = 3; c.stroke(); c.restore();
    }
    if (this.state === 'stun') {
      for (let i = 0; i < 4; i++) { const a = g.frame * 0.12 + i * TAU / 4; c.save(); c.translate(this.x + Math.cos(a) * 40, this.y - 320 * this.size + Math.sin(a) * 10); star(c, 0, 0, 10, '#ffd23f'); c.restore(); }
          }
    if (this.status.vein > 0) {
      const o = g.other(this);
      c.save(); c.translate(o.x, o.y - 150); c.rotate(g.frame * 0.05); c.strokeStyle = 'rgba(255,60,60,.8)'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-65, 0); c.lineTo(-35, 0); c.moveTo(35, 0); c.lineTo(65, 0); c.moveTo(0, -65); c.lineTo(0, -35); c.moveTo(0, 35); c.lineTo(0, 65); c.stroke();
      c.restore();
    }
  }
}

// ============================================================
// CPU AI
// ============================================================
const AI_LEVELS = [
  { react: 26, block: 0.12, aggro: 0.35, special: 0.010, combo: 0.15, antiProj: 0.15, dmg: 0.8 },
  { react: 16, block: 0.38, aggro: 0.55, special: 0.020, combo: 0.45, antiProj: 0.4, dmg: 1.0 },
  { react: 9, block: 0.62, aggro: 0.7, special: 0.032, combo: 0.7, antiProj: 0.65, dmg: 1.1 },
  { react: 4, block: 0.85, aggro: 0.85, special: 0.045, combo: 0.92, antiProj: 0.85, dmg: 1.25 }
];
class AI {
  constructor(f, level, mode = 'cpu') { this.f = f; this.L = AI_LEVELS[level]; this.mode = mode; this.wait = 0; this.hold = {}; this.holdT = 0; this.queue = []; this.lastOppState = ''; }
  think(g) {
    const f = this.f, o = g.other(f), L = this.L;
    const held = {}, pressed = {};
    const fwd = f.facing > 0 ? 'right' : 'left', back = f.facing > 0 ? 'left' : 'right';
    if (this.mode === 'stand') return { held, pressed };
    if (this.mode === 'block') { held.down = true; return { held, pressed }; }
    // continue holds
    if (this.holdT > 0) { this.holdT--; Object.assign(held, this.hold); }
    // combo queue executes on cancel windows
    if (this.queue.length) {
      if (f.state === 'attack' && f.atkHit && f.st >= f.atk.s + 1 || f.canAct()) {
        const nx = this.queue.shift();
        if (nx === 'sp') { pressed.sp = true; } else if (nx === 'ult') pressed.ult = true; else pressed[nx] = true;
        return { held, pressed };
      }
      if (f.state === 'attack' && !f.atkHit && f.st > f.atk.s + f.atk.a) this.queue = [];
      return { held, pressed };
    }
    const dist = Math.abs(o.x - f.x);
    // reactive defense (checked every frame but gated by reaction time)
    const threat = (o.state === 'attack' && dist < 240 && o.st < (o.atk ? o.atk.s + o.atk.a : 0)) ||
                   (o.state === 'cast' && dist < 200) ||
                   g.fx.some(p => p.isProjectile && p.owner === o && !p.dead && Math.abs(p.x - f.x) < 260 && Math.sign(p.vx) === Math.sign(f.x - p.x));
    if (threat && f.canAct()) {
      if (this.reactT == null) this.reactT = L.react;
      if (--this.reactT <= 0) {
        this.reactT = null;
        if (Math.random() < L.block) {
          if (Math.random() < L.antiProj * 0.3 && f.dodgeCd <= 0) { held.down = true; pressed[back] = true; }
          else { this.hold = { down: true }; this.holdT = 20; held.down = true; }
          return { held, pressed };
        }
      }
    } else this.reactT = null;

    if (--this.wait > 0) return { held, pressed };
    this.wait = Math.max(2, Math.round(L.react * rand(0.4, 1.0)));
    if (!f.canAct()) return { held, pressed };
    if (o.state === 'down' || o.state === 'getup') { if (dist < 140) { this.hold = { [back]: true }; this.holdT = 10; } return { held, pressed }; }

    // Ultimate
    if (f.energy >= 100 && Math.random() < L.aggro * 0.25 && dist < 700) { pressed.ult = true; return { held, pressed }; }
    // Specials
    const ready = f.def.specials.filter(s => !(f.cd[s.name] > 0) && s.input !== 'AIR');
    if (ready.length && Math.random() < L.special * this.wait) {
      const s = pick(ready);
      if (s.input === 'F') held[fwd] = true; if (s.input === 'B') held[back] = true; if (s.input === 'D') held.down = true;
      pressed.sp = true; return { held, pressed };
    }
    if (dist > 165) {
      const r = Math.random();
      if (r < L.aggro * 0.12 && dist < 450) { held.up = true; held[fwd] = true; this.queue = [pick(['hk', 'hp', 'lk'])]; this.qDelay = 12; return { held, pressed }; }
      if (r < L.aggro) { this.hold = { [fwd]: true }; this.holdT = randi(8, 22); held[fwd] = true; }
      else if (r < L.aggro + 0.12) { this.hold = { [back]: true }; this.holdT = randi(6, 14); }
      return { held, pressed };
    }
    // close range: attack strings
    const r = Math.random();
    if (r < L.aggro) {
      const strings = [['lp', 'lp', 'hp'], ['lk', 'hp'], ['lp', 'lk', 'hk'], ['hp', 'sp'], ['lp', 'hp', 'sp'], ['hk'], ['lk', 'lk', 'hp', 'sp']];
      let s = pick(strings);
      if (Math.random() > L.combo) s = [s[0]];
      if (s.includes('sp') && f.energy >= 100 && Math.random() < 0.5) s = s.map(x => x === 'sp' ? 'ult' : x);
      pressed[s[0]] = true; this.queue = s.slice(1);
      return { held, pressed };
    }
    if (r < L.aggro + 0.15) { this.hold = { down: true }; this.holdT = 18; held.down = true; }
    else { this.hold = { [back]: true }; this.holdT = 10; }
    return { held, pressed };
  }
}
