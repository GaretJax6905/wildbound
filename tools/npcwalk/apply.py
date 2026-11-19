import json, sys
sys.path.insert(0,'/tmp/npcwalk')
from synth import *
idx=json.load(open(f'{NPC}/index.json'))
for n in sorted(idx):
    d=Image.open(f'{NPC}/{n}_down.png'); u=Image.open(f'{NPC}/{n}_up.png'); r=Image.open(f'{NPC}/{n}_right0.png')
    d1,d2=front_steps(d); u1,u2=front_steps(u); r0,r1=side_step(r)
    d.save(f'{NPC}/{n}_down0.png'); d1.save(f'{NPC}/{n}_down1.png'); d2.save(f'{NPC}/{n}_down2.png')
    u.save(f'{NPC}/{n}_up0.png'); u1.save(f'{NPC}/{n}_up1.png'); u2.save(f'{NPC}/{n}_up2.png')
    r1.save(f'{NPC}/{n}_right1.png'); r1.save(f'{NPC}/{n}_right2.png')
    idx[n]['walk']=True
json.dump(idx,open(f'{NPC}/index.json','w'))
print(len(idx),'looks')
