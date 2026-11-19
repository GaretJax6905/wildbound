# Meridia's creature list (source of truth). Run: python3 tools/meridia/dex.py
# Writes static/js/species2.js. Each entry:
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

# ---- starters (Professor Cedar's lab; wild ones gather in Whisperwood) ----
c('bramblecub', 'Bramblecub', 'Grass', 315, 'phys', 'thornbear:16', 'static:whisperwood', 'quad', '#6a9a3a,#c8a060,#e8d8a0', 'ears=round eyes=cute',
  'A bear cub with a coat of soft moss. Burrs stick to it wherever it rolls, so seeds travel everywhere it naps.',
  'a small chubby bear cub with a coat of soft green moss, tan muzzle and belly, little burrs and clover sprigs stuck in its fur, big friendly eyes')
c('thornbear', 'Thornbear', 'Grass', 405, 'phys', 'briarbruin:36', '', 'quad', '#4e8a30,#a07840,#d8c890', 'ears=round eyes=mean',
  'Thorny vines grow along its shoulders. It guards berry bushes from anyone greedy enough to strip them bare.',
  'a sturdy young bear standing on all fours, green mossy fur, thorny bramble vines wrapping its shoulders and forearms, red berries growing in the vines')
c('briarbruin', 'Briarbruin', 'Grass/Brawl', 530, 'phys', '', '', 'biped', '#3e7a28,#8a6030,#c8b880', 'ears=round eyes=mean',
  'It stands tall and wrestles boulders out of the way to clear land for new forests. Its roar shakes leaves loose.',
  'a huge powerful bear standing upright like a wrestler, dark green mossy fur, massive thorny bramble gauntlets on its fists, a crown of leaves and berries on its head')
c('cindergecko', 'Cindergecko', 'Fire', 309, 'fast', 'forgecko:16', 'static:whisperwood', 'biped', '#e86a30,#f8c048,#fbe2a0', 'eyes=cute tail=flame',
  'This little gecko licks embers out of campfires. Its tail glows brighter the happier it is.',
  'a small orange gecko lizard with glowing ember spots along its back, a tail tip that glows like a hot coal, sticky toe pads and big amber eyes')
c('forgecko', 'Forgecko', 'Fire', 405, 'spec', 'smeltwyrm:36', '', 'biped', '#c84a20,#f0a038,#f8d890', 'eyes=mean tail=flame',
  'Its scales harden into plates of iron as it grows. It hammers stones with its tail to shape them.',
  'a lean red-orange lizard standing upright, dark iron-like scale plates on its back and forearms, its tail ends in a glowing hammer-shaped club, sparks around it')
c('smeltwyrm', 'Smeltwyrm', 'Fire/Metal', 530, 'spec', '', '', 'dragon', '#a83818,#8a8c98,#f8c060', 'eyes=mean horn=two tail=flame',
  'Molten metal flows in channels along its armor. Blacksmiths say a blade forged in its breath never dulls.',
  'a large armored fire lizard-dragon with steel plating riveted over red scales, glowing molten-orange seams running between the plates, a forge-chimney spine, glowing eyes')
c('splotter', 'Splotter', 'Water', 314, 'bal', 'surfotter:16', 'static:whisperwood', 'quad', '#4a90c8,#a8d8f0,#f0f8ff', 'eyes=cute',
  'A playful otter pup that splashes everyone it meets. It floats on its back to sleep, holding a pebble.',
  'a cute blue otter pup with a pale cream belly, round ears, whiskers, holding a smooth pebble, a little water droplet curl on its head')
c('surfotter', 'Surfotter', 'Water', 405, 'fast', 'glaciotter:36', '', 'quad', '#3478b8,#8cc8e8,#e8f4fc', 'eyes=mean',
  'It rides the waves on a slab of driftwood it carved itself. It can outswim most boats.',
  'a sleek blue otter riding on a carved driftwood surfboard, a frothy wave crest mane, long flat tail like a rudder')
c('glaciotter', 'Glaciotter', 'Water/Ice', 530, 'spec', '', '', 'quad', '#2a5c98,#c8ecfa,#f4fbff', 'eyes=mean crest',
  'It freezes the sea beneath its paws and glides over the ice. Its breath can turn a wave to glass mid-crash.',
  'a large regal otter with deep blue fur, an armor of clear ice crystals on its shoulders and back, a frozen wave-shaped crest, frosty breath, icy whiskers')

# ---- Route 11 ----
c('tumblepup', 'Tumblepup', 'Normal', 280, 'bal', 'rollhound:20', 'route11', 'quad', '#d8a868,#8a5a30,#f8e8c8', 'ears=floppy eyes=cute',
  'It curls into a ball and rolls down hills just for fun, yipping all the way.',
  'a round fluffy tan puppy with floppy ears and a curly tail, curled half into a ball like it is about to roll')
c('rollhound', 'Rollhound', 'Normal', 440, 'phys', '', 'route19', 'quad', '#b88848,#6a4220,#f0d8b0', 'ears=floppy eyes=mean',
  'It charges by tucking in and rolling like a boulder. Ranchers in Meridia use them to herd cattle.',
  'a muscular tan hound with thick armored-looking fur bands along its back like a pangolin, floppy ears, a confident grin')
c('chirpip', 'Chirpip', 'Normal/Flying', 265, 'fast', 'swiftail:16', 'route11', 'bird', '#e8b048,#f8e8a8,#fff4d8', 'eyes=cute',
  'A tiny songbird that chirps the same three notes over and over. It never gets tired of them.',
  'a tiny round yellow songbird with a fluffy chest, short stubby wings and a little crest of three feathers')
c('swiftail', 'Swiftail', 'Normal/Flying', 400, 'fast', 'galeon:34', 'route14', 'bird', '#d89038,#f8d880,#fff0c8', 'eyes=mean',
  'Its streamer tail feathers crack like whips when it turns. It races the wind across open prairie.',
  'a sleek swallow-like bird, gold and orange, with two very long streamer tail feathers and swept-back wings mid-flight')
c('galeon', 'Galeon', 'Flying', 495, 'fast', '', '', 'bird', '#c87028,#f0c060,#fbe8b8', 'eyes=mean crest',
  'A gust from its wings can flip a wagon. It hunts by riding the storm fronts that cross Meridia.',
  'a large majestic falcon with golden-bronze plumage, a crest of sharp feathers like a lion mane, huge wings spread wide with wind swirls')
c('larvel', 'Larvel', 'Bug', 200, 'tank', 'silkpod:7', 'route11', 'bug', '#88c050,#f8e070,#e8f8c8', 'eyes=cute',
  'A caterpillar that eats twice its weight in leaves every day. Its yellow spots taste bitter to birds.',
  'a small plump lime-green caterpillar with yellow spots, little stubby legs and a happy face')
