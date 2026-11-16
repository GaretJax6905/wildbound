"""Cut figures out of concept-art sheets (white/plain background, labels under each figure).

figures(path, crop) -> list of rows, each a list of (slice, mask) left to right
save(...)           -> RGBA cut-out fitted into a fixed canvas, bottom-centred
"""
import os, numpy as np
from PIL import Image
from scipy import ndimage as nd


def load(path, crop=None):
    pim = Image.open(path).convert('RGB')
    if crop:
        pim = pim.crop((int(crop[0] * pim.width), int(crop[1] * pim.height), int(crop[2] * pim.width), int(crop[3] * pim.height)))
    return np.asarray(pim).astype(np.int32)


def figures(im, row_gap=0.18, min_part=(0.045, 0.06), min_fig=0.004, join=0.012):
    H, W, _ = im.shape
    corners = np.concatenate([im[:20, :20].reshape(-1, 3), im[:20, -20:].reshape(-1, 3), im[-20:, :20].reshape(-1, 3), im[-20:, -20:].reshape(-1, 3)])
    bg = np.median(corners, 0)
    dist = np.sqrt(((im - bg) ** 2).sum(2))
    near = dist < 38
    lab, n = nd.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bgmask = np.isin(lab, edge[edge > 0])
    sizes = nd.sum(near, lab, range(n + 1))
    means = np.asarray(nd.mean(dist, lab, range(n + 1)))
    holes = (sizes > H * W * 0.0006) & (np.arange(n + 1) > 0) & (means < 13)
    bgmask |= holes[lab]
    fg = nd.binary_opening(~bgmask, iterations=2)
    lab, n = nd.label(fg)
    keep = np.zeros(n + 1, bool)
    for i, s in enumerate(nd.find_objects(lab), 1):
        h = s[0].stop - s[0].start; w = s[1].stop - s[1].start
        if h > H * min_part[0] or w > W * min_part[1]: keep[i] = True
    fg = keep[lab]
    grp, g = nd.label(nd.binary_dilation(fg, iterations=max(1, int(H * join))))
    figs = []
    for i, s in enumerate(nd.find_objects(grp), 1):
        m = (grp[s] == i) & fg[s]
        if m.sum() < H * W * min_fig: continue
        figs.append((s, m))
    figs.sort(key=lambda f: (f[0][0].start + f[0][0].stop) / 2)
    rows = []
    for f in figs:
        cy = (f[0][0].start + f[0][0].stop) / 2
        if rows and abs(cy - rows[-1][0]) < H * row_gap: rows[-1][1].append(f)
        else: rows.append([cy, [f]])
    out = []
    for cy, rf in rows:
        rf.sort(key=lambda f: f[0][1].start)
        out.append(rf)
    return out, bg, dist


def split(f, parts=2):
    """split one merged figure into `parts` pieces at the emptiest columns"""
    s, m = f
    w = m.shape[1]
    cols = m.sum(0)
    cuts = [0]
    for k in range(1, parts):
        lo, hi = int(w * (k / parts - 0.18)), int(w * (k / parts + 0.18))
        cuts.append(lo + int(np.argmin(cols[lo:hi])))
    cuts.append(w)
    res = []
    for x0, x1 in zip(cuts, cuts[1:]):
        mm = m[:, x0:x1]
        ys = np.where(mm.any(1))[0]; xs = np.where(mm.any(0))[0]
        y0, y1 = ys[0], ys[-1] + 1; xa, xb = xs[0], xs[-1] + 1
        res.append(((slice(s[0].start + y0, s[0].start + y1), slice(s[1].start + x0 + xa, s[1].start + x0 + xb)), mm[y0:y1, xa:xb]))
    return res


