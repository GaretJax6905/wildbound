# The Azurine Isles' creature list (source of truth). Run: python3 tools/azurine/dex.py
# Writes static/js/species3.js. Each entry:
#   id, name, types, base-stat total, stat profile, evolution ("to:level" or "to:item"),
#   habitats (map ids, ":w" surfing, ":r" rare, "static:<map>" one special encounter),
#   fallback body plan + colours + features, Dex entry, and LOOK = what the art shows.
import json, os

PROF = {
    'phys': (1.0, 1.25, 1.0, 0.7, 0.85, 1.0), 'spec': (0.95, 0.7, 0.85, 1.3, 1.05, 1.0),
    'tank': (1.15, 0.95, 1.35, 0.7, 1.05, 0.65), 'fast': (0.85, 1.05, 0.8, 1.0, 0.85, 1.45),
    'bal': (1, 1, 1, 1, 1, 1), 'spdef': (1.05, 0.8, 0.95, 1.05, 1.3, 0.85), 'legend': (1, 1.05, 1, 1.05, 1, 0.9),
}
def stats(total, prof):
    w = PROF[prof]; s = sum(w)
    v = [max(20, round(total * x / s)) for x in w]
    v[1] += total - sum(v)
    return v

C = []  # (id, name, types, total, prof, evo, where, plan, colors, feats, dex, look)
def c(*a): C.append(a)

# ---- starters (Professor Marlowe's lab; wild ones gather in the Route 21 jungle) ----
c('batbud', 'Batbud', 'Grass', 312, 'fast', 'frondbat:16', 'static:route21', 'bird', '#7cc050,#f0a040,#f8e8b0', 'eyes=cute wings=big',
  'A tiny fruit bat that sleeps wrapped in a leaf. It spreads seeds wherever it snacks.',
  'a tiny round fruit bat with leaf-green wing membranes shaped like palm fronds, an orange fuzzy body, big ears and a mango seed held in its feet')
c('frondbat', 'Frondbat', 'Grass', 405, 'fast', 'canopteryx:36', '', 'bird', '#5aa038,#e08830,#f0d890', 'eyes=mean wings=big',
  'It glides between the treetops on wings like palm leaves, dropping fruit on anyone it dislikes.',
  'a medium fruit bat with big palm-frond leaf wings, orange fur, a mane of small leaves and sharp little fangs, gliding')
c('canopteryx', 'Canopteryx', 'Grass/Flying', 530, 'fast', '', '', 'bird', '#3e8a28,#c86a20,#f0c870', 'eyes=mean wings=big crest',
  'The guardian of the jungle canopy. One sweep of its wings scatters a whole forest of seeds.',
  'a large majestic fruit bat with huge layered palm-leaf wings, an orange and green mane of fronds and flowers, a crest of coconut-husk fur, powerful and regal')
c('cindershell', 'Cindershell', 'Fire', 309, 'tank', 'kilnshell:16', 'static:route21', 'bug', '#e86a30,#5a4a48,#f8c060', 'eyes=cute',
  'It lives in a hollow lava stone instead of a seashell. The stone stays warm all night.',
  'a small hermit crab with orange claws living inside a round black lava-rock shell with glowing orange cracks, big curious eye stalks')
c('kilnshell', 'Kilnshell', 'Fire', 405, 'tank', 'calderacrab:36', '', 'bug', '#c84a20,#3a3434,#f0a038', 'eyes=mean',
  'Its shell is a little furnace. It bakes shellfish inside before eating them.',
  'a hermit crab carrying a chimney-shaped volcanic stone shell puffing smoke, red armored legs and one oversized claw glowing hot')
c('calderacrab', 'Calderacrab', 'Fire/Rock', 530, 'tank', '', '', 'bug', '#a83818,#2e2a2a,#f8a040', 'eyes=mean glow',
  'It carries a small erupting volcano on its back. Ships steer clear of beaches where it rests.',
  'a huge armored hermit crab whose shell is a miniature erupting volcano with lava flowing down the sides, massive obsidian claws, molten glowing joints')
c('tuskle', 'Tuskle', 'Water', 314, 'bal', 'lancetusk:16', 'static:route21', 'fish', '#6aa8d8,#f0f8ff,#a8d0f0', 'eyes=cute',
  'A narwhal calf with a soft stubby tusk. It bumps boats to say hello.',
  'a cute chubby baby narwhal calf, pale blue with white speckles, a short stubby rounded tusk, little flippers and a happy face')
c('lancetusk', 'Lancetusk', 'Water', 405, 'phys', 'narwhallant:36', '', 'fish', '#4a88c0,#e8f4ff,#c0c8d8', 'eyes=mean',
  'Its tusk grows long and straight as a spear. It fences with rivals in the shallows.',
  'a sleek young narwhal with a long straight spiral tusk like a fencing sword, blue back with white spots, a fin like a cape')
c('narwhallant', 'Narwhallant', 'Water/Metal', 530, 'phys', '', '', 'fish', '#2e6aa8,#d8e4f0,#9aa4b4', 'eyes=mean crest',
  'A knight of the deep. Its steel tusk can split an iceberg, and it guards the Isles\' shipping lanes.',
  'a large heroic narwhal wearing natural steel armor plates like a knight\'s, a long gleaming metal lance tusk, a fin like a flowing blue cape')

# ---- Route 20 (beach) ----
c('sandpip', 'Sandpip', 'Normal/Flying', 270, 'fast', 'shorewing:20', 'route20', 'bird', '#c8a878,#f8f0e0,#6a5038', 'eyes=cute',
  'It sprints after the retreating waves to snatch tiny shrimp, then runs back squeaking.',
  'a small round sandpiper bird with speckled tan back, white belly, long thin legs and a long thin beak')
c('shorewing', 'Shorewing', 'Normal/Flying', 420, 'fast', '', '', 'bird', '#a88858,#f8f0e0,#4a3a28', 'eyes=mean',
  'Flocks of Shorewing skim the waves in perfect formation, never once getting their feathers wet.',
  'a sleek shorebird with long pointed wings, speckled brown and white plumage, a black cap and a sharp long beak, skimming low')
c('cocolet', 'Cocolet', 'Grass', 285, 'tank', 'cocobrawl:24', 'route20', 'blob', '#8a6038,#f8f0e0,#6ab040', 'eyes=cute',
  'A coconut with legs and a sprout on top. Drop it and it bounces right back up.',
  'a round brown hairy coconut creature with a cracked opening showing a white face, two stubby feet and a green palm sprout on top')
c('cocobrawl', 'Cocobrawl', 'Grass/Brawl', 440, 'phys', '', '', 'biped', '#6a4828,#f0e8d0,#4a9030', 'eyes=mean',
  'It cracks coconuts open with its bare fists to stay in shape. Its head is the hardest coconut of all.',
  'a muscular creature with a coconut-shell head and shoulders, white fiber body, boxing-glove fists made of coconut husk and a palm leaf headband')
