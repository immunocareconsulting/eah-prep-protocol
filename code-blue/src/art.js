'use strict';
// ============================================================
// Character art: procedural cartoon fighters (skeletal poses + cel-shaded parts)
// ============================================================
const INK = '#14182b';

// ---------------- Poses ----------------
// Angles in radians. Legs: 0 = straight down, + = forward. Knee flex rotates shin backward.
// Arms: 0 = hanging, + = forward/up. Elbow flex rotates forearm forward/up.
const POSE_KEYS = ['lean', 'hx', 'bT', 'bK', 'fT', 'fK', 'bA', 'bE', 'fA', 'fE', 'head', 'rot', 'dy'];
const P = (o) => Object.assign({ lean: 0, hx: 0, bT: 0, bK: 0, fT: 0, fK: 0, bA: 0, bE: 0, fA: 0, fE: 0, head: 0, rot: 0, dy: 0 }, o);
const POSES = {
  idle:    P({ lean: .06, fT: .38, fK: .32, bT: -.32, bK: .22, fA: .55, fE: 2.05, bA: .35, bE: 2.15 }),
  walk:    P({ lean: .1, fA: .6, fE: 2.0, bA: .4, bE: 2.1 }),
  jump:    P({ lean: .05, fT: 1.1, fK: 1.7, bT: .25, bK: 1.5, fA: .9, fE: 1.6, bA: .4, bE: 1.4 }),
  block:   P({ lean: -.1, fT: .3, fK: .45, bT: -.35, bK: .35, fA: 1.15, fE: 2.25, bA: 1.0, bE: 2.35, head: .15 }),
  lp:      P({ lean: .14, fT: .45, fK: .3, bT: -.38, bK: .15, fA: 1.55, fE: .05, bA: .45, bE: 2.2 }),
  hp:      P({ lean: .3, hx: 8, fT: .55, fK: .35, bT: -.45, bK: .1, fA: .4, fE: 2.4, bA: 1.62, bE: .02, head: .05 }),
  lk:      P({ lean: -.12, fT: 1.45, fK: .15, bT: -.12, bK: .12, fA: .7, fE: 1.9, bA: .2, bE: 1.9 }),
  hk:      P({ lean: -.45, fT: 2.05, fK: .2, bT: -.25, bK: .05, fA: .3, fE: 2.2, bA: -.6, bE: 1.2 }),
  jlp:     P({ lean: .2, fT: .9, fK: 1.6, bT: .2, bK: 1.4, fA: 1.35, fE: .15, bA: .3, bE: 2.0 }),
  jhp:     P({ lean: .35, fT: .8, fK: 1.4, bT: .1, bK: 1.3, fA: .3, fE: 2.2, bA: 1.0, bE: .1 }),
  jlk:     P({ lean: -.05, fT: 1.2, fK: .2, bT: .3, bK: 1.6, fA: .8, fE: 1.7, bA: .2, bE: 1.6 }),
  jhk:     P({ lean: -.2, fT: 1.0, fK: .05, bT: .2, bK: 1.9, fA: .6, fE: 1.9, bA: -.4, bE: 1.0 }),
  cast:    P({ lean: .22, hx: 6, fT: .5, fK: .3, bT: -.45, bK: .15, fA: 1.7, fE: .1, bA: -.5, bE: .6 }),
  raise:   P({ lean: -.08, fT: .3, fK: .2, bT: -.3, bK: .15, fA: 2.95, fE: .15, bA: .4, bE: 1.9, head: -.15 }),
  slam:    P({ lean: .35, fT: .55, fK: .6, bT: -.4, bK: .4, fA: 1.0, fE: .1, bA: .9, bE: .1, head: .1 }),
  hit:     P({ lean: -.38, hx: -6, fT: .25, fK: .35, bT: -.3, bK: .2, fA: .25, fE: .6, bA: -.35, bE: .5, head: -.35 }),
  airhit:  P({ lean: -.5, fT: .6, fK: .9, bT: .3, bK: .6, fA: 2.4, fE: .3, bA: 2.0, bE: .4, head: -.4 }),
  down:    P({ rot: -1.52, dy: -14, fT: .2, fK: .2, bT: .35, bK: .5, fA: 2.6, fE: .3, bA: 2.4, bE: .4, head: -.2 }),
  stun:    P({ lean: .12, fT: .2, fK: .4, bT: -.2, bK: .4, fA: .1, fE: .3, bA: .05, bE: .3, head: .3 }),
  dodge:   P({ lean: .7, fT: 1.3, fK: 1.9, bT: .9, bK: 2.0, fA: 1.3, fE: 1.8, bA: 1.2, bE: 1.8, head: .3 }),
  sit:     P({ lean: .25, fT: 1.5, fK: 1.25, bT: 1.35, bK: 1.4, fA: 1.5, fE: .2, bA: 1.2, bE: .6 }),
  spin:    P({ lean: 0, fT: .2, fK: .2, bT: -.2, bK: .2, fA: 1.6, fE: 0, bA: -1.6, bE: 0 }),
  win:     P({ lean: -.05, fT: .3, fK: .15, bT: -.3, bK: .1, fA: 2.9, fE: .5, bA: .35, bE: 2.0, head: -.12 }),
  lose:    P({ lean: .4, fT: 1.45, fK: 1.55, bT: .05, bK: 2.4, fA: .2, fE: .4, bA: .1, bE: .3, head: .45 }),
  pointy:  P({ lean: .05, fT: .35, fK: .2, bT: -.3, bK: .15, fA: 1.55, fE: .05, bA: .2, bE: 2.3, head: 0 }),
  armsx:   P({ lean: -.05, fT: .3, fK: .15, bT: -.3, bK: .1, fA: .9, fE: 1.9, bA: .9, bE: 1.9, head: -.08 })
};

function blendPose(cur, target, k) {
  for (const key of POSE_KEYS) cur[key] = lerp(cur[key], target[key], k);
}

