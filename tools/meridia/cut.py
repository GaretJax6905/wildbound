import sys, json, numpy as np
ARGS=sys.argv[1:]
sys.argv=['x']
exec(open('/tmp/world/cut.py').read().split('jobs={')[0])
from PIL import Image
from scipy import ndimage as nd
S=json.load(open('/home/claude/wildbound/tools/meridia/sheets.json'))
OUTD='/tmp/meridia/out'
def cut(k):
    names=S[k]; n=len(names)
    Image.open(f'/tmp/meridia/sheets/s{k:02d}.jpg').convert('RGB').save('/tmp/meridia/tmp.png')
    a=np.asarray(Image.open('/tmp/meridia/tmp.png')).astype(int)
    H,W,_=a.shape
    border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)])
    bg=np.median(border,0); d=np.abs(a-bg).sum(2); fg=d>38
    lab,_=nd.label(~fg); edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fgm=nd.binary_opening(~np.isin(lab,list(edge)),iterations=1)
    lab2,m=nd.label(nd.binary_dilation(fgm,iterations=2))
    cells={}
    for i,sl in enumerate(nd.find_objects(lab2)):
        h=sl[0].stop-sl[0].start; w=sl[1].stop-sl[1].start
        area=int(((lab2[sl]==i+1)&fgm[sl]).sum())
        if area<120: continue
        if h<26 and w>2.2*h: continue          # stray name labels
        cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
        r=0 if cy<H/2 else 1; c=min(n-1,int(cx/W*n))
        cells.setdefault((r,c),[]).append((i+1,area))
    missing=[]
    for c,nm in enumerate(names):
        for r,side in ((0,'front'),(1,'back')):
            parts=cells.get((r,c))
            if not parts: missing.append((r,c)); continue
            big=max(ar for _,ar in parts)
            keep=[i for i,ar in parts if ar>=big*0.004]
            mask=np.isin(lab2,keep)&fgm
            ys,xs=np.where(mask); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
            rgba=np.zeros((y1-y0,x1-x0,4),np.uint8); rgba[...,:3]=a[y0:y1,x0:x1]; rgba[...,3]=mask[y0:y1,x0:x1]*255
            # trim the faint white fringe left by the jpeg edge
            al=rgba[...,3]>0; light=rgba[...,:3].min(2)>225
            fr=nd.binary_dilation(~al)&al&light; rgba[fr,3]=0
            im=Image.fromarray(rgba); w,h=im.size; s=340/max(w,h)
            im=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
            out=Image.new('RGBA',(384,384),(0,0,0,0)); out.alpha_composite(im,((384-im.width)//2, 384-12-im.height))
            out.save(f'{OUTD}/{nm}_{side}.png')
    return missing
if __name__=='__main__':
    import sys as s2
    for k in map(int,ARGS): print(k, cut(k))