c('tidepup', 'Tidepup', 'Water', 290, 'bal', 'sealord:30', 'route20:r', 'quad', '#9ab0c8,#f0f4f8,#5a6a80', 'eyes=cute',
  'A seal pup that naps on warm sand and barks at gulls. It is always hungry.',
  'a chubby gray baby seal pup with white spots, huge dark eyes, whiskers and little flippers, lying on its belly')
c('sealord', 'Sealord', 'Water', 470, 'tank', '', '', 'quad', '#6a7c98,#e0e8f0,#384858', 'eyes=mean crown',
  'The biggest Sealord rules each beach. Its bark can be heard from three islands away.',
  'a huge proud bull seal with a thick gray hide, white whiskers like a mustache, a crown-shaped ridge of coral on its head')
c('skitterling', 'Skitterling', 'Bug', 250, 'fast', 'skitterjack:22', 'route20:r', 'bug', '#d8c098,#8a7050,#f8ecd0', 'eyes=cute',
  'It hops along the tide line so fast it looks like a flicker of sand.',
  'a tiny sand-colored flea-like bug with big springy back legs, translucent shell and long antennae')
c('skitterjack', 'Skitterjack', 'Bug/Ground', 420, 'phys', '', '', 'bug', '#b89870,#6a5038,#f0dcb8', 'eyes=mean',
  'It leaps clear over grown people and lands with a kick strong enough to bury itself in the sand.',
  'a large sand-colored jumping bug with huge powerful spring legs, a shell like wet sand, sharp mandibles, crouched to leap')

# ---- Route 21 (rainy jungle) ----
c('leafrog', 'Leafrog', 'Grass/Water', 290, 'bal', 'rainfrog:28', 'route21', 'quad', '#58c050,#f05030,#e8f8d0', 'eyes=big',
  'It clings to wet leaves with sticky toes. It sings loudest right before a downpour.',
  'a small bright green tree frog with huge red eyes, orange sticky toe pads and a leaf-shaped back pattern')
c('rainfrog', 'Rainfrog', 'Grass/Water', 460, 'spec', '', '', 'quad', '#38a040,#e04028,#d0f0c0', 'eyes=big',
  'When it croaks, rain clouds gather. Jungle villagers thank it for every harvest.',
  'a large green tree frog with a raincloud-shaped vocal sac, droplets falling around it, red eyes, leafy frills on its legs')
c('mischimp', 'Mischimp', 'Normal/Grass', 285, 'fast', 'junglord:32', 'route21', 'biped', '#a87848,#f0d8b0,#68a040', 'eyes=cute',
  'A cheeky monkey that steals hats and hides them in the treetops.',
  'a small mischievous brown monkey with a curly tail, a leaf hat, big grin and long arms, hanging by its tail')
c('junglord', 'Junglord', 'Normal/Grass', 470, 'phys', '', '', 'biped', '#7a5030,#e8c898,#3e8030', 'eyes=mean crown',
  'It swings through the jungle as its kingdom. Its roar silences every other animal.',
  'a large powerful ape with brown fur, a mane of jungle vines and leaves, a crown of flowers and strong long arms')
c('parrotune', 'Parrotune', 'Normal/Flying', 290, 'spec', 'macawlure:30', 'route21:r', 'bird', '#e83a38,#38a8e8,#f8d040', 'eyes=cute crest',
  'It copies any sound it hears. Some even learn to hum ferry horns.',
  'a small colorful parrot with red body, blue wing tips, yellow cheeks, a curved beak and a little crest, beak open singing')
c('macawlure', 'Macawlure', 'Flying/Fae', 470, 'spec', '', '', 'bird', '#d82830,#2888d8,#f8c830', 'eyes=big wings=big crest',
  'Its song charms anyone who hears it into following it deep into the jungle.',
  'a large elegant macaw with brilliant red, blue and gold feathers, long sweeping tail plumes, glowing music-note shaped markings on its wings')
c('antlet', 'Antlet', 'Bug', 240, 'phys', 'antarch:26', 'route21:r', 'bug', '#c86030,#5aa040,#f8c098', 'eyes=cute',
  'It carries leaf pieces ten times its size back to its colony.',
  'a small orange leafcutter ant carrying a big green leaf fragment over its head like an umbrella')
c('antarch', 'Antarch', 'Bug/Grass', 445, 'phys', '', '', 'bug', '#a84420,#3e8a30,#f0a878', 'eyes=mean crown',
  'It commands a whole jungle colony. Its leaf cape is woven by its workers.',
  'a large armored leafcutter ant queen-knight standing upright, wearing a cape and crown made of cut leaves, strong mandibles')

# ---- Tide Cave ----
c('drippet', 'Drippet', 'Water', 260, 'spdef', 'drippool:24', 'tidecave', 'blob', '#78c0e8,#e8f8ff,#4a88c0', 'eyes=sleepy',
  'A water drop that fell from a stalactite and never stopped moving. It hates sunny days.',
  'a small round living droplet of clear blue water with a sleepy face, a tiny drip on top and a reflection shine')
c('drippool', 'Drippool', 'Water', 430, 'spdef', '', '', 'blob', '#4898d0,#d8f0ff,#2a6aa8', 'eyes=mean',
  'It lies flat as a tide pool. Anyone who steps in gets pulled under for a surprise bath.',
  'a wide puddle-shaped water creature like a living tide pool, with little shells, a starfish and pebbles floating inside it and a face on the surface')
c('stalaclam', 'Stalaclam', 'Water/Rock', 280, 'tank', 'pearlock:30', 'tidecave', 'blob', '#9a8a80,#f0e8f0,#6a5c58', 'eyes=sleepy',
  'It glues itself to cave ceilings and drops on prey below. It is very patient.',
  'a gray clam with a stony shell shaped like a stalactite tip, slightly open to show a white pearl and a sleepy face')
c('pearlock', 'Pearlock', 'Water/Rock', 470, 'tank', '', '', 'blob', '#7a6c64,#f8f0f8,#c8a8d0', 'eyes=mean glow',
  'It guards a pearl the size of a melon. It snaps shut on anything that comes too close.',
  'a large heavy clam with a rugged rocky shell covered in barnacles, open wide to show a giant glowing pearl and a stern face')
c('luminewt', 'Luminewt', 'Water/Electric', 285, 'spec', 'voltnewt:28', 'tidecave:r', 'serpent', '#58d0d8,#f8f040,#e0f8f8', 'eyes=big glow',
  'Its spots glow in dark caves. Explorers follow them to find the way out.',
  'a small slender cave newt with translucent teal skin, glowing yellow spots along its back and frilly gills')
c('voltnewt', 'Voltnewt', 'Water/Electric', 460, 'spec', '', '', 'serpent', '#30a8c0,#f0e020,#c8f0f8', 'eyes=mean glow',
  'It stuns fish with pulses from its spots. The cave water fizzes when it hunts.',
  'a long cave salamander with glowing electric-yellow stripes, crackling sparks between its frilly gills, sleek teal body')
