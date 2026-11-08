#!/usr/bin/env python3
"""Turn illustrated pose art into game sprites for one fighter.

Two ways in:
  python3 tools/make_sprites.py <fighter_id> --sheet sprite_sheet.png
      One image with all poses laid out in rows on a plain background, in this order
      (left→right, top→bottom):
        idle walk1 walk2 jump / lp hp lk hk / block hit down special / ultimate win lose
      Use --order to give a different order (comma-separated pose names, 'skip' to ignore one).

  python3 tools/make_sprites.py <fighter_id> --folder poses/
      One image per pose, named idle.png, walk1.png, ... (any of png/jpg/webp).

<fighter_id>: martel | nova | ruben | cesar | admin.  Only `idle` is required; missing poses
fall back to a similar one in the game. Characters must face RIGHT.
Output: assets/sprites/<fighter_id>/<pose>.webp + sprites.json — then run `python3 build.py`.
Requires: pip install opencv-python-headless numpy
"""
import argparse, json, pathlib, shutil
import cv2, numpy as np

POSES = ['idle', 'walk1', 'walk2', 'jump', 'lp', 'hp', 'lk', 'hk', 'block', 'hit', 'down', 'special', 'ultimate', 'win', 'lose']
ROOT = pathlib.Path(__file__).resolve().parent.parent
WORK_PX = 600   # idle-pose height in sprite pixels


def read(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f'cannot read {path}')
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img


