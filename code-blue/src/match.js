'use strict';
// ============================================================
// Match: rounds, combat resolution, camera, cinematics, HUD
// ============================================================
const ROUND_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
const HIT_WORDS = ['POW!', 'BAM!', 'WHAM!', 'BONK!', 'THWACK!', 'SMACK!', 'KAPOW!'];

class Match {
  // opts: { p1, p2 (defs), arena (index), mode: 'arcade'|'cpu'|'versus'|'training', p2cpu: bool, onEnd(result) }
  constructor(opts) {
    this.o = opts; this.mode = opts.mode;
    this.arena = ARENAS[opts.arena];
    this.fighters = [new Fighter(opts.p1, 0, this), new Fighter(opts.p2, 1, this)];
    const diff = Settings.difficulty;
    const single = opts.mode !== 'versus';
    this.ctrl = [
      { human: true, layouts: single ? [KEYMAP_P1, KEYMAP_P2] : [KEYMAP_P1], pad: 0, touch: true },
      opts.mode === 'versus' ? { human: true, layouts: [KEYMAP_P2], pad: 1, touch: false } : { human: false, ai: new AI(this.fighters[1], diff, opts.mode === 'training' ? 'stand' : 'cpu') }
    ];
    this.fighters[0].ctrlHuman = true; this.fighters[1].ctrlHuman = this.ctrl[1].human;
    if (!this.ctrl[1].human) this.fighters[1].dmgMult = AI_LEVELS[diff].dmg;
    this.round = 1; this.wins = [0, 0]; this.frame = 0; this.matchFrames = 0;
    this.cam = { x: STAGE_W / 2, zoom: 1, shake: 0 }; this.hitstop = 0; this.slow = 0;
    this.popups = []; this.timers = []; this.lastAnnounce = -999; this.cine = null;
    this.paused = false; this.pauseSel = 0; this.showMoves = false;
    this.training = opts.mode === 'training';
    this.startRound();
    AudioSys.playMusic(this.arena.music);
  }
  other(f) { return f === this.fighters[0] ? this.fighters[1] : this.fighters[0]; }
  later(d, fn) { this.timers.push({ t: d, fn }); }
  addShake(n) { this.cam.shake = Math.max(this.cam.shake, n); }
  floatText(x, y, text, color = '#fff', size = 34) { this.fx.push(new FloatText(x, y, text, color, size)); }
  poof(x, y) { for (let i = 0; i < 14; i++) this.fx.push(new Particle(x + rand(-30, 30), y + rand(-80, 80), { kind: 'smoke', color: '#e8f6ff', vx: rand(-2, 2), vy: rand(-2, 1), g: 0, life: 26, size: rand(10, 18) })); sparks(this, x, y, '#7fd6ff', 10); }
  dust(x) { for (let i = 0; i < 10; i++) this.fx.push(new Particle(x + rand(-50, 50), FLOOR - 5, { kind: 'smoke', color: '#d8d0c0', vx: rand(-3, 3), vy: rand(-2, 0), g: 0, life: 24, size: rand(8, 14) })); }
  announce(text, opts = {}) {
    if (!opts.force && this.frame - this.lastAnnounce < 70) { if (Announcer.current && Announcer.current.t < 40) return; }
    this.lastAnnounce = this.frame; Announcer.say(text, opts);
  }
  specialFlash(f, name) {
    this.camPunch = { f, t: 16 };
    this.fx.push(new FloatText(f.x, f.y - 320, name, f.def.color, 30, 55));
    this.banner = { side: f.side, text: name, t: 0 };
    AudioSys.sfx('magic');
  }
  cdMult(f) { return this.training ? 0.35 : 1; }

  startRound() {
    const [a, b] = this.fighters;
    a.resetRound(STAGE_W / 2 - 250); b.resetRound(STAGE_W / 2 + 250);
    this.fx = []; this.timers = []; this.cine = null; this.popups = [];
    this.phase = 'intro'; this.pt = 0; this.timer = (Settings.roundTime || 9999) * 60; this.winner = null; this.lowWarned = [false, false];
    this.popT = randi(600, 1100); this.cam.x = STAGE_W / 2;
    if (this.training) { this.phase = 'fight'; a.set('idle'); b.set('idle'); Announcer.say('TRAINING MODE', { size: 70, voice: false }); }
  }

  readCtl(i) {
    const c = this.ctrl[i];
    if (this.phase !== 'fight' || this.paused) return { held: {}, pressed: {} };
    if (c.human) return Input.read(c.layouts, c.pad, c.touch && Touch.enabled());
    return c.ai.think(this);
  }

