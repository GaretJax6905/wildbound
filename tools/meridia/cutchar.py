import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
OUTD='/tmp/meridia/chars'
def cut(sheet, names, rows=('ready','defeat'), W0=288, H0=392):
    a=np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    H,W,_=a.shape; n=len(names)
    border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)])
    bg=np.median(border,0); d=np.abs(a-bg).sum(2); fg=d>38
    lab,_=nd.label(~fg); edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fgm=nd.binary_opening(~np.isin(lab,list(edge)),iterations=1)
    lab2,m=nd.label(nd.binary_dilation(fgm,iterations=2))
    cells={}
    nr=len(rows)
    for i,sl in enumerate(nd.find_objects(lab2)):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        area=int(((lab2[sl]==i+1)&fgm[sl]).sum())
        if area<120: continue
        if h<26 and w>2.2*h: continue
        cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
        r=min(nr-1,int(cy/H*nr)); c=min(n-1,int(cx/W*n))
        cells.setdefault((r,c),[]).append((i+1,area))
    out=[]
    for c,nm in enumerate(names):
        if not nm: continue
        for r,pose in enumerate(rows):
            if not pose: continue
            parts=cells.get((r,c))
            if not parts: print('missing',nm,pose); continue
            big=max(ar for _,ar in parts)
            keep=[i for i,ar in parts if ar>=big*0.004]
            mask=np.isin(lab2,keep)&fgm
            ys,xs=np.where(mask); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
            rgba=np.zeros((y1-y0,x1-x0,4),np.uint8); rgba[...,:3]=a[y0:y1,x0:x1]; rgba[...,3]=mask[y0:y1,x0:x1]*255
            al=rgba[...,3]>0; light=rgba[...,:3].min(2)>225
            fr=nd.binary_dilation(~al)&al&light; rgba[fr,3]=0
            im=Image.fromarray(rgba); w,h=im.size
            out.append((nm,pose,im))
    return out
def place(im, W0=288, H0=392, maxh=380, scale=None):
    w,h=im.size; s=scale or min(maxh/h,(W0-8)/w)
    im=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    o=Image.new('RGBA',(W0,H0),(0,0,0,0)); o.alpha_composite(im,((W0-im.width)//2,H0-6-im.height)); return o
if __name__=='__main__':
    sheet=sys.argv[1]; names=sys.argv[2].split(',')
    res=cut(sheet,names)
    # defeat poses use the same scale as the ready pose so they look smaller/kneeling
    sc={}
    for nm,pose,im in res:
        if pose=='ready': w,h=im.size; sc[nm]=min(380/h,280/w)
    for nm,pose,im in res:
        place(im,scale=sc.get(nm)).save(f'{OUTD}/{nm}_{pose}.png')
        print(nm,pose,im.size)