c('silkpod', 'Silkpod', 'Bug', 210, 'tank', 'glimmoth:10', 'whisperwood:r', 'blob', '#c8b878,#88c050,#f0e8c0', 'eyes=sleepy',
  'Wrapped in silk and dry leaves, it hangs from branches and sways in the wind until it is ready.',
  'a silk cocoon wrapped in dry leaves and threads, hanging from a twig, two sleepy eyes peeking out')
c('glimmoth', 'Glimmoth', 'Bug/Fae', 395, 'spec', '', '', 'bird', '#f0c0e0,#80d0f0,#fff0fa', 'eyes=big wings=big',
  'The dust on its wings sparkles like starlight. Couples in Mossbrook watch them dance on summer nights.',
  'a graceful moth with big pastel pink and sky-blue wings covered in sparkling dust, fluffy white collar and feathery antennae')
c('zaphog', 'Zaphog', 'Electric', 285, 'fast', 'voltspike:26', 'route11', 'quad', '#f0d048,#5a4a3a,#fff4c0', 'eyes=cute',
  'Its quills store static from rubbing against grass. Touching it gives a harmless but startling zap.',
  'a small round hedgehog with yellow lightning-shaped quills, a brown face and paws, tiny sparks crackling between the spines')
c('voltspike', 'Voltspike', 'Electric', 450, 'phys', '', '', 'quad', '#e8b820,#3a3040,#fff0a0', 'eyes=mean',
  'It curls up and fires its charged quills like darts. A thunderstorm can recharge a whole family at once.',
  'a large spiky porcupine with long yellow-and-black lightning-bolt quills raised, electricity arcing between them, dark fur')

# ---- Whisperwood ----
c('mossnail', 'Mossnail', 'Bug/Grass', 285, 'tank', 'shellmoss:24', 'whisperwood', 'blob', '#9ab060,#6a8a40,#d8e8b0', 'eyes=sleepy',
  'A snail whose shell is a tiny garden. Ferns and mushrooms grow on it during the rainy season.',
  'a small snail with a shell covered in moss, tiny ferns and a little mushroom growing on top, sleepy stalk eyes')
c('shellmoss', 'Shellmoss', 'Bug/Grass', 450, 'tank', '', '', 'blob', '#7a9848,#5a7030,#c8d898', 'eyes=sleepy',
  'Its shell becomes a whole mossy hillock. Lost travelers have rested on it without noticing it move.',
  'a big snail whose shell is a mossy hill with a little tree, flowers and a tiny birdhouse growing on it, calm wise eyes')
c('hivelet', 'Hivelet', 'Bug', 260, 'fast', 'hiveguard:22', 'whisperwood', 'bug', '#f0b030,#3a2a20,#fff4c0', 'eyes=cute wings=small',
  'A bee that never stops working. It brings nectar home in its fuzzy pouch.',
  'a small round fuzzy bee with amber and dark brown stripes, tiny clear wings and a little pollen pouch')
c('hiveguard', 'Hiveguard', 'Bug/Metal', 460, 'phys', '', 'route16:r', 'bug', '#d89020,#7a8090,#f8e0a0', 'eyes=mean wings=small',
  'The soldier of the hive. Its stinger and shell harden into polished metal that can stop a sword.',
  'a bee knight with a polished steel armor shell over amber stripes, a lance-like metal stinger, honeycomb-pattern shield on its arm')
c('webbit', 'Webbit', 'Bug/Shadow', 270, 'fast', 'arachnight:26', 'whisperwood', 'bug', '#4a3a5a,#a080d0,#2a2030', 'eyes=big',
  'It spins webs between trees after dark. Dew on the silk glows faintly purple at dawn.',
  'a small round dark purple spider with big shiny eyes and glowing violet markings, spinning a thread')
c('arachnight', 'Arachnight', 'Bug/Shadow', 460, 'phys', '', 'stormcave', 'bug', '#2e2238,#9060c8,#1a1420', 'eyes=mean',
  'It weaves webs in the shape of the night sky. Anything caught in them falls into a deep sleep.',
  'a large elegant black spider with a violet crescent-moon pattern on its back, long legs, a web of starry silk behind it')
c('sporeling', 'Sporeling', 'Grass/Toxic', 280, 'spec', 'fungloom:28', 'whisperwood', 'plant', '#c85a6a,#f8e8d8,#8a5a7a', 'eyes=cute',
  'A walking mushroom. When startled, it puffs a cloud of spores that makes noses itch for hours.',
  'a small mushroom creature with a red cap with cream spots, stubby little feet and a puff of pink spores')
c('fungloom', 'Fungloom', 'Grass/Toxic', 450, 'spdef', '', '', 'plant', '#8a3a6a,#d8f070,#5a3a5a', 'eyes=mean glow',
  'Its glowing caps light the forest floor. The spores it releases at night make other mushrooms grow.',
  'a tall mushroom creature with a big purple cap with glowing lime spots, smaller glowing mushrooms growing from its body, drifting spores')

# ---- Route 12 (desert) ----
c('sandskink', 'Sandskink', 'Ground', 290, 'phys', 'duneskink:24', 'route12,echocanyon', 'serpent', '#d8b070,#a87840,#f8e8c0', 'eyes=cute',
  'It swims through sand as if it were water. Only its little eyes poke above the dunes.',
  'a small sandy-tan skink lizard with short legs, smooth scales with brown bands, peeking up from sand')
c('duneskink', 'Duneskink', 'Ground', 410, 'phys', 'sandrake:42', 'summitpass', 'serpent', '#c09850,#8a5a28,#f0d8a0', 'eyes=mean',
  'It digs tunnels so long that whole caravans use them as shortcuts beneath the desert.',
  'a long sandy lizard with digging claws, a spade-shaped head, ridged back scales and a whipping tail, sand swirling around')
c('sandrake', 'Sandrake', 'Ground/Dragon', 600, 'phys', '', '', 'dragon', '#b07838,#e8c070,#f8e4b0', 'eyes=mean wings=big horn=two',
  'It summons sandstorms with a beat of its wings. Old maps of Meridia mark its territory with a warning.',
  'a fierce desert dragon with sand-gold scales, wide wings like dune ridges with tattered edges, twin horns, swirling sandstorm around it')
c('prickle', 'Prickle', 'Grass', 290, 'tank', 'saguarro:28', 'route12', 'plant', '#5aa060,#f8a0c0,#d8f0c8', 'eyes=cute',
  'A tiny cactus with a flower on its head. It stores water in its body and shares it with thirsty travelers.',
  'a tiny round green cactus creature with soft little spines, a pink flower on top and stubby feet')
