import sys
from PIL import Image
T='/tmp/claude-tool-results/a748d4cc-4134-5cae-9ed1-321351281981/'
k=int(sys.argv[1]); W,H=int(sys.argv[2]),int(sys.argv[3])
full=Image.new('RGB',(W,H),(255,255,255))
for part in sys.argv[4:]:
    l,t,f=part.split(',',2)
    im=Image.open(T+f).convert('RGB')
    vw,vh=im.size
    full.paste(im.crop((0,0,min(vw,W-int(l)),min(vh,H-int(t)))),(int(l),int(t)))
full.save(f'/tmp/azurine/sheets/s{k:02d}.jpg',quality=95); print('ok',k)
