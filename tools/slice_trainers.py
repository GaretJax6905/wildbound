import sys, os
import numpy as np
sys.path.insert(0, '/tmp/art')
from slice2 import load, figures, split, save, drop_disc, largest_only
SCALE = {}
SRC = '/mnt/user-data/uploads/wildbound creatures'
OUT = 'tr'; os.makedirs(OUT, exist_ok=True)
SHEETS = [
 ('Characters 1', (0.0, 0.25, 1.0, 1.0), 'ready', [['jolt', 'marina', 'kenta'], ['sable', 'ignis', 'vesper'], ['frida', 'morrow', None, 'raze']]),
 ('Characters 1', (0.0, 0.0, 0.25, 0.26), 'ready', [['kai']]),
 ('Characters 1', (0.27, 0.0, 0.44, 0.26), 'ready', [['juno']]),
 ('Characters 1', (0.607, 0.0, 0.765, 0.26), 'ready', [['shale']]),
 ('Characters 1', (0.77, 0.0, 1.0, 0.26), 'ready', [['briar']]),
 ('Character 1 (Defeated)', None, 'defeat', [['kai', 'juno', 'shale', 'briar'], ['jolt', 'marina', 'kenta'], ['sable', 'ignis', 'vesper'], ['frida', 'morrow', 'raze']]),
 ('Characters 2', None, 'ready', [['bugkid', 'lass', 'boy', 'birdkeeper'], ['beauty', 'acetrainer', 'hiker', 'fisher'], ['swimmer', 'blackbelt', 'mystic', 'psychic'], ['vex', 'nyx', 'corvo', 'grunt'], []]),
 ('Characters 2 Defeated', None, 'defeat', [['bugkid', 'lass', 'boy', 'birdkeeper'], ['beauty', 'acetrainer', 'hiker', 'fisher'], ['swimmer', 'blackbelt', 'mystic', 'psychic'], ['vex', 'nyx', 'corvo', 'grunt'], []]),
 ('Characters 3', (0.0, 0.0, 0.35, 0.36), 'ready', [['maple']]),
]
ORBS = {'bugkid', 'boy', 'acetrainer', 'swimmer', 'grunt', 'nurse'}
for fn, crop, pose, rows in sorted(SHEETS, key=lambda e: e[2] != 'ready'):
    im = load(os.path.join(SRC, fn + '.jpg'), crop)
    got, bg, dist = figures(im, row_gap=0.12, join=0.008)
    if len(rows) == 1 and len(rows[0]) == 1:
        allf = [f for r in got for f in r]
        got = [[max(allf, key=lambda f: f[1].sum())]]
    print(fn, crop and crop[:2], [len(r) for r in got], 'want', [len(r) for r in rows])
    for rf, names in zip(got, rows):
        if len(names) == 1 and len(rf) > 1 or len(got) > len(rows) and len(rows) == 1:
            pass
        while 0 < len(rf) < len(names):
            i = max(range(len(rf)), key=lambda k: rf[k][1].shape[1])
            rf = rf[:i] + split(rf[i]) + rf[i + 1:]
        if len(rf) != len(names): print('  row mismatch', len(rf), names)
        for f, name in zip(rf, names):
            if not name: continue
            g = drop_disc(im, f)
            if pose == 'ready' and name in ('juno', 'shale'):
                # a blurred stray head sits between these two on the sheet: drop its bluish pixels
                (sy, sx), mm = g
                rgb = im[sy, sx]
                yy = np.arange(mm.shape[0])[:, None] / mm.shape[0]
                ghost = (rgb[..., 2] - rgb[..., 0] > 10) & (rgb[..., 2] >= rgb[..., 1]) & (yy > 0.3)
                g = ((sy, sx), mm & ~ghost)
            if name in ('juno', 'shale', 'oldman', 'maple'): g = largest_only(g, 0.08)
            sc = save(im, bg, dist, g, os.path.join(OUT, f'{name}_{pose}.png'), size=(288, 392), orbs=name in ORBS and pose == 'ready', scale=SCALE.get(name) if pose != 'ready' else None, gaps=True)
            if pose == 'ready': SCALE[name] = sc