c('barnacreep', 'Barnacreep', 'Rock/Water', 280, 'tank', 'barnacolossus:38', 'tidecave:r', 'golem', '#a89880,#5a7090,#e8e0d0', 'eyes=cute',
  'A cluster of barnacles that learned to walk. It hitches rides on Sealord.',
  'a small cluster of gray barnacles shaped like a little creature with stubby legs, tiny feather-like feelers poking out of the barnacles')
c('barnacolossus', 'Barnacolossus', 'Rock/Water', 500, 'tank', '', '', 'golem', '#7a6c5c,#3a5878,#d8d0c0', 'eyes=mean',
  'A shipwreck hull covered in barnacles that stood up and walked away.',
  'a huge golem made of an old wooden ship hull completely covered in barnacles, seaweed and starfish, with a glowing porthole eye')

# ---- Route 22 (sea) ----
c('ternlet', 'Ternlet', 'Water/Flying', 280, 'fast', 'stormtern:32', 'route22', 'bird', '#f0f4f8,#202830,#f08030', 'eyes=cute',
  'It dives headfirst into the sea for fish and pops back up shaking its head.',
  'a small white tern bird with a black cap, orange beak and pointed wings, mid-dive')
c('stormtern', 'Stormtern', 'Water/Flying', 460, 'fast', '', '', 'bird', '#d8e0e8,#182028,#e86020', 'eyes=mean wings=big',
  'It flies straight through storms that ground every other bird.',
  'a sleek storm tern with gray and white plumage, very long forked tail streamers, black cap, sharp wings with rain droplets around it')
c('marinig', 'Marinig', 'Rock/Water', 285, 'tank', 'iguanox:34', 'route22:r', 'quad', '#4a4a50,#c84a38,#8a9098', 'eyes=sleepy',
  'It basks on black rocks after every swim and sneezes salt.',
  'a small black marine iguana with red patches, spiky back crest and a salty white crust on its head, sunbathing')
c('iguanox', 'Iguanox', 'Rock/Water', 480, 'phys', '', '', 'quad', '#2e2e34,#b83828,#7a8088', 'eyes=mean crest',
  'Its spines are as hard as lava rock. It headbutts waves that dare to splash it.',
  'a large armored marine iguana with jagged volcanic rock spines along its back, red and black scales, a powerful tail and a fierce face')
c('finlet', 'Finlet', 'Water', 245, 'fast', 'sailfinn:25', 'route22:w', 'fish', '#4888d8,#f0f8ff,#f8c040', 'eyes=cute',
  'A tiny fish with a sail-shaped fin. Schools of them flash silver in the sun.',
  'a small blue fish with a tall sail-shaped dorsal fin, a yellow stripe and big eyes')
c('sailfinn', 'Sailfinn', 'Water', 455, 'fast', '', '', 'fish', '#2860b8,#e0f0ff,#f0b030', 'eyes=mean',
  'The fastest swimmer in the Isles. It raises its sail to catch the wind and race boats.',
  'a sleek sailfish with a huge tall blue sail fin, a long pointed bill and gold stripes, leaping from the water')
c('jellune', 'Jellune', 'Water/Fae', 270, 'spdef', 'lunajel:30', 'route22:w', 'floater', '#c8b8f0,#f8f0ff,#80d0f0', 'eyes=sleepy glow',
  'A moon jellyfish that glows softly at night. It drifts toward lullabies.',
  'a small translucent lavender moon jellyfish with a glowing crescent-moon mark on its bell and soft trailing tentacles')
c('lunajel', 'Lunajel', 'Water/Fae', 465, 'spec', '', '', 'floater', '#a898e0,#f8f0ff,#60b8e8', 'eyes=big glow crown',
  'On full moons, groups of Lunajel rise to the surface and light up the sea like lanterns.',
  'a large glowing jellyfish with a bell like a full moon, a starry pattern inside, long ribbon tentacles trailing sparkles')
c('turtide', 'Turtide', 'Water', 280, 'tank', 'turtidal:35', 'route22:w:r', 'quad', '#58a878,#a87848,#e8f0d0', 'eyes=cute',
  'A sea turtle hatchling that rides currents across the whole ocean.',
  'a small baby sea turtle with a green shell patterned like waves, little flippers and big friendly eyes')
c('turtidal', 'Turtidal', 'Water/Grass', 490, 'tank', '', '', 'quad', '#3a8858,#8a6038,#d8e8c0', 'eyes=mean',
  'A whole kelp garden grows on its shell. Fish live there their entire lives.',
  'a huge ancient sea turtle with a wide shell covered in a kelp forest and coral, with small fish swimming around it')
c('puffurr', 'Puffurr', 'Water/Toxic', 275, 'tank', 'spinefugu:30', 'route22:w:r', 'fish', '#f0d060,#8a6038,#f8f0d0', 'eyes=cute',
  'When scared it puffs into a spiky ball. Its spines sting for hours.',
  'a small round yellow pufferfish with brown spots, half puffed up with tiny spines, a surprised face')
c('spinefugu', 'Spinefugu', 'Water/Toxic', 455, 'tank', '', '', 'fish', '#d8a830,#6a3a78,#f8e0a0', 'eyes=mean',
  'Its poison spines can pierce a boat hull. Fishers cut their nets rather than touch one.',
  'a large fully puffed pufferfish covered in long purple-tipped poison spines, a scowling face and golden body')

# ---- Route 23 (volcano slope) ----
c('kidling', 'Kidling', 'Fire', 285, 'phys', 'ramblaze:32', 'route23', 'quad', '#e86838,#4a3a38,#f8c068', 'eyes=cute',
  'A young goat with hooves that never burn. It climbs the hottest rocks to show off.',
  'a small orange goat kid with tiny glowing horns, black hooves and a little ember tuft on its chin')
c('ramblaze', 'Ramblaze', 'Fire', 475, 'phys', '', '', 'quad', '#c84a20,#2e2626,#f8a040', 'eyes=mean horn=two',
  'Its curled horns glow white-hot. It rams boulders off the volcano for fun.',
  'a strong mountain goat with huge curled horns glowing white-hot like lava, dark smoky fur and fiery hooves')
c('pumicorn', 'Pumicorn', 'Rock/Fire', 450, 'tank', '', 'route23', 'quad', '#b8b0a8,#6a5e58,#f0a048', 'eyes=sleepy horn=one',
  'Its body is light, porous pumice. It floats if it falls into the sea, which it finds embarrassing.',
  'a stocky rhinoceros made of light gray porous pumice stone with a single horn, small glowing embers in its pores')
c('smogfly', 'Smogfly', 'Bug/Fire', 280, 'fast', 'magmoth:30', 'route23:r', 'bug', '#5a5050,#f08030,#c8c0b8', 'eyes=big',
  'It flies through volcanic smoke and leaves a trail of sparks.',
  'a small fly with smoky gray wings, an orange glowing abdomen like a coal and big compound eyes')
c('magmoth', 'Magmoth', 'Bug/Fire', 465, 'spec', '', '', 'bug', '#3a3030,#f85820,#f8c040', 'eyes=mean wings=big glow',
  'Its wings are patterned like flowing lava. It nests in fresh lava tubes.',
  'a large moth with black wings veined with glowing molten-lava patterns, an ash-gray fluffy body and ember antennae')
