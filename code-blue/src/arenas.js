'use strict';
// ============================================================
// Arenas: five animated healthcare stages (world space, x 0..STAGE_W, floor at FLOOR)
// ============================================================
function parallax(c, cam, p, fn) { c.save(); c.translate((cam.x - STAGE_W / 2) * (1 - p), 0); fn(); c.restore(); }
function gradRect(c, x, y, w, h, stops) {
  const g = c.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(x, y, w, h);
}
function tileFloor(c, col1, col2, line = 'rgba(0,0,0,.12)') {
  gradRect(c, -400, FLOOR - 10, STAGE_W + 800, 200, [[0, col1], [1, col2]]);
  c.strokeStyle = line; c.lineWidth = 2;
  for (let i = -10; i < 40; i++) { c.beginPath(); c.moveTo(i * 80, FLOOR - 10); c.lineTo(i * 80 + (i * 80 - STAGE_W / 2) * 0.35, FLOOR + 190); c.stroke(); }
  for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(-400, FLOOR + 10 + j * j * 14); c.lineTo(STAGE_W + 400, FLOOR + 10 + j * j * 14); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-400, FLOOR - 10, STAGE_W + 800, 6);
}
// generic background staffer (faceless silhouette, cartoon)
function staffer(c, x, y, s, col, t, walking = true, skin = '#c99a74') {
  c.save(); c.translate(x, y); c.scale(s, s);
  const sw = walking ? Math.sin(t * 0.25) * 0.5 : 0;
  c.lineCap = 'round';
  c.strokeStyle = shade(col, 0.75); c.lineWidth = 16;
  c.beginPath(); c.moveTo(0, -95); c.lineTo(Math.sin(sw) * 40, -95 + Math.cos(sw) * 90); c.stroke();
  c.beginPath(); c.moveTo(0, -95); c.lineTo(-Math.sin(sw) * 40, -95 + Math.cos(sw) * 90); c.stroke();
  rr(c, -22, -190, 44, 100, 14); c.fillStyle = col; c.fill();
  c.strokeStyle = col; c.lineWidth = 12; c.beginPath(); c.moveTo(-14, -180); c.lineTo(-14 - Math.sin(sw) * 30, -110); c.stroke();
  dot(c, 0, -212, 20, skin, null);
  c.restore();
}