// ---------------- Character visual definitions ----------------
const LOOKS = {
  martel: {
    head: 'martel', skin: '#94572f', skinD: '#6e3d1f', skinL: '#ad6d42', hair: null, hairStyle: 'bald', beard: '#191210', beardStyle: 'full',
    eye: '#2a170c', outfit: 'coat', top: '#f5f7fa', topD: '#d6dde6', under: '#ffffff', pants: '#1d2a56', pantsD: '#141e40', shoe: '#20232c',
    sleeve: 'long', glove: null, smile: 'grin',
    thigh: 64, shin: 62, torso: 100, uArm: 45, fArm: 43, shoulder: 40, waist: 32, headRx: 25.5, headRy: 29.5, neck: 12, limbW: 23
  },
  ruben: {
    head: 'ruben', skin: '#c98a5e', skinD: '#a66a43', skinL: '#dca172', hair: '#151112', hairStyle: 'slick', beard: '#1a1311', beardStyle: 'trim',
    eye: '#2d1a0e', outfit: 'scrubs', top: '#1d2c63', topD: '#142050', under: '#f4f4f4', pants: '#1b2a5e', pantsD: '#121d46', shoe: '#2a2d36',
    sleeve: 'short', glove: null, smile: 'smirk',
    thigh: 63, shin: 61, torso: 98, uArm: 44, fArm: 42, shoulder: 39, waist: 33, headRx: 24, headRy: 28.5, neck: 11, limbW: 23
  },
  cesar: {
    head: 'cesar', skin: '#d0956d', skinD: '#ac7550', skinL: '#e3aa7d', hair: '#121011', hairStyle: 'crop', beard: '#141010', beardStyle: 'dense',
    eye: '#2b190d', outfit: 'polo', top: '#2b58c6', topD: '#1f43a0', under: '#2b58c6', pants: '#252b3d', pantsD: '#1a1f2e', shoe: '#1d1f26',
    sleeve: 'short', glove: '#8a66db', smile: 'soft',
    thigh: 62, shin: 60, torso: 99, uArm: 44, fArm: 42, shoulder: 41, waist: 35, headRx: 25, headRy: 28.5, neck: 11, limbW: 24
  },
  nova: {
    skin: '#e7b48a', skinD: '#c98f66', skinL: '#f3c9a3', hair: '#6b3a1f', hairStyle: 'pony', beard: null, beardStyle: null,
    eye: '#3a2412', outfit: 'scrubs', top: '#17a5a8', topD: '#0f8285', under: null, pants: '#17a5a8', pantsD: '#0f8285', shoe: '#f2f2f2',
    sleeve: 'short', glove: null, smile: 'soft', lashes: true, lips: '#c4525d',
    thigh: 62, shin: 61, torso: 92, uArm: 42, fArm: 40, shoulder: 33, waist: 27, headRx: 23, headRy: 27.5, neck: 11, limbW: 19
  },
  admin: {
    skin: '#eec4a2', skinD: '#d39f7b', skinL: '#f8d8bd', hair: '#b4b6bf', hairStyle: 'parted', beard: null, beardStyle: null,
    eye: '#2e3a4a', outfit: 'suit', top: '#3a3f4c', topD: '#2a2e38', under: '#f3f3f3', pants: '#343944', pantsD: '#262a33', shoe: '#120f0f',
    sleeve: 'long', glove: null, smile: 'smug', glasses: true,
    thigh: 62, shin: 60, torso: 98, uArm: 44, fArm: 42, shoulder: 38, waist: 37, headRx: 24, headRy: 28, neck: 10, limbW: 22
  }
};

// ---------------- Skeleton ----------------
function skeleton(L, p) {
  const leg = (hip, a1, a2) => {
    const k = { x: hip.x + Math.sin(a1) * L.thigh, y: hip.y + Math.cos(a1) * L.thigh };
    const a = a1 - a2;
    return { hip, knee: k, foot: { x: k.x + Math.sin(a) * L.shin, y: k.y + Math.cos(a) * L.shin }, a };
  };
  // compute legs relative to hip (0,0) first for grounding
  let fl = leg({ x: 0, y: 0 }, p.fT, p.fK), bl = leg({ x: 0, y: 0 }, p.bT, p.bK);
  return { fl, bl };
}

function limb(c, pts, w, color, outline = true) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (outline) {
    c.strokeStyle = INK; c.lineWidth = w + 5;
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); c.stroke();
  }
  c.strokeStyle = color; c.lineWidth = w;
  c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); c.stroke();
}
function seg(c, a, b, w, color) { limb(c, [a, b], w, color); }
function dot(c, x, y, r, fill, stroke = INK, lw = 2.5) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
function ell(c, x, y, rx, ry, fill, stroke = INK, lw = 2.5, rot = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}

// ImmunoCare-style shield badge
function drawLogo(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, -7); c.lineTo(6, -5); c.lineTo(5.5, 2); c.quadraticCurveTo(3, 6, 0, 8); c.quadraticCurveTo(-3, 6, -5.5, 2); c.lineTo(-6, -5); c.closePath();
  c.fillStyle = '#1f5fd1'; c.fill(); c.strokeStyle = '#cfe2ff'; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#9fd0ff'; c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.fill();
  c.restore();
}

