#!/usr/bin/env python3
"""Record where the white logo badge sits in each sprite of a fighter (sprites.json "logo"
boxes), so the game can keep the text readable when the sprite is mirrored.
Usage: python3 tools/mark_logos.py gordon"""
import sys, json, pathlib, cv2, numpy as np
d = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'sprites' / sys.argv[1]
cfg = json.loads((d / 'sprites.json').read_text())
for pose, v in cfg['poses'].items():
    im = cv2.imread(str(d / f'{pose}.webp'), cv2.IMREAD_UNCHANGED)
    white = ((im[..., :3].min(axis=2) > 215) & (im[..., 3] > 200)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white)
    best = None
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a > 400 and 1.1 < w / h < 2.6 and a > w * h * 0.55 and (best is None or a > best[4]): best = st[i]
    v.pop('logo', None)
    if best is not None:
        x, y, w, h, _ = best.tolist(); v['logo'] = [x - 2, y - 2, w + 4, h + 4]; print(pose, v['logo'])
(d / 'sprites.json').write_text(json.dumps(cfg, indent=1))
