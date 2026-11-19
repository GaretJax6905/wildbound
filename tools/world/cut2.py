import numpy as np
from PIL import Image
from scipy import ndimage as nd
def silhouette_objects(path, T=10, close=6, minsize=20000, crop=None):
    im=Image.open(path).convert('RGB')
    if crop: im=im.crop(crop)
    a=np.asarray(im).astype(int)
    border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)])
    bg=np.median(border,0); d=np.abs(a-bg).sum(2)
    fg=d>T
    fg=nd.binary_opening(fg,iterations=1)
    sil=nd.binary_closing(np.pad(fg,close+2),iterations=close)[close+2:-close-2,close+2:-close-2]
    sil=nd.binary_fill_holes(sil)
    sil=nd.binary_opening(sil,iterations=2)
    lab,n=nd.label(sil)
    out=[]
    for i,s in enumerate(nd.find_objects(lab)):
        h=s[0].stop-s[0].start; w=s[1].stop-s[1].start
        if h*w<minsize: continue
        m=lab[s]==i+1
        rgba=np.zeros((h,w,4),np.uint8); rgba[...,:3]=a[s]; rgba[...,3]=m*255
        out.append(((s[0].start+s[0].stop)/2,(s[1].start+s[1].stop)/2,Image.fromarray(rgba)))
    return out,a.shape[:2]
def place(objs,R,C,HW,names,OUT='/tmp/world/cut'):
    H,W=HW; g={}
    for cy,cx,im in objs:
        r=min(R-1,int(cy/H*R)); c=min(C-1,int(cx/W*C))
        if (r,c) not in g or im.size[0]*im.size[1]>g[(r,c)].size[0]*g[(r,c)].size[1]: g[(r,c)]=im
    for k,(r,c) in enumerate([(i,j) for i in range(R) for j in range(C)]):
        g[(r,c)].save(f'{OUT}/{names[k]}.png'); print(names[k],g[(r,c)].size)
o,HW=silhouette_objects('src/bld_town_snow.jpg',T=10,close=8)
place(o,2,2,HW,['house_snow','house2_snow','center_snow','mart_snow'])
o,HW=silhouette_objects('src/bld_big_snow.jpg',T=10,close=5,minsize=8000,crop=(0,0,1024,559))
place(o,1,2,HW,['gym_snow','lab_snow'])
# fence and tall grass: drop every near-background pixel, not just edge-connected ones
for f,names,cells in []: pass