// ---------------- Head ----------------
// Illustrated heads (cut from the reference artwork, embedded by build.py as HEAD_DATA).
const HeadImages = {};
if (typeof HEAD_DATA !== 'undefined') for (const k in HEAD_DATA) { const im = new Image(); im.onload = () => { HeadImages[k] = im; }; im.src = HEAD_DATA[k]; }
function drawHeadAny(c, L, expr, t, blink) {
  const im = L.head && HeadImages[L.head];
  if (!im) return drawHead(c, L, expr, t, blink);
  // neck stub so the faded bottom of the cut-out blends into the body
  c.fillStyle = L.skinD; c.strokeStyle = INK; c.lineWidth = 2.5;
  rr(c, -10, -16, 22, 24, 6); c.fill(); c.stroke();
  const h = 86, w = h * im.width / im.height;
  c.save();
  // squash & stretch reactions
  if (expr === 'shout') c.scale(1.04, 1.04);
  if (expr === 'hurt' || expr === 'shock') { c.rotate(Math.sin(t * 0.8) * 0.06); c.scale(1.06, 0.95); }
  c.drawImage(im, 2 - w / 2, -h + 8, w, h);
  c.restore();
  // cartoon overlays
  if (expr === 'hurt' || expr === 'shock') {
    c.fillStyle = '#8fd3ff'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-18, -62); c.quadraticCurveTo(-26, -50, -18, -47); c.quadraticCurveTo(-10, -50, -18, -62); c.fill(); c.stroke();
  }
  if (expr === 'ko') {
    for (let i = 0; i < 3; i++) { const a = t * 0.15 + i * TAU / 3; star(c, 2 + Math.cos(a) * 30, -74 + Math.sin(a) * 8, 7, '#ffd23f'); }
  }
  if (expr === 'fierce' || expr === 'shout') {
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(30, -50 + i * 10); c.lineTo(40, -54 + i * 10); c.stroke(); }
  }
}
function drawHead(c, L, expr, t, blink) {
  const rx = L.headRx, ry = L.headRy, cx = 2, cy = -ry + 1;
  // neck
  c.fillStyle = L.skinD; c.strokeStyle = INK; c.lineWidth = 2.5;
  rr(c, -9, -14, 20, 22, 6); c.fill(); c.stroke();

  // ponytail behind
  if (L.hairStyle === 'pony') {
    const sw = Math.sin(t * 0.12) * 0.25;
    c.save(); c.translate(-rx + 6, cy - 12); c.rotate(0.5 + sw);
    ell(c, -6, 18, 10, 24, L.hair); c.restore();
    ell(c, -rx + 6, cy - 12, 6, 6, '#e94f7a');
  }
  // ear
  ell(c, -7, cy + 3, 6.5, 9, L.skin);
  ell(c, -7, cy + 3, 3, 5, L.skinD, null);

  // head shape
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  c.fillStyle = L.skin; c.fill();
  // back shading
  c.save(); c.clip();
  c.fillStyle = L.skinD; c.globalAlpha = 0.55;
  c.beginPath(); c.ellipse(cx - rx * 0.95, cy + 2, rx * 0.55, ry * 1.1, 0, 0, TAU); c.fill();
  c.globalAlpha = 1; c.restore();
  c.strokeStyle = INK; c.lineWidth = 2.8; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke();
  // re-draw ear on top of outline at the back
  ell(c, -7, cy + 3, 6.5, 9, L.skin); ell(c, -7, cy + 4, 2.8, 4.5, L.skinD, null);

  // nose (protrudes on the facing side)
  c.beginPath();
  c.moveTo(cx + rx - 4, cy - 6);
  c.quadraticCurveTo(cx + rx + 7, cy + 6, cx + rx + 1, cy + 9);
  c.quadraticCurveTo(cx + rx - 4, cy + 11, cx + rx - 7, cy + 8);
  c.fillStyle = L.skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
  ell(c, cx + rx - 3, cy + 8, 2.4, 1.4, L.skinD, null);

  // hair
  drawHair(c, L, cx, cy, rx, ry, t);

  // beard
  if (L.beard) drawBeard(c, L, cx, cy, rx, ry);

  // eyes
  const ey = cy - 3;
  const eyes = [{ x: cx + 5, s: 1 }, { x: cx + 17, s: 0.85 }];
  for (const e of eyes) {
    if (expr === 'ko') {
      c.strokeStyle = INK; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(e.x - 4, ey - 4); c.lineTo(e.x + 4, ey + 4); c.moveTo(e.x + 4, ey - 4); c.lineTo(e.x - 4, ey + 4); c.stroke();
    } else if (expr === 'hurt' || blink) {
      c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath();
      if (expr === 'hurt') { c.moveTo(e.x - 4, ey - 3); c.lineTo(e.x + 3, ey); c.lineTo(e.x - 4, ey + 3); }
      else { c.moveTo(e.x - 4, ey); c.quadraticCurveTo(e.x, ey + 2.5, e.x + 4, ey); }
      c.stroke();
    } else if (expr === 'happy') {
      c.strokeStyle = INK; c.lineWidth = 2.8; c.beginPath(); c.moveTo(e.x - 4, ey + 1); c.quadraticCurveTo(e.x, ey - 4, e.x + 4, ey + 1); c.stroke();
    } else {
      const big = expr === 'shock' ? 1.4 : 1;
      ell(c, e.x, ey, 4.6 * e.s * big, 3.8 * big, '#fff', INK, 1.6);
      dot(c, e.x + 1.3, ey + 0.3, 2.6 * e.s, L.eye, null);
      dot(c, e.x + 2.1, ey - 0.9, 0.9, '#fff', null);
      if (L.lashes) { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x - 5, ey - 2); c.quadraticCurveTo(e.x, ey - 6, e.x + 5, ey - 3); c.stroke(); }
    }
  }
  // brows
  const angry = expr === 'fierce' || expr === 'shout';
  const sad = expr === 'hurt' || expr === 'ko';
  c.strokeStyle = L.hair && L.hairStyle !== 'parted' ? L.hair : (L.beard || '#4a3a30');
  if (L.hairStyle === 'parted') c.strokeStyle = '#8d8f99';
  if (L.hairStyle === 'pony') c.strokeStyle = '#4a2814';
  c.lineWidth = L.beard ? 4.2 : 3; c.lineCap = 'round';
  for (const e of eyes) {
    c.beginPath();
    const inner = angry ? 3.5 : sad ? -3 : 0;
    c.moveTo(e.x - 5, ey - 8 - (sad ? 2 : 0)); c.lineTo(e.x + 5, ey - 8 + (e.x > cx + 10 ? -inner : inner) * 0.6 - (e.x < cx + 10 ? inner * 0.4 : 0));
    c.stroke();
  }

  // glasses
  if (L.glasses) {
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 2;
    for (const e of eyes) { rr(c, e.x - 6, ey - 5, 12, 10, 3); c.stroke(); }
    c.beginPath(); c.moveTo(eyes[0].x + 6, ey - 1); c.lineTo(eyes[1].x - 6, ey - 1); c.moveTo(eyes[0].x - 6, ey - 1); c.lineTo(-4, ey - 2); c.stroke();
    c.fillStyle = 'rgba(180,220,255,.25)'; for (const e of eyes) { rr(c, e.x - 6, ey - 5, 12, 10, 3); c.fill(); }
  }

  // mouth
  const mx = cx + 13, my = cy + 15;
  c.lineWidth = 2.4; c.strokeStyle = INK;
  if (expr === 'shout' || expr === 'shock') {
    ell(c, mx, my + 1, 6, expr === 'shock' ? 6 : 7.5, '#4a0d14');
    ell(c, mx, my + 5, 3.5, 2.5, '#d4526a', null);
    c.fillStyle = '#fff'; c.fillRect(mx - 4.5, my - 5.5, 9, 2.5);
  } else if (expr === 'hurt') {
    rr(c, mx - 7, my - 3, 14, 7, 3); c.fillStyle = '#fff'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(mx - 7, my + 0.5); c.lineTo(mx + 7, my + 0.5); c.stroke();
  } else if (expr === 'ko') {
    c.beginPath(); c.moveTo(mx - 6, my + 2); c.quadraticCurveTo(mx, my - 3, mx + 6, my + 2); c.stroke();
    ell(c, mx + 4, my + 5, 2.5, 3.5, '#e86f8a', null);
  } else if (L.smile === 'grin' || expr === 'happy' || expr === 'fierce') {
    c.beginPath(); c.moveTo(mx - 9, my - 3); c.quadraticCurveTo(mx, my + 10, mx + 9, my - 4); c.quadraticCurveTo(mx, my - 1, mx - 9, my - 3);
    c.fillStyle = '#fff'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(mx - 7, my - 1); c.quadraticCurveTo(mx, my + 2, mx + 7, my - 1.5); c.strokeStyle = '#c9c9c9'; c.lineWidth = 1; c.stroke();
  } else if (L.smile === 'smug') {
    c.beginPath(); c.moveTo(mx - 6, my + 1); c.quadraticCurveTo(mx + 2, my + 3, mx + 8, my - 3); c.stroke();
  } else {
    c.beginPath(); c.moveTo(mx - 7, my - 1); c.quadraticCurveTo(mx, my + 5, mx + 7, my - 2); c.stroke();
  }
  if (L.lips && expr !== 'shout' && expr !== 'shock') { c.strokeStyle = L.lips; c.lineWidth = 3; c.beginPath(); c.moveTo(mx - 5, my); c.quadraticCurveTo(mx, my + 3.5, mx + 5, my - 0.5); c.stroke(); }
  // cheek blush / sweat
  if (expr === 'hurt' || expr === 'shock') {
    c.fillStyle = '#8fd3ff'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx - 12, cy - 22); c.quadraticCurveTo(cx - 18, cy - 12, cx - 12, cy - 10); c.quadraticCurveTo(cx - 6, cy - 12, cx - 12, cy - 22); c.fill(); c.stroke();
  }
}

