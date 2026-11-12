import sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd

SRC = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
# file -> rows of names; each name gets front, back in order (extra figures ignored)
LAYOUT = {
  'Abyssalotl.jpg': [['abyssalotl']], 'Blazelynx.jpg': [['blazelynx']], 'Emberkit.jpg': [['emberkit']],
  'Grovemaw.jpg': [['grovemaw']], 'Infernyx.jpg': [['infernyx']], 'Puddlefin.jpg': [['puddlefin']],
  'Sproutmole.jpg': [['sproutmole']], 'Thornmole.jpg': [['thornmole']], 'Tidalotl.jpg': [['tidalotl']],
  'Bunnip Hopscot.jpg': [['bunnip', 'hopscot']],
  'Buzzlet Voltwasp.jpg': [['buzzlet'], ['voltwasp']],
  'Gustling Galehawk Tempestalon.jpg': [['gustling', 'galehawk'], ['tempestalon']],
  'Monolox Dunepup Mesaruff.jpg': [['monolox'], ['dunepup', 'mesaruff']],
  'Pebbit Bouldox.jpg': [['pebbit'], ['bouldox']],
  'Twigling Barkmantis.jpg': [['twigling'], ['barkmantis']],
}
SIZE = 384

def cut(fn, rows):
    im = np.asarray(Image.open(os.path.join(SRC, fn)).convert('RGB')).astype(np.int32)
    H, W, _ = im.shape
    corners = np.concatenate([im[:20, :20].reshape(-1, 3), im[:20, -20:].reshape(-1, 3), im[-20:, :20].reshape(-1, 3), im[-20:, -20:].reshape(-1, 3)])
    bg = np.median(corners, 0)
    dist = np.sqrt(((im - bg) ** 2).sum(2))
    near = dist < 38
    lab, n = nd.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bgmask = np.isin(lab, edge[edge > 0])
    sizes = nd.sum(near, lab, range(n + 1))
    holes = (sizes > H * W * 0.0006) & (np.arange(n + 1) > 0)
    bgmask |= holes[lab]
    fg = ~bgmask
    fg = nd.binary_opening(fg, iterations=2)
    # drop small bits (label text, specks)
    lab, n = nd.label(fg)
    sl = nd.find_objects(lab)
    keep = np.zeros(n + 1, bool)
    for i, s in enumerate(sl, 1):
        h = s[0].stop - s[0].start; w = s[1].stop - s[1].start
        if h > H * 0.045 or w > W * 0.06: keep[i] = True
    fg = keep[lab]
    # group pieces into figures
    grp, g = nd.label(nd.binary_dilation(fg, iterations=int(H * 0.012)))
    figs = []
    for i, s in enumerate(nd.find_objects(grp), 1):
        m = (grp[s] == i) & fg[s]
        if m.sum() < H * W * 0.004: continue
        figs.append((s, m))
    # rows by vertical centre, then left to right
    figs.sort(key=lambda f: (f[0][0].start + f[0][0].stop) / 2)
    rowlist = []
    for f in figs:
        cy = (f[0][0].start + f[0][0].stop) / 2
        if rowlist and abs(cy - rowlist[-1][0]) < H * 0.18: rowlist[-1][1].append(f)
        else: rowlist.append([cy, [f]])
    out = []
    for (cy, rf), names in zip(rowlist, rows):
        rf.sort(key=lambda f: f[0][1].start)
        if len(rf) < 2 * len(names) and len(rf) == 1:
            s, m = rf[0]
            cols = m.sum(0); w = m.shape[1]
            cx = int(w * 0.3) + int(np.argmin(cols[int(w * 0.3):int(w * 0.7)]))
            def sub(x0, x1):
                mm = m[:, x0:x1]; ys = np.where(mm.any(1))[0]; xs = np.where(mm.any(0))[0]
                y0, y1 = ys[0], ys[-1] + 1; xa, xb = xs[0], xs[-1] + 1
                return ((slice(s[0].start + y0, s[0].start + y1), slice(s[1].start + x0 + xa, s[1].start + x0 + xb)), mm[y0:y1, xa:xb])
            rf = [sub(0, cx), sub(cx, w)]
        for k, name in enumerate(names):
            for side, f in zip(['front', 'back'], rf[2 * k:2 * k + 2]):
                s, m = f
                rgb = im[s].astype(np.uint8)
                # soft edge: alpha ramps with distance from background colour near the border of the mask
                d = dist[s]
                a = np.clip((d - 10) / 40, 0, 1)
                inner = nd.binary_erosion(m, iterations=3)
                alpha = np.where(inner, 1.0, np.where(m, np.maximum(a, 0.0), 0.0))
                # un-mix the white fringe
                af = np.maximum(alpha[..., None], 1e-3)
                col = np.clip((rgb - bg * (1 - af)) / af, 0, 255)
                col = np.where(alpha[..., None] > 0, col, 0).astype(np.uint8)
                rgba = Image.fromarray(np.dstack([col, (alpha * 255).astype(np.uint8)]), 'RGBA')
                w, h = rgba.size
                sc = (SIZE - 8) / max(w, h)
                rgba = rgba.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)
                canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
                canvas.paste(rgba, ((SIZE - rgba.width) // 2, SIZE - 4 - rgba.height), rgba)
                canvas.save(os.path.join(OUT, f'{name}_{side}.png'), optimize=True)
                out.append(f'{name}_{side}')
    print(fn, 'figures:', len(figs), 'rows:', [len(r[1]) for r in rowlist], '->', out)

for fn, rows in LAYOUT.items():
    cut(fn, rows)