c('saguarro', 'Saguarro', 'Grass/Ground', 470, 'tank', '', '', 'plant', '#3e8848,#f07890,#c8e8b0', 'eyes=mean',
  'It stands so still in the desert that birds nest in its arms. It can go a year without water.',
  'a tall saguaro cactus creature with two raised arms, a stern face, flowers on its head and a little bird nest in one arm')
c('scorpip', 'Scorpip', 'Toxic/Ground', 295, 'phys', 'dunestinger:30', 'route12', 'bug', '#c86a3a,#8a3a7a,#f0c090', 'eyes=cute',
  'It waves its stinger to look tough, but it is mostly bluff. Its venom only tingles.',
  'a small orange scorpion with oversized cute claws, a curled stinger tipped in purple, beady eyes')
c('dunestinger', 'Dunestinger', 'Toxic/Ground', 480, 'phys', '', '', 'bug', '#a84a28,#7a2a6a,#e8a070', 'eyes=mean claws',
  'Its shell is the color of the setting sun. Its venom glows violet in the dark.',
  'a large armored desert scorpion with sunset-orange plates, huge pincers, a tall curled stinger dripping glowing violet venom')
c('shimmerling', 'Shimmerling', 'Fire/Mind', 300, 'spec', 'miragekin:sunstone', 'route12', 'floater', '#f8c060,#f07090,#fff0c0', 'eyes=big glow',
  'A wisp of heat haze given life. Travelers see it as a shimmering oasis that is never quite there.',
  'a small floating wisp of shimmering heat haze, golden with pink edges, round body with big dreamy eyes and a ripple trail')
c('miragekin', 'Miragekin', 'Fire/Mind', 490, 'spec', '', '', 'floater', '#f0a030,#d04880,#fff0b0', 'eyes=mean glow crown',
  'It bends light to show false oases, then leads travelers to real water. It evolves under a Sun Stone.',
  'an elegant floating desert spirit with a sun-disc halo, flowing ribbon-like veils of gold and magenta, shimmering mirage ripples around it')

# ---- Route 13 (canyon) ----
c('ramblet', 'Ramblet', 'Ground', 300, 'tank', 'ramparch:32', 'route13', 'quad', '#d8c8a8,#8a6a48,#f8f0e0', 'eyes=cute horn=two',
  'A lamb with tiny curled horns. It practices head-butting canyon walls every morning.',
  'a small fluffy cream-colored lamb with tiny curled horns, brown legs and a determined face')
c('ramparch', 'Ramparch', 'Ground/Rock', 490, 'tank', '', '', 'quad', '#b8a080,#6a5038,#e8dcc0', 'eyes=mean horn=two',
  'Its horns are layered like canyon rock. When two clash, the sound echoes for miles.',
  'a huge bighorn ram with massive curled horns made of layered red canyon rock, thick wool, standing on a ledge')
c('vultyke', 'Vultyke', 'Flying/Shadow', 290, 'phys', 'vultrex:30', 'route13', 'bird', '#5a4a48,#d86a50,#2a2020', 'eyes=mean',
  'It circles high over the canyon waiting for something to drop. It is braver in a group.',
  'a scruffy young vulture chick with dark feathers, a bald pinkish-red head, and a cocky look')
c('vultrex', 'Vultrex', 'Flying/Shadow', 480, 'phys', '', 'route18', 'bird', '#3a2e30,#c84a38,#1a1414', 'eyes=mean wings=big',
  'Its shadow is said to bring bad luck to whatever it passes over. In truth, it cleans up the canyon.',
  'a large menacing vulture with black and charcoal plumage, a red crested head, huge ragged wings spread wide, a bone necklace of feathers')
c('coyip', 'Coyip', 'Ground', 285, 'fast', 'howlote:28', 'route13', 'quad', '#c8a070,#8a6040,#f0e0c8', 'ears=pointy eyes=cute',
  'A coyote pup that yips at the moon. Its huge ears can hear a mouse under the sand.',
  'a small tan coyote pup with huge pointed ears, a bushy tail and a mischievous grin')
c('howlote', 'Howlote', 'Ground/Shadow', 470, 'fast', '', '', 'quad', '#9a7850,#3a2a40,#e0c8a0', 'ears=pointy eyes=mean',
  'Its howl at dusk calls the whole pack. Dark markings on its fur look like a starry night sky.',
  'a lean coyote with sandy fur and a dark indigo back covered in star-like speckles, howling with its head raised')
c('dustwhirl', 'Dustwhirl', 'Ground/Flying', 290, 'fast', 'siroccor:34', 'route13', 'floater', '#d8b880,#a07848,#f8ecd0', 'eyes=big',
  'A dust devil that spins itself into a creature. It gets dizzy if it stops spinning.',
  'a small spinning dust devil whirlwind with two big eyes in the swirl, little pebbles and leaves orbiting it')
c('siroccor', 'Siroccor', 'Ground/Flying', 470, 'spec', '', '', 'floater', '#c09050,#8a5a30,#f0dcb0', 'eyes=mean crown',
  'A towering sand cyclone with a crown of whirling stones. Caravans halt when they see it on the horizon.',
  'a towering sand tornado creature with fierce eyes, a crown of orbiting stones, arms made of swirling sand')

# ---- Echo Canyon (cave) ----
c('stalagmon', 'Stalagmon', 'Rock', 300, 'tank', 'stalagant:30', 'echocanyon', 'golem', '#9a8a78,#6a5a4a,#c8bca8', 'eyes=sleepy',
  'It hangs from cave ceilings pretending to be a stalactite, then drops down to say hello.',
  'a small cone-shaped rock creature like a stalagmite with little stubby arms, mineral drips and sleepy eyes')
c('stalagant', 'Stalagant', 'Rock/Ground', 490, 'tank', '', 'summitpass', 'golem', '#7a6a58,#4a3a2a,#b0a490', 'eyes=mean',
  'Its body is a forest of rock spires. Where it sleeps, new caverns slowly form.',
  'a big hulking rock giant whose back is covered with a cluster of stalagmite spires, heavy arms, glowing mineral eyes')
c('trilobyte', 'Trilobyte', 'Rock/Bug', 310, 'tank', 'trilocrown:35', 'echocanyon', 'bug', '#8a7a60,#c8a868,#e8dcc0', 'eyes=cute',
  'An ancient creature thought extinct until it was found living in Echo Canyon. It scuttles on many legs.',
  'a small ancient trilobite creature with a segmented stone-brown shell, many tiny legs, and big round fossil eyes')
c('trilocrown', 'Trilocrown', 'Rock/Bug', 495, 'phys', '', '', 'bug', '#6a5a40,#d8b050,#e0d0a8', 'eyes=mean crown',
  'The kings of the ancient seas. Its shell is crowned with spikes that grew for a thousand years.',
  'a large armored trilobite king with a fossilized shell, a crown of stone spikes on its head plate and golden amber accents')
