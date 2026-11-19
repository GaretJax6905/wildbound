import numpy as np, json, sys
from PIL import Image
NPC='/home/claude/wildbound/static/art/npc'
def A(im): return np.asarray(im.convert('RGBA')).copy()
def crotch(a):
    """row where the legs part (front/back views), or None for skirts/robes"""
    al=a[...,3]>0; h,w=al.shape
    cols=np.where(al.any(0))[0]; cx=(cols.min()+cols.max())//2
    y=h-1
    # walk up from the feet while the middle column (±1) is see-through
    gap=0
    while y>h*0.5 and not al[y,cx-1:cx+2].any():
        y-=1; gap+=1
    if gap < max(3,h*0.08): return None, cx
    return y+1, cx
def shift(a,x0,x1,y0,y1,dy,dx=0):
    h,w=a.shape[:2]
    reg=a[y0:y1,x0:x1].copy(); a[y0:y1,x0:x1,3]=0
    for y in range(reg.shape[0]):
        for x in range(reg.shape[1]):
            if reg[y,x,3]==0: continue
            ny,nx=y0+y+dy,x0+x+dx
            if 0<=ny<h and 0<=nx<w: a[ny,nx]=reg[y,x]
def front_steps(im):
    a=A(im); h,w=a.shape[:2]
    cy,cx=crotch(a)
    out=[]
    for side in (0,1):
        b=a.copy()
        if cy is not None:
            lift=max(1,round(h*0.05))
            x0,x1=(0,cx) if side==0 else (cx,w)
            shift(b,x0,x1,cy-1,h,-lift)
        else:
            # robe/skirt: sway the hem a pixel
            y0=int(h*0.8); shift(b,0,w,y0,h,0,-1 if side==0 else 1)
        out.append(Image.fromarray(b))
    return out
def side_step(im):
    a=A(im); h,w=a.shape[:2]
    s=max(1,round(w*0.08))
    pad=np.zeros((h,w+2*s,4),np.uint8); pad[:,s:s+w]=a; a=pad; w2=a.shape[1]
    al=a[...,3]>0; cols=np.where(al.any(0))[0]; cx=(cols.min()+cols.max())//2
    hip=int(h*0.8)
    b=a.copy()
    # stride: back leg (left half) goes back, front leg forward; the lower the row the wider
    reg=b[hip:,:].copy(); b[hip:,:,3]=0
    for y in range(reg.shape[0]):
        k=round(s*(y+1)/reg.shape[0])
        for x in range(w2):
            if reg[y,x,3]==0: continue
            nx=x-k if x<cx else x+k
            if 0<=nx<w2: b[hip+y,nx]=reg[y,x]
    # fill the crotch gap row-wise lightly: none (legs apart)
    st=Image.fromarray(a); st1=Image.fromarray(b)
    return st, st1
if __name__=='__main__':
    looks=sys.argv[1].split(',')
    prev=[]
    for n in looks:
        d=Image.open(f'{NPC}/{n}_down.png'); u=Image.open(f'{NPC}/{n}_up.png'); r=Image.open(f'{NPC}/{n}_right0.png')
        d1,d2=front_steps(d); u1,u2=front_steps(u); r0,r1=side_step(r)
        prev.append([d,d1,d2,u,u1,u2,r0,r1])
    H=max(f.height for row in prev for f in row); W=max(f.width for row in prev for f in row)+3
    S=Image.new('RGBA',(W*8,H*len(prev)),(90,140,90,255))
    for i,row in enumerate(prev):
        for j,f in enumerate(row): S.alpha_composite(f,(j*W,i*H+H-f.height))
    S.resize((S.width*3,S.height*3),0).save('/tmp/npcwalk/prev.png'); print(S.size)
