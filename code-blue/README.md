# CODE BLUE: HEALTHCARE SHOWDOWN

A 2D arcade fighting game for healthcare workers. It mixes Street Fighter-style combat with workplace comedy about prior auths, one-star reviews and mandatory meetings.

**Play:** open `index.html` in any modern browser. It's one self-contained file with no installs, servers or network calls. The only external request is Google Fonts, and the game falls back to system fonts without it. The same file runs as a Claude Artifact.

## Fighters

| Fighter | Role | Specials (L = Special) | Ultimate (O) |
|---|---|---|---|
| **MARTEL** "The Diagnosis Destroyer" | Nurse Practitioner · ImmunoCare Health | Diagnosis Shock (L) · Prior Authorization Denied (→L, stuns) · eRx Blast (←L) · PrEP Protect (S+L, halves damage taken) · One-Star Smackdown (L in air) | **Viral Suppression** → *DISCHARGED!* |
| **RUBEN** "The Vital Sign Vigilante" | Certified Medical Assistant · ImmunoCare Health | BP Cuff Whip · Rooming Rush (stool dash) · Deflate & Stun · Hypertension Hold (launcher) | **BP Cuff Slam** → *PATIENT NEEDS FOLLOW-UP!* |
| **CESAR** "The Vein Hunter" | Phlebotomist · ImmunoCare Health | Butterfly Strike · Tourniquet Tornado (pull) · Vein Finder Vision (damage + crit buff) · Specimen Storm | **The Difficult Stick** → *SPECIMEN COLLECTED!* |
| **GORDON** "The Executive" | Executive Director · Equity Alliance Health | Executive Dealbreaker (briefcase swing) · Mandatory Meeting (trap) · Staffing Shortage (decoys) · Budget Cut | **340B Power Slam** → *POSITION ELIMINATED!* |
| **DHVANI** "The Pharmacist" | Pharmacist / COO · ImmunoCare Health | Pill Toss · Rx Dispense (pill spray) · Med Pass Madness · 340B Savings (heal) | **340B Pill Storm** → *PRESCRIPTION FILLED!* |
| **MADDY** "The Chief Nursing Officer" | Chief Nursing Officer · Equity Alliance Health | Chart Swipe · Audit Review (counter: absorbs a hit and strikes back) · Call Light Chaos · Shift Change (teleport) | **Compliance Overload** → *AUDIT FAILED!* |

All six fight with illustrated pose sprites taken from the supplied character sheets. On Gordon's briefcase, the ImmunoCare logo has been repainted as Equity Alliance Health. Their showcase art appears on the select screen, VS screen, ultimate cut-ins and victory report. In Arcade mode, Gordon is the final boss in the Boardroom.

## Controls

| Action | Player 1 | Player 2 (Versus) | Gamepad |
|---|---|---|---|
| Move / Jump | A D / W | ← → / ↑ | D-pad / stick |
| Block (hold) · Dodge | S · S + ←/→ | ↓ · ↓ + ←/→ | Down |
| Light / Heavy Punch | J / K | Num1 / Num2 (or `,` `.`) | X / Y |
| Light / Heavy Kick | U / I | Num4 / Num5 (or `;` `'`) | A / B |
| Special (+direction) | L | Num3 (or `/`) | RB / LB |
| Ultimate (full energy) | O | Num6 (or `]`) | RT |
| Pause | Esc / P | | Start |

Touch screens get an on-screen D-pad and buttons automatically. You can force them on or off in Settings.

## Features

- **Modes:** Start Game / Arcade (4-fight ladder ending with a boss in the Boardroom), Character Selection (pick both fighters vs CPU), Versus (local 2-player), and Training (dummy can stand, block or fight; infinite energy; shorter cooldowns).
- **Combat:** best 2 of 3 rounds; light/heavy punches and kicks; blocking with chip damage; dodge rolls with invulnerability; jump attacks; chaining normals into specials (hit-confirm); Heavy Kick launches for aerial juggles; combo damage scaling; critical hits; projectile clashes; stun, freeze, root and trap effects; energy meter; special cooldowns; cinematic ultimates.
- **CPU:** Easy, Normal, Hard and **Nightmare Shift**. Harder levels react faster, block more, combo more and hit harder.
- **Presentation:**
  - Characters are built from jointed parts, so every move animates smoothly.
  - The camera zooms in for specials and ultimates, the screen shakes on big hits, and hits pause briefly for impact.
  - Particles, comic "POW!" bursts, floating damage numbers and confetti.
  - Fighters change expression when attacking, hurt, knocked out or celebrating.
  - VS intro screen, victory poses and catchphrases, and an end-of-match stats report.
- **Five animated arenas:**
  - **Emergency Department:** ECG monitors, a rotating beacon, a stretcher on a STAT run.
  - **Nurses' Station:** call-light board, ringing phones, the EHR wall.
  - **Skilled Nursing Facility:** bingo banner, a wheelchair drag race.
  - **Insurance Authorization Office:** DENIED posters, a fax machine spewing paper, hold music.
  - **Hospital Boardroom:** skyline, KPI dashboards, spotlights.