c('obsidisk', 'Obsidisk', 'Rock/Shadow', 290, 'phys', 'obsidrake:40', 'route23:r', 'golem', '#2a2830,#8a58c8,#585060', 'eyes=mean',
  'A shard of volcanic glass that cools into a sharper shape each night.',
  'a small creature shaped like a sharp shard of shiny black obsidian glass with a faint purple glow, two glowing eyes and little claws')
c('obsidrake', 'Obsidrake', 'Rock/Dragon', 520, 'phys', '', '', 'dragon', '#1e1c24,#7a48c0,#4a4250', 'eyes=mean wings=big horn=two',
  'Its whole body is volcanic glass. Light passing through its wings makes purple rainbows.',
  'a fierce dragon made of glossy black obsidian glass with sharp faceted edges, wings like broken glass panes glowing purple inside')

# ---- Magma Tunnel ----
c('lavalump', 'Lavalump', 'Fire', 270, 'tank', 'lavalanche:34', 'magmatunnel', 'blob', '#f05820,#2a2424,#f8c040', 'eyes=sleepy',
  'A blob of cooling lava. A crust forms on its back while it naps.',
  'a small round blob of glowing orange lava with a dark cooled crust on top like a hat, sleepy face')
c('lavalanche', 'Lavalanche', 'Fire/Rock', 480, 'tank', '', '', 'golem', '#d84010,#2a2222,#f8b030', 'eyes=mean',
  'It rolls down the volcano in a river of its own lava, crushing everything in its path.',
  'a large boulder-like creature of black rock with rivers of lava pouring between the plates, rolling forward with a fierce face')
c('sulfurk', 'Sulfurk', 'Toxic/Fire', 280, 'spec', 'sulfurex:36', 'magmatunnel', 'serpent', '#e8d838,#6a5a30,#f8f0a0', 'eyes=sleepy',
  'A salamander that bathes in sulfur vents. It smells like rotten eggs and is proud of it.',
  'a small yellow salamander with crusty sulfur crystal bumps, puffs of yellow gas around it and a smug face')
c('sulfurex', 'Sulfurex', 'Toxic/Fire', 465, 'spec', '', '', 'serpent', '#c8b020,#4a3a20,#f8e070', 'eyes=mean glow',
  'It breathes clouds of burning sulfur. Miners in the tunnel wear masks because of it.',
  'a large yellow salamander-lizard with a back covered in jagged sulfur crystals, breathing a yellow-green flaming gas, smoldering eyes')
c('quartzling', 'Quartzling', 'Rock/Fae', 285, 'spdef', 'quartzeen:38', 'magmatunnel:r', 'floater', '#f0e0f8,#c898e0,#f8f8ff', 'eyes=cute glow',
  'A little crystal that formed in a lava bubble. It chimes when it is happy.',
  'a small floating cluster of pink and clear quartz crystals with a cute face and sparkles')
c('quartzeen', 'Quartzeen', 'Rock/Fae', 490, 'spdef', '', '', 'floater', '#e0c8f0,#a870d0,#f8f0ff', 'eyes=big glow crown',
  'Light shining through its body splits into rainbows. Cave explorers call it the Cave Queen.',
  'a graceful floating crystal creature like a queen with a gown of rose quartz crystals, a tiara of amethyst points, rainbow light refracting')
c('magmaw', 'Magmaw', 'Fire/Dragon', 300, 'phys', 'magmawyrm:42', 'magmatunnel:r', 'dragon', '#e85020,#3a2a2a,#f8c048', 'eyes=cute',
  'A baby dragon that hatched from an egg buried in lava. It loves chewing hot rocks.',
  'a small chubby baby dragon with red-orange scales, a wide mouth showing glowing lava inside, stubby wings and a rocky belly')
c('magmawyrm', 'Magmawyrm', 'Fire/Dragon', 530, 'phys', '', '', 'dragon', '#b83010,#2a1e1e,#f8a030', 'eyes=mean wings=big horn=two',
  'It swims through magma like water. When it surfaces, a new island begins to form.',
  'a large dragon with dark volcanic rock scales cracked with glowing magma, huge wings with lava-fringed edges, horns like basalt columns')

# ---- Route 24 (sea) ----
c('skimmerkit', 'Skimmerkit', 'Flying', 275, 'fast', 'skimmerlance:35', 'route24', 'bird', '#383838,#f0f0f0,#e84830', 'eyes=cute',
  'It flies with its lower beak in the water, scooping up anything it touches.',
  'a small black and white skimmer bird with a long red-orange lower beak longer than the upper one, skimming the water')
c('skimmerlance', 'Skimmerlance', 'Flying/Water', 465, 'fast', '', '', 'bird', '#202020,#f8f8f8,#d83820', 'eyes=mean wings=big',
  'It slices through waves with its blade-like beak at incredible speed.',
  'a large skimmer bird with a long blade-like red beak, sharp black wings like a jet and a white chest, cutting through a wave')
c('conchurn', 'Conchurn', 'Water/Mind', 285, 'spdef', 'conchoracle:36', 'route24:r', 'blob', '#f0a888,#f8e8d8,#a868a0', 'eyes=sleepy',
  'Hold it to your ear and you will hear the future. Or maybe just the sea.',
  'a small sea snail living in a pink spiral conch shell, a dreamy face peeking out, faint psychic swirls around it')
c('conchoracle', 'Conchoracle', 'Water/Mind', 480, 'spec', '', '', 'floater', '#e08868,#f8e0d0,#8848a0', 'eyes=big glow',
  'It floats above the waves and whispers prophecies to sailors through its shell.',
  'a floating mystical sea snail in a huge ornate spiral conch shell decorated with pearls, glowing purple eyes and a halo of swirling water')
c('dolphling', 'Dolphling', 'Water', 285, 'fast', 'dolphinade:34', 'route24:w', 'fish', '#78a8e0,#f0f8ff,#f0a0c0', 'eyes=cute',
  'A dolphin calf that follows boats and laughs when they splash.',
  'a small playful blue dolphin calf with a pink cheek blush and a big smile, jumping')
c('dolphinade', 'Dolphinade', 'Water/Fae', 475, 'spec', '', '', 'fish', '#5888d0,#f0f8ff,#f088b8', 'eyes=big',
  'It leaps through rainbows it makes from spray. Seeing one means a safe voyage.',
  'a graceful dolphin with shimmering blue and pink skin, star-shaped spots, leaping through a rainbow arc made of sea spray')
c('kelpie', 'Kelpie', 'Water/Grass', 280, 'bal', 'kelpstallion:32', 'route24:w', 'fish', '#58a868,#a8d878,#3a7a50', 'eyes=cute',
  'A seahorse with a mane of kelp. It ties itself to seaweed during storms.',
  'a small green seahorse with a flowing mane and tail made of kelp leaves, a curled tail and a cheerful face')