function drawHair(c, L, cx, cy, rx, ry, t) {
  const top = cy - ry;
  c.lineWidth = 2.6; c.strokeStyle = INK;
  if (L.hairStyle === 'bald') {
    c.fillStyle = 'rgba(255,255,255,.28)';
    c.beginPath(); c.ellipse(cx + 3, top + 8, 10, 4, -0.15, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(cx + 11, top + 13, 4, 2, -0.3, 0, TAU); c.fill();
    return;
  }
  if (L.hairStyle === 'slick') {
    // faded sides
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    const g = c.createLinearGradient(0, top, 0, cy + 4);
    g.addColorStop(0, 'rgba(20,16,18,.85)'); g.addColorStop(1, 'rgba(20,16,18,0)');
    c.fillStyle = g; c.fillRect(cx - rx, top, rx * 1.2, ry + 6);
    c.restore();
    // voluminous slicked-back top
    c.beginPath();
    c.moveTo(cx - rx + 1, cy - 6);
    c.quadraticCurveTo(cx - rx - 2, top - 2, cx - 4, top - 9);
    c.quadraticCurveTo(cx + 12, top - 15, cx + rx - 1, top - 4);
    c.quadraticCurveTo(cx + rx + 3, top + 6, cx + rx - 5, top + 12);
    c.quadraticCurveTo(cx + 8, top + 6, cx - 6, top + 12);
    c.quadraticCurveTo(cx - 14, top + 14, cx - rx + 4, cy - 2);
    c.closePath(); c.fillStyle = L.hair; c.fill(); c.stroke();
    // shine streaks
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cx + 14 - i * 9, top - 6 + i * 1.5); c.quadraticCurveTo(cx - i * 9, top - 6, cx - 14 - i * 6, top + 3 + i * 2); c.stroke(); }
    return;
  }
  if (L.hairStyle === 'crop') {
    // high fade sides
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    const g = c.createLinearGradient(0, top + 8, 0, cy + 2);
    g.addColorStop(0, 'rgba(18,16,17,.9)'); g.addColorStop(1, 'rgba(18,16,17,0)');
    c.fillStyle = g; c.fillRect(cx - rx, top, rx * 1.25, ry + 4);
    c.restore();
    // textured crop top with blunt fringe
    const fy = cy - 13; // fringe line
    c.beginPath();
    c.moveTo(cx - rx + 2, cy - 4);
    c.quadraticCurveTo(cx - rx - 2, top + 2, cx - 10, top - 3);
    // spiky texture along top
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const xx = lerp(cx - 10, cx + rx - 1, i / n);
      const yy = top - 4 + Math.pow(i / n, 2) * 10 + (i % 2 ? -5 : 0);
      c.lineTo(xx, yy);
    }
    c.lineTo(cx + rx + 1, fy - 2);
    c.lineTo(cx + rx - 2, fy);     // blunt straight fringe
    c.lineTo(cx + 2, fy + 1);
    c.lineTo(cx - 8, fy - 1);
    c.quadraticCurveTo(cx - 16, fy, cx - rx + 5, cy - 2);
    c.closePath(); c.fillStyle = L.hair; c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) { const xx = cx - 6 + i * 5; c.beginPath(); c.moveTo(xx, top + 2 + i); c.lineTo(xx + 3, fy - 4); c.stroke(); }
    return;
  }
  if (L.hairStyle === 'pony') {
    c.beginPath();
    c.moveTo(cx - rx + 1, cy + 4);
    c.quadraticCurveTo(cx - rx - 3, top - 2, cx + 2, top - 3);
    c.quadraticCurveTo(cx + rx + 2, top, cx + rx, cy - 10);
    c.quadraticCurveTo(cx + 12, top + 6, cx - 2, top + 13);
    c.quadraticCurveTo(cx - 12, top + 18, cx - 13, cy + 2);
    c.closePath(); c.fillStyle = L.hair; c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx + 12, top + 1); c.quadraticCurveTo(cx - 5, top + 2, cx - 15, top + 14); c.stroke();
    return;
  }
  if (L.hairStyle === 'parted') {
    c.beginPath();
    c.moveTo(cx - rx + 1, cy + 2);
    c.quadraticCurveTo(cx - rx - 3, top - 1, cx + 2, top - 4);
    c.quadraticCurveTo(cx + rx + 2, top - 1, cx + rx - 1, cy - 12);
    c.quadraticCurveTo(cx + 14, top + 4, cx + 4, top + 7);
    c.lineTo(cx - 4, top + 5);
    c.quadraticCurveTo(cx - 12, top + 14, cx - 13, cy + 2);
    c.closePath(); c.fillStyle = L.hair; c.fill(); c.stroke();
    c.strokeStyle = '#8a8c96'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 4, top + 5); c.quadraticCurveTo(cx - 8, top - 1, cx - 15, top + 2); c.stroke();
  }
}

