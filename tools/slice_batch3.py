import sys, os
sys.path.insert(0, '/tmp/art')
from slice2 import load, figures, split, save
SRC = '/mnt/user-data/uploads/wildbound creatures'
OUT = 'out3'; os.makedirs(OUT, exist_ok=True)
def fb(*names): return [x for n in names for x in (n + '_front', n + '_back')]
L = {
 'Acornut Oakling Sneakit Shadeclaw Cogling Gearoid': [fb('acornut', 'oakling', 'sneakit'), fb('shadeclaw', 'cogling', 'gearoid')],
 'Chubbin Puffalo': [fb('chubbin'), fb('puffalo')],
 'Croakle Bullfrogue Fawnlet Stagmire Echobat Sonarwing': [['croakle_front', 'croakle_back', 'bullfrogue_front'], ['bullfrogue_back', 'fawnlet_front', 'fawnlet_back'], ['stagmire_front', 'stagmire_back', 'echobat_front'], ['echobat_back', 'sonarwing_front', 'sonarwing_back']],
 'Ironhorn Steelrhine Drakelet Wyvernix Dragoneel Leviaclaw': [fb('ironhorn', 'steelrhine', 'drakelet'), ['wyvernix_front', 'wyvernix_back', 'dragoneel_front', 'leviaclaw_front', 'leviaclaw_back']],
 'Leafwing Canopywing': [fb('leafwing'), fb('canopywing')],
 'Nightpip Ravenlord': [fb('nightpip'), fb('ravenlord')],
 'Sludgeon Mucklord Twinklet Starsprite': [fb('sludgeon', 'mucklord'), fb('twinklet', 'starsprite')],
 'Slumbear': [fb('slumbear')],
 'Verdantaur Stormaw Abyssion Eclipsa': [['verdantaur_front', 'stormaw_front', 'abyssion_front', 'eclipsa_front'], ['verdantaur_back', 'stormaw_back', 'abyssion_back', 'eclipsa_back']],
 'Whiskit Pantherine': [fb('whiskit'), fb('pantherine')],
 'Zapfinch Beetank Dreamray Frostseer Grapplex': [fb('zapfinch', 'beetank'), fb('dreamray'), fb('frostseer', 'grapplex')],
}
for fn, rows in L.items():
    im = load(os.path.join(SRC, fn + '.jpg'))
    got, bg, dist = figures(im)
    print(fn, [len(r) for r in got], 'want', [len(r) for r in rows])
    for rf, names in zip(got, rows):
        # merge-split fallback: if fewer figures than names, split the widest
        while len(rf) < len(names):
            i = max(range(len(rf)), key=lambda k: rf[k][1].shape[1])
            rf = rf[:i] + split(rf[i]) + rf[i + 1:]
        for f, name in zip(rf, names):
            if name: save(im, bg, dist, f, os.path.join(OUT, name + '.png'))