c('kelpstallion', 'Kelpstallion', 'Water/Grass', 470, 'phys', '', '', 'quad', '#2e8848,#88c860,#1e5a38', 'eyes=mean',
  'It gallops across the waves on hooves of foam, its kelp mane streaming behind.',
  'a horse-like sea creature with green scales, a long flowing mane and tail of kelp, front hooves of sea foam, galloping over waves')
c('squiddle', 'Squiddle', 'Water/Shadow', 280, 'fast', 'inkraken:38', 'route24:w:r', 'floater', '#6a4888,#f0d8f8,#2a1e38', 'eyes=big',
  'A little squid that hides in its own ink cloud and giggles.',
  'a small purple squid with big round eyes, short tentacles and a puff of dark ink behind it')
c('inkraken', 'Inkraken', 'Water/Shadow', 495, 'spec', '', '', 'floater', '#3e2858,#e0c0f0,#120a1c', 'eyes=mean glow',
  'It drags ships into pitch-black ink clouds. Sailors say its eyes glow in the dark water.',
  'a large dark violet kraken with long curling tentacles, glowing yellow eyes and clouds of black ink swirling around it')
c('leafydra', 'Leafydra', 'Water/Dragon', 300, 'spec', 'leviadrake:45', 'route24:w:r', 'serpent', '#a8c848,#f0a830,#e0f0b0', 'eyes=cute',
  'It looks just like drifting seaweed. Even sharks swim right past it.',
  'a small leafy sea dragon creature with leaf-like yellow-green fronds all over its body, a long snout and a curled tail')
c('leviadrake', 'Leviadrake', 'Water/Dragon', 540, 'spec', '', '', 'serpent', '#5a9838,#e89020,#c8e090', 'eyes=mean crest',
  'An ancient sea dragon draped in kelp. Storms calm when it surfaces.',
  'a huge majestic sea serpent dragon with long golden-green leafy fins flowing like seaweed, a crest of fronds and a powerful coiled body')

# ---- Route 25 (pink lagoon coast) ----
c('cranelet', 'Cranelet', 'Water/Flying', 280, 'bal', 'crestcrane:34', 'route25', 'bird', '#f0f0f0,#3870b8,#f0c040', 'eyes=cute',
  'It stands on one leg in the lagoon for hours waiting for a fish.',
  'a small white crane chick with blue wing tips, a yellow beak and long legs, standing on one leg')
c('crestcrane', 'Crestcrane', 'Water/Flying', 470, 'spec', '', '', 'bird', '#f8f8f8,#2858a8,#e8b030', 'eyes=mean wings=big crest',
  'Its dance across the lagoon is said to call the tide in.',
  'a tall elegant crane with white plumage, deep blue wing feathers like waves, a golden crest and long legs, dancing')
c('coralcat', 'Coralcat', 'Fae', 285, 'fast', 'coralynx:34', 'route25', 'quad', '#f8a0b0,#fff0f0,#f06080', 'eyes=cute',
  'A pink kitten with a coral-branch tail. It loves to nap in warm tide pools.',
  'a small pink kitten with a branching coral-shaped tail, coral bumps on its ears and big sparkly eyes')
c('coralynx', 'Coralynx', 'Fae/Water', 475, 'spec', '', '', 'quad', '#f07890,#fff0f4,#d84060', 'eyes=big',
  'It guards coral reefs. Its tail can grow back any coral that breaks.',
  'a graceful lynx with pink and white fur, a long tail and ear tufts made of living branching coral, pearls dangling from its ears')
c('moonhare', 'Moonhare', 'Fae/Normal', 280, 'fast', 'lunahare:30', 'route25:r', 'quad', '#f0e8f8,#c8b0e8,#f8f0a0', 'eyes=big',
  'It only comes out under the moon and leaves crescent-shaped footprints.',
  'a small white hare with very long ears tipped in lavender, a crescent moon mark on its forehead and a fluffy tail')
c('lunahare', 'Lunahare', 'Fae/Normal', 465, 'fast', '', '', 'quad', '#e0d0f0,#9878d0,#f8e870', 'eyes=big glow',
  'It leaps so high on full-moon nights that it seems to bounce off the moon.',
  'a tall elegant hare with silver-lavender fur, very long ears with glowing star tips, a shimmering crescent-moon mane, mid-leap')
c('palmtort', 'Palmtort', 'Grass/Ground', 300, 'tank', 'palmtortoise:38', 'route25:r', 'quad', '#8a7048,#58a040,#d8c090', 'eyes=sleepy',
  'A small tortoise with a palm sapling growing on its shell.',
  'a small tortoise with a sandy brown shell and a small palm tree sapling growing from the top, sleepy smile')
c('palmtortoise', 'Palmtortoise', 'Grass/Ground', 510, 'tank', '', '', 'quad', '#6a5434,#3e8a30,#c8a870', 'eyes=sleepy',
  'A whole little island grows on its back, with palms, sand and a tiny beach.',
  'a gigantic tortoise carrying a tiny tropical island on its back with palm trees, a sandy beach and a little waterfall')

# ---- Sunken Ruins ----
c('glyphlet', 'Glyphlet', 'Mind/Rock', 285, 'spec', 'glyphyx:38', 'sunkenruins', 'floater', '#a8a090,#48c0d0,#e0d8c8', 'eyes=big glow',
  'A floating stone tablet carved with glowing runes. Nobody can read them, not even it.',
  'a small floating square stone tablet with glowing teal rune carvings and one big eye in the middle')
c('glyphyx', 'Glyphyx', 'Mind/Rock', 480, 'spec', '', '', 'floater', '#8a8270,#28a8c0,#d0c8b8', 'eyes=mean glow crown',
  'It reassembles the ruined city stone by stone while everyone sleeps.',
  'a floating totem of ancient carved stone blocks orbiting a glowing teal core eye, rune symbols spinning around it')
c('drownling', 'Drownling', 'Spirit/Water', 280, 'spec', 'wreckwraith:38', 'sunkenruins', 'floater', '#80c0c8,#f0f8f8,#305860', 'eyes=sleepy',
  'A lost little ghost wearing a sailor\'s cap. It asks travelers for directions home.',
  'a small translucent sea-green ghost wearing a tiny sailor cap, with drips of seawater and a sad cute face')
c('wreckwraith', 'Wreckwraith', 'Spirit/Water', 480, 'spec', '', '', 'floater', '#4a8890,#d8f0f0,#1e3a40', 'eyes=mean glow',
  'The ghost of a ship\'s captain. Its lantern lures sailors onto the rocks.',
  'a tall ghostly sea captain spirit in a tattered coat and tricorn hat, seaweed hanging from it, holding a lantern with a green flame, no legs')
c('idolith', 'Idolith', 'Rock/Spirit', 465, 'tank', '', 'sunkenruins:r', 'golem', '#8a8a78,#48b0a0,#c8c0a8', 'eyes=mean glow',
  'A stone idol head from the sunken city. It hums when the tide comes in.',
  'a large carved stone idol head with moss and barnacles, glowing teal eyes and a wide mouth, hovering slightly off the ground')
