import sys, json
from PIL import Image
S=json.load(open('/home/claude/wildbound/tools/meridia/sheets.json'))
ks=[int(x) for x in sys.argv[1:]]
rows=[]
for k in ks:
    for n in S[k]: rows.append(n)
M=Image.new('RGBA',(192*len(rows) if len(rows)<=8 else 192*8, 384*((len(rows)+7)//8)),(70,90,70,255))
for i,n in enumerate(rows):
    for r,sd in enumerate(['front','back']):
        try: M.alpha_composite(Image.open(f'/tmp/meridia/out/{n}_{sd}.png').resize((192,192)),((i%8)*192,(i//8)*384+r*192))
        except Exception as e: pass
M.save('/tmp/meridia/chk.png')