c('crysmite', 'Crysmite', 'Rock/Fae', 300, 'spdef', 'crystallix:moonshard', 'echocanyon', 'bug', '#a8d8f0,#f0a8d8,#e8f8ff', 'eyes=cute glow',
  'A tiny beetle that eats gems. The crystals on its back grow in whatever color it last ate.',
  'a tiny beetle with a cluster of pastel pink and blue crystals growing on its back, sparkling, big cute eyes')
c('crystallix', 'Crystallix', 'Rock/Fae', 500, 'spec', '', '', 'golem', '#90c8e8,#e890c8,#f0faff', 'eyes=mean glow crown',
  'A living geode. When moonlight touches it, it rings like a bell and lights the whole cave.',
  'a graceful creature made of glowing prismatic crystal, like a geode cracked open, with a crown of crystal spires and rainbow light inside')
c('lumigrub', 'Lumigrub', 'Bug/Electric', 280, 'spec', 'scarabolt:28', 'echocanyon', 'bug', '#a8f070,#3a5a3a,#f0ffd0', 'eyes=cute glow',
  'It glows to attract tiny insects in dark caves. Miners follow them to find the way out.',
  'a small glowing green grub with a lantern-like glowing tail segment, tiny legs and happy eyes')
c('scarabolt', 'Scarabolt', 'Bug/Electric', 460, 'phys', '', '', 'bug', '#2a6a8a,#f0d040,#a8e0f0', 'eyes=mean',
  'A scarab whose shell crackles with lightning. Ancient Meridians carved its likeness onto their doors.',
  'a large metallic teal scarab beetle with gold lightning-bolt markings, a horn crackling with electricity, wings slightly open')

# ---- Route 14 (prairie) ----
c('kitewing', 'Kitewing', 'Flying', 290, 'fast', 'sailkite:32', 'route14', 'bird', '#e86050,#f8d050,#fff0d0', 'eyes=cute',
  'It flies like a kite, holding still in the wind for hours. Its tail ribbons flutter when it is happy.',
  'a small diamond-shaped bird like a paper kite, red and yellow with a long ribbon tail, spread flat in the wind')
c('sailkite', 'Sailkite', 'Flying/Electric', 485, 'spec', '', '', 'bird', '#c84838,#f0c040,#fff0c8', 'eyes=mean',
  'It soars into thunderclouds and comes down crackling. Farmers welcome it as a sign of rain.',
  'a large kite-shaped bird with sail-like red and gold wings, long ribbon tails crackling with electricity, flying through clouds')
c('prairox', 'Prairox', 'Normal/Ground', 470, 'tank', '', 'route14', 'quad', '#8a6038,#3a2818,#d8b888', 'eyes=mean horn=two',
  'Herds of them roam the prairie. When they stampede, the ground rumbles like distant thunder.',
  'a big shaggy prairie bison with dark brown fur, a huge woolly hump, short curved horns and a determined look')
c('hoplit', 'Hoplit', 'Bug', 270, 'fast', 'locustorm:26', 'route14', 'bug', '#88b048,#c8a040,#e0f0b0', 'eyes=cute',
  'A grasshopper that can jump twenty times its length. It chirps by rubbing its legs together.',
  'a small bright green grasshopper with big hind legs, long antennae and a cheerful face')
c('locustorm', 'Locustorm', 'Bug/Flying', 465, 'fast', '', '', 'bug', '#5a8a38,#c89038,#d0e8a0', 'eyes=mean wings=big',
  'When thousands of them fly together the sky goes dark. One alone is surprisingly polite.',
  'a large armored locust with bronze-green plates and powerful wings spread in flight, sharp mandibles')

# ---- Route 15 (sea) ----
c('shellsnap', 'Shellsnap', 'Water/Rock', 305, 'tank', 'reefortress:34', 'route15', 'quad', '#4a8a78,#a08060,#d0e8d8', 'eyes=cute',
  'A little turtle whose shell grows barnacles and coral. It snaps at anything that tickles its nose.',
  'a small sea turtle with a rocky shell covered in barnacles and a bit of coral, snapping beak, flippers')
c('reefortress', 'Reefortress', 'Water/Rock', 500, 'tank', '', '', 'quad', '#2a6a68,#e07060,#b8d8c8', 'eyes=mean',
  'An entire reef grows on its shell, with fish living among the coral. It sleeps on the sea floor for months.',
  'a huge ancient sea turtle whose shell is a colorful coral reef with little towers like a castle, fish swimming around it')
c('pouchbeak', 'Pouchbeak', 'Water/Flying', 440, 'bal', '', 'route15', 'bird', '#f0f0f0,#f0a040,#ffffff', 'eyes=sleepy',
  'It scoops up fish with its huge bill pouch, and sometimes a surprised Splotter.',
  'a plump white pelican with a huge orange bill pouch full of water and a small fish, sleepy eyes')
c('bogslug', 'Bogslug', 'Toxic/Water', 290, 'tank', 'mirelurk:30', 'route15', 'blob', '#7a8a50,#a050a0,#c8d090', 'eyes=sleepy',
  'It oozes along muddy shores leaving a slime trail that glows faintly. It loves the rain.',
  'a small mossy-green sea slug with purple frills and spots, slimy and soft, droopy happy eyes')
c('mirelurk', 'Mirelurk', 'Toxic/Water', 480, 'tank', '', '', 'blob', '#5a6a38,#8a3a8a,#a8b878', 'eyes=mean',
  'It hides in marsh mud with only its eyes showing. Its frills release a fog that makes prey dizzy.',
  'a large swamp slug creature rising from mud, olive-green with purple poison frills, drooping reeds on its back, glowing eyes')
c('jellet', 'Jellet', 'Water/Toxic', 290, 'spdef', 'medusail:30', 'route15:w', 'floater', '#a8d0f8,#e080d0,#e8f4ff', 'eyes=cute',
  'A tiny jellyfish that drifts with the tide. Its tentacles sting just enough to say "stay back."',
  'a small translucent light-blue jellyfish with pink tentacles and a cute face, glowing softly')
c('medusail', 'Medusail', 'Water/Toxic', 480, 'spdef', '', '', 'floater', '#6898e0,#c048b0,#dde8ff', 'eyes=mean crown',
  'It raises a sail-shaped crest above the waves and drifts across whole oceans with the wind.',
  'a large regal jellyfish with a translucent sail-shaped crest above its bell, long trailing violet tentacles, glowing')
c('driftling', 'Driftling', 'Water/Fae', 310, 'spec', 'driftsteed:32', 'route15:w', 'serpent', '#90d8e0,#f0b0d0,#f0ffff', 'eyes=big',
  'A tiny seahorse that curls its tail around seagrass while it sleeps. It sings to the moon.',
  'a tiny pastel teal seahorse with a curly tail, pink fins and starry sparkles')
