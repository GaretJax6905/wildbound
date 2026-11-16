from PIL import Image
from rembg import remove, new_session
import numpy as np
from scipy import ndimage as nd
sess = new_session('isnet-general-use')
SHEETS = {'front': '/mnt/user-data/uploads/39abe992-image.jpg', 'back': '/mnt/user-data/uploads/31db6a93-image.jpg'}
# cells (x0, y0, x1, y1) above each label
CELLS = {
 'elderoak':  (130, 0, 870, 535), 'mechatron': (930, 100, 1640, 535), 'skydrake': (1690, 0, 2560, 535),
 'pumpling':  (280, 590, 720, 915), 'gourdghast': (1060, 585, 1500, 915), 'sandcroc': (1680, 640, 2470, 915),
 'dunejaw':   (100, 980, 930, 1295), 'crabble': (970, 980, 1610, 1295), 'kingpincer': (1700, 960, 2400, 1295),
}
for side, path in SHEETS.items():
    sheet = Image.open(path).convert('RGB')
    for name, box in CELLS.items():
        crop = sheet.crop(box)
        out = remove(crop, session=sess)
        a = np.asarray(out).copy()
        al = a[..., 3] > 40
        lab, n = nd.label(al)
        if n > 1:
            sizes = nd.sum(al, lab, range(1, n + 1))
            keep = np.isin(lab, 1 + np.where(sizes >= sizes.max() * 0.04)[0])
            a[..., 3][~keep] = 0
        img = Image.fromarray(a)
        bb = img.getbbox()
        img = img.crop(bb)
        img.save(f'/tmp/art9/{name}_{side}.png')
        print(name, side, img.size)
