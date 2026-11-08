#!/usr/bin/env python3
"""Cut poses out of an 18-panel character sheet (dark panel backgrounds, captions under
each pose) and remove the background with rembg. Writes one transparent PNG per pose,
ready for:  python3 tools/make_sprites.py <id> --folder <out>

Usage: python3 tools/cut_panels.py <sheet> <layout> <out_folder> [--eah-logo]
  layout: a key of LAYOUTS below (pixel boxes measured on the supplied sheets)
  --eah-logo: repaint ImmunoCare briefcase logos as Equity Alliance Health (Gordon)
Requires: pip install "rembg[cpu]" opencv-python-headless numpy pillow
"""
import argparse, pathlib
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

# Panel order on the sheets: 1 idle, 2 walk1, 3 walk2, 4 jump, 5 land, 6 block,
# 7 lp, 8 hp, 9 lk, 10 hk, 11 extra attack, 12 special, 13 ultimate, 14 victory,
# 15 hit, 16 stagger, 17 knocked down, 18 defeated
NAMES = ['idle', 'walk1', 'walk2', 'jump', None, 'block', 'lp', 'hp', 'lk', 'hk', None,
         'special', 'ultimate', 'win', 'hit', None, 'down', 'lose']


def rows(x0, x1, y0, y1, n):
    w = (x1 - x0) / n
    return [(int(x0 + i * w), y0, int(x0 + (i + 1) * w), y1) for i in range(n)]


LAYOUTS = {   # (x0, y0, x1, y1) per panel, captions excluded
    'gordon': rows(368, 1530, 40, 228, 6) + rows(368, 1530, 292, 462, 5) +
              [(372, 538, 812, 745), (826, 538, 1236, 745), (1256, 538, 1528, 750)] + rows(368, 1530, 832, 975, 4),
    'dhvani': rows(325, 1530, 38, 224, 6) + rows(325, 1530, 292, 458, 5) +
              [(327, 538, 735, 748), (752, 538, 1228, 748), (1246, 538, 1528, 750)] + rows(325, 1530, 832, 965, 4),
    'maddy':  rows(305, 1442, 34, 225, 6) + rows(305, 1442, 300, 478, 5) +
              [(307, 552, 720, 786), (730, 552, 1162, 786), (1172, 552, 1440, 790)] + rows(305, 1442, 866, 1016, 4),
}


# jump panels: the leap reaches above the row's caption-free box, so start near the panel top
for _k, _top in (('gordon', 10), ('dhvani', 12), ('maddy', 12)):
    _x0, _y0, _x1, _y1 = LAYOUTS[_k][3]; LAYOUTS[_k][3] = (_x0, _top, _x1, _y1)


# poses where another rembg model keeps props/effects better
MODEL_FOR = {('gordon', 'special'): 'u2net'}


def clean(alpha):
    """Keep the character (+ attached effects); drop specks and stray caption fragments."""
    m = (alpha > 40).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n <= 1: return alpha
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    keep = np.zeros_like(m)
    bx, by, bw, bh = st[big, :4]
    for i in range(1, n):
        x, y, w, h, a = st[i]
        near = x < bx + bw + 40 and x + w > bx - 40 and y < by + bh + 10 and y + h > by - 40
        spill = x <= 1 or x + w >= m.shape[1] - 1                # bits of the neighbouring panel
        if i == big or (a > st[big, cv2.CC_STAT_AREA] * 0.004 and near and not spill):
            keep[lab == i] = 1
    return (alpha * keep).astype(np.uint8)


