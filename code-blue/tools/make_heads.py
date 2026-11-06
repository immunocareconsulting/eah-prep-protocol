#!/usr/bin/env python3
"""Cut fighter heads out of the reference artwork (GrabCut), add a cartoon ink outline,
and save transparent PNGs to assets/heads/. build.py embeds them into index.html.

Usage: python3 tools/make_heads.py <martel_src> <ruben_src> <cesar_src>
Requires: pip install opencv-python-headless numpy
"""
import sys, pathlib
import cv2, numpy as np

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'heads'
OUT.mkdir(parents=True, exist_ok=True)

# id: (crop box x0,y0,x1,y1 in source pixels, neck cut y in source pixels, cartoonize?)
SPEC = {
    'martel': ((326, 258, 510, 500), 494, False),
    'ruben':  ((140, 92, 370, 412), 404, False),
    'cesar':  ((326, 596, 804, 1322), 1306, True),
}

def cartoonize(img):
    """Push a photo toward the illustrated house style: flat-ish shading + ink lines."""
    sty = img
    for _ in range(4): sty = cv2.bilateralFilter(sty, 9, 40, 9)
    hsv = cv2.cvtColor(sty, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 1.25; hsv[..., 2] = np.clip(hsv[..., 2] * 1.06, 0, 255)
    sty = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    gray = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 7)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 21, 12)
    edges = cv2.morphologyEx(255 - edges, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    edges = cv2.GaussianBlur(edges, (3, 3), 0).astype(np.float32)[..., None] / 255
    out = (sty * (1 - edges * 0.3)).astype(np.uint8)
    return out

def cut(src, box, cut_y, toon, name):
    img = cv2.imread(src)
    x0, y0, x1, y1 = box
    crop = img[y0:y1, x0:x1].copy()
    h, w = crop.shape[:2]
    mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    b = max(3, w // 60)
    mask[:b, :] = mask[:, :b] = mask[:, -b:] = cv2.GC_BGD
    mask[cut_y - y0:, :] = cv2.GC_BGD
    # the face centre is certainly foreground
    cy, cx = int(h * 0.5), w // 2
    cv2.ellipse(mask, (cx, cy), (int(w * 0.22), int(h * 0.25)), 0, 0, 360, cv2.GC_FGD, -1)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(crop, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the largest blob, fill holes
    n, lab, stats, _ = cv2.connectedComponentsWithStats(alpha)
    if n > 1:
        k = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]); alpha = np.where(lab == k, 255, 0).astype(np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
    cnts, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    alpha = np.zeros_like(alpha); cv2.drawContours(alpha, cnts, -1, 255, -1)
    if toon: crop = cartoonize(crop)
    # scale to game resolution
    H = 200; s = H / h
    crop = cv2.resize(crop, (int(w * s), H), interpolation=cv2.INTER_AREA)
    alpha = cv2.resize(alpha, (int(w * s), H), interpolation=cv2.INTER_AREA)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    # ink outline
    pad = 6
    crop = cv2.copyMakeBorder(crop, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0))
    alpha = cv2.copyMakeBorder(alpha, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    ring = cv2.dilate((alpha > 110).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    ink = np.array([43, 24, 20], np.uint8)  # #14182b in BGR
    a = alpha.astype(np.float32)[..., None] / 255
    rgb = (crop * a + ink * (1 - a)).astype(np.uint8)
    out_a = np.maximum(alpha, ring)
    # fade the cut-off neck so it blends into the drawn neck/collar
    fade = int(H * 0.06)
    for i in range(fade):
        row = out_a.shape[0] - pad - fade + i
        out_a[row] = (out_a[row] * (1 - i / fade)).astype(np.uint8)
    out_a[out_a.shape[0] - pad:] = 0
    ys, xs = np.where(out_a > 0)
    rgba = cv2.merge([*cv2.split(rgb), out_a])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(str(OUT / f'{name}.png'), rgba)
    print(name, rgba.shape)

if __name__ == '__main__':
    for name, src in zip(['martel', 'ruben', 'cesar'], sys.argv[1:4]):
        box, cy, toon = SPEC[name]
        cut(src, box, cy, toon, name)