c('driftsteed', 'Driftsteed', 'Water/Fae', 490, 'spec', '', '', 'serpent', '#58b0c8,#e080b8,#e8faff', 'eyes=mean mane',
  'It gallops across the tops of waves. Sailors who see one are promised safe passage home.',
  'an elegant sea horse creature like a true horse with a fish tail, flowing foam mane, pastel teal and pink, galloping over a wave')
c('lanternfin', 'Lanternfin', 'Water/Electric', 295, 'spec', 'gloomangler:35', 'route15:w', 'serpent', '#3a6aa8,#f8e060,#a8c8f0', 'eyes=big glow',
  'It lights the deep water with the glowing bulb on its head. It is shy around bright sunlight.',
  'a small round deep-sea fish with a glowing yellow lantern lure on a stalk, big eyes and tiny fins')
c('gloomangler', 'Gloomangler', 'Water/Shadow', 495, 'spec', '', '', 'serpent', '#1a2a48,#f0d040,#4a5a88', 'eyes=mean glow fangs',
  'It lures prey in the lightless deep with a lantern that hypnotizes. Its mouth is wider than it is long.',
  'a big menacing anglerfish with dark navy scales, a huge toothy mouth, and a glowing golden lantern lure, bioluminescent spots')
c('minnowisp', 'Minnowisp', 'Water', 260, 'fast', 'razorcuda:28', 'route15:w', 'serpent', '#a8c8e0,#f0f8ff,#ffffff', 'eyes=cute',
  'Schools of them flash silver in the shallows. Alone, it is very easily startled.',
  'a tiny silver minnow fish with a shimmering body and a big curious eye')
c('razorcuda', 'Razorcuda', 'Water/Shadow', 460, 'fast', '', '', 'serpent', '#4a6880,#c8d8e8,#203040', 'eyes=mean fangs',
  'A torpedo of a fish with a jaw full of needles. It patrols the reefs around Kingsgate.',
  'a long sleek barracuda with steel-blue scales, dark stripes, a jutting jaw of sharp teeth and a fierce eye')

# ---- Route 16 (autumn woods) ----
c('hoothaunt', 'Hoothaunt', 'Spirit/Flying', 290, 'spec', 'owlgeist:34', 'route16', 'bird', '#8a7aa8,#f0c060,#d8d0e8', 'eyes=big',
  'An owlet whose hoots echo strangely, as if a second voice answers. It can turn its head all the way around.',
  'a small round ghostly owlet with pale lavender feathers, huge glowing golden eyes and a wispy translucent tail')
c('owlgeist', 'Owlgeist', 'Spirit/Flying', 485, 'spec', '', 'stormcave', 'bird', '#5a4a80,#f8d070,#b8a8d8', 'eyes=mean wings=big glow',
  'It guards the graveyards of Kingsgate. Its silent wings leave trails of glowing mist.',
  'a large spectral owl with indigo feathers fading into mist, glowing golden eyes, a lantern hanging from its talons, wings spread')
c('nutkin', 'Nutkin', 'Normal', 270, 'fast', 'cachekin:30', 'route16', 'quad', '#c87038,#f0d0a0,#fff0e0', 'ears=pointy eyes=cute',
  'A squirrel that buries acorns everywhere and forgets half of them. Whole oak groves grow from its mistakes.',
  'a small red-orange squirrel with a huge fluffy tail, holding an acorn, cheeks stuffed full')
c('cachekin', 'Cachekin', 'Normal/Grass', 450, 'phys', '', '', 'quad', '#a85828,#e8c088,#f8e8d0', 'ears=pointy eyes=mean',
  'Its tail is a living autumn bough. It rolls acorns as hard as stones at anything that threatens its stash.',
  'a big squirrel whose giant tail is made of autumn leaves in red and gold, wearing an acorn cap like a helmet')
c('rustling', 'Rustling', 'Grass', 280, 'spdef', 'leafwraith:32', 'route16', 'blob', '#d8783a,#f0c048,#a84a28', 'eyes=big',
  'A pile of autumn leaves that walks. It loves being jumped into, then scatters everyone away with a gust.',
  'a small creature made of a pile of red, orange and yellow autumn leaves with two big eyes peeking out')
c('leafwraith', 'Leafwraith', 'Grass/Spirit', 470, 'spec', '', '', 'floater', '#b84a28,#e8a040,#5a3a2a', 'eyes=mean glow',
  'A whirling spirit of fallen leaves that drifts through autumn woods at dusk, humming to itself.',
  'a tall floating spirit made of swirling autumn leaves with a hooded shape, glowing amber eyes and wispy branch-like arms')
c('gravepup', 'Gravepup', 'Spirit', 290, 'phys', 'hollowhound:34', 'route16', 'quad', '#c8c8d8,#6a6a88,#f0f0f8', 'ears=floppy eyes=cute',
  'A ghostly puppy that follows lonely travelers home. It wags its tail even though nobody can pet it.',
  'a small translucent pale ghost puppy with floppy ears, a wispy tail, a little collar with a bell')
c('hollowhound', 'Hollowhound', 'Spirit/Shadow', 490, 'phys', '', '', 'quad', '#4a4a68,#80f0c8,#2a2a3a', 'ears=pointy eyes=mean glow',
  'Its eyes glow like lanterns on foggy nights. It guards the gates of Kingsgate\'s old castle.',
  'a large spectral hound with dark smoky fur, glowing mint-green eyes and paw-prints, ghostly chains, flames of mist along its back')
c('glintpie', 'Glintpie', 'Metal/Flying', 300, 'fast', 'gildcrow:30', 'route19', 'bird', '#2a2a3a,#c8c8d8,#e8e8f0', 'eyes=cute',
  'A magpie that steals anything shiny. Its feathers slowly turn to metal from all the coins it hoards.',
  'a small black and white magpie with a shiny silver metallic sheen on its wings, holding a coin in its beak')
c('gildcrow', 'Gildcrow', 'Metal/Flying', 480, 'phys', '', '', 'bird', '#1a1a2a,#d8b040,#c8c8d8', 'eyes=mean wings=big',
  'Its wings are plated in gold it has collected. It nests on Ironhaven\'s smokestacks.',
  'a large crow with black feathers and gleaming gold metal-plated wings and beak, a monocle-like ring around one eye')

# ---- Route 17 (snow) ----
c('yetling', 'Yetling', 'Ice/Brawl', 300, 'phys', 'yetirage:38', 'route17', 'biped', '#f0f4fa,#7aa0c8,#ffffff', 'eyes=cute',
  'A fluffy snow-white cub that practices punching snowdrifts. It gets grumpy when it warms up.',
  'a small fluffy white yeti cub with blue-gray face and paws, little fists raised, snow on its head')