def eah_logo(img, relaxed=False):
    """Replace small blue shield logos sitting on dark (briefcase) areas with an
    Equity Alliance Health mark."""
    rgb = img[..., :3].astype(np.int16); a = img[..., 3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    blue = (b > 120) & (b - r > 50) & (b - g > 15) & (a > 200)
    if relaxed:                                               # faded logos; briefcases sit low in the frame
        blue = (b > 110) & (b - r > 35) & (b - g > 15) & (a > 200)
        blue[: int(a.shape[0] * 0.55)] = False
    n, lab, st, cen = cv2.connectedComponentsWithStats(blue.astype(np.uint8))
    H, W = a.shape
    pil = Image.fromarray(img); d = ImageDraw.Draw(pil)
    done = 0
    cands = sorted(range(1, n), key=lambda i: -st[i, cv2.CC_STAT_AREA])   # biggest shield first
    for i in cands:
        if done: break                                       # one briefcase logo per pose
        x, y, w, h, area = st[i]
        if not (40 <= area <= 20000 and 0.5 < w / max(h, 1) < 1.6 and w < W * 0.3): continue
        ring = cv2.dilate((lab == i).astype(np.uint8), np.ones((9, 9), np.uint8)) - (lab == i)
        if rgb[ring > 0].mean() > 115: continue
        inside = rgb[y:y + h, x:x + w]
        if area >= 400 and ((inside.min(axis=2) > 170).mean()) < 0.03: continue  # big shields must show the white icon (swooshes don't)               # must sit on something dark
        s = max(w, h)
        # erase the shield and the "ImmunoCare HEALTH" wordmark beside/below it
        X0, X1 = max(0, x - int(s * 1.5)), min(W, x + int(s * 2.5))
        Y0, Y1 = max(0, y - int(s * 0.2)), min(H, y + int(s * 2.4))
        box = img[Y0:Y1, X0:X1]
        dark = box[..., :3][(box[..., :3].max(axis=2) < 70) & (box[..., 3] > 200)]
        fill = tuple(int(v) for v in (np.median(dark, axis=0) if len(dark) else (20, 20, 24)))
        mx, mn = box[..., :3].max(axis=2).astype(np.int16), box[..., :3].min(axis=2).astype(np.int16)
        whiteish = (mx > 55) & (mx - mn < 45)               # wordmark text, incl. faint anti-aliased edges
        sel = (box[..., 3] > 200) & (whiteish | blue[Y0:Y1, X0:X1])
        box[..., :3][sel] = fill
        pil = Image.fromarray(img); d = ImageDraw.Draw(pil)
        # EAH mark: blue ring with swirl + wordmark
        cx, cy, R = x + w / 2, y + h / 2, s * 0.55
        d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(38, 120, 210, 255), outline=(220, 235, 255, 255), width=max(1, int(R / 5)))
        d.arc([cx - R * 0.55, cy - R * 0.55, cx + R * 0.55, cy + R * 0.55], 30, 300, fill=(255, 255, 255, 255), width=max(1, int(R / 4)))
        try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(6, int(s * 0.42)))
        except OSError: font = ImageFont.load_default()
        for k, word in enumerate(['EQUITY ALLIANCE', 'HEALTH']):
            tw = d.textlength(word, font=font)
            d.text((cx - tw / 2, cy + R * 1.25 + k * s * 0.5), word, fill=(235, 242, 255, 255), font=font)
        img[:] = np.array(pil); done += 1
    if not done and not relaxed:
        return eah_logo(img, relaxed=True)
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet'); ap.add_argument('layout'); ap.add_argument('out')
    ap.add_argument('--eah-logo', action='store_true')
    ap.add_argument('--only', help='comma-separated poses to (re)do')
    ap.add_argument('--logo-only', action='store_true', help='just repaint logos in an existing output folder')
    ap.add_argument('--model', default='birefnet-general-lite', help='rembg model (birefnet-general-lite handles dark suits on dark panels best)')
    args = ap.parse_args()
    out = pathlib.Path(args.out); out.mkdir(parents=True, exist_ok=True)
    only = set(args.only.split(',')) if args.only else None
    if args.logo_only:
        for p in sorted(out.glob('*.png')):
            if only and p.stem not in only: continue
            rgba = np.array(Image.open(p).convert('RGBA')); n = eah_logo(rgba)
            Image.fromarray(rgba).save(p); print(p.stem, f'{n} logo(s)')
        return
    from rembg import remove, new_session
    sessions = {}
    sheet = Image.open(args.sheet).convert('RGB')
    for name, box in zip(NAMES, LAYOUTS[args.layout]):
        if not name or (only and name not in only): continue
        model = MODEL_FOR.get((args.layout, name), args.model)
        if model not in sessions: sessions[model] = new_session(model)
        cell = sheet.crop(box)
        rgba = np.array(remove(cell, session=sessions[model]))
        rgba[..., 3] = clean(rgba[..., 3])
        if args.eah_logo:
            n = eah_logo(rgba)
            if n: print(f'  {name}: replaced {n} logo(s)')
        Image.fromarray(rgba).save(out / f'{name}.png')
        print(name, 'ok')


if __name__ == '__main__':
    main()