c('coilfin', 'Coilfin', 'Water/Electric', 285, 'phys', 'voltacoil:40', 'sunkenruins:r', 'serpent', '#3a5878,#f8e040,#a8c0d8', 'eyes=mean',
  'A young eel that hides in the cracks of sunken pillars and zaps passersby.',
  'a small dark blue eel with yellow lightning stripes and a sharp grin, coiled around a broken pillar')
c('voltacoil', 'Voltacoil', 'Water/Electric', 505, 'phys', '', '', 'serpent', '#1e3858,#f8d820,#88a8c8', 'eyes=mean glow',
  'A huge eel that generates enough power to light the whole sunken city.',
  'a huge long eel with deep blue body, bright yellow glowing lightning patterns, electricity crackling along fin ridges, menacing fangs')

# ---- Route 26 (stormy sea) ----
c('sparkgull', 'Sparkgull', 'Electric/Flying', 455, 'fast', '', 'route26', 'bird', '#f0f0f0,#f8d030,#788090', 'eyes=mean',
  'It rides lightning bolts down to the sea and comes up with a fish every time.',
  'a seagull with white and gray feathers, yellow lightning-shaped wing tips and crackling sparks around its beak')
c('shalecat', 'Shalecat', 'Rock', 290, 'phys', 'shalepard:40', 'route26:r', 'quad', '#8a8478,#4a4440,#c8c0b0', 'eyes=cute',
  'A cat with a coat of flaky slate. It sharpens its claws on cliffs.',
  'a small gray cat with fur made of layered slate shale plates, a striped tail and sharp little claws')
c('shalepard', 'Shalepard', 'Rock/Shadow', 490, 'phys', '', '', 'quad', '#5a544c,#2a2624,#a8a090', 'eyes=mean',
  'It stalks the sea cliffs at night, silent as falling dust.',
  'a large sleek leopard with a coat of dark layered slate plates with shadowy spots, glowing eyes and sharp stone claws')
c('tunarrow', 'Tunarrow', 'Water', 450, 'phys', '', 'route26:w', 'fish', '#284878,#c8d8e8,#f0c030', 'eyes=mean',
  'It swims like an arrow across the open sea and never stops moving, even to sleep.',
  'a streamlined tuna fish with a dark blue back, silver sides, yellow finlets and an arrow-shaped head')
c('stormray', 'Stormray', 'Water/Electric', 460, 'spec', '', 'route26:w', 'fish', '#384058,#f8e040,#8890a8', 'eyes=mean glow',
  'It glides under storm clouds and stores their lightning in its wings.',
  'a flat electric ray with dark gray wings patterned with glowing yellow circles, sparks along its edges and a long tail')
c('coralith', 'Coralith', 'Rock/Water', 290, 'tank', 'coralossus:42', 'route26:w:r', 'golem', '#f08870,#f8d0c0,#a85848', 'eyes=cute',
  'A chunk of reef that broke off and decided to walk around.',
  'a small creature made of branching orange and pink coral with tiny fish hiding in it and a cute face')
c('coralossus', 'Coralossus', 'Rock/Water', 520, 'tank', '', '', 'golem', '#d86050,#f8c0b0,#884030', 'eyes=mean',
  'A giant made of an entire reef. Whole schools of fish live in its arms.',
  'a towering golem built from a whole colorful coral reef, sea anemones and fish living in its body, glowing blue eyes')
c('whaleling', 'Whaleling', 'Water', 320, 'tank', 'titanwhale:48', 'route26:w:r', 'fish', '#5878a8,#e8f0f8,#304868', 'eyes=cute',
  'A baby whale already bigger than a boat. It sings to its mother across the sea.',
  'a chubby baby blue whale with a pale belly, a tiny spout of water above its head and a sweet smile')
c('titanwhale', 'Titanwhale', 'Water/Normal', 540, 'tank', '', '', 'fish', '#304868,#d8e4f0,#1a2a40', 'eyes=sleepy',
  'The biggest creature in the Isles. Islands have been mistaken for its back.',
  'a colossal ancient whale with barnacles and a small palm island growing on its back, a giant spout of water and a wise old eye')

# ---- Route 27 (crag trail) ----
c('crystag', 'Crystag', 'Rock/Fae', 290, 'bal', 'crystagger:36', 'route27', 'quad', '#c8b8a0,#a0d8f0,#f0e8d8', 'eyes=cute',
  'A fawn whose antlers are tiny crystals. They chime when it runs.',
  'a small fawn with tan fur, white spots and little crystal antlers like clear quartz')
c('crystagger', 'Crystagger', 'Rock/Fae', 480, 'phys', '', '', 'quad', '#a89880,#70c0e8,#e8e0d0', 'eyes=mean crown',
  'Its huge crystal antlers catch the sunrise and blind any rival.',
  'a majestic stag with stone-gray fur and enormous branching antlers made of glowing blue crystals')
c('condorock', 'Condorock', 'Flying/Rock', 470, 'phys', '', 'route27', 'bird', '#4a4440,#f0f0e8,#c88850', 'eyes=mean wings=big',
  'Its wings are lined with stone feathers. It drops rocks on intruders from the clouds.',
  'a large condor with dark plumage, a white neck ruff and wings tipped with stone-gray rocky feathers, soaring')
c('scalet', 'Scalet', 'Dragon', 300, 'phys', 'scalewyrm:35', 'route27:r', 'dragon', '#6858c8,#f0d878,#c8c0f0', 'eyes=cute',
  'A baby dragon that chews on rocks to sharpen its tiny teeth.',
  'a small purple baby dragon with a pale yellow belly, little horn nubs, tiny wings and big eyes, gnawing a pebble')
c('scalewyrm', 'Scalewyrm', 'Dragon', 420, 'phys', 'scaleking:50', '', 'dragon', '#5040b0,#e8c860,#b0a8e8', 'eyes=mean horn=two',
  'Its scales grow thick as shields. It practices roaring at the crater rim.',
  'a medium purple dragon with thick overlapping shield-like scales, a golden belly, two sharp horns and folded wings')
c('scaleking', 'Scaleking', 'Dragon/Rock', 600, 'phys', '', '', 'dragon', '#3a2e90,#e0b840,#9a90d8', 'eyes=mean wings=big crown',
  'The ruler of Wyrmhold\'s crater. Its scales are said to be harder than any metal.',
  'a huge regal dragon with deep purple armored scales edged in gold, a crown of rock spikes, massive wings and a commanding pose')
c('crestisk', 'Crestisk', 'Dragon/Shadow', 480, 'spec', '', 'route27:r', 'serpent', '#2e3a30,#e05030,#7a9a70', 'eyes=mean glow crest',
  'A lizard-dragon whose crest flares red when it stares down a foe.',
  'a long lizard-dragon with dark green scales, a tall frilled crest that glows red, slitted glowing eyes and a whip tail')

# ---- Route 28 (open sea) ----
c('albatrice', 'Albatrice', 'Flying', 470, 'fast', '', 'route28', 'bird', '#f8f8f8,#384048,#f0c060', 'eyes=sleepy wings=big',
  'It can glide for a month without landing, sleeping on the wind.',
  'a huge albatross with enormous long white wings with dark tips, a peaceful face and a golden beak, gliding')