  update() {
    // pause handling
    if (Input.menu('pause') && this.phase !== 'end') { this.paused = !this.paused; this.pauseSel = 0; this.showMoves = false; AudioSys.sfx(this.paused ? 'back' : 'confirm'); return; }
    if (this.paused) return this.updatePause();
    this.frame++;
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.slow > 0) { this.slow--; if (this.slow % 3 !== 0) return; }

    for (let i = this.timers.length - 1; i >= 0; i--) if (--this.timers[i].t <= 0) { const tm = this.timers.splice(i, 1)[0]; tm.fn(); }

    const [a, b] = this.fighters;
    if (this.cine) this.updateCine();
    else {
      const c0 = this.readCtl(0), c1 = this.readCtl(1);
      a.update(c0); b.update(c1);
      this.separate();
    }
    this.fx = this.fx.filter(e => e.update());
    // projectile clashes
    const ps = this.fx.filter(e => e.isProjectile && !e.dead && e.clash);
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      if (ps[i].owner !== ps[j].owner && overlap(ps[i].box(), ps[j].box())) { ps[i].dead = ps[j].dead = true; sparks(this, (ps[i].x + ps[j].x) / 2, ps[i].y, '#fff', 18); this.fx.push(new ComicBurst((ps[i].x + ps[j].x) / 2, ps[i].y, 'CLASH!', '#7fd6ff', 0.9)); AudioSys.sfx('hitH'); }
    }
    this.popups = this.popups.filter(p => p.update());
    if (this.banner && ++this.banner.t > 70) this.banner = null;
    this.updatePhase();
    this.updateCamera();
    for (const f of this.fighters) f.dispHp = f.dispHp > f.hp ? Math.max(f.hp, f.dispHp - (this.frame % 1 === 0 ? 6 : 0)) : f.hp;
    // arena ambience
    if (this.frame % 420 === 200 && this.phase === 'fight') AudioSys.sfx(pick(this.arena.ambient));
  }

  separate() {
    const [a, b] = this.fighters;
    const dx = b.x - a.x, minD = 64;
    const vOverlap = Math.abs(a.y - b.y) < 200;
    if (Math.abs(dx) < minD && vOverlap && a.state !== 'down' && b.state !== 'down') {
      const push = (minD - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
      a.x -= push; b.x += push;
      if (a.x < 50) { b.x += 50 - a.x; a.x = 50; } if (b.x > STAGE_W - 50) { a.x -= b.x - (STAGE_W - 50); b.x = STAGE_W - 50; }
      if (b.x < 50) { a.x += 50 - b.x; b.x = 50; } if (a.x > STAGE_W - 50) { b.x -= a.x - (STAGE_W - 50); a.x = STAGE_W - 50; }
    }
    const maxD = 1120;
    if (Math.abs(b.x - a.x) > maxD) { const mid = (a.x + b.x) / 2, s = Math.sign(b.x - a.x); a.x = mid - s * maxD / 2; b.x = mid + s * maxD / 2; }
  }

  updateCamera() {
    const [a, b] = this.fighters; const cam = this.cam;
    let tx = (a.x + b.x) / 2, tz = clamp(1.12 - Math.abs(a.x - b.x) / 2400, 1.0, 1.08);
    if (this.cine) {
      const k = this.cine;
      if (k.t < 45) { tx = k.caster.x; tz = 1.35; } else { tx = (k.target.x * 2 + k.caster.x) / 3; tz = 1.06; }
    } else if (this.camPunch && this.camPunch.t > 0) { this.camPunch.t--; tx = lerp(tx, this.camPunch.f.x, 0.4); tz += 0.1; }
    if (this.phase === 'ko' && this.pt < 70 && this.loser) { tx = this.loser.x; tz = 1.3; }
    // headroom: keep the tallest point of both fighters (jumps, raised arms) below the health bars
    const top = Math.min(...this.fighters.map(f => f.y - 330 * f.size - 25));
    tz = Math.max(0.8, Math.min(tz, (640 - 125) / Math.max(1, FLOOR - top)));
    cam.zoom = lerp(cam.zoom, tz, tz < cam.zoom ? 0.3 : 0.08);
    cam.x = lerp(cam.x, tx, 0.12);
    const half = W / 2 / cam.zoom;
    cam.x = clamp(cam.x, half, STAGE_W - half);
    cam.shake *= 0.86; if (cam.shake < 0.3) cam.shake = 0;
  }

  updatePhase() {
    this.pt++;
    const [a, b] = this.fighters;
    if (this.phase === 'intro') {
      if (this.pt === 20) {
        const last = this.wins[0] === 1 && this.wins[1] === 1;
        this.announce(last ? 'FINAL ROUND — OVERTIME!' : `ROUND ${ROUND_NAMES[this.round - 1] || this.round}`, { force: true, size: 90, sub: last ? null : 'BEGIN YOUR SHIFT!', dur: 100, speak: last ? 'Final round. Overtime!' : `Round ${['one', 'two', 'three', 'four', 'five'][this.round - 1]}. Begin your shift!` });
      }
      if (this.pt === 135) { this.announce('FIGHT!', { force: true, size: 140, color: '#ff3b3b', dur: 50 }); AudioSys.sfx('hitH'); }
      if (this.pt >= 150) { this.phase = 'fight'; this.pt = 0; a.set('idle'); b.set('idle'); }
      return;
    }
    if (this.phase === 'fight') {
      this.matchFrames++;
      if (this.training) {
        a.energy = 100;
        for (const f of this.fighters) { if (f.hp < f.maxHp && f.state === 'idle' && this.other(f).combo === 0) f.hp = Math.min(f.maxHp, f.hp + 8); if (f.hp <= 1) f.hp = f.maxHp; }
        return;
      }
      if (!this.cine && Settings.roundTime) { this.timer--; if (this.timer % 60 === 0 && this.timer <= 600 && this.timer > 0) AudioSys.sfx('tick'); }
      // low health callouts
      this.fighters.forEach((f, i) => { if (!this.lowWarned[i] && f.hp > 0 && f.hp < f.maxHp * 0.22) { this.lowWarned[i] = true; this.announce('FINISH THE CHART!', { color: '#ff3b3b', size: 80 }); } });
      // comedy pop-ups
      if (Settings.popups && --this.popT <= 0) { this.popT = randi(780, 1400); this.spawnPopup(); }
      if (!this.cine) for (const f of this.fighters) if (f.hp <= 0 && !f.ko) { this.ko(this.other(f), f, false); break; }
      if (this.timer <= 0 && !this.cine && this.phase === 'fight') this.timeOut();
      return;
    }
    if (this.phase === 'ko') {
      if (this.pt === 120) {
        const w = this.winner;
        if (w) { w.set('win'); if (this.loser) this.loser.set('lose'); }
        else { a.set('lose'); b.set('lose'); }
      }
      if (this.pt === 150 && this.winner) {
        if (this.winner.hp >= this.winner.maxHp) this.announce('PERFECT SHIFT!', { force: true, size: 100, color: '#7cf28b' });
        else this.announce(`${this.winner.def.name} WINS`, { force: true, size: 80, color: this.winner.def.color, speak: `${this.winner.def.name.toLowerCase()} wins` });
        AudioSys.sfx('cheer'); confetti(this, this.winner.x, this.winner.y - 400, 50);
      }
      if (this.pt >= 290) {
        if (this.winner) this.wins[this.winner.side]++;
        const done = this.wins[0] >= 2 || this.wins[1] >= 2 || this.round >= 5;
        if (done) { this.phase = 'end'; this.endMatch(); }
        else { this.round++; this.startRound(); }
      }
    }
  }

  timeOut() {
    const [a, b] = this.fighters;
    this.phase = 'ko'; this.pt = 0;
    this.winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b; this.loser = this.winner ? this.other(this.winner) : null;
    this.announce('TIME! DOCUMENTATION INCOMPLETE!', { force: true, size: 70, color: '#ffd23f', speak: 'Time! Documentation incomplete!' });
  }

  ko(att, def, viaUlt) {
    if (this.phase !== 'fight') return;
    def.ko = true; this.phase = 'ko'; this.pt = 0; this.winner = att; this.loser = def;
    this.slow = 90; AudioSys.sfx('ko'); this.addShake(18);
    const finals = ['DISCHARGED!', 'SHIFT COMPLETE!'];
    const txt = viaUlt ? att.def.ult.final : pick(finals);
    this.announce(txt, { force: true, size: 120, color: '#ff3b3b', dur: 110 });
    if (!viaUlt) { def.set('air'); def.vy = -12; def.vx = (def.x > att.x ? 1 : -1) * 8; def.y -= 2; }
  }

  endMatch() {
    const w = this.wins[0] > this.wins[1] ? 0 : this.wins[1] > this.wins[0] ? 1 : (this.fighters[0].hp >= this.fighters[1].hp ? 0 : 1);
    AudioSys.playMusic('win');
    this.o.onEnd && this.o.onEnd({ winner: w, fighters: this.fighters, time: this.matchFrames, match: this });
  }

  spawnPopup() {
    const p = pick(POPUPS); let who = null;
    if (p.effect === 'cooldown') { const f = pick(this.fighters); who = f.def.name; for (const s of f.def.specials) f.cd[s.name] = Math.max(f.cd[s.name] || 0, 150); }
    if (p.effect === 'energy') for (const f of this.fighters) f.energy = Math.min(100, f.energy + 15);
    this.popups.push(new Popup(p, who));
    if (this.popups.length > 2) this.popups.shift();
    AudioSys.sfx('notify');
  }

  // ---------- combat resolution ----------
  applyHit(a, d, h, srcX) {
    if (this.cine || !d.hittable()) return false;
    // Maddy's AUDIT REVIEW: absorb the hit and counter-attack
    if (d.status.counter > 0 && !h.unblockable && !h.chip) {
      d.status.counter = 0; d.set('idle'); d.faceOpp(); AudioSys.sfx('stamp');
      this.fx.push(new FloatText(d.x, d.y - 330, 'AUDIT FAILED!', '#9fe0ff', 44, 60));
      this.later(5, () => { if (a.hittable()) this.applyHit(d, a, { dmg: 110, stun: 30, kd: true, kb: 9, sfx: 'hitH', text: 'NON-COMPLIANT!', textColor: '#8e7dff', shake: 12, unblockable: true, burst: true }, d.x); });
      return 'countered';
    }
    const blocked = !h.unblockable && d.isBlockingFrom(srcX) && d.grounded();
    let dmg = h.dmg * a.def.stats.power / d.def.stats.defense * (a.dmgMult || 1);
    const dir = Math.sign(d.x - srcX) || a.facing;
    if (blocked) {
      dmg = Math.round(dmg * 0.12);
      d.hp = Math.max(1, d.hp - dmg);
      d.set('blockstun'); d.hitstun = Math.round((h.stun || 12) * 0.7); d.vx = dir * Math.max(3, (h.kb || 3) * 0.9);
      a.energy = Math.min(100, a.energy + 3); d.energy = Math.min(100, d.energy + 5); d.stats.blocks++;
      sparks(this, d.x - dir * 30, d.y - 170, '#7fd6ff', 10); this.fx.push(new Ring(d.x - dir * 30, d.y - 170, '#7fd6ff', 50, 12));
      AudioSys.sfx('block'); this.hitstop = 4;
      return 'blocked';
    }
    const comboing = ['hit', 'air', 'stun', 'freeze', 'trap'].includes(d.state);
    a.combo = comboing ? a.combo + 1 : 1; a.comboT = 75; a.stats.maxCombo = Math.max(a.stats.maxCombo, a.combo);
    const scale = Math.max(0.35, 1 - 0.09 * (a.combo - 1));
    const crit = !h.chip && Math.random() < (a.status.vein > 0 ? 0.3 : 0.05);
    dmg = Math.round(dmg * scale * (crit ? 1.5 : 1) * (a.status.vein > 0 ? 1.25 : 1) * (d.status.shield > 0 ? 0.5 : 1));
    d.hp = Math.max(0, d.hp - dmg); d.stats.taken += dmg;
    a.stats.dmg += dmg; a.stats.hits++;
    a.energy = Math.min(100, a.energy + (h.energy || 8)); d.energy = Math.min(100, d.energy + dmg * 0.05);
    d.flash = 8; d.pullTo = null;
    // reaction
    if (h.effect && d.hp > 0) {
      const ty = h.effect.type; d.set(ty); d.status[ty] = h.effect.dur; d.vx = dir * 2;
      if (ty === 'freeze') { sparks(this, d.x, d.y - 150, '#bff3ff', 20, 'dot'); }
    } else if (h.launch || !d.grounded() || d.state === 'air' || h.kd) {
      d.juggle++;
      d.set('air'); d.vy = h.launch || (h.kd ? -9 : d.juggle > 3 ? 3 : -7.5); d.vx = dir * (h.kb || 3) * (h.kd ? 0.9 : 0.55); d.y = Math.min(d.y, FLOOR - 2);
    } else {
      d.set('hit'); d.hitstun = h.stun || 14; d.vx = dir * (h.kb || 3);
    }
    // attacker pushback in the corner
    if (h.normal && (d.x < 80 || d.x > STAGE_W - 80)) a.vx -= a.facing * 3;
    // juice
    const hx = d.x - dir * 20, hy = d.y - 170 + (h.launch ? 30 : 0);
    this.hitstop = crit ? 10 : h.dmg >= 70 ? 7 : 4;
    if (h.shake) this.addShake(h.shake);
    sparks(this, hx, hy, crit ? '#ff3b3b' : '#fff8c0', crit ? 22 : 12);
    this.fx.push(new Ring(hx, hy, crit ? '#ff3b3b' : '#fff', crit ? 110 : 70));
    if (h.burst || crit || h.dmg >= 85) this.fx.push(new ComicBurst(hx + rand(-30, 30), hy - 60, crit ? 'CRIT!' : pick(HIT_WORDS), crit ? '#ff3b3b' : pick(['#ffd23f', '#ff5a8a', '#3bb3ff', '#7cf28b']), crit ? 1.2 : 1));
    this.fx.push(new FloatText(d.x + rand(-20, 20), d.y - 280, String(dmg), crit ? '#ff3b3b' : '#fff', crit ? 40 : 28, 40));
    if (h.text) this.fx.push(new FloatText(d.x, d.y - 330, h.text, h.textColor || '#ffd23f', 40, 60));
    AudioSys.sfx(crit ? 'crit' : (h.sfx || 'hitL'));
    if (h.sfx && h.sfx !== 'hitL' && h.sfx !== 'hitH') AudioSys.sfx(h.dmg >= 60 ? 'hitH' : 'hitL');
    if (crit) this.announce('CRITICAL HIT!', { size: 80, color: '#ff3b3b' });
    else if (h.announce) this.announce(h.announce, { size: 80, color: h.textColor || '#ffd23f' });
    if (d.hp <= 0) {
      if (this.training) { d.hp = d.maxHp; return true; }
      this.ko(a, d, false);
    }
    return true;
  }

  // ---------- ultimate cinematics ----------
  startCine(f) {
    const o = this.other(f), def = f.def.ult;
    this.cine = { caster: f, target: o, t: 0, def, tx: o.x, per: Math.round(def.dmg * f.def.stats.power / o.def.stats.defense * (f.dmgMult || 1) / def.hits.length) };
    f.set('ult'); f.vx = 0; f.faceOpp();
    o.set('ulthit'); o.vx = 0; o.vy = 0; o.y = FLOOR; o.pullTo = null;
    if (f.y < FLOOR) { f.y = FLOOR; f.vy = 0; }
    for (const e of this.fx) if (e.isProjectile) e.dead = true;
    AudioSys.sfx('super');
    Announcer.clear(); if (Settings.voice) Announcer.speak(def.name);
  }
  updateCine() {
    const k = this.cine, def = k.def, f = k.caster, o = k.target;
    k.t++;
    if (def.update) def.update(k.t, k, this);
    if (k.t === 42) Announcer.say(def.quote, { size: 46, color: '#fff', dur: 120, y: H * 0.82 });
    if (def.hits.includes(k.t)) {
      const last = k.t === def.hits[def.hits.length - 1];
      o.hp = Math.max(this.training ? 1 : 0, o.hp - k.per); if (!last && o.hp <= 0) o.hp = 1;
      f.stats.dmg += k.per; f.stats.hits++; f.combo++; f.comboT = 90; f.stats.maxCombo = Math.max(f.stats.maxCombo, f.combo);
      o.flash = 8; this.addShake(last ? 20 : 7);
      sparks(this, o.x, o.y - 150, pick(['#ffd23f', '#ff5a8a', '#7fd6ff']), 14);
      this.fx.push(new ComicBurst(o.x + rand(-60, 60), o.y - rand(150, 260), pick(HIT_WORDS), pick(['#ffd23f', '#ff5a8a', '#3bb3ff', '#7cf28b']), last ? 1.5 : 0.9));
      AudioSys.sfx(last ? 'crit' : 'hitH');
    }
    if (k.t === def.dur - 50) {
      Announcer.say(def.final, { size: 104, color: '#ff3b3b', dur: 80 });
      confetti(this, o.x, o.y - 400, 70); AudioSys.sfx('cheer');
    }
    f.updatePose(); o.updatePose();
    if (k.t >= def.dur) {
      o.spin = 0; this.cine = null;
      f.set('idle');
      if (o.hp <= 0 && !this.training) { o.set('air'); this.ko(f, o, true); o.vy = -12; o.vx = (o.x > f.x ? 1 : -1) * 9; o.y -= 2; o.state = 'air'; }
      else { o.set('air'); o.vy = -9; o.vx = (o.x > f.x ? 1 : -1) * 6; o.y -= 2; }
    }
  }

  // ---------- pause ----------
  pauseItems() {
    const items = ['RESUME', 'MOVE LIST'];
    if (this.training) items.push('DUMMY: ' + this.ctrl[1].ai.mode.toUpperCase());
    items.push('RESTART', 'QUIT TO MENU');
    return items;
  }
  updatePause() {
    if (this.showMoves) { if (Input.menu('back') || Input.menu('ok') || Input.mouse) { this.showMoves = false; AudioSys.sfx('back'); } return; }
    const items = this.pauseItems();
    const sel = menuNav(items.length, this.pauseSel, (i) => ({ x: W / 2 - 200, y: 250 + i * 70, w: 400, h: 58 }));
    this.pauseSel = sel.i;
    if (Input.menu('back')) { this.paused = false; return; }
    if (sel.ok) {
      const it = items[sel.i]; AudioSys.sfx('confirm');
      if (it === 'RESUME') this.paused = false;
      else if (it === 'MOVE LIST') this.showMoves = true;
      else if (it.startsWith('DUMMY')) { const m = ['stand', 'block', 'cpu']; const ai = this.ctrl[1].ai; ai.mode = m[(m.indexOf(ai.mode) + 1) % 3]; }
      else if (it === 'RESTART') App.restartMatch();
      else if (it === 'QUIT TO MENU') App.go('menu');
    }
  }

  // ---------- rendering ----------
  draw(c) {
    const cam = this.cam;
    const sx = cam.shake ? rand(-cam.shake, cam.shake) : 0, sy = cam.shake ? rand(-cam.shake, cam.shake) : 0;
    c.save();
    c.translate(W / 2 + sx, 640 + sy); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -FLOOR);
    this.arena.draw(c, cam, this.frame);
    if (this.cine || (this.camPunch && this.camPunch.t > 0)) {
      const a = this.cine ? Math.min(0.6, this.cine.t / 20 * 0.6) * (this.cine.t > this.cine.def.dur - 15 ? (this.cine.def.dur - this.cine.t) / 15 : 1) : this.camPunch.t / 16 * 0.3;
      c.fillStyle = `rgba(5,8,25,${a})`; c.fillRect(-600, -600, STAGE_W + 1200, 1600);
    }
    if (this.cine && this.cine.def.drawWorld) this.cine.def.drawWorld(c, this.cine.t, this.cine, this);
    for (const e of this.fx) if (e.layer === 'back') e.draw(c);
    const [a, b] = this.fighters;
    const order = (a.state === 'attack' || a.state === 'cast' || a.state === 'ult') ? [b, a] : [a, b];
    for (const f of order) f.draw(c);
    for (const e of this.fx) if (e.layer !== 'back') e.draw(c);
    c.restore();

    if (this.cine) this.drawCineOverlay(c);
    this.drawHUD(c);
    this.popups.forEach((p, i) => p.draw(c, i));
    Announcer.draw(c);
    if (this.paused) this.drawPause(c);
  }

  drawCineOverlay(c) {
    const k = this.cine, f = k.caster;
    if (k.def.drawScreen) k.def.drawScreen(c, k.t, k, this);
    if (k.t < 50) {
      // super cut-in band
      const p = k.t < 10 ? easeOutBack(k.t / 10) : k.t > 40 ? 1 - (k.t - 40) / 10 : 1;
      c.save(); c.globalAlpha = Math.max(0, p);
      c.translate(0, H * 0.5);
      c.fillStyle = f.def.color; c.beginPath(); c.moveTo(0, -110); c.lineTo(W, -150); c.lineTo(W, 90); c.lineTo(0, 130); c.fill();
      c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 30; i++) c.fillRect(((i * 97 + k.t * 40) % (W + 200)) - 100, -150 + (i * 37) % 240, 120, 3);
      c.save(); c.beginPath(); c.moveTo(0, -110); c.lineTo(W, -150); c.lineTo(W, 90); c.lineTo(0, 130); c.clip();
      const bx = f.side === 0 ? 260 + (1 - p) * -300 : W - 260 + (1 - p) * 300;
      if (!drawShowcase(c, f.def.id, bx - 210, -165, 420, 300, { fy: 0.22, border: false, radius: 0, flip: f.side === 1 }))
        drawBust(c, f.L, bx, -40, 3.4, 'shout', k.t, f.side === 0 ? 1 : -1);
      c.restore();
      bigText(c, k.def.name, f.side === 0 ? W * 0.66 : W * 0.34, 0, 66, '#fff', INK);
      bigText(c, 'ULTIMATE', f.side === 0 ? W * 0.66 : W * 0.34, -70, 30, '#ffd23f', INK);
      c.restore();
    }
  }

  drawHUD(c) {
    const [a, b] = this.fighters;
    // timer
    c.save();
    rr(c, W / 2 - 52, 18, 104, 82, 14); c.fillStyle = 'rgba(10,20,50,.85)'; c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.stroke();
    const tsec = this.training || !Settings.roundTime ? '∞' : String(Math.max(0, Math.ceil(this.timer / 60)));
    bigText(c, tsec, W / 2, 56, 50, this.timer < 600 && !this.training ? '#ff3b3b' : '#fff');
    c.fillStyle = '#9fd0ff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(this.training ? 'TRAINING' : `ROUND ${this.round}`, W / 2, 92);
    c.restore();
    this.drawBar(c, a, 0); this.drawBar(c, b, 1);
    // combo counters
    for (const f of this.fighters) {
      if (f.combo >= 2 && f.comboT > 0) {
        const x = f.side === 0 ? 150 : W - 150;
        c.save(); c.globalAlpha = Math.min(1, f.comboT / 20); c.translate(x, 300); c.rotate(f.side ? 0.08 : -0.08);
        bigText(c, `${f.combo} HITS`, 0, 0, 54, '#ffd23f'); bigText(c, f.combo >= 8 ? 'CODE BLUE COMBO!' : f.combo >= 5 ? 'RAPID RESPONSE!' : 'COMBO!', 0, 40, 24, '#fff');
        c.restore();
      }
    }
    // special name banner
    if (this.banner) {
      const bn = this.banner; const p = Math.min(1, bn.t / 8) * (bn.t > 55 ? (70 - bn.t) / 15 : 1);
      c.save(); c.globalAlpha = Math.max(0, p);
      const x = bn.side === 0 ? 40 : W - 40;
      c.font = font(28); const w = c.measureText(bn.text).width + 40;
      rr(c, bn.side === 0 ? x : x - w, 150, w, 42, 8); c.fillStyle = 'rgba(10,20,50,.85)'; c.fill();
      bigText(c, bn.text, bn.side === 0 ? x + 20 : x - 20, 172, 28, this.fighters[bn.side].def.color, INK, bn.side === 0 ? 'left' : 'right');
      c.restore();
    }
    if (this.training) {
      c.save(); c.fillStyle = 'rgba(10,20,50,.7)'; rr(c, W / 2 - 330, H - 46, 660, 34, 8); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center';
      c.fillText(`Dummy: ${this.ctrl[1].ai.mode.toUpperCase()}  •  Infinite energy  •  Esc/P → pause menu (change dummy, move list)`, W / 2, H - 24); c.restore();
    }
    if (Touch.enabled() && this.phase !== 'end') Touch.draw(c);
  }

  drawBar(c, f, side) {
    const x0 = side === 0 ? 30 : W - 30, dir = side === 0 ? 1 : -1;
    const bw = 470, bx = side === 0 ? 130 : W - 130 - bw, by = 30;
    // portrait
    c.save();
    c.beginPath(); c.arc(x0 + dir * 50, 66, 48, 0, TAU); c.fillStyle = f.def.color; c.fill(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
    c.save(); c.beginPath(); c.arc(x0 + dir * 50, 66, 46, 0, TAU); c.clip();
    if (!drawShowcase(c, f.def.id, x0 + dir * 50 - 48, 18, 96, 96, Object.assign({ border: false, radius: 0 }, f.def.face, { flip: side === 1 }))) drawBust(c, f.L, x0 + dir * 50, 40, 1.45, f.hp < f.maxHp * 0.25 ? 'hurt' : 'normal', this.frame, side === 0 ? 1 : -1);
    c.restore(); c.restore();
    // health bar
    c.save();
    rr(c, bx - 4, by - 4, bw + 8, 38, 10); c.fillStyle = 'rgba(10,20,50,.85)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    const pct = f.hp / f.maxHp, dpct = f.dispHp / f.maxHp;
    const fill = (p, col) => { const w = bw * p; c.fillStyle = col; rr(c, side === 0 ? bx + bw - w : bx, by, w, 30, 7); c.fill(); };
    fill(dpct, '#ff3b3b');
    const col = pct > 0.5 ? '#3dff6e' : pct > 0.22 ? '#ffd23f' : (this.frame % 20 < 10 ? '#ff3b3b' : '#ff8a8a');
    fill(pct, col);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(bx, by + 3, bw, 6);
    // name
    bigText(c, f.def.name, side === 0 ? bx + 6 : bx + bw - 6, by + 52, 26, '#fff', INK, side === 0 ? 'left' : 'right');
    c.fillStyle = '#d6e6ff'; c.font = 'bold 12px sans-serif'; c.textAlign = side === 0 ? 'left' : 'right';
    c.fillText(f.def.role.toUpperCase(), side === 0 ? bx + 8 : bx + bw - 8, by + 76);
    // round wins (crosses)
    for (let i = 0; i < 2; i++) {
      const cx = side === 0 ? bx + bw - 14 - i * 30 : bx + 14 + i * 30, cy = by + 52;
      c.fillStyle = this.wins[side] > i ? '#ff3b3b' : 'rgba(255,255,255,.25)'; c.strokeStyle = INK; c.lineWidth = 2;
      c.fillRect(cx - 4, cy - 11, 8, 22); c.fillRect(cx - 11, cy - 4, 22, 8);
    }
    // energy bar
    const ew = 300, ex = side === 0 ? 30 : W - 30 - ew, ey = H - 70;
    rr(c, ex - 3, ey - 3, ew + 6, 24, 8); c.fillStyle = 'rgba(10,20,50,.85)'; c.fill();
    const full = f.energy >= 100;
    const eg = c.createLinearGradient(ex, 0, ex + ew, 0); eg.addColorStop(0, '#1f5fd1'); eg.addColorStop(1, full ? '#ffd23f' : '#7fd6ff');
    c.fillStyle = eg; const w = ew * f.energy / 100; rr(c, side === 0 ? ex : ex + ew - w, ey, w, 18, 6); c.fill();
    if (full) { c.save(); c.globalAlpha = 0.5 + Math.sin(this.frame * 0.2) * 0.4; c.strokeStyle = '#ffd23f'; c.lineWidth = 3; rr(c, ex - 3, ey - 3, ew + 6, 24, 8); c.stroke(); c.restore(); }
    bigText(c, full ? 'ULTIMATE READY!' : 'ENERGY', side === 0 ? ex + 6 : ex + ew - 6, ey - 14, 18, full ? '#ffd23f' : '#9fd0ff', INK, side === 0 ? 'left' : 'right');
    // special cooldown pips
    f.def.specials.forEach((s, i) => {
      const px = side === 0 ? ex + ew + 16 + i * 40 : ex - 16 - 34 - i * 40, py = ey - 10;
      const cd = f.cd[s.name] || 0, maxCd = s.cd * (this.training ? 0.35 : 1);
      rr(c, px, py, 34, 34, 7); c.fillStyle = cd > 0 ? 'rgba(40,40,60,.85)' : f.def.color; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      if (cd > 0) { c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(px, py + 34 * (1 - cd / maxCd), 34, 34 * cd / maxCd); }
      c.fillStyle = cd > 0 ? '#aaa' : INK; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText({ N: 'SP', F: '→SP', B: '←SP', D: '↓SP', AIR: 'AIR' }[s.input], px + 17, py + 21);
    });
    c.restore();
  }

  drawPause(c) {
    c.save(); c.fillStyle = 'rgba(5,10,30,.9)'; c.fillRect(0, 0, W, H);
    if (this.showMoves) { drawMoveList(c, this.fighters[0].def, W / 2, 80); bigText(c, 'Press any button to return', W / 2, H - 40, 24, '#9fd0ff'); c.restore(); return; }
    bigText(c, 'PAUSED', W / 2, 150, 90, '#ffd23f');
    c.fillStyle = '#9fd0ff'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.fillText('ON BREAK (15 minutes, unpaid)', W / 2, 205);
    this.pauseItems().forEach((it, i) => drawButton(c, W / 2 - 200, 250 + i * 70, 400, 58, it, i === this.pauseSel));
    c.restore();
  }
}