c('yetirage', 'Yetirage', 'Ice/Brawl', 505, 'phys', '', '', 'biped', '#e0e8f4,#4a78a8,#ffffff', 'eyes=mean',
  'It punches avalanches out of its way. Its roar can be heard over a blizzard.',
  'a huge muscular yeti with shaggy white fur, icy blue forearms like frozen gauntlets, roaring with snow swirling')
c('pengloo', 'Pengloo', 'Ice/Water', 300, 'bal', 'emperice:36', 'route17', 'bird', '#3a4a6a,#f0f4fa,#f8b040', 'eyes=cute',
  'A penguin chick that slides everywhere on its belly. It builds tiny snow forts for fun.',
  'a small round navy-blue penguin chick with a white belly, a little orange beak, sliding on its belly')
c('emperice', 'Emperice', 'Ice/Water', 500, 'spec', '', '', 'bird', '#1a2a4a,#e8f0fa,#f0c030', 'eyes=mean crown',
  'It wears a crown of ice it carved itself. The whole colony bows when it waddles past.',
  'a tall regal emperor penguin with a crown and cape made of ice crystals, golden collar markings, proud stance')
c('flurrybun', 'Flurrybun', 'Ice/Fae', 290, 'fast', 'aurorine:32', 'route17', 'quad', '#f8f8ff,#a8c8f8,#ffffff', 'ears=long eyes=big',
  'A snow-white stoat that dives into snowbanks headfirst. It leaves sparkles where it lands.',
  'a small slender snow-white stoat with a black-tipped tail, big sparkling eyes and snowflake sparkles around it')
c('aurorine', 'Aurorine', 'Ice/Fae', 470, 'fast', '', '', 'quad', '#e8f0ff,#80e0c8,#f0a8f0', 'ears=long eyes=mean glow',
  'Its fur shimmers with the colors of the northern lights. Seeing one at night brings a year of good luck.',
  'an elegant long-bodied ermine with white fur shimmering with aurora green, blue and pink ribbons of light flowing from its tail')
c('rustmite', 'Rustmite', 'Metal/Bug', 280, 'tank', 'ironmantle:34', 'route17', 'bug', '#a86040,#7a7a88,#d8a888', 'eyes=cute',
  'A little beetle that chews on scrap metal. Its shell flakes rust when it shakes.',
  'a small rusty-orange metal beetle with a riveted shell, tiny bolts for spots, curious antenna')
c('ironmantle', 'Ironmantle', 'Metal/Bug', 490, 'tank', '', '', 'bug', '#5a5e6a,#a85a38,#9a9eaa', 'eyes=mean horn=one',
  'Its shell is as thick as a vault door. It shrugs off blows and charges with a steel horn.',
  'a large armored rhinoceros beetle with heavy polished iron plates, a big steel horn, rivets and a few rust streaks')

# ---- Route 18 (stormy peaks) ----
c('kidbolt', 'Kidbolt', 'Electric', 300, 'fast', 'voltibex:36', 'route18', 'quad', '#d8d8e0,#f0d040,#f8f8ff', 'eyes=cute horn=two',
  'A mountain kid whose horns spark when it bleats. It leaps from crag to crag during storms.',
  'a small white mountain goat kid with tiny yellow lightning-shaped horns, sparks crackling, bouncing on a rock')
c('voltibex', 'Voltibex', 'Electric/Rock', 460, 'phys', '', '', 'quad', '#9a9aa8,#f0c830,#d8d8e0', 'eyes=mean horn=two',
  'Its curved horns act as lightning rods. Climbers sometimes see a whole herd glowing on the peaks.',
  'a big mountain ibex with slate-gray coat and huge backward-curving horns crackling with lightning, standing on a peak')
c('sleetwing', 'Sleetwing', 'Ice/Flying', 300, 'fast', 'hailhawk:38', 'route18', 'bird', '#a8c8e0,#f0f8ff,#e8f4fc', 'eyes=cute',
  'It fluffs its feathers into a snowball to stay warm and rolls down hills to travel.',
  'a small round pale blue bird with frosty fluffy feathers, icicle-tipped wings and a puffed chest')
c('hailhawk', 'Hailhawk', 'Ice/Flying', 495, 'fast', '', '', 'bird', '#6898c0,#f0f8ff,#c8e0f0', 'eyes=mean wings=big',
  'It dives out of blizzards at incredible speed, shedding hailstones as it goes.',
  'a fierce hawk with steel-blue and white plumage, wings edged with sharp ice crystals, diving through hail')
c('cloudlet', 'Cloudlet', 'Flying/Fae', 290, 'spdef', 'nimbulord:sparkstone', 'route18', 'floater', '#f8f8ff,#f0b0d0,#ffffff', 'eyes=cute',
  'A little cloud that drifts after anyone humming a tune. It rains a tiny bit when it cries.',
  'a small fluffy white cloud creature with pink cheeks, a happy face and a tiny raindrop')
c('nimbulord', 'Nimbulord', 'Flying/Electric', 500, 'spec', '', '', 'floater', '#7a88a8,#f0d040,#d8dce8', 'eyes=mean crown',
  'A thundercloud that rules the sky over Skyspire. Lightning forks from its crown when it is angry.',
  'a big dark storm-cloud creature with a crown of lightning bolts, stern face, arms of swirling cloud, rain and sparks falling')
c('frostbeetle', 'Frostbeetle', 'Ice/Bug', 440, 'tank', '', 'route18', 'bug', '#a8d8f0,#4a7aa8,#e8f8ff', 'eyes=mean',
  'Its shell is coated in ice that never melts. It hibernates inside glaciers.',
  'a large beetle with a shell of thick clear blue ice, frost crystals on its legs and frosty mandibles')

# ---- Storm Cave (dark) ----
c('murkit', 'Murkit', 'Shadow', 285, 'fast', 'umbrastoat:30', 'stormcave', 'quad', '#3a3048,#a080c8,#5a5068', 'ears=round eyes=big',
  'A ferret that slips through cracks in the dark. It steals shiny pebbles from sleeping Glintpie.',
  'a small sleek dark purple ferret with a mask-like marking around big glowing eyes and a fluffy tail')
c('umbrastoat', 'Umbrastoat', 'Shadow/Brawl', 480, 'fast', '', '', 'quad', '#28203a,#8a58c8,#40385a', 'ears=round eyes=mean',
  'It moves so fast in the dark that it seems to teleport. Its claws leave violet trails.',
  'a long powerful shadow weasel with dark fur, violet claw trails, a scarf-like tail and a fierce masked face')
