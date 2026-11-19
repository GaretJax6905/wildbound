import sys, numpy as np
sys.path.insert(0,'/tmp/npc2')
from PIL import Image
from scipy import ndimage as nd
SRC='/mnt/user-data/uploads/Downloads/wildbound sprites'
def block_size(a,y0,y1,x0,x1):
    sub=a[y0:y1,x0:x1].astype(float); best=None
    for B in np.arange(7,14,0.125):
        for o in np.arange(0,B,B/4):
            ys=np.arange(o,sub.shape[0]-B,B); xs=np.arange(o,sub.shape[1]-B,B)
            p=sub[(ys+B*.3).astype(int)[:,None],(xs+B*.3).astype(int)[None,:]]
            q=sub[(ys+B*.7).astype(int)[:,None],(xs+B*.7).astype(int)[None,:]]
            e=np.abs(p-q).mean()
            if best is None or e<best[0]: best=(e,B,o)
    return best[1],best[2]
def cells(path):
    im=Image.open(path).convert('RGB'); a=np.asarray(im).astype(int)
    fg=(765-a.sum(2))>60
    lab,n=nd.label(nd.binary_dilation(fg,iterations=6))
    objs=[s for s in nd.find_objects(lab) if s[0].stop-s[0].start>250]
    print(path.split('/')[-1], im.size, len(objs))
    objs.sort(key=lambda s:s[0].start)
    rows=[sorted(objs[i:i+3],key=lambda s:s[1].start) for i in (0,3,6)]
    return a,rows
def grab(a,y0,x0,H,W,B):
    cols=np.zeros((H,W,3))
    for r in range(H):
        for c in range(W):
            yy=int(y0+(r+.5)*B); xx=int(x0+(c+.5)*B)
            cols[r,c]=np.median(a[yy-1:yy+2,xx-1:xx+2].reshape(-1,3),0)
    near=(255-cols).sum(2)<60
    lab,n=nd.label(near)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    out=np.zeros((H,W,4),np.uint8); out[...,:3]=cols.astype(np.uint8); out[...,3]=np.where(np.isin(lab,list(edge)),0,255)
    return Image.fromarray(out)
def run(g):
    a,rows=cells(f'{SRC}/hero_{g}_walk.jpg')
    s=rows[0][0]; B,o=block_size(a,s[0].start,s[0].stop,s[1].start,s[1].stop); print('B',B)
    out={}
    for ri,row in enumerate(rows):
        # common box for the row: same bottom (feet), same width, centred on the standing frame's centre
        bot=max(x[0].stop for x in row)+6
        top=min(x[0].start for x in row)-6
        H=int((bot-top)/B)+1; W=int(max(x[1].stop-x[1].start for x in row)/B)+4
        cx=(row[0][1].start+row[0][1].stop)/2
        fr=[]
        for s in row:
            # centre each step frame on its torso: use the standing frame's centre relative to the head
            c=(s[1].start+s[1].stop)/2 if s is row[0] else None
            # head centre: columns of fg in the top 30% of the figure
            sub=(765-a[s[0].start:s[0].start+int((s[0].stop-s[0].start)*.3), s[1].start:s[1].stop].sum(2))>60
            xs=np.where(sub.any(0))[0]; hc=s[1].start+(xs.min()+xs.max())/2
            fr.append((s,hc))
        hc0=fr[0][1]
        for i,(s,hc) in enumerate(fr):
            x0=hc-W*B/2; y0=bot-H*B
            out[(ri,i)]=grab(a,y0,x0,H,W,B)
    return out
for g in ('boy','girl'):
    o=run(g)
    # contact sheet
    ims=[[o[(r,c)] for c in range(3)] for r in range(3)]
    w=max(i.width for row in ims for i in row); h=max(i.height for row in ims for i in row)
    sheet=Image.new('RGBA',(w*3+8,h*3+8),(90,140,90,255))
    for r in range(3):
        for c in range(3): sheet.alpha_composite(ims[r][c],(c*(w+4),r*(h+4)))
    sheet.resize((sheet.width*5,sheet.height*5),0).save(f'/tmp/hero/{g}_sheet.png')
    import pickle; pickle.dump({k:(v.tobytes(),v.size) for k,v in o.items()},open(f'/tmp/hero/{g}.pkl','wb'))
