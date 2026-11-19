import sys
sys.path.insert(0,'/tmp/meridia')
from cutchar import cut
from PIL import Image
H=76
sheet=sys.argv[1]; names=sys.argv[2].split(',')
res=cut(sheet,names,rows=('down','up','right0'))
sc={nm:H/im.size[1] for nm,p,im in res if p=='down'}
for nm,p,im in res:
    s=sc[nm]; w,h=im.size
    o=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    # hard alpha for a crisp pixel edge
    a=o.split()[3].point(lambda v:255 if v>110 else 0); o.putalpha(a)
    o.save(f'/tmp/meridia/npc/{nm}_{p}.png'); print(nm,p,o.size)