function drawBeard(c, L, cx, cy, rx, ry) {
  const dense = L.beardStyle === 'dense', trim = L.beardStyle === 'trim';
  const chinY = cy + ry + (dense ? 5 : trim ? 1 : 2);
  c.beginPath();
  // sideburn from in front of ear down the jaw to the chin and up to the mouth area
  c.moveTo(cx - 6, cy - (dense ? 6 : 2));
  c.lineTo(cx - 1, cy - (dense ? 6 : 2));
  c.quadraticCurveTo(cx + 2, cy + 6, cx + 9, cy + 7);         // cheek line
  c.quadraticCurveTo(cx + 15, cy + 5, cx + rx - 1, cy + 9);   // over upper lip (mustache top)
  c.quadraticCurveTo(cx + rx + 3, cy + 18, cx + rx - 3, cy + 23);
  c.quadraticCurveTo(cx + 14, chinY + 2, cx + 6, chinY);
  c.quadraticCurveTo(cx - 6, chinY - 3, cx - 10, cy + 8);
  c.closePath();
  c.fillStyle = L.beard; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  // fuzzy texture
  c.fillStyle = 'rgba(255,255,255,.08)';
  for (let i = 0; i < 14; i++) { const a = i * 2.39; c.fillRect(cx + 4 + Math.cos(a) * 9, cy + 16 + Math.sin(a) * 6, 1.5, 1.5); }
  // lips area cut-out (skin) so the mouth reads
  c.beginPath(); c.ellipse(cx + 13, cy + 15, 8.5, 4.5, -0.08, 0, TAU); c.fillStyle = L.skinD; c.fill();
}