const ARENAS = [
  {
    id: 'ed', name: 'EMERGENCY DEPARTMENT', music: 'fight', ambient: ['beep', 'alarm', 'phone'],
    draw(c, cam, t) {
      parallax(c, cam, 0.45, () => {
        gradRect(c, -600, -200, STAGE_W + 1200, FLOOR + 200, [[0, '#cfe3f3'], [0.7, '#b6d0e6'], [1, '#9dbcd6']]);
        // ceiling lights
        for (let i = -2; i < 14; i++) { c.fillStyle = '#f8fbff'; rr(c, i * 180, 10, 120, 16, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(i * 180, 26); c.lineTo(i * 180 + 120, 26); c.lineTo(i * 180 + 160, 200); c.lineTo(i * 180 - 40, 200); c.fill(); }
        // brand wall sign
        c.save(); c.translate(560, 110);
        rr(c, -10, -10, 560, 120, 14); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
        drawLogo(c, 50, 48, 6.5);
        c.fillStyle = '#0f2557'; c.font = `bold 54px ${FONT2}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('ImmunoCare', 110, 52);
        c.font = 'bold 18px sans-serif'; c.fillText('—  H E A L T H  —', 200, 76);
        c.font = '20px sans-serif'; c.fillText('Compassion. Prevention. Health.', 120, 102);
        c.restore();
        // EMERGENCY sign
        const glow = 0.6 + Math.sin(t * 0.1) * 0.4;
        c.save(); c.shadowColor = '#ff2b2b'; c.shadowBlur = 25 * glow; rr(c, 1180, 60, 380, 80, 10); c.fillStyle = '#b5121b'; c.fill(); c.restore();
        bigText(c, 'EMERGENCY', 1370, 102, 56, '#fff', '#5a0a0f');
        // bays with curtains & monitors
        for (let i = 0; i < 6; i++) {
          const bx = -100 + i * 330;
          c.fillStyle = '#e8f0f7'; c.fillRect(bx, 260, 300, 330);
          c.fillStyle = ['#7fb4e0', '#8fd0c4', '#b9a6e0'][i % 3]; for (let k = 0; k < 8; k++) { c.globalAlpha = k % 2 ? 0.85 : 1; c.fillRect(bx + k * 14, 270, 14, 300); } c.globalAlpha = 1;
          // monitor
          rr(c, bx + 170, 290, 110, 80, 8); c.fillStyle = '#20262f'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#04120a'; c.fillRect(bx + 178, 298, 94, 64);
          c.strokeStyle = '#3dff6e'; c.lineWidth = 2; c.beginPath();
          for (let x = 0; x < 90; x += 2) { const ph = (x + t * 2 + i * 30) % 45; const y = ph > 20 && ph < 26 ? -18 * Math.sin((ph - 20) / 6 * Math.PI) : 0; x ? c.lineTo(bx + 180 + x, 335 + y) : c.moveTo(bx + 180 + x, 335 + y); }
          c.stroke();
          c.fillStyle = '#ffd23f'; c.font = 'bold 12px monospace'; c.fillText(String(70 + ((t / 20 + i * 7) | 0) % 30), bx + 250, 312);
          // bed
          rr(c, bx + 150, 470, 140, 30, 6); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#7a8796'; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#7a8796'; c.fillRect(bx + 160, 500, 6, 70); c.fillRect(bx + 274, 500, 6, 70);
        }
        // red rotating beacon
        c.save(); c.translate(1130, 40); dot(c, 0, 0, 16, '#ff3b3b'); c.globalAlpha = 0.25; c.fillStyle = '#ff3b3b';
        const a = t * 0.12; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 600, a, a + 0.4); c.fill(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 600, a + Math.PI, a + Math.PI + 0.4); c.fill(); c.restore();
      });
      // walking staff + stretcher layer
      parallax(c, cam, 0.7, () => {
        const cols = ['#1d2c63', '#17a5a8', '#7d5bd1', '#2f7bd1'];
        for (let i = 0; i < 4; i++) {
          const x = ((t * (1.2 + i * 0.3) + i * 600) % (STAGE_W + 600)) - 300;
          staffer(c, i % 2 ? STAGE_W - x : x, FLOOR - 30, 0.8, cols[i], t + i * 20);
        }
        const sx = ((t * 7) % 5000) - 600;
        if (sx < STAGE_W + 400) {
          c.save(); c.translate(sx, FLOOR - 70);
          rr(c, -110, -30, 220, 26, 8); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#9fb3c8'; c.fillRect(-100, -4, 200, 8); dot(c, -90, 30, 10, '#333'); dot(c, 90, 30, 10, '#333');
          c.strokeStyle = '#9fb3c8'; c.lineWidth = 6; c.beginPath(); c.moveTo(-90, 4); c.lineTo(-90, 26); c.moveTo(90, 4); c.lineTo(90, 26); c.stroke();
          staffer(c, -150, 70, 0.75, '#1d2c63', t); bigText(c, 'STAT!', 0, -70, 34, '#ff3b3b');
          c.restore();
        }
      });
      tileFloor(c, '#d9e3ea', '#a9b8c6');
      c.fillStyle = 'rgba(255,60,60,.6)'; c.fillRect(-400, FLOOR + 40, STAGE_W + 800, 8);
    }
  },
  {
    id: 'station', name: "NURSES' STATION", music: 'fight', ambient: ['phone', 'beep', 'printer'],
    draw(c, cam, t) {
      parallax(c, cam, 0.45, () => {
        gradRect(c, -600, -200, STAGE_W + 1200, FLOOR + 200, [[0, '#f3e6d4'], [1, '#d9c3a6']]);
        c.fillStyle = '#c9b08f'; c.fillRect(-600, 470, STAGE_W + 1200, 12);
        // call light board
        c.save(); c.translate(260, 90); rr(c, 0, 0, 420, 170, 10); c.fillStyle = '#2a2f3a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
        bigText(c, 'CALL LIGHTS', 210, 22, 26, '#ffd23f');
        for (let i = 0; i < 24; i++) { const on = ((i * 7919 + Math.floor(t / 25) * 31) % 7) < 3; c.save(); c.translate(36 + (i % 8) * 50, 62 + Math.floor(i / 8) * 40); ITEMS.callLight(c, 0.85, on); c.restore(); c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText(String(400 + i), 36 + (i % 8) * 50, 80 + Math.floor(i / 8) * 40); }
        c.restore();
        // whiteboard
        c.save(); c.translate(780, 90); rr(c, 0, 0, 380, 200, 6); c.fillStyle = '#fbfbfb'; c.fill(); c.strokeStyle = '#8a8f99'; c.lineWidth = 6; c.stroke();
        c.fillStyle = '#1f5fd1'; c.font = 'bold 26px "Comic Sans MS", cursive'; c.textAlign = 'left'; c.fillText('Census: 32', 24, 46);
        c.fillStyle = '#d0121b'; c.fillText('Staff: 3 (lol)', 24, 86);
        c.fillStyle = '#1a8a46'; c.fillText('Lunch: ???', 24, 126);
        c.fillStyle = '#7d5bd1'; c.font = 'bold 18px "Comic Sans MS", cursive'; c.fillText('Remember: hydrate! ☺', 24, 170);
        c.restore();
        // clock
        c.save(); c.translate(1300, 150); dot(c, 0, 0, 60, '#fff', INK, 6);
        c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(t * 0.002) * 30, -Math.cos(t * 0.002) * 30); c.stroke();
        c.strokeStyle = '#d0121b'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(t * 0.1) * 48, -Math.cos(t * 0.1) * 48); c.stroke(); c.restore();
        // station counter with EHR screens & phones
        c.save(); c.translate(0, 0);
        rr(c, 120, 420, 1560, 160, 14); c.fillStyle = '#7a5a3a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
        c.fillStyle = '#a07a52'; c.fillRect(120, 420, 1560, 22);
        for (let i = 0; i < 6; i++) {
          const mx = 200 + i * 250;
          rr(c, mx, 320, 140, 96, 6); c.fillStyle = '#1b202a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
          c.fillStyle = (t / 30 + i) % 10 < 1 ? '#fff' : '#e9f3ff'; c.fillRect(mx + 8, 328, 124, 80);
          c.fillStyle = '#1f5fd1'; c.fillRect(mx + 8, 328, 124, 12);
          c.fillStyle = '#b8c7da'; for (let k = 0; k < 4; k++) c.fillRect(mx + 14, 348 + k * 13, 90 - k * 12, 6);
          if (i % 2) { c.fillStyle = '#d0121b'; c.font = 'bold 10px sans-serif'; c.textAlign = 'left'; c.fillText('⚠ 47 UNSIGNED NOTES', mx + 12, 402); }
          c.fillStyle = '#333'; c.fillRect(mx + 60, 416, 20, 8);
          // phones
          if (i % 2 === 0) {
            const ring = (t + i * 40) % 300 < 60; const jx = ring ? Math.sin(t * 2) * 3 : 0;
            c.save(); c.translate(mx + 175 + jx, 410); rr(c, -22, -14, 44, 18, 6); c.fillStyle = '#2b2f36'; c.fill(); c.stroke(); c.restore();
            if (ring) bigText(c, 'RING!', mx + 175, 370 - (t % 20), 22, '#ffd23f');
          }
        }
        // coffee pot
        c.fillStyle = '#5a3a20'; rr(c, 1600, 380, 40, 40, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
        c.restore();
      });
      parallax(c, cam, 0.75, () => {
        for (let i = 0; i < 3; i++) { const x = ((t * (1 + i * 0.5) + i * 700) % (STAGE_W + 600)) - 300; staffer(c, i % 2 ? STAGE_W - x : x, FLOOR - 20, 0.85, ['#17a5a8', '#d36ba6', '#1d2c63'][i], t + i * 15); }
      });
      tileFloor(c, '#cfc7b8', '#9f9583');
    }
  },
  {
    id: 'snf', name: 'SKILLED NURSING FACILITY', music: 'fight', ambient: ['beep', 'ding'],
    draw(c, cam, t) {
      parallax(c, cam, 0.45, () => {
        gradRect(c, -600, -200, STAGE_W + 1200, FLOOR + 200, [[0, '#e7efe1'], [1, '#c9d8bf']]);
        // wallpaper stripes
        c.fillStyle = 'rgba(120,160,110,.12)'; for (let i = -10; i < 50; i++) c.fillRect(i * 50, 0, 18, 420);
        // handrail
        c.fillStyle = '#8c6b4a'; rr(c, -600, 420, STAGE_W + 1200, 16, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
        // doors
        for (let i = 0; i < 6; i++) {
          const dx = -60 + i * 330;
          rr(c, dx, 170, 150, 420, 6); c.fillStyle = '#b98a5a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#a07246'; c.fillRect(dx + 16, 190, 118, 160); c.fillRect(dx + 16, 370, 118, 190);
          dot(c, dx + 130, 390, 6, '#d7b46a');
          rr(c, dx + 40, 130, 70, 30, 4); c.fillStyle = '#fff'; c.fill(); c.stroke();
          c.fillStyle = '#333'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.fillText(String(101 + i), dx + 75, 151);
        }
        // banners
        c.save(); c.translate(860, 70); rr(c, -200, -30, 400, 60, 10); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
        bigText(c, 'BINGO @ 2PM — PRIZES!', 0, 2, 30, '#d0121b'); c.restore();
        c.save(); c.translate(1450, 80); for (let i = 0; i < 9; i++) { c.fillStyle = ['#ff5a8a', '#3bb3ff', '#7cf28b', '#ffd23f'][i % 4]; c.beginPath(); c.moveTo(i * 30 - 130, 0); c.lineTo(i * 30 - 115, 30); c.lineTo(i * 30 - 100, 0); c.fill(); }
        bigText(c, 'HAPPY 100th, MS. JUNE!', 0, 60, 26, '#7d5bd1'); c.restore();
        // med cart & parked wheelchairs
        c.save(); c.translate(560, 560); ITEMS.medCart(c, 1.6); c.restore();
        for (const wx of [1200, 1290]) { c.save(); c.translate(wx, 560); wheelchair(c, 1, 0); c.restore(); }
      });
      parallax(c, cam, 0.75, () => {
        // wheelchair race across the hall!
        const x = ((t * 6) % 4200) - 500;
        if (x < STAGE_W + 300) {
          c.save(); c.translate(x, FLOOR - 40); wheelchair(c, 1.1, t); staffer(c, 6, -8, 0.55, '#d8c8f0', 0, false, '#e8c8a8');
          c.fillStyle = '#eee'; dot(c, 6, -126, 13, '#f0f0f0', null);
          bigText(c, 'WHEEE!', 0, -170, 28, '#ff5a8a'); c.restore();
        }
        const wx = STAGE_W - ((t * 0.6) % (STAGE_W + 400)) + 200;
        c.save(); c.translate(wx, FLOOR - 30); staffer(c, 0, 0, 0.75, '#9fc5e8', t * 0.3, true, '#e8c8a8');
        c.strokeStyle = '#9aa3ad'; c.lineWidth = 5; c.strokeRect(-55, -110, 30, 110); c.restore();
      });
      tileFloor(c, '#d8cfb9', '#b3a78c');
    }
  },
  {
    id: 'insurance', name: 'INSURANCE AUTHORIZATION OFFICE', music: 'boss', ambient: ['printer', 'phone', 'stamp'],
    draw(c, cam, t) {
      parallax(c, cam, 0.45, () => {
        gradRect(c, -600, -200, STAGE_W + 1200, FLOOR + 200, [[0, '#dcdfe6'], [1, '#b0b6c3']]);
        // ceiling grid
        c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 2; for (let i = -10; i < 40; i++) { c.beginPath(); c.moveTo(i * 90, 0); c.lineTo(i * 90, 60); c.stroke(); }
        // DENIED posters
        for (let i = 0; i < 7; i++) { c.save(); c.translate(-20 + i * 290, 120 + (i % 2) * 40); c.rotate((i % 3 - 1) * 0.08); rr(c, -110, -60, 220, 120, 4); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); ITEMS.stamp(c, 1.05, ['DENIED', 'PENDING', 'DENIED', 'NOT COVERED', 'DENIED', 'RESUBMIT', 'DENIED'][i]); c.restore(); }
        bigText(c, 'PLEASE HOLD — YOUR CALL IS IMPORTANT TO US', 900, 270, 30, '#13284f', '#fff');
        // cubicles with monitors
        for (let i = 0; i < 7; i++) {
          const cx = -40 + i * 280;
          c.fillStyle = '#7d8696'; c.fillRect(cx, 380, 240, 200); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(cx, 380, 240, 200);
          c.fillStyle = '#939cad'; c.fillRect(cx + 8, 388, 224, 20);
          rr(c, cx + 70, 330, 110, 70, 6); c.fillStyle = '#20262f'; c.fill(); c.stroke();
          c.fillStyle = '#e9f3ff'; c.fillRect(cx + 78, 338, 94, 52);
          c.save(); c.translate(cx + 125, 364); c.rotate(t * 0.15 + i); c.strokeStyle = '#1f5fd1'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 12, 0, 4.5); c.stroke(); c.restore();
          c.fillStyle = '#333'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText('PENDING…', cx + 125, 386);
        }
        // fax machine spewing paper
        c.save(); c.translate(1550, 520); rr(c, -70, -50, 140, 70, 8); c.fillStyle = '#e1e4ea'; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
        c.fillStyle = '#333'; c.fillRect(-50, -40, 60, 10); bigText(c, 'FAX', 40, -20, 18, '#d0121b');
        for (let i = 0; i < 5; i++) { const p = ((t * 2 + i * 40) % 200) / 200; c.save(); c.translate(-80 - p * 260, -30 - Math.sin(p * Math.PI) * 140); c.rotate(p * 6 + i); c.fillStyle = '#fff'; c.fillRect(-18, -24, 36, 48); c.strokeStyle = '#999'; c.lineWidth = 1; c.strokeRect(-18, -24, 36, 48); c.restore(); }
        c.restore();
      });
      // music notes (hold music)
      parallax(c, cam, 0.7, () => { for (let i = 0; i < 6; i++) { const y = 300 - ((t * 1.5 + i * 60) % 300); c.save(); c.globalAlpha = 0.5; c.fillStyle = '#13284f'; c.font = '34px serif'; c.fillText('♪', 300 + i * 230 + Math.sin(t * 0.05 + i) * 20, y); c.restore(); } });
      tileFloor(c, '#7f8796', '#5b6271', 'rgba(255,255,255,.06)');
    }
  },
  {
    id: 'boardroom', name: 'HOSPITAL BOARDROOM', music: 'boss', ambient: ['ding', 'notify'],
    draw(c, cam, t) {
      parallax(c, cam, 0.3, () => {
        gradRect(c, -600, -200, STAGE_W + 1200, FLOOR + 200, [[0, '#0b1230'], [0.6, '#1d2a5a'], [1, '#2c1d4a']]);
        // skyline through windows
        for (let i = 0; i < 40; i++) { const bx = -500 + i * 80, bh = 120 + ((i * 137) % 260); c.fillStyle = '#111a3c'; c.fillRect(bx, 470 - bh, 70, bh); c.fillStyle = 'rgba(255,220,120,.6)'; for (let k = 0; k < 8; k++) if ((i * 7 + k * 3) % 5 < 2) c.fillRect(bx + 8 + (k % 3) * 20, 480 - bh + Math.floor(k / 3) * 30, 10, 14); }
        c.fillStyle = '#e8ecf5'; dot(c, 1500, 90, 40, '#f5f1d6', null);
      });
      parallax(c, cam, 0.5, () => {
        // window frames
        c.strokeStyle = '#0a0f22'; c.lineWidth = 16; for (let i = -4; i < 20; i++) { c.beginPath(); c.moveTo(i * 200, 0); c.lineTo(i * 200, 480); c.stroke(); }
        c.fillStyle = '#3a2a24'; c.fillRect(-600, 470, STAGE_W + 1200, 200);
        // dashboards
        for (let i = 0; i < 3; i++) {
          const dx = 260 + i * 480;
          c.save(); c.translate(dx, 150); rr(c, -170, -90, 340, 190, 10); c.fillStyle = '#0d1424'; c.fill(); c.strokeStyle = '#4a5a8a'; c.lineWidth = 4; c.stroke();
          c.fillStyle = '#9fd0ff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'left'; c.fillText(['Q4 SYNERGY', 'EBITDA (vibes)', 'STAFF MORALE'][i], -155, -66);
          c.strokeStyle = ['#3dff6e', '#ffd23f', '#ff4d4d'][i]; c.lineWidth = 4; c.beginPath();
          for (let x = 0; x <= 300; x += 10) { const trend = i === 2 ? x * 0.4 : -x * 0.3; const y = trend + Math.sin(x * 0.05 + t * 0.05 + i) * 20; x ? c.lineTo(-150 + x, 20 + y * 0.6) : c.moveTo(-150 + x, 20 + y * 0.6); }
          c.stroke();
          if (i === 2) bigText(c, '↓ 97%', 110, -60, 26, '#ff4d4d');
          if (i === 0) bigText(c, '↑ 400%', 110, -60, 26, '#3dff6e');
          c.restore();
        }
        // long table & chairs
        rr(c, 120, 470, 1560, 40, 16); c.fillStyle = '#4a2b17'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
        for (let i = 0; i < 9; i++) { const x = 180 + i * 180; rr(c, x - 30, 400, 60, 80, 12); c.fillStyle = '#151515'; c.fill(); c.stroke(); }
      });
      // spotlight beams
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { const a = Math.sin(t * 0.01 + i * 2) * 0.35; const x = 300 + i * 600; c.save(); c.translate(x, -50); c.rotate(a); const gr = c.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, 'rgba(180,140,255,.28)'); gr.addColorStop(1, 'rgba(180,140,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(200, 800); c.lineTo(-200, 800); c.fill(); c.restore(); }
      c.restore();
      gradRect(c, -400, FLOOR - 10, STAGE_W + 800, 200, [[0, '#5a2230'], [1, '#2a0f18']]);
      c.fillStyle = 'rgba(255,215,0,.35)'; c.fillRect(-400, FLOOR - 10, STAGE_W + 800, 4);
    }
  }
];

function wheelchair(c, s, t) {
  c.save(); c.scale(s, s);
  c.strokeStyle = '#4a4f5a'; c.lineWidth = 5;
  c.beginPath(); c.arc(-10, 0, 34, 0, TAU); c.stroke();
  c.save(); c.translate(-10, 0); c.rotate(t * 0.3); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineWidth = 2; c.stroke(); } c.restore();
  dot(c, 30, 26, 8, '#333');
  c.fillStyle = '#1f5fd1'; c.fillRect(-30, -50, 50, 10); c.fillRect(-36, -100, 10, 60);
  c.lineWidth = 4; c.beginPath(); c.moveTo(20, -40); c.lineTo(34, 20); c.stroke();
  c.restore();
}
