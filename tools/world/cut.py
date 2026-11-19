import numpy as np, sys, os
from PIL import Image
from scipy import ndimage as nd
SRC='/tmp/world/src'; OUT='/tmp/world/cut'
def objects(path, T, minsize, n_expected=None):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    H,W,_=a.shape
    border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)])
    bg=np.median(border,0)
    d=np.abs(a-bg).sum(2)
    fg=d>T
    # remove edge-connected background only
    lab,n=nd.label(~fg)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bgm=np.isin(lab,list(edge))
    fgm=~bgm
    fgm=nd.binary_opening(fgm,iterations=1)
    lab2,n2=nd.label(nd.binary_dilation(fgm,iterations=3))
    objs=[]
    for i,s in enumerate(nd.find_objects(lab2)):
        h=s[0].stop-s[0].start; w=s[1].stop-s[1].start
        if h*w<minsize: continue
        m=(lab2[s]==i+1)&fgm[s]
        rgba=np.zeros((h,w,4),np.uint8); rgba[...,:3]=a[s]; rgba[...,3]=m*255
        objs.append(((s[0].start+s[0].stop)/2,(s[1].start+s[1].stop)/2,Image.fromarray(rgba)))
    return objs,(H,W)
def grid_sort(objs,rows,cols,HW):
    H,W=HW
    out={}
    for cy,cx,im in objs:
        r=min(rows-1,int(cy/H*rows)) ; c=min(cols-1,int(cx/W*cols))
        # keep the biggest per cell
        if (r,c) not in out or im.size[0]*im.size[1]>out[(r,c)].size[0]*out[(r,c)].size[1]: out[(r,c)]=im
    return out
jobs={
 'bld_town':(['house','house2','center','mart'],2,2,40,20000),
 'bld_big':(['lab','gym','tower','league'],2,2,40,20000),
 'bld_town_snow':(['house_snow','house2_snow','center_snow','mart_snow'],2,2,14,20000),
}
for f,(names,R,C,T,ms) in jobs.items():
    objs,HW=objects(f'{SRC}/{f}.jpg',T,ms)
    g=grid_sort(objs,R,C,HW)
    for k,(r,c) in enumerate([(i,j) for i in range(R) for j in range(C)]):
        if (r,c) in g: g[(r,c)].save(f'{OUT}/{names[k]}.png'); print(names[k],g[(r,c)].size)
        else: print('MISSING',names[k])
# screenshot sheets: image occupies 1024x559 at top-left
for f,names,T in [('bld_big_snow',['gym_snow','lab_snow'],14)]:
    im=Image.open(f'{SRC}/{f}.jpg').crop((0,0,1024,559)); im.save('/tmp/world/tmp.png')
    objs,HW=objects('/tmp/world/tmp.png',T,8000)
    g=grid_sort(objs,1,2,HW)
    for k in range(2): g[(0,k)].save(f'{OUT}/{names[k]}.png'); print(names[k],g[(0,k)].size)
for f,names in [('props',['tree','pine','palm','deadtree','bush','rock','crack','pushrock','flower_r','flower_y','fence','sign','tall','snowgrass','lily','stump']),
                ('furn',['bed','tv','shelf','table','pc','plant','counter','healer','mat','stove','fridge','chair','console','statue','crate','armchair'])]:
    im=Image.open(f'{SRC}/{f}.jpg').crop((30,0,980,540)); im.save('/tmp/world/tmp.png')
    objs,HW=objects('/tmp/world/tmp.png',30,600)
    g=grid_sort(objs,4,4,HW)
    for k,(r,c) in enumerate([(i,j) for i in range(4) for j in range(4)]):
        if (r,c) in g: g[(r,c)].save(f'{OUT}/{names[k]}.png'); print(names[k],g[(r,c)].size,end='; ')
        else: print('MISSING',names[k])
    print()