c('palmdrake', 'Palmdrake', 'Dragon/Grass', 300, 'tank', 'palmwyrm:48', 'route28:r', 'dragon', '#6a5838,#58b040,#f0d898', 'eyes=cute',
  'A little dragon with a palm-frond crest. It drops coconuts on its friends as gifts.',
  'a small brown baby dragon with a crest of green palm fronds on its head, scales like palm bark and a coconut held in its arms')
c('palmwyrm', 'Palmwyrm', 'Dragon/Grass', 530, 'tank', '', '', 'dragon', '#4a3e28,#3e9030,#e0c078', 'eyes=mean wings=big',
  'Its wings are huge palm leaves. Whole islands sprout where it naps.',
  'a large tall dragon with bark-textured scales, huge palm leaf wings, a crown of coconuts and fronds, sturdy legs like tree trunks')
c('orcanine', 'Orcanine', 'Water/Shadow', 490, 'phys', '', 'route28:w', 'fish', '#181820,#f8f8f8,#606878', 'eyes=mean',
  'It hunts in clever packs and herds fish into tight balls before striking.',
  'a powerful orca with glossy black and white markings shaped like a wolf mask, a tall dorsal fin and sharp teeth')
c('swordmarl', 'Swordmarl', 'Water/Brawl', 490, 'phys', '', 'route28:w', 'fish', '#2858a0,#d8e4f0,#90a0b8', 'eyes=mean',
  'It duels anything that swims near, including other Swordmarl, just for practice.',
  'a muscular marlin fish with a long sharp sword-like bill, a tall blue sail fin and battle scars, poised like a fencer')
c('serpentide', 'Serpentide', 'Water/Dragon', 510, 'spec', '', 'route28:w:r', 'serpent', '#18608a,#80e0e8,#0a3048', 'eyes=mean crest',
  'A sea serpent that coils around shipwrecks. Its body glows like a wave at night.',
  'a long sea serpent with deep teal scales, glowing aqua stripes like bioluminescent waves, finned crest and a dragon head')
c('gloomray', 'Gloomray', 'Water/Shadow', 500, 'spec', '', 'route28:w:r', 'fish', '#1e1830,#a080e0,#4a3a68', 'eyes=mean glow',
  'A giant manta from the deep trench. It blots out the sun when it swims overhead.',
  'a huge dark manta ray with an inky purple back speckled with tiny glowing star-like spots, wide wings and a long whip tail')

# ---- Coral Depths ----
c('coralite', 'Coralite', 'Rock/Fae', 475, 'spdef', '', 'coraldepths', 'floater', '#f8b8d0,#f0f8ff,#e070a0', 'eyes=big glow',
  'A crystal of fossilized coral that glows pink in the deep.',
  'a floating gem-like creature of pink fossilized coral and crystal, glowing softly, with a gentle face')
c('anemonix', 'Anemonix', 'Water/Toxic', 470, 'spdef', '', 'coraldepths', 'blob', '#e05098,#f8e0f0,#802860', 'eyes=sleepy',
  'Its waving tentacles sting anything but its partner fish.',
  'a sea anemone creature with long waving magenta tentacles with glowing tips, a round base with a sleepy face and a small striped fish hiding inside')
c('trenchfang', 'Trenchfang', 'Water/Dragon', 520, 'phys', '', 'coraldepths:r', 'serpent', '#1e2e48,#f04848,#405878', 'eyes=mean glow',
  'A deep-sea dragon with a lure on its head. It swallows whole schools of fish in one gulp.',
  'a deep-sea dragon-fish with a huge jaw full of needle fangs, dark navy scales, a glowing red lure dangling from its head')
c('pearlking', 'Pearlking', 'Water/Metal', 520, 'tank', '', 'coraldepths:r', 'blob', '#c8d0e0,#f8f0f8,#8890a8', 'eyes=mean crown',
  'A giant oyster with a silver shell. The pearl inside is the size of a person.',
  'a giant oyster with a polished silver metal shell, slightly open to reveal an enormous glowing pearl, a crown of smaller pearls on top')

# ---- Route 29 (coast to Crown Atoll) ----
c('hibiscat', 'Hibiscat', 'Grass/Fae', 475, 'spec', '', 'route29', 'quad', '#f05068,#68b048,#f8e070', 'eyes=big',
  'A cat with hibiscus flowers for ears. Its scent makes everyone feel like dancing.',
  'an elegant cat with green fur, big red hibiscus flowers for ears and a flowered tail, a lei of flowers around its neck')
c('rootstrider', 'Rootstrider', 'Grass/Water', 480, 'tank', '', 'route29', 'golem', '#6a5038,#3e9038,#a88860', 'eyes=sleepy',
  'A mangrove tree that walks on its stilt roots through the shallows.',
  'a walking mangrove tree creature standing on tall arched stilt roots, leafy canopy head with a sleepy face, small crabs on its roots')
c('solarbird', 'Solarbird', 'Fire/Flying', 480, 'spec', '', 'route29:r', 'bird', '#f8a020,#f04020,#f8e060', 'eyes=mean wings=big glow',
  'It flies toward the sunset every evening and is said to carry the sun to bed.',
  'a radiant bird with flame-orange and golden plumage, sunburst tail feathers and wings glowing like a tropical sunset')
c('kingcoral', 'Kingcoral', 'Rock/Water', 490, 'tank', '', 'route29:r', 'golem', '#c84060,#f8d0a0,#782840', 'eyes=mean crown',
  'A coral boulder crowned with a living reef. It sits at the gate of Crown Atoll.',
  'a stout regal creature made of red coral rock with a crown of colorful living coral and sea fans, stern face and a royal posture')

# ---- legends ----
c('caldoros', 'Caldoros', 'Fire/Dragon', 600, 'legend', '', 'static:magmatunnel', 'dragon', '#b82810,#1e1414,#f8b030', 'eyes=mean wings=big glow crown',
  'The volcano dragon that raised Ember Isle from the sea. It sleeps in the heart of the mountain.',
  'a legendary colossal volcano dragon with a body of black basalt and rivers of lava, a crater-shaped crown spewing fire and smoke, huge ash-gray wings')
c('maelstrix', 'Maelstrix', 'Water/Flying', 600, 'legend', '', 'static:route26', 'bird', '#2850a0,#e0f0f8,#80c0f0', 'eyes=mean wings=big glow',
  'It stirs the great whirlpools between the islands with every beat of its wings.',
  'a legendary giant sea bird with deep-blue and white storm-feathers, its long tail swirling into a whirlpool, wings trailing rain and spray')
c('coralis', 'Coralis', 'Water/Fae', 600, 'legend', '', 'static:coraldepths', 'floater', '#f8a0c0,#f8f8ff,#60c8e0', 'eyes=big glow crown',
  'The guardian of every reef. Coral grows wherever its tears fall.',
  'a legendary graceful mermaid-like reef spirit with a body of pink coral and pearl, flowing fins like silk, a crown of coral and starfish, glowing gently')
