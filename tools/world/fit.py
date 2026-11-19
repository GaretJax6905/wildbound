import numpy as np, json
from PIL import Image, ImageFilter
CUT='/tmp/world/cut'; OUT='/home/claude/wildbound/static/art/world'
SIZES={'center':(5,4),'mart':(5,4),'house':(5,4),'house2':(5,4),'gym':(7,5),'lab':(7,4),'tower':(7,6),'league':(9,6)}
MAXOVER=12
def crisp(im, w, h):
    im=im.crop(im.getbbox())
    # premultiplied downscale, then hard alpha and a light sharpen
    r=im.resize((w,h),Image.LANCZOS)
    a=np.asarray(r).copy()
    a[...,3]=np.where(a[...,3]>120,255,0)
    out=Image.fromarray(a)
    rgb=out.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1,percent=60,threshold=2))
    out=Image.merge('RGBA',(*rgb.split(),out.split()[3]))
    return out
idx={'buildings':{}, 'tiles':{}}
for kind,(tw,th) in SIZES.items():
    for var in ('', '_snow'):
        try: im=Image.open(f'{CUT}/{kind}{var}.png')
        except FileNotFoundError: continue
        im=im.crop(im.getbbox()); w0,h0=im.size
        W,H=tw*16,th*16
        s=min(W/w0,(H+MAXOVER)/h0)
        w,h=round(w0*s),round(h0*s)
        out=crisp(im,w,h)
        out.save(f'{OUT}/b_{kind}{var}.png')
        idx['buildings'][kind+var]={'w':w,'h':h}
        print(kind+var,(w,h),'footprint',(W,H))
# 16x16 props: scale to fit; 'fill' props stretch wider
PROPS={'tree':16,'pine':16,'palm':16,'deadtree':16,'bush':13,'rock':13,'crack':14,'pushrock':14,
       'flower_r':14,'flower_y':14,'fence':16,'sign':14,'tall':16,'snowgrass':16,'lily':14,'stump':12,
       'bed':16,'tv':15,'shelf':16,'table':14,'pc':15,'plant':14,'counter':16,'healer':15,'mat':14,'stove':15,
       'fridge':16,'chair':13,'console':16,'statue':15,'crate':14,'armchair':14,
       'stalagmite':16,'caveboulder':14,'cavecrack':13,'crystal':14,'mushroom':12,'rockpile':14,'magmarock':14,'crystal2':12,'redshroom':12}
for n,box in PROPS.items():
    im=Image.open(f'{CUT}/{n}.png'); im=im.crop(im.getbbox()); w0,h0=im.size
    if n in ('tall','snowgrass','fence','counter','mat'):
        w,h=16,max(6,round(h0*16/w0)) if n!='tall' and n!='snowgrass' else 13
    else:
        s=box/max(w0,h0); w,h=max(1,round(w0*s)),max(1,round(h0*s))
    out=crisp(im,w,h); out.save(f'{OUT}/t_{n}.png'); idx['tiles'][n]={'w':w,'h':h}
json.dump(idx,open(f'{OUT}/index.json','w'))
