#!/usr/bin/env python3
"""Bundle src/*.js into a single self-contained index.html (works as a Claude Artifact)."""
import pathlib
root = pathlib.Path(__file__).parent
order = ['core.js', 'art.js', 'effects.js', 'fighters.js', 'arenas.js', 'match.js', 'app.js']
import base64, json
heads = {p.stem: 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((root / 'assets' / 'heads').glob('*.png'))}
js = 'const HEAD_DATA = ' + json.dumps(heads) + ';\n' + '\n'.join((root / 'src' / f).read_text() for f in order)
html = (root / 'template.html').read_text().replace('/*__SCRIPTS__*/', js)
(root / 'index.html').write_text(html)
print(f'index.html: {len(html)//1024} KB')