// ---------------- Torso / outfits ----------------
function drawTorso(c, L, t) {
  const T = L.torso, sh = L.shoulder, wa = L.waist;
  // body shape in torso space: hip at (0,0), neck at (0,-T)
  const body = () => {
    c.beginPath();
    c.moveTo(-wa, 0);
    c.quadraticCurveTo(-wa - 6, -T * 0.5, -sh, -T + 14);
    c.quadraticCurveTo(-sh + 4, -T - 2, -8, -T - 2);
    c.lineTo(10, -T - 2);
    c.quadraticCurveTo(sh - 2, -T - 2, sh + 2, -T + 14);
    c.quadraticCurveTo(wa + 8 + (L.outfit === 'suit' ? 8 : 0), -T * 0.42, wa, 0);
    c.closePath();
  };
  body(); c.fillStyle = L.top; c.fill();
  c.save(); body(); c.clip();
  // shading on the back half
  c.fillStyle = L.topD; c.globalAlpha = 0.7; c.fillRect(-sh - 10, -T - 5, sh * 0.7, T + 10); c.globalAlpha = 1;

  if (L.outfit === 'coat') {
    // white V-neck shirt under coat
    c.fillStyle = L.under; c.beginPath(); c.moveTo(-10, -T - 2); c.lineTo(18, -T - 2); c.lineTo(12, -T * 0.25); c.lineTo(-4, -T * 0.25); c.closePath(); c.fill();
    c.strokeStyle = '#c9d0da'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-6, -T - 2); c.lineTo(4, -T + 18); c.lineTo(14, -T - 2); c.stroke();
    // lapels
    c.fillStyle = '#e6ebf1'; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.moveTo(14, -T - 1); c.lineTo(26, -T + 30); c.lineTo(15, -T + 34); c.lineTo(14, -T * 0.25); c.lineTo(10, -T * 0.25); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-10, -T - 1); c.lineTo(-18, -T + 28); c.lineTo(-8, -T + 32); c.lineTo(-4, -T * 0.25); c.closePath(); c.fill(); c.stroke();
    // pocket + logo
    c.strokeStyle = '#9aa6b5'; c.lineWidth = 1.5; rr(c, 18, -T + 44, 16, 14, 2); c.stroke();
    drawLogo(c, 26, -T + 36, 1.1);
    c.fillStyle = '#1d2a56'; c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.fillText('ImmunoCare', 26, -T + 52);
    // stethoscope
    c.strokeStyle = '#2b2f36'; c.lineWidth = 3.5; c.beginPath();
    c.moveTo(-14, -T + 2); c.quadraticCurveTo(-22, -T + 34, -6, -T + 52); c.quadraticCurveTo(4, -T + 60, 8, -T + 46);
    c.moveTo(18, -T + 2); c.quadraticCurveTo(26, -T + 26, 22, -T + 40);
    c.stroke();
    dot(c, 22, -T + 44, 5, '#cfd6de', INK, 2); dot(c, 22, -T + 44, 2.2, '#8f9aa6', null);
  } else if (L.outfit === 'scrubs') {
    if (L.under) {
      c.fillStyle = L.under; c.beginPath(); c.moveTo(-12, -T - 2); c.lineTo(20, -T - 2); c.lineTo(5, -T + 22); c.closePath(); c.fill();
    } else {
      c.fillStyle = L.skin; c.beginPath(); c.moveTo(-8, -T - 2); c.lineTo(16, -T - 2); c.lineTo(5, -T + 18); c.closePath(); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -T - 2); c.lineTo(5, -T + 22); c.lineTo(20, -T - 2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.6; rr(c, 14, -T + 36, 18, 16, 2); c.stroke();
    if (L === LOOKS.ruben) { drawLogo(c, 22, -T + 28, 1.15); c.fillStyle = '#fff'; c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.fillText('ImmunoCare', 22, -T + 40); }
    else { // badge reel
      c.strokeStyle = '#ffd23f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(16, -T + 30); c.lineTo(16, -T + 40); c.stroke();
      rr(c, 10, -T + 40, 13, 17, 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#e94f7a'; c.fillRect(11, -T + 41, 11, 4);
      c.fillStyle = '#e94f7a'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('RN', 16.5, -T + 54);
    }
  } else if (L.outfit === 'polo') {
    // collar + placket
    c.fillStyle = L.top; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-12, -T - 3); c.lineTo(-4, -T + 12); c.lineTo(4, -T + 1); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(20, -T - 3); c.lineTo(14, -T + 12); c.lineTo(5, -T + 1); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; rr(c, 1, -T + 2, 8, 30, 2); c.stroke();
    dot(c, 5, -T + 12, 1.6, '#e8e8e8', null); dot(c, 5, -T + 22, 1.6, '#e8e8e8', null);
    // phlebotomy badge
    rr(c, 16, -T + 34, 16, 20, 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#c4161c'; c.beginPath(); c.moveTo(24, -T + 37); c.quadraticCurveTo(29, -T + 44, 24, -T + 47); c.quadraticCurveTo(19, -T + 44, 24, -T + 37); c.fill();
    c.fillStyle = '#1e2d66'; c.font = 'bold 4.5px sans-serif'; c.textAlign = 'center'; c.fillText('LAB', 24, -T + 52);
    // tourniquet draped over shoulder
    c.strokeStyle = '#3b8be8'; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, -T + 2); c.quadraticCurveTo(-26, -T + 30, -22, -T + 50); c.stroke();
    c.strokeStyle = '#3b8be8'; c.beginPath(); c.moveTo(-12, -T); c.quadraticCurveTo(-30, -T - 2, -24, -T + 8); c.stroke();
  } else if (L.outfit === 'suit') {
    c.fillStyle = L.under; c.beginPath(); c.moveTo(-10, -T - 2); c.lineTo(18, -T - 2); c.lineTo(8, -T * 0.35); c.lineTo(2, -T * 0.35); c.closePath(); c.fill();
    // tie
    c.fillStyle = '#c0262d'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(2, -T); c.lineTo(8, -T); c.lineTo(7, -T + 6); c.lineTo(10, -T * 0.42); c.lineTo(5, -T * 0.35); c.lineTo(0, -T * 0.42); c.lineTo(3, -T + 6); c.closePath(); c.fill(); c.stroke();
    // lapels
    c.fillStyle = L.topD; c.lineWidth = 2;
    c.beginPath(); c.moveTo(16, -T - 1); c.lineTo(28, -T + 24); c.lineTo(18, -T + 28); c.lineTo(10, -T * 0.35); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-10, -T - 1); c.lineTo(-20, -T + 24); c.lineTo(-10, -T + 28); c.lineTo(0, -T * 0.35); c.closePath(); c.fill(); c.stroke();
    // pocket square + lanyard
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(22, -T + 40); c.lineTo(32, -T + 40); c.lineTo(27, -T + 34); c.closePath(); c.fill();
    dot(c, 4, -T * 0.25, 1.8, '#111', null); dot(c, 4, -T * 0.12, 1.8, '#111', null);
  }
  c.restore();
  body(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
  // belt line
  if (L.outfit === 'scrubs' || L.outfit === 'polo') { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-wa + 2, -6); c.lineTo(wa - 1, -6); c.stroke(); }
}

// Coat tails / jacket flaps drawn over the legs
function drawTails(c, L, lean, fT, bT) {
  if (L.outfit !== 'coat' && L.outfit !== 'suit') return;
  const len = L.outfit === 'coat' ? 58 : 22;
  const swing = clamp((fT - bT) * 0.12, -0.3, 0.3);
  c.save(); c.rotate(-lean * 0.5);
  c.beginPath();
  c.moveTo(-L.waist - 1, -4);
  c.lineTo(-L.waist - 8 + swing * 30, len);
  c.lineTo(-2, len + 4);
  c.lineTo(4, -2);
  c.closePath(); c.fillStyle = L.topD; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
  c.beginPath();
  c.moveTo(2, -4);
  c.lineTo(6 + swing * 40, len + 2);
  c.lineTo(L.waist + 8 + swing * 40, len - 2);
  c.lineTo(L.waist + 1, -4);
  c.closePath(); c.fillStyle = L.top; c.fill(); c.stroke();
  c.restore();
}