def drop_disc(im, f):
    """remove the flat coloured stand under a character. The stand is an ellipse at the
    bottom of the figure: find its widest row, then clear stand-coloured pixels inside it."""
    s, m = f
    m = m.copy()
    h, w = m.shape
    rgb = im[s].astype(np.float64)
    widths = m.sum(1)
    lo = int(h * 0.62)
    yw = lo + int(np.argmax(widths[lo:]))          # widest row near the bottom = disc middle
    ybot = np.where(m.any(1))[0][-1]
    xs = np.where(m[yw])[0]
    if len(xs) < 2: return f
    cx, rx = (xs[0] + xs[-1]) / 2, (xs[-1] - xs[0]) / 2
    ry = max(4, ybot - yw)
    if rx < w * 0.3 or ry > h * 0.2: return f        # no clear stand
    yy, xx = np.mgrid[0:h, 0:w]
    ell = ((xx - cx) / (rx + 2)) ** 2 + ((yy - yw) / (ry + 2)) ** 2 <= 1.0
    # stand palette: pixels in the outer part of the ellipse (where no feet are)
    ring = ell & m & (np.abs(xx - cx) > rx * 0.55)
    pal = rgb[ring]
    if len(pal) < 20: return f
    # a few representative colours (coarse k-means)
    cents = pal[np.random.default_rng(0).choice(len(pal), 6, replace=False)]
    for _ in range(8):
        d = ((pal[:, None, :] - cents[None]) ** 2).sum(2)
        k = d.argmin(1)
        cents = np.array([pal[k == j].mean(0) if (k == j).any() else cents[j] for j in range(len(cents))])
    dist = np.sqrt(((rgb[..., None, :] - cents[None, None]) ** 2).sum(3)).min(2)
    kill = ell & (dist < 26)
    kill |= (yy > yw) & ell                       # everything below the disc's middle line is stand
    kill &= ~((yy < yw) & (dist >= 26))
    m &= ~kill
    m = nd.binary_opening(m, iterations=1)
    lab, n = nd.label(m)
    if n > 1:
        sizes = nd.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.where(sizes > sizes.max() * 0.03)[0])
    ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    y0, y1, x0, x1 = ys[0], ys[-1] + 1, xs[0], xs[-1] + 1
    return ((slice(s[0].start + y0, s[0].start + y1), slice(s[1].start + x0, s[1].start + x1)), m[y0:y1, x0:x1])


def paint_orb(img, cx, cy, R):
    """the in-game orb: teal top, cream bottom, gold band and gold diamond, dark outline"""
    from PIL import ImageDraw
    S = 8
    size = int(R * 2 + 4)
    big = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    c = size * S / 2; r = R * S
    d.ellipse([c - r, c - r, c + r, c + r], fill=(32, 32, 40, 255))
    r2 = r - S * 1.1
    d.pieslice([c - r2, c - r2, c + r2, c + r2], 180, 360, fill=(42, 168, 154, 255))
    d.pieslice([c - r2, c - r2, c + r2, c + r2], 0, 180, fill=(240, 230, 200, 255))
    d.rectangle([c - r2, c - S * 0.9, c + r2, c + S * 0.9], fill=(224, 176, 48, 255))
    q = r2 * 0.38
    d.polygon([(c, c - q), (c + q, c), (c, c + q), (c - q, c)], fill=(224, 176, 48, 255), outline=(32, 32, 40, 255))
    d.ellipse([c - r2 * 0.55 - S, c - r2 * 0.7 - S * 0.6, c - r2 * 0.55 + S, c - r2 * 0.7 + S * 0.6], fill=(255, 255, 255, 230))
    small = big.resize((size, size), Image.LANCZOS)
    img.alpha_composite(small, (int(round(cx - size / 2)), int(round(cy - size / 2))))
    return img