def foreground(img):
    """Alpha mask for the character(s). Uses existing transparency, a flood fill for plain
    backgrounds, or GrabCut for anything busier."""
    if img.shape[2] == 4 and (img[..., 3] < 250).mean() > 0.05:
        return img[..., 3].copy()
    bgr = img[..., :3]
    h, w = bgr.shape[:2]
    border = np.concatenate([bgr[0], bgr[-1], bgr[:, 0], bgr[:, -1]]).astype(np.float32)
    med = np.median(border, axis=0)
    if np.abs(border - med).mean() < 14:                      # plain background → flood fill
        dist = np.linalg.norm(bgr.astype(np.float32) - med, axis=2)
        bgish = (dist < 34).astype(np.uint8)
        n, lab = cv2.connectedComponents(bgish)
        edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        bg = np.isin(lab, edge[edge > 0]) & (bgish > 0)
        # interior = opaque; background-connected pixels fade by colour distance (anti-aliasing, glows)
        alpha = np.where(bg, np.clip((dist - 8) / 30, 0, 1), 1.0)
        # remove the background colour from semi-transparent edge pixels (no white fringe)
        af = np.maximum(alpha, 1e-3)[..., None]
        bgr[:] = np.clip((bgr.astype(np.float32) - (1 - af) * med) / af, 0, 255).astype(np.uint8)
        return (alpha * 255).astype(np.uint8)
    # busy background → GrabCut on a reduced copy
    s = min(1.0, 700 / max(h, w))
    small = cv2.resize(bgr, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    mask = np.full(small.shape[:2], cv2.GC_PR_FGD, np.uint8)
    b = 6
    mask[:b], mask[-b:], mask[:, :b], mask[:, -b:] = cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD
    cv2.grabCut(small, mask, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
    a = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    return cv2.GaussianBlur(cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR), (3, 3), 0)


def split_sheet(img, alpha, order):
    """Find each figure on a sheet and return {pose: rgba crop}."""
    h, w = alpha.shape
    # drop caption banners (wide, flat shapes) so they don't merge with the feet
    n0, lab0, st0, _ = cv2.connectedComponentsWithStats((alpha > 30).astype(np.uint8))
    for i in range(1, n0):
        bw, bh = st0[i, cv2.CC_STAT_WIDTH], st0[i, cv2.CC_STAT_HEIGHT]
        if bw > bh * 2.8 and bh < h * 0.06:
            alpha[lab0 == i] = 0
    k = max(3, int(min(h, w) * 0.008))
    merged = cv2.dilate((alpha > 30).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    n, lab, st, cen = cv2.connectedComponentsWithStats(merged)
    areas = st[1:, cv2.CC_STAT_AREA]
    if not len(areas): raise SystemExit('no figures found on the sheet')
    big_ref = np.median(np.sort(areas)[::-1][:len(order)])
    blobs = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > big_ref * 0.2]
    # glow trails, sparkles and other detached bits join the nearest figure
    for i in range(1, n):
        if i in blobs or st[i, cv2.CC_STAT_AREA] < 20: continue
        j = min(blobs, key=lambda j: np.hypot(*(cen[i] - cen[j])))
        lab[lab == i] = j
    for j in blobs:                                          # recompute bounding boxes
        ys, xs = np.where(lab == j)
        st[j, :4] = [xs.min(), ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1]
        cen[j] = [(xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2]
    hts = np.median([st[i, cv2.CC_STAT_HEIGHT] for i in blobs])
    # group into rows by vertical centre, then left→right
    blobs.sort(key=lambda i: cen[i][1])
    rows, cur = [], [blobs[0]]
    for i in blobs[1:]:
        if cen[i][1] - np.mean([cen[j][1] for j in cur]) > hts * 0.5: rows.append(cur); cur = [i]
        else: cur.append(i)
    rows.append(cur)
    ordered = [i for r in rows for i in sorted(r, key=lambda i: cen[i][0])]
    print(f'found {len(ordered)} figures in {len(rows)} rows ({", ".join(str(len(r)) for r in rows)})')
    if len(ordered) != len(order):
        print(f'WARNING: expected {len(order)} poses ({",".join(order)}); extra figures are ignored')
    rgba = np.dstack([img[..., :3], alpha])
    out = {}
    for pose, i in zip(order, ordered):
        if pose == 'skip': continue
        x, y, bw, bh = st[i, :4]
        m = (lab[y:y + bh, x:x + bw] == i)
        crop = rgba[y:y + bh, x:x + bw].copy()
        crop[..., 3] = np.where(m, crop[..., 3], 0)
        out[pose] = crop
    return out


def split_grid(img, alpha, order, cols, rows):
    """Evenly spaced sheet: each connected piece goes to the cell holding most of it;
    pieces that substantially cover two cells (touching figures) are split at the boundary."""
    h, w = alpha.shape
    n0, lab0, st0, _ = cv2.connectedComponentsWithStats((alpha > 30).astype(np.uint8))
    for i in range(1, n0):                                   # caption banners
        bw, bh = st0[i, cv2.CC_STAT_WIDTH], st0[i, cv2.CC_STAT_HEIGHT]
        if bw > bh * 2.8 and bh < h * 0.06: alpha[lab0 == i] = 0
    n, lab = cv2.connectedComponents((alpha > 30).astype(np.uint8))
    cw, ch = w / cols, h / rows
    yy, xx = np.indices((h, w))
    cell_of = (np.minimum(yy // ch, rows - 1) * cols + np.minimum(xx // cw, cols - 1)).astype(np.int32)
    owner = np.full((h, w), -1, np.int32)
    for i in range(1, n):
        m = lab == i
        cells, cnt = np.unique(cell_of[m], return_counts=True)
        if len(cells) > 1 and np.sort(cnt)[-2] > cnt.sum() * 0.25:
            owner[m] = cell_of[m]                             # merged figures → split by cell
        else:
            owner[m] = cells[np.argmax(cnt)]
    rgba = np.dstack([img[..., :3], alpha])
    out = {}
    for idx, pose in enumerate(order):
        if pose == 'skip' or idx >= cols * rows: continue
        m = owner == idx
        if m.sum() < 200: continue
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(m[y0:y1, x0:x1], crop[..., 3], 0)
        out[pose] = crop
    print(f'grid {cols}x{rows}: got {len(out)} poses')
    return out


_SR = {}
def upscale2(rgba, model):
    """2x super-resolution (OpenCV dnn_superres; models in ~/.sr). Colours are bled into the
    transparent border first so the network doesn't pull dark halos into the edges."""
    if model not in _SR:
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(str(pathlib.Path.home() / '.sr' / f'{model.upper()}_x2.pb')); sr.setModel(model, 2); _SR[model] = sr
    rgb, a = np.ascontiguousarray(rgba[..., :3]), rgba[..., 3]
    hole = ((a < 10) & (cv2.dilate((a >= 10).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0)).astype(np.uint8)
    rgb = cv2.inpaint(rgb, hole, 3, cv2.INPAINT_TELEA)
    up = _SR[model].upsample(rgb)
    if model == 'fsrcnn':                                     # light unsharp mask to crisp up line art
        up = cv2.addWeighted(up, 1.5, cv2.GaussianBlur(up, (0, 0), 1.2), -0.5, 0)
    au = cv2.resize(a, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
    return np.dstack([up, au])


def erase_captions(img, bands):
    """Inside each band, erase only the dark-blue caption boxes (and their white text)."""
    if img.shape[2] == 3: img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    b, g, r, a = [img[..., i].astype(np.int16) for i in range(4)]
    for band in bands.split(','):
        y0, y1 = map(int, band.split('-'))
        lab = ((b > 70) & (r < 50) & (g < 85) & (b - g > 35) & (a > 0))[y0:y1].astype(np.uint8)
        lab = cv2.dilate(lab, np.ones((9, 25), np.uint8))
        n, cc, st, _ = cv2.connectedComponentsWithStats(lab)
        for i in range(1, n):
            x, y, w, h, area = st[i]
            if w > 60: img[y0 + y:y0 + y + h, max(0, x - 4):x + w + 4, 3] = 0
    return img


def anchor(rgba, pose):
    """(x, y) of the point between the feet: torso centre horizontally, lowest pixel vertically."""
    a = rgba[..., 3] > 60
    ys, xs = np.where(a)
    y0, y1 = ys.min(), ys.max()
    if pose == 'down':
        return (xs.min() + xs.max()) / 2, y1 + 1
    top = ys < y0 + (y1 - y0) * 0.32                         # head + shoulders: stable across kicks/punches
    return float(xs[top].mean()), y1 + 1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('fighter')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--sheet'); g.add_argument('--folder')
    ap.add_argument('--order', default=','.join(POSES))
    ap.add_argument('--grid', help='COLSxROWS for evenly spaced sheets, e.g. 5x3')
    ap.add_argument('--cut-bands', help='pixel row ranges to erase first (caption strips), e.g. 318-352,643-680')
    ap.add_argument('--panel-normalize', action='store_true',
                    help='poses came from differently sized panels: rescale each panel row to consistent proportions')
    ap.add_argument('--upscale', choices=['edsr', 'fsrcnn'], help='2x AI upscale of low-resolution source poses first')
    ap.add_argument('--height', type=float, default=300, help='idle height in game units (drawn fighters are ~300)')
    args = ap.parse_args()

    if args.sheet:
        img = read(args.sheet)
        if args.cut_bands:
            img = erase_captions(img, args.cut_bands)
        order = [p.strip() for p in args.order.split(',')]
        if args.grid:
            cols, rows = map(int, args.grid.lower().split('x'))
            poses = split_grid(img, foreground(img), order, cols, rows)
        else:
            poses = split_sheet(img, foreground(img), order)
    else:
        poses = {}
        for p in pathlib.Path(args.folder).iterdir():
            if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp') and p.stem.lower() in POSES:
                img = read(p)
                poses[p.stem.lower()] = np.dstack([img[..., :3], foreground(img)])
    if 'idle' not in poses:
        raise SystemExit('need an idle pose')

    if args.upscale:
        for k in list(poses):
            poses[k] = upscale2(poses[k], args.upscale); print(f'  upscaled {k}', flush=True)
    out = ROOT / 'assets' / 'sprites' / args.fighter
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    ys = np.where(poses['idle'][..., 3] > 60)[0]
    scale = WORK_PX / (ys.max() - ys.min() + 1)              # one pixel scale for every pose
    conf = {'scale': round(args.height / WORK_PX, 5), 'poses': {}}
    # Panel sheets draw some rows bigger. Pose-height ratios taken from a consistently drawn
    # sheet (Cesar's) put each row back at the idle pose's scale.
    row_scale = {}
    if args.panel_normalize:
        hgt = lambda p: np.ptp(np.where(poses[p][..., 3] > 60)[0]) + 1
        idle_h = hgt('idle')
        for members, ref, ratio in ((['lp', 'hp', 'lk', 'hk'], 'hp', 0.99),
                                    (['special', 'ultimate', 'win'], 'win', 1.04),
                                    (['hit', 'down', 'lose'], 'hit', 0.92)):
            if ref in poses:
                f = ratio * idle_h / hgt(ref)
                for m in members: row_scale[m] = f
                print(f'  rows {",".join(members)}: x{f:.2f}')
    for pose in POSES:
        if pose not in poses: continue
        im = poses[pose]
        k = scale * row_scale.get(pose, 1)
        im = cv2.resize(im, (max(1, round(im.shape[1] * k)), max(1, round(im.shape[0] * k))), interpolation=cv2.INTER_AREA)
        ys, xs = np.where(im[..., 3] > 8)
        im = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        ax, ay = anchor(im, pose)
        cv2.imwrite(str(out / f'{pose}.webp'), im, [cv2.IMWRITE_WEBP_QUALITY, 86])
        conf['poses'][pose] = {'ax': round(float(ax), 1), 'ay': round(float(ay), 1)}
        print(f'  {pose:9s} {im.shape[1]:4d}x{im.shape[0]:<4d} feet at ({ax:.0f},{ay:.0f})')
    (out / 'sprites.json').write_text(json.dumps(conf, indent=1))
    print(f'wrote {len(conf["poses"])} poses to {out.relative_to(ROOT)}  →  now run: python3 build.py')


if __name__ == '__main__':
    main()
