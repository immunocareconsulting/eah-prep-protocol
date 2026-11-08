#!/usr/bin/env python3
"""Prepare arena backgrounds: erase the title banner in the top-left corner and save a
compressed 1600x900 JPEG to assets/arenas/<n>.jpg (build.py embeds them).
Usage: python3 tools/make_backgrounds.py   (reads art/backgrounds/0N_*.png)"""
import pathlib, cv2, numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
# banner boxes (x1, y1) in 1920x1080 source pixels, measured on the supplied images
BANNER = {1: (1075, 185), 2: (800, 200), 3: (1040, 180), 4: (610, 170), 5: (790, 150)}
for p in sorted((ROOT / 'art' / 'backgrounds').glob('0*.png')):
    n = int(p.name[:2]); img = cv2.imread(str(p))
    x1, y1 = BANNER.get(n, (0, 0))
    if x1:
        s = 0.5; small = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        m = np.zeros(small.shape[:2], np.uint8); m[:int(y1 * s) + 3, :int(x1 * s) + 3] = 255
        fill = cv2.inpaint(small, m, 9, cv2.INPAINT_TELEA)
        fill = cv2.GaussianBlur(fill, (0, 0), 4)
        big = cv2.resize(fill, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
        mask = np.zeros(img.shape[:2], np.float32); mask[:y1 + 6, :x1 + 6] = 1
        mask = cv2.GaussianBlur(mask, (0, 0), 6)[..., None]
        img = (img * (1 - mask) + big * mask).astype(np.uint8)
    img = cv2.resize(img, (1600, 900), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(ROOT / 'assets' / 'arenas' / f'{n}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 84])
    print(p.name, '->', f'assets/arenas/{n}.jpg')