def recolor_orbs(rgba):
    """find small red-over-white balls and repaint them as the game's own orb
    (teal top, cream bottom, gold band)"""
    a = np.asarray(rgba).astype(np.int32).copy()
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    red = (al > 150) & (r > 120) & (r - g > 50) & (r - b > 40)
    white = (al > 150) & (np.minimum(np.minimum(r, g), b) > 175)
    H, W = red.shape
    found = []
    for rad in (22, 18, 15, 12, 10, 8, 6, 5):
        yy, xx = np.mgrid[-rad:rad + 1, -rad:rad + 1]
        disk = xx ** 2 + yy ** 2 <= rad ** 2
        up = disk & (yy < -1); dn = disk & (yy > 1)
        ru = nd.correlate(red.astype(float), up.astype(float), mode='constant') / up.sum()
        wd = nd.correlate(white.astype(float), dn.astype(float), mode='constant') / dn.sum()
        score = np.minimum(ru, wd)
        for _ in range(4):
            y, x = np.unravel_index(np.argmax(score), score.shape)
            if score[y, x] < 0.28: break
            if all((y - fy) ** 2 + (x - fx) ** 2 > (rad + fr) ** 2 for fy, fx, fr in found):
                found.append((y, x, rad))
            score[max(0, y - 2 * rad):y + 2 * rad, max(0, x - 2 * rad):x + 2 * rad] = 0
    img = Image.fromarray(a.astype(np.uint8), 'RGBA')
    ballish = red | white
    for y, x, rad in found:
        # fit the ball: red/white pixels around the hit
        y0, y1 = max(0, y - 2 * rad), min(H, y + 2 * rad + 1)
        x0, x1 = max(0, x - 2 * rad), min(W, x + 2 * rad + 1)
        lab, n = nd.label(nd.binary_closing(ballish[y0:y1, x0:x1], iterations=2))
        k = lab[min(y - y0, lab.shape[0] - 1), min(x - x0, lab.shape[1] - 1)]
        if k == 0:
            cy, cx, R = y, x, rad * 1.15
        else:
            ys, xs = np.where(lab == k)
            cy, cx = (ys.min() + ys.max()) / 2 + y0, (xs.min() + xs.max()) / 2 + x0
            R = max(ys.max() - ys.min(), xs.max() - xs.min()) / 2 + 1
        img = paint_orb(img, cx, cy, R + 1.5)
    return img, len(found)


def largest_only(f, frac=0.15):
    s, m = f
    lab, n = nd.label(m)
    if n < 2: return f
    sizes = nd.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, 1 + np.where(sizes >= sizes.max() * frac)[0])
    ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    y0, y1, x0, x1 = ys[0], ys[-1] + 1, xs[0], xs[-1] + 1
    return ((slice(s[0].start + y0, s[0].start + y1), slice(s[1].start + x0, s[1].start + x1)), m[y0:y1, x0:x1])


def save(im, bg, dist, f, path, size=(384, 384), pad=4, orbs=False, scale=None, gaps=False):
    s, m = f
    rgb = im[s].astype(np.float64)
    d = dist[s]
    if gaps:
        m = m.copy()
        nearbg = m & (d < 30)
        lab, n = nd.label(nearbg)
        hh = m.shape[0]
        for i, sl in enumerate(nd.find_objects(lab), 1):
            comp = lab == i
            if sl[0].stop < hh * 0.55: continue
            dv = d[comp]
            if dv.mean() < 14 and dv.std() < 7 and comp.sum() > 40:
                # opens to the outside at the bottom or sides of the figure?
                edge = nd.binary_dilation(comp, iterations=2) & ~m
                if edge.any() or sl[0].stop >= hh - 2: m &= ~comp
    a = np.clip((d - 10) / 40, 0, 1)
    inner = nd.binary_erosion(m, iterations=3)
    alpha = np.where(inner, 1.0, np.where(m, a, 0.0))
    af = np.maximum(alpha[..., None], 1e-3)
    col = np.clip((rgb - bg * (1 - af)) / af, 0, 255)
    col = np.where(alpha[..., None] > 0, col, 0).astype(np.uint8)
    rgba = Image.fromarray(np.dstack([col, (alpha * 255).astype(np.uint8)]), 'RGBA')
    w, h = rgba.size
    W, H = size
    fit = min((W - 2 * pad) / w, (H - pad) / h)
    sc = min(scale, fit) if scale else fit
    rgba = rgba.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(rgba, ((W - rgba.width) // 2, H - pad - rgba.height), rgba)
    n = 0
    if orbs: canvas, n = recolor_orbs(canvas)
    canvas.save(path)
    return sc