- **Audio:** synthesized arcade music and sound effects (monitor beeps, EHR notifications, printers, phones, alarms, cartoon impacts). The announcer uses the browser's built-in speech plus on-screen callouts: "CODE BLUE!", "ROUND ONE — BEGIN YOUR SHIFT!", "PRIOR AUTH DENIED!", "PERFECT SHIFT!" and more.
- **Comedy pop-ups:** random hospital notifications during fights. Some actually change things: "Insurance Has Denied Your Special Attack!" puts a fighter's specials on cooldown, and "Critical Lab Result!" gives both fighters energy.

## Limitations (Artifact / single-file build)

- **Illustrated heads, animated bodies.** The three real-person heads are single illustrations embedded in the HTML, so their faces don't change expression. Hits, KOs and shouts are shown with squash, shake, sweat drops and dizzy stars instead. Full illustrated sprite sheets would need dedicated art (see below).
- **Optional real portraits.** Add `?portraits=1` to the URL and put PNGs at `assets/portraits/<id>.png` (`martel`, `nova`, `ruben`, `cesar`, `admin`, roughly 3:4 head-and-shoulders). They replace the drawn cards on the select screen.
- **Synthesized sound.** Music and sound effects are generated with Web Audio; there are no recorded audio files. The announcer voice uses the browser's speech engine, so it sounds different per device. Turn it off in Settings and the callouts stay on screen.
- **No external framework.** Phaser/React aren't used, so the game works anywhere an Artifact runs. It's plain HTML5 Canvas with a fixed 60 FPS update loop.

## Adding illustrated art

Everything below is picked up automatically by `python3 build.py`, and any fighter without it keeps the drawn look.

**Showcase picture (one per fighter).** Save a dramatic full-body illustration as `assets/showcase/<id>.jpg` (about 630×840, portrait). It's used on the select screen, VS screen, ultimate cut-in, victory report and arcade ending. Cesar already has one.

**18-panel character sheets** (dark panels with captions, like Gordon's, Dhvani's and Maddy's): `tools/cut_panels.py` cuts each panel and removes the background with rembg, then `make_sprites.py --folder ... --panel-normalize` evens out the panel sizes:

```
python3 tools/cut_panels.py art/gordon_sheet.webp gordon /tmp/gordon_poses --eah-logo
python3 tools/make_sprites.py gordon --folder /tmp/gordon_poses --panel-normalize
```

The panel boxes for each sheet are in `LAYOUTS` at the top of `cut_panels.py`. For a new sheet, add its measured boxes there. This needs `pip install "rembg[cpu]"`.

**Fighting poses (sprite sheet).** Generate 15 poses of the character in one image, on a plain white background, all facing right, in this order:

| Row | Poses |
|---|---|
| 1 | idle stance · walk step 1 · walk step 2 · jump |
| 2 | light punch · heavy punch · light kick · heavy kick |
| 3 | block · getting hit · knocked down (lying) · special move |
| 4 | ultimate · victory · defeated (kneeling) |

Then run:

```
python3 tools/make_sprites.py cesar --sheet cesar_sheet.png
python3 build.py
```

The tool finds each figure, removes the background, sizes every pose to match the idle pose and lines up the feet. Use `--order` if your sheet is laid out differently, or `--folder` with one image per pose (`idle.png`, `walk1.png`, …). Only `idle` is required; missing poses fall back to a similar one. It needs `pip install opencv-python-headless numpy`.

## Building a fuller standalone version

1. **Art:** commission or generate sprite sheets per fighter, one row per animation state: idle, walk, run, jump, LP, HP, LK, HK, block, hit, knockdown, special, ultimate, victory, defeat. Suggested size is about 512×512 per frame at 12–24 fps. Keep the current cartoon style and use the reference photos for likeness.
2. **Engine:** port `src/` to Phaser 3. `Fighter.update()` and `NORMALS` already work as a frame-data state machine. Replace `drawCharacter()` with sprite animations keyed on `state`, and move hitbox data into per-frame JSON.
3. **Audio:** swap `AudioSys.sfx()` names for recorded clips and record a real announcer.
4. **Online / persistence:** add a leaderboard (fastest arcade clear, highest combo) and rollback netcode if you want online versus.

## Source layout

```
code-blue/
├─ index.html      ← built, self-contained game (open this)
├─ build.py        ← bundles src/*.js + assets/heads/*.png into index.html
├─ tools/make_heads.py   ← cuts heads out of the reference artwork
├─ tools/make_sprites.py ← turns a pose sprite sheet into fighting sprites
├─ tools/cut_panels.py   ← cuts poses out of 18-panel character sheets (rembg)
├─ art/                  ← the original character sheets
├─ assets/showcase/      ← one full illustration per fighter
├─ assets/sprites/<id>/  ← pose sprites + sprites.json
├─ assets/heads/   ← transparent head cut-outs
├─ template.html
└─ src/
   ├─ core.js      settings, input (keyboard/gamepad), Web Audio synth, announcer
   ├─ art.js       procedural cartoon characters, poses, faces, outfits
   ├─ effects.js   item art (DENIED stamp, one-star card…), particles, projectiles, pop-ups
   ├─ fighters.js  move library, ultimates, fighter state machine, CPU AI
   ├─ roster.js    the six playable fighters and their moves
   ├─ arenas.js    five animated stages
   ├─ match.js     rounds, hit resolution, camera, cinematics, HUD
   └─ app.js       menus, character/arena select, VS, results, touch controls, main loop
```

After editing anything in `src/`, run `python3 build.py`.
