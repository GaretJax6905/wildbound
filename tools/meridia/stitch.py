import sys
from PIL import Image
T='/tmp/claude-tool-results/a748d4cc-4134-5cae-9ed1-321351281981/'
def stitch(k, h, top, bot=None):
    a=Image.open(T+top).convert('RGB')
    full=Image.new('RGB',(1024,h),'white')
    if h<=600 or not bot:
        full.paste(a.crop((0,0,1024,min(h,631))),(0,0))
    else:
        b=Image.open(T+bot).convert('RGB'); o=h-600
        full.paste(a.crop((0,0,1024,600)),(0,0))
        full.paste(b.crop((0,600-o,1024,h-o)),(0,600))
    full.save(f'/tmp/meridia/sheets/s{k:02d}.jpg', quality=95)
if __name__=='__main__':
    k=int(sys.argv[1]); h=int(sys.argv[2]); stitch(k,h,sys.argv[3],sys.argv[4] if len(sys.argv)>4 else None)