// ---------------- Full fighter ----------------
// opts: { pose, facing, expr, t, blink, prop, alpha, tint, scale }
function drawCharacter(c, L, x, y, o) {
  if (o.sprite !== false && hasSprites(L.id)) return drawSprite(c, L.id, o.spriteKey || 'idle', x, y, o);
  const p = o.pose;
  c.save();
  c.translate(x, y);
  const s = o.scale || 1;
  c.scale((o.facing || 1) * s, s);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (p.rot) { c.translate(0, p.dy); c.rotate(p.rot); }

  const { fl, bl } = skeleton(L, p);
  // ground the lowest point (feet or knees)
  let low = Math.max(fl.foot.y, bl.foot.y, fl.knee.y - 4, bl.knee.y - 4);
  if (o.air) low = L.thigh + L.shin - 12;
  const hip = { x: p.hx, y: -low - 6 };
  const off = (pt) => ({ x: pt.x + hip.x, y: pt.y + hip.y });
  const T = L.torso;
  const neck = { x: hip.x + Math.sin(p.lean) * T, y: hip.y - Math.cos(p.lean) * T };
  const shoulderOf = (side) => {
    const sx = side > 0 ? 8 : -12;
    return { x: neck.x + Math.cos(p.lean) * sx + Math.sin(p.lean) * 12, y: neck.y + 12 + Math.sin(p.lean) * -sx };
  };
  const arm = (sh, a1, a2) => {
    const e = { x: sh.x + Math.sin(a1) * L.uArm, y: sh.y + Math.cos(a1) * L.uArm };
    const a = a1 + a2;
    return { sh, el: e, hand: { x: e.x + Math.sin(a) * L.fArm, y: e.y + Math.cos(a) * L.fArm }, a };
  };
  const fa = arm(shoulderOf(1), p.fA, p.fE), ba = arm(shoulderOf(-1), p.bA, p.bE);
  const LW = L.limbW;
  const sleeveCol = (front) => front ? L.top : L.topD;
  const drawArm = (A, front) => {
    const handCol = L.glove || L.skin;
    if (L.sleeve === 'long') {
      limb(c, [A.sh, A.el, A.hand], LW - 3, sleeveCol(front));
      if (L.outfit === 'suit') { const cuff = { x: lerp(A.el.x, A.hand.x, .82), y: lerp(A.el.y, A.hand.y, .82) }; seg(c, cuff, A.hand, LW - 8, L.under); }
    } else {
      limb(c, [A.sh, A.el, A.hand], LW - 7, front ? L.skin : L.skinD);
      const mid = { x: lerp(A.sh.x, A.el.x, .55), y: lerp(A.sh.y, A.el.y, .55) };
      limb(c, [A.sh, mid], LW - 1, sleeveCol(front));
    }
    // fist
    dot(c, A.hand.x, A.hand.y, 9.5, front ? handCol : shade(handCol), INK, 2.5);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(A.hand.x - 3, A.hand.y - 6); c.lineTo(A.hand.x - 3, A.hand.y + 4); c.stroke();
  };
  const drawLeg = (lg, front) => {
    const h = off(lg.hip), k = off(lg.knee), f = off(lg.foot);
    limb(c, [h, k, f], LW + 2, front ? L.pants : L.pantsD);
    // shoe
    c.save(); c.translate(f.x, f.y); c.rotate(-(lg.a) * 0.6);
    ell(c, 9, 2, 17, 7.5, front ? L.shoe : shade(L.shoe));
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-2, 4, 22, 2);
    c.restore();
  };

  drawArm(ba, false);
  drawLeg(bl, false);
  drawLeg(fl, true);
  // torso
  c.save(); c.translate(hip.x, hip.y); c.rotate(p.lean);
  drawTorso(c, L, o.t || 0);
  c.restore();
  c.save(); c.translate(hip.x, hip.y); drawTails(c, L, p.lean, p.fT, p.bT); c.restore();
  // head
  c.save(); c.translate(neck.x, neck.y + 4); c.rotate(p.lean * 0.6 + p.head); c.scale(1.13, 1.13);
  drawHeadAny(c, L, o.expr || 'normal', o.t || 0, o.blink);
  c.restore();
  drawArm(fa, true);
  if (o.prop) drawProp(c, o.prop, fa.hand, fa.a, o.t || 0);
  c.restore();
  return { hand: fa.hand, neck, hip };
}

function shade(hex, k = 0.78) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor(((n >> 16) & 255) * k), g = Math.floor(((n >> 8) & 255) * k), b = Math.floor((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

// Props held in the front hand
function drawProp(c, prop, h, a, t) {
  c.save(); c.translate(h.x, h.y);
  if (prop === 'tablet') {
    c.rotate(-0.2);
    c.shadowColor = '#5ff'; c.shadowBlur = 30;
    rr(c, -16, -46, 34, 46, 5); c.fillStyle = '#1b2233'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    rr(c, -12, -42, 26, 36, 3); c.fillStyle = '#7ff5ff'; c.fill();
    c.shadowBlur = 0; c.fillStyle = '#c4161c'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('DENIED', 1, -22);
  } else if (prop === 'ivpole') {
    c.rotate(t * 0.6);
    c.strokeStyle = '#b8c2cc'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -110); c.lineTo(0, 110); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -105); c.lineTo(16, -105); c.stroke();
    rr(c, -10, -100, 20, 28, 6); c.fillStyle = 'rgba(170,230,255,.85)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('NS', 0, -84);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 110); c.lineTo(22 * s, 120); c.strokeStyle = '#8c96a0'; c.lineWidth = 4; c.stroke(); dot(c, 22 * s, 122, 4, '#333', null); }
  } else if (prop === 'clipboard') {
    c.rotate(-0.3);
    rr(c, -14, -40, 30, 40, 3); c.fillStyle = '#b07a3e'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(-10, -34, 22, 30); c.fillStyle = '#999'; c.fillRect(-4, -43, 10, 6);
    c.fillStyle = '#2a7'; for (let i = 0; i < 4; i++) c.fillRect(-7, -30 + i * 7, 14, 2);
  } else if (prop === 'needle') {
    c.rotate(a - Math.PI / 2);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(0, 0, 10, 5, 0, 0, TAU); c.fill();
    c.strokeStyle = '#ccc'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke();
  }
  c.restore();
}