c('umbrapede', 'Umbrapede', 'Shadow/Bug', 300, 'phys', 'centigloom:34', 'stormcave', 'serpent', '#3a2a3a,#e05050,#6a4a5a', 'eyes=mean',
  'A centipede that lives where light never reaches. Its many legs clatter like rain on stone.',
  'a small dark centipede with many red-tipped legs, segmented charcoal plates and glowing red eyes')
c('centigloom', 'Centigloom', 'Shadow/Toxic', 495, 'phys', '', '', 'serpent', '#2a1a2a,#c03860,#5a3a5a', 'eyes=mean fangs',
  'It coils through the deepest tunnels. Its venom makes the world go dark for a moment.',
  'a huge coiled centipede with black glossy armor, crimson legs, venomous fangs and dripping violet poison')
c('sparkshade', 'Sparkshade', 'Electric/Spirit', 300, 'spec', 'stormwisp:duskstone', 'stormcave', 'floater', '#80a0f0,#f0e060,#c0d0ff', 'eyes=cute glow',
  'A spark that wandered into the cave during a storm and never found its way out. It hums like a lightbulb.',
  'a small floating ghostly spark with a blue body, a yellow lightning-shaped tail and a cute face, glowing')
c('stormwisp', 'Stormwisp', 'Electric/Spirit', 490, 'spec', '', '', 'floater', '#4a68d0,#f8e040,#a0b8ff', 'eyes=mean glow',
  'A phantom of ball lightning. Old miners say its crackle is the voice of the storm.',
  'a floating ghostly storm phantom made of ball lightning and blue mist, with forked lightning arms and a crackling halo')
c('armorghast', 'Armorghast', 'Spirit/Metal', 480, 'tank', '', 'stormcave', 'golem', '#7a7e8a,#60e0c0,#3a3e4a', 'eyes=mean glow',
  'An empty suit of armor that still patrols. Nobody knows which old knight it belonged to.',
  'an empty suit of medieval knight armor floating slightly, ghostly green light glowing from the gaps and the visor, holding a broken sword')

# ---- Route 19 ----
c('squirebeetle', 'Squirebeetle', 'Metal/Brawl', 300, 'phys', 'paladeetle:36', 'route19', 'bug', '#7a8a9a,#c84040,#c8d0d8', 'eyes=cute horn=one',
  'A beetle that trains every morning with a twig for a sword. It dreams of becoming a knight.',
  'a small round steel-gray beetle like a squire, tiny horn, a red cape and a little twig held like a sword')
c('paladeetle', 'Paladeetle', 'Metal/Brawl', 505, 'phys', '', '', 'bug', '#5a6a7a,#d03838,#b8c0c8', 'eyes=mean horn=one',
  'A stag beetle knight with a horn like a lance. It protects travelers on the road to Zenith.',
  'a large upright stag beetle knight in polished silver armor with a red cape, its long horns crossed like a lance and blade')
c('clanklet', 'Clanklet', 'Metal', 290, 'tank', 'clockork:ironcore', 'route19', 'golem', '#c8a050,#7a6a50,#f0dca0', 'eyes=cute',
  'A wind-up toy that came to life. It must be wound every morning or it gets sleepy.',
  'a small brass wind-up toy creature with a big key on its back, round body, little gear joints and blinking eyes')
c('clockork', 'Clockork', 'Metal/Mind', 480, 'spec', '', '', 'golem', '#a88038,#5a4a38,#f0d890', 'eyes=mean glow',
  'Its body is a great clock. It can slow time for a heartbeat, just long enough to dodge.',
  'a tall brass clockwork creature with a clock face for a chest, spinning gears visible inside, pendulum tail and glowing eyes')
c('frostox', 'Frostox', 'Ice/Ground', 480, 'tank', '', 'route19', 'quad', '#6a5a50,#c8e0f0,#e0d8d0', 'eyes=mean horn=two',
  'A shaggy musk ox that migrates down from the peaks every winter. Frost never melts on its horns.',
  'a big shaggy musk ox with long dark brown fur crusted with frost, broad icy horns sweeping down, breath steaming')

# ---- Summit Pass ----
c('orelet', 'Orelet', 'Rock/Metal', 300, 'tank', 'oregolem:30', 'summitpass', 'golem', '#7a7068,#d8a040,#b8aca0', 'eyes=cute',
  'A pebble with veins of gold. Prospectors chase them, but they always roll away.',
  'a small round rock creature with shiny gold and copper ore veins, little arms and a cheeky face')
c('oregolem', 'Oregolem', 'Rock/Metal', 420, 'tank', 'titanore:45', '', 'golem', '#5a524a,#e0a838,#9a908a', 'eyes=mean',
  'It grows by eating ore. Its fists are solid bronze.',
  'a medium stone golem with thick bronze and gold ore fists, metallic veins across its rocky body')
c('titanore', 'Titanore', 'Rock/Metal', 520, 'tank', '', '', 'golem', '#4a4440,#f0b838,#8a8278', 'eyes=mean crown',
  'A walking mountain of metal and stone. Ironhaven was built where one once slept.',
  'a towering colossal golem of dark stone and veins of glowing molten gold and steel, crystals on its shoulders, a crown-like peak on its head')
c('rimelet', 'Rimelet', 'Dragon/Ice', 300, 'phys', 'rimewyrm:40', 'summitpass', 'dragon', '#a8d0f0,#f0f8ff,#6898c8', 'eyes=cute',
  'A young dragon born in glacier caves. It sneezes snowflakes.',
  'a small baby dragon with pale icy-blue scales, stubby wings, little frost horns and a snowflake on its forehead')
c('rimewyrm', 'Rimewyrm', 'Dragon/Ice', 520, 'phys', '', '', 'dragon', '#5880b8,#e8f4ff,#2a4a78', 'eyes=mean wings=big horn=two',
  'Its breath freezes rivers solid. It guards the summit where the sky is closest.',
  'a large majestic ice dragon with deep-blue scales, wings like sheets of frost, icicle spines and swirling snow around it')

# ---- legends ----
c('solkhan', 'Solkhan', 'Fire/Ground', 600, 'legend', '', 'static:echocanyon', 'quad', '#f0a028,#c86020,#f8e090', 'eyes=mean mane glow',
  'The sun lion of Meridia\'s desert. Where it walks, the sand turns to glass.',
  'a mighty legendary lion with golden fur, a mane of blazing sunfire forming a sun disc, glowing runes on its paws, standing on glassy sand')
c('thundrael', 'Thundrael', 'Electric/Flying', 600, 'legend', '', 'static:route18', 'bird', '#2a3a78,#f8e040,#a8b8f0', 'eyes=mean wings=big glow',
  'It rides the storms over Skyspire. Each beat of its wings is a peal of thunder.',
  'a legendary giant thunderbird with indigo plumage, golden lightning patterns across huge wings, a crest of crackling lightning')