c('azuron', 'Azuron', 'Dragon/Fae', 600, 'legend', '', 'static:route28', 'serpent', '#3070d0,#f8f0ff,#f0c040', 'eyes=big glow crown',
  'A mythical sky-and-sea dragon said to have painted the Isles\' waters their blue.',
  'a mythical long flowing serpent dragon with azure scales shifting from sky blue to deep sea blue, golden whiskers, feathery fins and a pearl held in its claw')

LEGENDS = {'caldoros', 'maelstrix', 'coralis', 'azuron'}

# ---- wild tables: 2 common + 2 rare per area (the rare ones hide in one far patch) ----
WILD3 = {
    'route20': {'land': [['sandpip', 40], ['cocolet', 35], ['tidepup', 15], ['skitterling', 10]]},
    'route21': {'land': [['leafrog', 40], ['mischimp', 35], ['parrotune', 15], ['antlet', 10]]},
    'tidecave': {'land': [['drippet', 40], ['stalaclam', 35], ['luminewt', 15], ['barnacreep', 10]]},
    'route22': {'land': [['ternlet', 60], ['marinig', 40]], 'surf': [['finlet', 40], ['jellune', 35], ['turtide', 15], ['puffurr', 10]]},
    'route23': {'land': [['kidling', 40], ['pumicorn', 35], ['smogfly', 15], ['obsidisk', 10]]},
    'magmatunnel': {'land': [['lavalump', 40], ['sulfurk', 35], ['quartzling', 15], ['magmaw', 10]]},
    'route24': {'land': [['skimmerkit', 60], ['conchurn', 40]], 'surf': [['dolphling', 40], ['kelpie', 35], ['squiddle', 15], ['leafydra', 10]]},
    'route25': {'land': [['cranelet', 40], ['coralcat', 35], ['moonhare', 15], ['palmtort', 10]]},
    'sunkenruins': {'land': [['glyphlet', 40], ['drownling', 35], ['idolith', 15], ['coilfin', 10]]},
    'route26': {'land': [['sparkgull', 60], ['shalecat', 40]], 'surf': [['tunarrow', 40], ['stormray', 35], ['coralith', 15], ['whaleling', 10]]},
    'route27': {'land': [['crystag', 40], ['condorock', 35], ['scalet', 15], ['crestisk', 10]]},
    'route28': {'land': [['albatrice', 60], ['palmdrake', 40]], 'surf': [['orcanine', 40], ['swordmarl', 35], ['serpentide', 15], ['gloomray', 10]]},
    'coraldepths': {'land': [['coralite', 40], ['anemonix', 35], ['trenchfang', 15], ['pearlking', 10]]},
    'route29': {'land': [['hibiscat', 40], ['rootstrider', 35], ['solarbird', 15], ['kingcoral', 10]]},
}

# ---- hand learnsets for the starters and legends (others are generated) ----
LEARN = {
    'batbud': [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'gust'], [13, 'palmslap'], [17, 'featherdart'], [22, 'vinelash'], [28, 'tropicstorm'], [34, 'solarlance']],
    'frondbat': [[1, 'tackle'], [1, 'leafflick'], [16, 'palmslap'], [21, 'featherdart'], [27, 'vinelash'], [33, 'tropicstorm']],
    'canopteryx': [[1, 'palmslap'], [1, 'tropicstorm'], [36, 'hurricane'], [42, 'solarlance'], [48, 'skydive']],
    'cindershell': [[1, 'scratch'], [1, 'harden'], [5, 'ember'], [9, 'rocktoss'], [13, 'coralspike'], [17, 'flamefang'], [23, 'shellbash'], [29, 'magmaburst']],
    'kilnshell': [[1, 'scratch'], [1, 'ember'], [16, 'flamefang'], [21, 'shellbash'], [27, 'magmaburst'], [33, 'ironwall']],
    'calderacrab': [[1, 'magmaburst'], [1, 'shellbash'], [36, 'lavacrush'], [42, 'bouldercrash'], [48, 'inferno']],
    'tuskle': [[1, 'tackle'], [1, 'tailwag'], [5, 'waterjet'], [9, 'quickjab'], [13, 'riptide'], [18, 'ironclaw'], [24, 'tidecrash'], [30, 'gearsaw']],
    'lancetusk': [[1, 'tackle'], [1, 'waterjet'], [16, 'riptide'], [22, 'ironclaw'], [28, 'tidecrash'], [34, 'quickstep']],
    'narwhallant': [[1, 'riptide'], [1, 'gearsaw'], [36, 'meteorfist'], [42, 'monsoon'], [48, 'chromebeam']],
    'caldoros': [[1, 'ember'], [1, 'drakebreath'], [40, 'magmaburst'], [45, 'scalestrike'], [50, 'lavacrush'], [60, 'dracosurge']],
    'maelstrix': [[1, 'gust'], [1, 'waterjet'], [40, 'riptide'], [45, 'tropicstorm'], [50, 'monsoon'], [60, 'hurricane']],
    'coralis': [[1, 'pixiebreeze'], [1, 'waterjet'], [40, 'coralspike'], [45, 'pearlglow'], [50, 'monsoon'], [60, 'starfall']],
    'azuron': [[1, 'drakebreath'], [1, 'pixiebreeze'], [30, 'scalestrike'], [40, 'pearlglow'], [50, 'azurewave'], [60, 'dracosurge']],
}

def esc(s): return s.replace('\\', '\\\\').replace("'", "\\'")

def main():
    out = []
    out.append("// The Azurine Isles creature list (generated by tools/azurine/dex.py - edit that, not this).")
    out.append("// Same row format as species.js, plus the region tag added in data.js.")
    out.append("const A = (plan, c, f = '', stage = 1, legend = false) => ({ family: 'plan', plan, c: c.split(','), f, stage, legend });")
    out.append('export const RAW_SPECIES3 = [')
    pre = {}
    for e in C:
        evo = e[5]
        if evo: pre[evo.split(':')[0]] = e[0]
    for e in C:
        id_, name, types, total, prof, evo, where, plan, cols, feats, dex, look = e
        st = 1; p = id_
        while p in pre: st += 1; p = pre[p]
        leg = 'true' if id_ in LEGENDS else 'false'
        s = stats(total, prof)
        out.append(f"  ['{id_}', '{esc(name)}', '{types}', {s}, '{evo}', '{where}', A('{plan}', '{cols}', '{feats}', {min(st,3)}, {leg}), '{esc(dex)}'],")
    out.append('];')
    out.append('export const HAND_LEARNSETS3 = ' + json.dumps(LEARN).replace('"', "'") + ';')
    out.append('export const WILD3 = ' + json.dumps(WILD3).replace('"', "'") + ';')
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    open(os.path.join(root, 'static/js/species3.js'), 'w').write('\n'.join(out) + '\n')
    json.dump({e[0]: {'name': e[1], 'types': e[2], 'look': e[11], 'evo': e[5]} for e in C}, open(os.path.join(os.path.dirname(__file__), 'looks.json'), 'w'), indent=1)
    print(len(C), 'creatures')

if __name__ == '__main__':
    main()
