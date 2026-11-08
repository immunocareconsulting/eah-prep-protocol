#!/usr/bin/env python3
"""Bundle src/*.js and art assets into a single self-contained index.html (works as a Claude Artifact).

Art picked up automatically:
  assets/heads/<id>.png             illustrated head cut-outs (tools/make_heads.py)
  assets/showcase/<id>.jpg|png      one full illustration per fighter (select, VS, ultimate cut-in, victory)
  assets/sprites/<id>/<pose>.png    illustrated fighting poses + sprites.json (tools/make_sprites.py)
"""
import base64, json, mimetypes, pathlib

root = pathlib.Path(__file__).parent
assets = root / 'assets'
order = ['core.js', 'art.js', 'effects.js', 'fighters.js', 'roster.js', 'arenas.js', 'match.js', 'app.js']


def data_url(p):
    mime = mimetypes.guess_type(p.name)[0] or 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()


heads = {p.stem: data_url(p) for p in sorted((assets / 'heads').glob('*.png'))}
showcase = {p.stem: data_url(p) for p in sorted((assets / 'showcase').glob('*')) if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')}
sprites = {}
for d in sorted((assets / 'sprites').glob('*')):
    cfg = d / 'sprites.json'
    if d.is_dir() and cfg.exists():
        conf = json.loads(cfg.read_text())
        imgs = {p.stem: data_url(p) for p in sorted(d.iterdir()) if p.suffix.lower() in ('.png', '.webp')}
        sprites[d.name] = {'scale': conf['scale'], 'poses': {k: dict(v, src=imgs[k]) for k, v in conf['poses'].items() if k in imgs}}

prelude = ''.join(f'const {name} = {json.dumps(val)};\n' for name, val in
                  [('EAH_LOGO', data_url(assets / 'eah_logo.png') if (assets / 'eah_logo.png').exists() else ''), ('HEAD_DATA', heads), ('SHOWCASE_DATA', showcase), ('SPRITE_DATA', sprites)])
js = prelude + '\n'.join((root / 'src' / f).read_text() for f in order)
html = (root / 'template.html').read_text().replace('/*__SCRIPTS__*/', js)
(root / 'index.html').write_text(html)
print(f'index.html: {len(html)//1024} KB  (heads: {len(heads)}, showcase: {len(showcase)}, sprite sets: {list(sprites)})')