c('glacieth', 'Glacieth', 'Ice/Spirit', 600, 'legend', '', 'static:route17', 'serpent', '#c8e8f8,#8060c0,#f0f8ff', 'eyes=mean glow crown',
  'A spirit of the eternal winter. Its song is said to hold the snows in place on the peaks.',
  'a legendary ghostly ice serpent with translucent pale-blue body, violet spirit flames, a crown of ice crystals, frosty aurora trail')
c('meridion', 'Meridion', 'Normal/Fae', 600, 'legend', '', 'static:summitpass', 'floater', '#f8f0e0,#f0a0d0,#a0d8f0', 'eyes=big glow crown',
  'A mythical creature said to have painted every climate in Meridia, one brushstroke at a time.',
  'a mythical small floating creature with a white body and a flowing tail that changes colors like a rainbow, a crown with sun, snowflake, leaf and raindrop symbols')

LEGENDS = {'solkhan', 'thundrael', 'glacieth', 'meridion'}

# ---- wild tables: 3-4 per area, like Aldermoor ----
WILD2 = {
    'route11': {'land': [['tumblepup', 35], ['chirpip', 30], ['larvel', 20], ['zaphog', 15]]},
    'whisperwood': {'land': [['hivelet', 30], ['webbit', 25], ['sporeling', 25], ['mossnail', 20]]},
    'route12': {'land': [['sandskink', 35], ['prickle', 25], ['scorpip', 25], ['shimmerling', 15]]},
    'route13': {'land': [['ramblet', 30], ['vultyke', 25], ['coyip', 25], ['dustwhirl', 20]]},
    'echocanyon': {'land': [['stalagmon', 35], ['trilobyte', 25], ['crysmite', 20], ['lumigrub', 20]]},
    'route14': {'land': [['kitewing', 30], ['hoplit', 30], ['prairox', 25], ['swiftail', 15]]},
    'route15': {'land': [['shellsnap', 40], ['pouchbeak', 35], ['bogslug', 25]], 'surf': [['jellet', 35], ['driftling', 25], ['lanternfin', 20], ['minnowisp', 20]]},
    'route16': {'land': [['hoothaunt', 30], ['nutkin', 25], ['rustling', 25], ['gravepup', 20]]},
    'route17': {'land': [['yetling', 30], ['pengloo', 30], ['flurrybun', 25], ['rustmite', 15]]},
    'route18': {'land': [['kidbolt', 30], ['sleetwing', 30], ['cloudlet', 25], ['frostbeetle', 15]]},
    'stormcave': {'land': [['umbrapede', 30], ['murkit', 30], ['sparkshade', 25], ['armorghast', 15]]},
    'route19': {'land': [['squirebeetle', 30], ['clanklet', 25], ['glintpie', 25], ['frostox', 20]]},
    'summitpass': {'land': [['orelet', 35], ['stalagant', 25], ['duneskink', 20], ['rimelet', 20]]},
}

# ---- hand learnsets for the starters and a few showpieces (others are generated) ----
LEARN = {
    'bramblecub': [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'palmstrike'], [13, 'thornjab'], [17, 'mossguard'], [22, 'vinelash'], [28, 'rumblepunch'], [34, 'bramble']],
    'thornbear': [[1, 'tackle'], [1, 'leafflick'], [16, 'thornjab'], [22, 'rumblepunch'], [28, 'mossguard'], [34, 'bramble']],
    'briarbruin': [[1, 'thornjab'], [1, 'rumblepunch'], [36, 'titanfist'], [42, 'solarlance'], [48, 'haymaker']],
    'cindergecko': [[1, 'scratch'], [1, 'growl'], [5, 'ember'], [9, 'quickjab'], [13, 'ironclaw'], [17, 'flamefang'], [23, 'quickstep'], [29, 'forgeflare']],
    'forgecko': [[1, 'scratch'], [1, 'ember'], [16, 'flamefang'], [21, 'gearsaw'], [27, 'forgeflare'], [33, 'ironwall']],
    'smeltwyrm': [[1, 'forgeflare'], [1, 'gearsaw'], [36, 'magnetbash'], [42, 'inferno'], [48, 'chromebeam']],
    'splotter': [[1, 'tackle'], [1, 'tailwag'], [5, 'waterjet'], [9, 'quickjab'], [13, 'bubbleburst'], [18, 'frostnip'], [24, 'tidalspin'], [30, 'tidecrash']],
    'surfotter': [[1, 'tackle'], [1, 'waterjet'], [16, 'tidalspin'], [22, 'rimefang'], [28, 'tidecrash'], [34, 'quickstep']],
    'glaciotter': [[1, 'tidalspin'], [1, 'rimefang'], [36, 'glacierbeam'], [42, 'torrent'], [48, 'hailstorm']],
    'solkhan': [[1, 'ember'], [1, 'sandlash'], [40, 'forgeflare'], [45, 'dunecrash'], [50, 'sunflare'], [60, 'earthsplit']],
    'thundrael': [[1, 'spark'], [1, 'gust'], [40, 'galeburst'], [45, 'voltdive'], [50, 'stormbolt'], [60, 'hurricane']],
    'glacieth': [[1, 'frostnip'], [1, 'wail'], [40, 'gravechill'], [45, 'glacierbeam'], [50, 'glacialdirge'], [60, 'soulrend']],
    'meridion': [[1, 'pixiebreeze'], [1, 'quickjab'], [30, 'prismbeam'], [40, 'tumblerush'], [50, 'meridianray'], [60, 'starfall']],
}

def esc(s): return s.replace('\\', '\\\\').replace("'", "\\'")

def main():
    out = []
    out.append("// The Meridia creature list (generated by tools/meridia/dex.py - edit that, not this).")
    out.append("// Same row format as species.js, plus the region tag added in data.js.")
    out.append("const A = (plan, c, f = '', stage = 1, legend = false) => ({ family: 'plan', plan, c: c.split(','), f, stage, legend });")
    out.append('export const RAW_SPECIES2 = [')
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
    out.append('export const HAND_LEARNSETS2 = ' + json.dumps(LEARN).replace('"', "'") + ';')
    out.append('export const WILD2 = ' + json.dumps(WILD2).replace('"', "'") + ';')
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    open(os.path.join(root, 'static/js/species2.js'), 'w').write('\n'.join(out) + '\n')
    json.dump({e[0]: {'name': e[1], 'types': e[2], 'look': e[11], 'evo': e[5]} for e in C}, open(os.path.join(os.path.dirname(__file__), 'looks.json'), 'w'), indent=1)
    print(len(C), 'creatures')

if __name__ == '__main__':
    main()