// ---------------- Illustrated art: showcase pictures & pose sprites ----------------
for (const k in LOOKS) LOOKS[k].id = k;
function loadImg(src, cb) { const im = new Image(); im.onload = () => cb(im); im.src = src; }
const ShowcaseImages = {};
if (typeof SHOWCASE_DATA !== 'undefined') for (const k in SHOWCASE_DATA) loadImg(SHOWCASE_DATA[k], im => { ShowcaseImages[k] = im; });
const hasShowcase = id => !!ShowcaseImages[id];
// Draw a showcase illustration "cover"-fitted into a rounded frame. fx/fy = focus point (0..1) kept in view.
function drawShowcase(c, id, x, y, w, h, o = {}) {
  const im = ShowcaseImages[id]; if (!im) return false;
  const fx = o.fx ?? 0.5, fy = o.fy ?? 0.3, r = o.radius ?? 14, zoom = o.zoom || 1;
  const s = Math.max(w / im.width, h / im.height) * zoom;
  const dw = im.width * s, dh = im.height * s;
  const dx = clamp(x + w / 2 - fx * dw, x + w - dw, x), dy = clamp(y + h / 2 - fy * dh, y + h - dh, y);
  c.save();
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 30; rr(c, x, y, w, h, r); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0; }
  rr(c, x, y, w, h, r); c.clip();
  if (o.flip) { c.translate(x * 2 + w, 0); c.scale(-1, 1); }
  c.drawImage(im, dx, dy, dw, dh);
  c.restore();
  if (o.border !== false) { c.save(); rr(c, x, y, w, h, r); c.strokeStyle = o.border || '#fff'; c.lineWidth = 4; c.stroke(); c.restore(); }
  return true;
}

// Pose sprites: SPRITE_DATA[id] = { scale, poses: { idle: {src, ax, ay}, ... } } (tools/make_sprites.py).
// Images face RIGHT; (ax, ay) is the point between the feet, in image pixels.
const SPRITE_POSES = ['idle', 'walk1', 'walk2', 'jump', 'lp', 'hp', 'lk', 'hk', 'block', 'hit', 'down', 'special', 'ultimate', 'win', 'lose'];
const SPRITE_FALLBACK = { walk1: 'idle', walk2: 'walk1', jump: 'idle', lp: 'hp', hp: 'special', lk: 'hk', hk: 'lp', block: 'idle', hit: 'idle', down: 'hit', special: 'hp', ultimate: 'special', win: 'idle', lose: 'hit' };
const SpriteSets = {};
if (typeof SPRITE_DATA !== 'undefined') for (const id in SPRITE_DATA) {
  const set = { scale: SPRITE_DATA[id].scale, poses: {} };
  for (const k in SPRITE_DATA[id].poses) { const d = SPRITE_DATA[id].poses[k]; loadImg(d.src, im => { set.poses[k] = { im, ax: d.ax, ay: d.ay }; }); }
  SpriteSets[id] = set;
}
const hasSprites = id => !!(SpriteSets[id] && SpriteSets[id].poses.idle);
function spritePose(set, key) {
  for (let i = 0; i < 8 && key; i++) { if (set.poses[key]) return set.poses[key]; key = SPRITE_FALLBACK[key]; }
  return set.poses.idle;
}
function drawSprite(c, id, key, x, y, o) {
  const set = SpriteSets[id], sp = spritePose(set, key), k = set.scale * (o.scale || 1);
  const t = o.t || 0;
  c.save(); c.translate(x, y);
  c.scale(o.facing || 1, 1);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  // keep single drawings alive: breathing on idle, squash on hits
  let sx = 1, sy = 1;
  if (key === 'idle' || key === 'win') sy = 1 + Math.sin(t * 0.09) * 0.012;
  if (key === 'hit') { sx = 1.04; sy = 0.97; c.rotate(-0.06); }
  if (o.expr === 'shock') c.translate(Math.sin(t * 1.3) * 3, 0);
  c.scale(sx, sy);
  c.drawImage(sp.im, -sp.ax * k, -sp.ay * k, sp.im.width * k, sp.im.height * k);
  c.restore();
  if (o.expr === 'ko' || o.expr === 'hurt') {
    const hy = y - sp.ay * k * 0.92;
    if (o.expr === 'ko') for (let i = 0; i < 3; i++) { const a = t * 0.15 + i * TAU / 3; star(c, x + Math.cos(a) * 34, hy + Math.sin(a) * 8, 8, '#ffd23f'); }
  }
  return { hand: { x: 60, y: -200 }, neck: { x: 0, y: -240 }, hip: { x: 0, y: -130 } };
}

// Bust portrait (select screen / HUD)
function drawBust(c, L, x, y, size, expr = 'normal', t = 0, facing = 1) {
  c.save(); c.translate(x, y); c.scale(size * facing, size);
  if (L.head && HeadImages[L.head]) c.translate(0, 20);
  c.save(); c.translate(0, L.torso + 22); drawTorso(c, L, t); c.restore();
  c.save(); c.translate(0, 26); drawHeadAny(c, L, expr, t, false); c.restore();
  c.restore();
}

// Optional: externally supplied portrait art (assets/portraits/<id>.png). Falls back to procedural busts.
const PortraitImages = {};
function loadPortraitImages(ids) {
  // Opt-in (add ?portraits=1 to the URL) so the self-contained build makes no failing requests.
  if (!/[?&]portraits=1/.test(location.search)) return;
  for (const id of ids) {
    const img = new Image();
    img.onload = () => { PortraitImages[id] = img; };
    img.onerror = () => {};
    img.src = `assets/portraits/${id}.png`;
  }
}