function drawMoveList(c, def, cx, y) {
  bigText(c, `${def.name} — MOVE LIST`, cx, y, 50, def.color);
  const rows = [
    ['Light Punch / Heavy Punch', 'J / K'], ['Light Kick / Heavy Kick', 'U / I'], ['Block (hold)', 'S'], ['Dodge roll', 'S + ← or →'], ['Jump (air attacks!)', 'W'],
    ...def.specials.map(s => [s.name, { N: 'L', F: '→ + L', B: '← + L', D: 'S + L', AIR: 'L in the air' }[s.input]]),
    [`ULTIMATE: ${def.ult.name}`, 'O  (full energy)']
  ];
  c.save();
  rows.forEach((r, i) => {
    const yy = y + 60 + i * 40;
    rr(c, cx - 420, yy - 16, 840, 34, 8); c.fillStyle = i >= 5 ? 'rgba(31,95,209,.35)' : 'rgba(255,255,255,.08)'; c.fill();
    c.fillStyle = i === rows.length - 1 ? '#ffd23f' : '#fff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'left'; c.fillText(r[0], cx - 400, yy + 7);
    c.fillStyle = '#7fd6ff'; c.textAlign = 'right'; c.fillText(r[1], cx + 400, yy + 7);
  });
  c.restore();
}
