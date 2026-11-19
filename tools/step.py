import pickle, numpy as np
from PIL import Image
from scipy import ndimage as nd
def load(g):
    d=pickle.load(open(f'/tmp/hero/{g}.pkl','rb'))
    return {k:Image.frombytes('RGBA',s,b) for k,(b,s) in d.items()}
def clean(im):
    a=np.asarray(im).copy(); rgb=a[...,:3].astype(int)
    light=(rgb.min(2)>125)&((rgb.max(2)-rgb.min(2))<28)
    for _ in range(4):
        touch=nd.binary_dilation(a[...,3]==0)&light&(a[...,3]>0)
        if not touch.any(): break
        a[touch,3]=0
    return Image.fromarray(a)
def geom(a):
    al=a[...,3]>0; ys,xs=np.where(al)
    top,bot=ys.min(),ys.max(); h=bot-top
    # crotch gap: lowest-ish row band where middle column becomes transparent
    cx=int(round((xs.min()+xs.max())/2))
    return top,bot,h,cx
def shift(a,box,dy,dx=0):
    x0,x1,y0,y1=box
    reg=a[y0:y1,x0:x1].copy(); a[y0:y1,x0:x1,3]=0
    H,W=a.shape[:2]
    ny0=max(0,y0+dy); ny1=min(H,y1+dy); nx0=max(0,x0+dx); nx1=min(W,x1+dx)
    src=reg[ny0-(y0+dy):reg.shape[0]-((y1+dy)-ny1), nx0-(x0+dx):reg.shape[1]-((x1+dx)-nx1)]
    m=src[...,3]>0
    tgt=a[ny0:ny1,nx0:nx1]; tgt[m]=src[m]
def front_step(im, side):
    a=np.asarray(im).copy(); top,bot,h,cx=geom(a)
    hip=top+int(h*.74)          # legs start (below the hands)
    leg_lift=3
    if side=='L': lx0,lx1=cx-12,cx
    else: lx0,lx1=cx,cx+12
    shift(a,(lx0,lx1,hip,bot+1),-leg_lift)
    # opposite hand swings forward (drops 2 px, tucks in 1), same-side hand goes back (up 1)
    handy0=top+int(h*.58); handy1=top+int(h*.76)
    W=a.shape[1]
    left=(0,cx-8,handy0,handy1); right=(cx+8,W,handy0,handy1)
    fwd,back=(right,left) if side=='L' else (left,right)
    shift(a,fwd,2,-1 if fwd is right else 1)
    shift(a,back,-1)
    return Image.fromarray(a)
