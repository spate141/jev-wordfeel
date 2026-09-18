/**
 * Fixed v2 taxonomies.
 *
 * These are the product's finite palettes. Materials, smells, and shapes are curated demo
 * vocabularies, not claims of exhaustive scientific classification. The IDs and their display
 * order are part of the public contract: the order below is the stable tie-break for ranking
 * and the order a renderer should use. Changing an ID or a definition means bumping
 * `TAXONOMY_VERSION` in `prompts.ts`.
 *
 * Every candidate carries two texts. `definition` is a one-line gloss for humans and for any
 * renderer that wants to explain a label. `criterion` is what the model reads: a structured
 * object whose `not_for` field draws the border against the neighbours it is most likely to be
 * confused with. The palettes are large enough that near-neighbours exist by design, so the
 * contrast is doing the work that a single sentence cannot.
 *
 * `no_association` is appended to every facet so unfamiliar or unsuitable inputs have an
 * explicit outcome rather than being forced into a category.
 */

/**
 * The structured criterion sent to the model for one label.
 *
 * Field names are read by the model alongside their values, so they are short and say what
 * follows. `not_for` is the exclusion that separates this label from its nearest rivals.
 */
export interface Criterion {
  readonly what: string;
  readonly not_for?: string;
  readonly examples?: readonly string[];
}

/** One candidate label, its human-readable gloss, and the criterion sent to the model. */
export interface Candidate {
  readonly id: string;
  readonly definition: string;
  readonly criterion?: Criterion;
}

/**
 * Shared final candidate for every facet. Its probability stays in the returned distribution;
 * it is never hidden and the other labels are never renormalized without it.
 */
export const NO_ASSOCIATION = {
  id: "no_association",
  definition:
    "The input cannot be meaningfully interpreted, or none of the available categories provides a meaningful literal or metaphorical association for this facet.",
  criterion: {
    what: "The text is uninterpretable, or no category above offers any meaningful literal or metaphorical association.",
    not_for:
      "Do not choose this merely because the subject is abstract, unfamiliar, unpleasant, or non-physical. Abstract subjects usually do have an evocative association; pick it.",
    examples: ["random keystrokes", "an empty or meaningless fragment"],
  },
} as const satisfies Candidate;

/**
 * Taste palette: the flavor a subject would have in the mouth.
 *
 * Trigeminal sensations that arrive with flavor are included (`pungent` burn, `cooling` tingle,
 * `effervescent` prickle). Aroma proper belongs to the smell facet, and serving temperature and
 * mouthfeel-only textures are still out of scope.
 */
export const TASTE_CANDIDATES = [
  {
    id: "sweet",
    definition: "Sugar-like sweetness, as in honey or ripe fruit.",
    criterion: {
      what: "Clean sugar-like sweetness that is pleasant rather than excessive.",
      not_for: "Sickly or overwhelming sweetness, which is cloying; browned sugar, which is caramelized.",
      examples: ["honey", "ripe peach", "sugar"],
    },
  },
  {
    id: "sour",
    definition: "Acidic tartness, as in lemon juice or vinegar.",
    criterion: {
      what: "Bright, sharp acidity that makes the mouth water.",
      not_for: "Funky aged complexity, which is fermented; drying pucker without acid, which is astringent.",
      examples: ["lemon juice", "vinegar", "unripe apple"],
    },
  },
  {
    id: "salty",
    definition: "Salt-like mineral savor, as in brine.",
    criterion: {
      what: "The savor of salt itself: brine, cured, seasoned.",
      not_for: "Stony or chalky minerality without salt, which is mineral; brothy depth, which is umami.",
      examples: ["sea salt", "brine", "cured olives"],
    },
  },
  {
    id: "bitter",
    definition: "Bitterness associated with unsweetened coffee, cocoa, or bitter greens.",
    criterion: {
      what: "Natural plant bitterness: dark, dry, slightly harsh but edible.",
      not_for: "Harsh chemical or antiseptic bitterness, which is medicinal; tannic drying, which is astringent.",
      examples: ["black coffee", "unsweetened cocoa", "bitter greens"],
    },
  },
  {
    id: "umami",
    definition: "Brothy, savory taste associated with mushrooms, stock, or aged cheese.",
    criterion: {
      what: "Deep savory brothiness that fills and lingers.",
      not_for: "Oily richness, which is fatty; funky aged tang, which is fermented.",
      examples: ["mushroom broth", "meat stock", "aged parmesan"],
    },
  },
  {
    id: "fatty",
    definition: "Rich, oily richness that coats the mouth, as in butter or cream.",
    criterion: {
      what: "Rich oily or buttery richness that coats the tongue.",
      not_for: "Roasted kernel oiliness, which is nutty; rich sweetness taken to excess, which is cloying.",
      examples: ["butter", "cream", "marbled meat"],
    },
  },
  {
    id: "astringent",
    definition: "Drying, puckering tannin, as in strong tea or unripe fruit.",
    criterion: {
      what: "A drying, puckering, mouth-tightening quality from tannin.",
      not_for: "Acidic sharpness, which is sour; plain bitterness, which is bitter.",
      examples: ["over-steeped black tea", "unripe persimmon", "red wine tannin"],
    },
  },
  {
    id: "metallic",
    definition: "Iron or coin-like tang, as in blood or tin.",
    criterion: {
      what: "A bright metal tang on the tongue: iron, copper, tin.",
      not_for: "Stone and chalk, which is mineral; chemical antiseptic harshness, which is medicinal.",
      examples: ["blood", "a licked coin", "food from a tin can"],
    },
  },
  {
    id: "mineral",
    definition: "Stony, chalky, flinty savor, as in spring water over rock.",
    criterion: {
      what: "Cool stone, chalk, or flint: clean, dry, inorganic.",
      not_for: "Salt, which is salty; iron tang, which is metallic; soil and mushroom, which belong to the smell facet.",
      examples: ["flint", "chalk", "spring water over rock"],
    },
  },
  {
    id: "pungent",
    definition: "Sharp burning heat or sting, as in chili or horseradish.",
    criterion: {
      what: "Burning, stinging heat in the mouth and nose.",
      not_for: "Warm aromatic spice smelled rather than felt, which belongs to the smell facet.",
      examples: ["chili heat", "horseradish", "raw garlic bite"],
    },
  },
  {
    id: "cooling",
    definition: "Cold tingling freshness, as in mint or menthol.",
    criterion: {
      what: "A cold, tingling, breath-widening sensation independent of actual temperature.",
      not_for: "Something merely served cold; mint as an aroma, which belongs to the smell facet.",
      examples: ["menthol", "peppermint", "camphor"],
    },
  },
  {
    id: "effervescent",
    definition: "Fizzing, prickling bubbles, as in sparkling water.",
    criterion: {
      what: "A light prickling fizz that lifts and tickles.",
      not_for: "Acidity on its own, which is sour; burning heat, which is pungent.",
      examples: ["sparkling water", "soda", "champagne"],
    },
  },
  {
    id: "fermented",
    definition: "Yeasty, funky, aged complexity, as in sourdough or kimchi.",
    criterion: {
      what: "Yeasty, funky, cultured complexity from age or fermentation.",
      not_for: "Clean simple acidity, which is sour; savory depth without funk, which is umami.",
      examples: ["sourdough", "kimchi", "the funk of a washed-rind cheese"],
    },
  },
  {
    id: "caramelized",
    definition: "Browned, toasted sugar with a faint edge of bitterness.",
    criterion: {
      what: "Sugar browned by heat: toasty, deep, slightly bitter at the edge.",
      not_for: "Plain unbrowned sweetness, which is sweet; char and ash, which is smoky.",
      examples: ["caramel", "toasted marshmallow", "browned butter"],
    },
  },
  {
    id: "nutty",
    definition: "Roasted kernel or seed flavor, as in almond or sesame.",
    criterion: {
      what: "Roasted seed and kernel flavor: dry, oily, faintly sweet.",
      not_for: "General richness, which is fatty; browned sugar, which is caramelized.",
      examples: ["almond", "toasted sesame", "roasted peanut"],
    },
  },
  {
    id: "green",
    definition: "Vegetal, grassy, unripe sap flavor.",
    criterion: {
      what: "Raw vegetal sap: grassy, stemmy, unripe.",
      not_for: "Herb aromas in the nose, which belong to the smell facet; sharp acidity, which is sour.",
      examples: ["raw green bean", "cut grass", "tomato stem"],
    },
  },
  {
    id: "medicinal",
    definition: "Harsh chemical or antiseptic bitterness, as in cough syrup.",
    criterion: {
      what: "Clinical, chemical, antiseptic bitterness that reads as manufactured.",
      not_for: "Natural plant bitterness, which is bitter.",
      examples: ["cough syrup", "iodine", "a dissolved aspirin"],
    },
  },
  {
    id: "bland",
    definition: "Plain, neutral, starchy; very little flavor at all.",
    criterion: {
      what: "Deliberately flat, plain, starchy: a real taste that is the absence of character.",
      not_for: "Cases where no category applies at all, which is no_association.",
      examples: ["plain rice", "white bread", "boiled potato"],
    },
  },
  {
    id: "smoky",
    definition: "Char, ember, and ash on the tongue.",
    criterion: {
      what: "The taste of char and ash left by fire.",
      not_for: "Smoke as an aroma, which belongs to the smell facet; burnt sugar, which is caramelized.",
      examples: ["charred meat crust", "lapsang souchong", "smoked salt"],
    },
  },
  {
    id: "cloying",
    definition: "Sickly, overwhelming sweetness or richness.",
    criterion: {
      what: "Sweetness or richness pushed past pleasure into excess.",
      not_for: "Balanced pleasant sweetness, which is sweet; richness without sweetness, which is fatty.",
      examples: ["over-sweet syrup", "artificial candy", "too-rich frosting"],
    },
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Material palette. A symbolic embodiment, not a claim about physical composition. */
export const MATERIAL_CANDIDATES = [
  {
    id: "glass",
    definition: "Smooth, transparent or translucent, rigid, and potentially fragile.",
    criterion: {
      what: "Smooth, clear, rigid and breakable; shows what is behind it.",
      not_for: "Faceted geometric growth, which is crystal; frozen water, which is ice.",
      examples: ["a windowpane", "a drinking glass", "a lens"],
    },
  },
  {
    id: "metal",
    definition: "Hard, metallic, often reflective, with an industrial or conductive character.",
    criterion: {
      what: "Hard, reflective, machined or forged; conducts and rings.",
      not_for: "Grey mineral mass, which is stone; poured grey building mass, which is concrete.",
      examples: ["steel", "brass", "a blade"],
    },
  },
  {
    id: "wood",
    definition: "Solid organic material with grain, fibers, and a natural tactile character.",
    criterion: {
      what: "Grained, fibrous, living-then-cut: warm and structural.",
      not_for: "Pressed wood pulp, which is paper; dry plant matter, which is not this.",
      examples: ["oak plank", "a branch", "a carved handle"],
    },
  },
  {
    id: "stone",
    definition: "Dense, mineral, rocky material suggesting solidity or weight.",
    criterion: {
      what: "Dense natural rock: heavy, cool, immovable.",
      not_for: "Poured and cast grey mass, which is concrete; loose grains, which is sand.",
      examples: ["granite", "a river boulder", "marble"],
    },
  },
  {
    id: "fabric",
    definition: "Flexible woven or fibrous textile; soft, draping, or thread-like.",
    criterion: {
      what: "Woven or knitted textile: soft, draping, made of threads.",
      not_for: "Animal hide, which is leather; matted plant growth, which is moss.",
      examples: ["linen", "velvet", "a woven blanket"],
    },
  },
  {
    id: "water",
    definition: "Flowing liquid associated with ripples, fluidity, or transparency.",
    criterion: {
      what: "Liquid in motion: flowing, rippling, taking any shape.",
      not_for: "The same substance frozen, which is ice; drifting vapor, which is smoke.",
      examples: ["a stream", "rain", "a still pool"],
    },
  },
  {
    id: "smoke",
    definition: "Diffuse drifting particulate clouds; wispy, hazy, or ephemeral.",
    criterion: {
      what: "Drifting, formless, dissipating vapor you cannot hold.",
      not_for: "Settled burnt residue, which is ash; liquid flow, which is water.",
      examples: ["a rising plume", "haze", "incense smoke"],
    },
  },
  {
    id: "rubber",
    definition: "Elastic, flexible material that stretches, compresses, and rebounds.",
    criterion: {
      what: "Elastic and grippy: stretches, squashes, springs back.",
      not_for: "Rigid moulded synthetic, which is plastic; light airy cells, which is foam.",
      examples: ["a tire", "an eraser", "a stretched band"],
    },
  },
  {
    id: "paper",
    definition: "Thin pressed pulp; foldable, tearable, printable.",
    criterion: {
      what: "Thin pressed fiber sheet: light, foldable, easily torn or marked.",
      not_for: "Solid grained timber, which is wood; woven cloth, which is fabric.",
      examples: ["a page", "a folded note", "cardboard"],
    },
  },
  {
    id: "clay",
    definition: "Soft, damp, workable earth that holds a pressed shape.",
    criterion: {
      what: "Malleable damp earth that takes and keeps an impression.",
      not_for: "Loose dry grains, which is sand; hard fired rock, which is stone.",
      examples: ["potter's clay", "wet mud shaped by hand", "an unfired vessel"],
    },
  },
  {
    id: "ice",
    definition: "Frozen water; cold, hard, clear, and temporary.",
    criterion: {
      what: "Frozen, cold, hard and clear, always on the edge of melting.",
      not_for: "Clear manufactured solid, which is glass; flowing liquid, which is water.",
      examples: ["an icicle", "a frozen lake", "frost on a pane"],
    },
  },
  {
    id: "leather",
    definition: "Cured animal hide; supple, grained, and darkening with age.",
    criterion: {
      what: "Tanned hide: supple, grained, worn smooth by use.",
      not_for: "Woven textile, which is fabric; synthetic sheeting, which is plastic.",
      examples: ["a worn jacket", "a saddle", "a bound book cover"],
    },
  },
  {
    id: "plastic",
    definition: "Moulded synthetic polymer; smooth, light, uniform, manufactured.",
    criterion: {
      what: "Moulded synthetic: uniform, light, cheap to make, unmistakably manufactured.",
      not_for: "Elastic and rebounding, which is rubber; transparent and brittle, which is glass.",
      examples: ["a moulded chair", "a bottle cap", "a toy brick"],
    },
  },
  {
    id: "sand",
    definition: "Loose dry grains that pour, shift, and slip away.",
    criterion: {
      what: "Countless loose grains that pour and will not hold a form.",
      not_for: "Damp shapeable earth, which is clay; burnt residue, which is ash.",
      examples: ["a dune", "a beach", "grains through an hourglass"],
    },
  },
  {
    id: "crystal",
    definition: "Faceted mineral growth; geometric, refractive, sharply ordered.",
    criterion: {
      what: "Geometric mineral growth with flat facets and refracted light.",
      not_for: "Smooth manufactured clarity, which is glass; frozen water, which is ice.",
      examples: ["a quartz cluster", "a geode", "a cut gemstone"],
    },
  },
  {
    id: "wax",
    definition: "Soft, opaque, meltable solid that holds a form until warmed.",
    criterion: {
      what: "Soft opaque solid that softens, drips, and re-sets.",
      not_for: "Fossilized resin, which is amber; workable earth, which is clay.",
      examples: ["a candle", "a wax seal", "a honeycomb cell"],
    },
  },
  {
    id: "bone",
    definition: "Dry, pale, porous skeletal material; hard but once alive.",
    criterion: {
      what: "Pale porous skeletal material: hard, dry, formerly living.",
      not_for: "Inorganic rock, which is stone; hide, which is leather.",
      examples: ["a skull", "ivory", "a bleached rib"],
    },
  },
  {
    id: "moss",
    definition: "Soft, damp, spreading plant growth over a surface.",
    criterion: {
      what: "Soft damp living growth that creeps over and softens whatever it covers.",
      not_for: "Woven softness, which is fabric; soil itself, which is not in this palette.",
      examples: ["moss on a north wall", "lichen on a rock", "a mossy log"],
    },
  },
  {
    id: "concrete",
    definition: "Poured, cast grey mass; heavy, rough, deliberately built.",
    criterion: {
      what: "Poured and set building mass: heavy, grey, flat, deliberately made.",
      not_for: "Natural rock, which is stone; forged or machined, which is metal.",
      examples: ["a bare wall", "an overpass", "a poured slab"],
    },
  },
  {
    id: "foam",
    definition: "Light, airy cellular mass full of trapped bubbles.",
    criterion: {
      what: "Light cellular mass of trapped air: compressible, weightless, insubstantial.",
      not_for: "Dense elastic solid, which is rubber; drifting vapor, which is smoke.",
      examples: ["sea foam", "packing foam", "the head on a poured beer"],
    },
  },
  {
    id: "ash",
    definition: "Fine grey residue left behind after burning.",
    criterion: {
      what: "The soft grey powder fire leaves: weightless, spent, easily scattered.",
      not_for: "Rising vapor, which is smoke; mineral grains, which is sand.",
      examples: ["a cold hearth", "cigarette ash", "volcanic fall"],
    },
  },
  {
    id: "amber",
    definition: "Hardened resin; warm, golden, translucent, holding the past.",
    criterion: {
      what: "Fossilized resin: golden, translucent, warm, preserving what it caught.",
      not_for: "Soft meltable solid, which is wax; faceted mineral, which is crystal.",
      examples: ["amber with an insect inside", "hardened pine resin", "a resin bead"],
    },
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Scent-family palette. */
export const SMELL_CANDIDATES = [
  {
    id: "floral",
    definition: "Blossom or petal aromas, such as rose or jasmine.",
    criterion: {
      what: "Petal and blossom aromas: soft, sweet, perfumed.",
      not_for: "Ripe fruit flesh, which is fruity; sweet baking aromas, which is gourmand.",
      examples: ["rose", "jasmine", "orange blossom"],
    },
  },
  {
    id: "citrus",
    definition: "Bright aromas of citrus peel or oils, such as lemon or orange.",
    criterion: {
      what: "Zesty citrus peel and oil: bright, sharp, lifting.",
      not_for: "Other ripe fruit, which is fruity; cold tingle, which is minty.",
      examples: ["lemon zest", "grapefruit peel", "bergamot"],
    },
  },
  {
    id: "woody",
    definition: "Wood, bark, cedar, or sandalwood aromas.",
    criterion: {
      what: "Dry cut wood, bark, and heartwood.",
      not_for: "Sticky sap and incense, which is resinous; soil and moss, which is earthy.",
      examples: ["cedar", "sandalwood", "a fresh-sawn plank"],
    },
  },
  {
    id: "earthy",
    definition: "Soil, damp earth, moss, or mushroom-like aromas.",
    criterion: {
      what: "Damp soil, moss, mushroom, root cellar.",
      not_for: "Dry paper and neglect, which is dusty; cut wood, which is woody.",
      examples: ["wet soil", "mushrooms", "a root cellar"],
    },
  },
  {
    id: "smoky",
    definition: "Smoke, charred wood, embers, or burnt aromas.",
    criterion: {
      what: "Smoke, embers, char, and things that have burned.",
      not_for: "Warm baking sweetness, which is gourmand; solvent fumes, which is chemical.",
      examples: ["a bonfire", "charred wood", "a blown-out match"],
    },
  },
  {
    id: "herbal",
    definition: "Green leaves, fresh herbs, grass, or leafy aromas.",
    criterion: {
      what: "Fresh culinary and garden herbs, leaves, cut grass.",
      not_for: "Cooling menthol, which is minty; sticky conifer sap, which is resinous.",
      examples: ["basil", "thyme", "cut grass"],
    },
  },
  {
    id: "spicy",
    definition: "Aromatic spices such as cinnamon, clove, or pepper.",
    criterion: {
      what: "Warm aromatic spice in the nose: cinnamon, clove, pepper, cardamom.",
      not_for: "Burning heat felt on the tongue, which is the taste facet's pungent.",
      examples: ["cinnamon", "clove", "black pepper"],
    },
  },
  {
    id: "oceanic",
    definition: "Marine, sea-air, seaweed, or coastal aromas.",
    criterion: {
      what: "Salt air, seaweed, spray, wet shoreline.",
      not_for: "Rain and clean air inland, which is ozonic; decay on the tideline, which is putrid.",
      examples: ["sea spray", "seaweed", "a harbour at low tide"],
    },
  },
  {
    id: "gourmand",
    definition: "Edible sweet aromas: vanilla, caramel, baking.",
    criterion: {
      what: "Warm sweet kitchen aromas: vanilla, sugar, butter, baking.",
      not_for: "Flower perfume, which is floral; fresh fruit, which is fruity.",
      examples: ["vanilla", "caramel", "bread in the oven"],
    },
  },
  {
    id: "musky",
    definition: "Warm, skin-close, heavy, lingering aromas.",
    criterion: {
      what: "Warm, soft, skin-close heaviness that lingers low.",
      not_for: "Fur and hide, which is animalic; sweet edible warmth, which is gourmand.",
      examples: ["musk", "warm skin", "a heavy base perfume"],
    },
  },
  {
    id: "ozonic",
    definition: "Rain, clean air, static, and open-window freshness.",
    criterion: {
      what: "Clean charged air: rain about to fall, static, cold wind, fresh laundry.",
      not_for: "Salt and seaweed, which is oceanic; menthol, which is minty.",
      examples: ["air before a storm", "rain on pavement", "a cold clear morning"],
    },
  },
  {
    id: "chemical",
    definition: "Solvent, antiseptic, or synthetic fumes.",
    criterion: {
      what: "Sharp manufactured fumes: solvent, antiseptic, fuel, fresh plastic.",
      not_for: "Burning organic matter, which is smoky; rot, which is putrid.",
      examples: ["acetone", "hospital antiseptic", "petrol"],
    },
  },
  {
    id: "animalic",
    definition: "Leather, hide, fur, and warm-blooded aromas.",
    criterion: {
      what: "Hide, fur, leather, stable: warm and unmistakably from a creature.",
      not_for: "Soft skin-warmth, which is musky; decay, which is putrid.",
      examples: ["worn leather", "wet fur", "a stable"],
    },
  },
  {
    id: "dusty",
    definition: "Old paper, attics, and long-settled dust.",
    criterion: {
      what: "Dry settled dust, old paper, closed rooms, time passing.",
      not_for: "Damp soil, which is earthy; mould and rot, which is putrid.",
      examples: ["an old book", "an attic", "a room left shut"],
    },
  },
  {
    id: "resinous",
    definition: "Incense, amber, pine sap, and balsamic aromas.",
    criterion: {
      what: "Sticky aromatic sap and resin: incense, pine, balsam, amber.",
      not_for: "Dry cut wood, which is woody; sweet edible warmth, which is gourmand.",
      examples: ["frankincense", "pine sap", "burning resin"],
    },
  },
  {
    id: "fruity",
    definition: "Ripe non-citrus fruit aromas.",
    criterion: {
      what: "Ripe fruit flesh: berry, stone fruit, tropical, orchard.",
      not_for: "Citrus peel, which is citrus; wine and yeast, which is fermented.",
      examples: ["ripe peach", "strawberry", "mango"],
    },
  },
  {
    id: "minty",
    definition: "Menthol, eucalyptus, and cold green freshness.",
    criterion: {
      what: "Cold, sharp, breath-opening green freshness.",
      not_for: "Culinary herbs generally, which is herbal; clean air, which is ozonic.",
      examples: ["peppermint", "eucalyptus", "menthol"],
    },
  },
  {
    id: "fermented",
    definition: "Wine, yeast, vinegar, and cellar aromas.",
    criterion: {
      what: "Yeast, wine, vinegar, brewing, cellar air.",
      not_for: "Fresh fruit, which is fruity; active decay, which is putrid.",
      examples: ["a wine cellar", "rising dough", "cider vinegar"],
    },
  },
  {
    id: "metallic",
    definition: "Blood, hot iron, and struck-metal aromas.",
    criterion: {
      what: "Iron, blood, hot metal, the smell of a struck spark.",
      not_for: "Solvent fumes, which is chemical; charged air, which is ozonic.",
      examples: ["blood", "hot iron", "wet coins"],
    },
  },
  {
    id: "putrid",
    definition: "Sulfur, rot, mould, and decay.",
    criterion: {
      what: "Active decay: sulfur, rot, mould, spoilage.",
      not_for: "Cellar funk that is still appetising, which is fermented; dry neglect, which is dusty.",
      examples: ["sulfur", "spoiled food", "black mould"],
    },
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Shape palette. Each entry is chosen to be unmistakable when drawn as a single figure. */
export const SHAPE_CANDIDATES = [
  {
    id: "circle",
    definition: "A smooth closed round shape without corners.",
    criterion: {
      what: "A filled, whole, continuous round: complete and without corners.",
      not_for: "A round band with an open centre, which is a ring; a partial curve, which is an arc.",
      examples: ["wholeness", "a cycle", "a face"],
    },
  },
  {
    id: "triangle",
    definition: "A three-sided angular shape with three corners.",
    criterion: {
      what: "Three sides meeting in three corners: directed, stable on its base, pointed at its apex.",
      not_for: "A four-cornered figure balanced on a point, which is a diamond; a jagged fragment, which is a shard.",
      examples: ["ascent", "hierarchy", "a blade point"],
    },
  },
  {
    id: "square",
    definition: "A four-sided shape with equal sides and right angles.",
    criterion: {
      what: "Equal sides and right angles: ordered, stable, contained.",
      not_for: "Repeated intersecting lines, which is a grid; a square turned on its point, which is a diamond.",
      examples: ["order", "a room", "a rule"],
    },
  },
  {
    id: "star",
    definition: "A radial shape with multiple outward points.",
    criterion: {
      what: "A closed figure with alternating long points radiating from a centre.",
      not_for: "Open rays with no outline, which is a burst; a six-sided cell, which is a hexagon.",
      examples: ["distinction", "a night sky", "a marked favourite"],
    },
  },
  {
    id: "spiral",
    definition: "A curve winding around a center while moving inward or outward.",
    criterion: {
      what: "A single line coiling around a centre, each turn further out than the last.",
      not_for: "A curve that crosses itself into loops, which is a knot; a closed band, which is a ring.",
      examples: ["obsession", "growth", "a descent inward"],
    },
  },
  {
    id: "wave",
    definition: "An undulating curve with alternating rises and falls.",
    criterion: {
      what: "A smooth curve rising and falling in repeating rounded crests.",
      not_for: "Sharp angular reversals, which is a zigzag; a single sweeping curve, which is an arc.",
      examples: ["rhythm", "the sea", "a mood that comes and goes"],
    },
  },
  {
    id: "line",
    definition: "A single straight stroke; direct, minimal, unbranching.",
    criterion: {
      what: "One straight unbroken stroke: direct, spare, going one way.",
      not_for: "A curved sweep, which is an arc; several crossing lines, which is a grid.",
      examples: ["directness", "a horizon", "a single decision"],
    },
  },
  {
    id: "arc",
    definition: "A single sweeping curve; part of a circle, open at both ends.",
    criterion: {
      what: "One open curved sweep: a piece of a circle that never closes.",
      not_for: "A closed round, which is a circle; repeated rises and falls, which is a wave.",
      examples: ["a bridge", "a thrown trajectory", "a partial return"],
    },
  },
  {
    id: "ring",
    definition: "A band around an empty centre.",
    criterion: {
      what: "A closed band with a hollow middle: a boundary drawn around nothing.",
      not_for: "A solid round, which is a circle; a coiling open line, which is a spiral.",
      examples: ["a vow", "an enclosure", "something missing at the centre"],
    },
  },
  {
    id: "crescent",
    definition: "A curved sliver tapering to two points.",
    criterion: {
      what: "A thick curve thinning to two horns: a partial, waxing or waning form.",
      not_for: "An even open curve, which is an arc; a closed band, which is a ring.",
      examples: ["the moon", "incompleteness", "a quiet night"],
    },
  },
  {
    id: "hexagon",
    definition: "A six-sided cell; efficient, repeatable, naturally tiling.",
    criterion: {
      what: "Six equal sides: an efficient cell that packs perfectly against its neighbours.",
      not_for: "A pointed radial figure, which is a star; a four-sided cell, which is a square.",
      examples: ["a honeycomb", "engineered efficiency", "a network node"],
    },
  },
  {
    id: "diamond",
    definition: "A four-sided figure balanced on its point.",
    criterion: {
      what: "A square turned on its corner: poised, alert, balanced on a single point.",
      not_for: "The same figure resting on a side, which is a square; a three-cornered figure, which is a triangle.",
      examples: ["preciousness", "alertness", "a warning sign"],
    },
  },
  {
    id: "cross",
    definition: "Two strokes intersecting at right angles.",
    criterion: {
      what: "Two strokes meeting at a right angle: a junction, a marker, a refusal.",
      not_for: "Many repeated crossings, which is a grid; a radiating figure, which is a burst.",
      examples: ["an intersection", "a negation", "a meeting point"],
    },
  },
  {
    id: "zigzag",
    definition: "A line of sharp alternating angular reversals.",
    criterion: {
      what: "A line that reverses in sharp angles: abrupt, nervous, electric.",
      not_for: "Smooth rounded reversals, which is a wave; a jagged broken piece, which is a shard.",
      examples: ["lightning", "agitation", "a sudden change of mind"],
    },
  },
  {
    id: "grid",
    definition: "Regular lines crossing into a lattice of cells.",
    criterion: {
      what: "Evenly repeated lines crossing into uniform cells: systematic and total.",
      not_for: "A single intersection, which is a cross; one bounded cell, which is a square.",
      examples: ["bureaucracy", "a city plan", "a spreadsheet"],
    },
  },
  {
    id: "burst",
    definition: "Open rays radiating outward from a center.",
    criterion: {
      what: "Loose open rays flying outward from a point, with no closed outline.",
      not_for: "A closed pointed figure, which is a star; a coiling line, which is a spiral.",
      examples: ["an explosion", "sudden joy", "a release"],
    },
  },
  {
    id: "knot",
    definition: "A line looping over and through itself.",
    criterion: {
      what: "A single line crossing over and under itself into a tangle.",
      not_for: "An even coil that never crosses, which is a spiral; a hollow band, which is a ring.",
      examples: ["a problem", "entanglement", "a bond"],
    },
  },
  {
    id: "branch",
    definition: "A line dividing repeatedly into smaller limbs.",
    criterion: {
      what: "A stem splitting again and again into thinner limbs.",
      not_for: "Rays from a single point, which is a burst; crossing regular lines, which is a grid.",
      examples: ["a family line", "a decision tree", "a river delta"],
    },
  },
  {
    id: "cloud",
    definition: "A soft irregular blob with no fixed edge.",
    criterion: {
      what: "A soft lumpy mass with no firm outline: vague, drifting, formless.",
      not_for: "A crisp closed round, which is a circle; a jagged fragment, which is a shard.",
      examples: ["vagueness", "daydreaming", "something not yet decided"],
    },
  },
  {
    id: "shard",
    definition: "A jagged broken fragment with sharp uneven edges.",
    criterion: {
      what: "A broken angular fragment: sharp, uneven, part of something that was whole.",
      not_for: "A regular three-cornered figure, which is a triangle; angular reversals along a line, which is a zigzag.",
      examples: ["a break", "grief", "a splinter"],
    },
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** The four facets, in the order `analyzeWord` fans them out and reports them. */
export const FACETS = ["taste", "material", "smell", "shape"] as const;

export type Facet = (typeof FACETS)[number];

/** Candidate palettes keyed by facet. Single source of truth for labels and definitions. */
export const TAXONOMIES = {
  taste: TASTE_CANDIDATES,
  material: MATERIAL_CANDIDATES,
  smell: SMELL_CANDIDATES,
  shape: SHAPE_CANDIDATES,
} as const;

// Label unions are derived from the tables above so they can never drift from what is sent.
export type TasteLabel = (typeof TASTE_CANDIDATES)[number]["id"];
export type MaterialLabel = (typeof MATERIAL_CANDIDATES)[number]["id"];
export type SmellLabel = (typeof SMELL_CANDIDATES)[number]["id"];
export type ShapeLabel = (typeof SHAPE_CANDIDATES)[number]["id"];

/** The label union for a given facet. */
export type LabelOf<F extends Facet> = (typeof TAXONOMIES)[F][number]["id"];

/** Any label from any facet. */
export type AnyLabel = LabelOf<Facet>;

/**
 * What one label's criterion looks like once serialized for the request.
 *
 * Plain JSON: the SDK's `Description` accepts a string or a JSON object, and `readonly` arrays
 * are not JSON values, so `examples` is copied into a mutable array on the way out.
 */
export type CriterionPayload = string | { [field: string]: string | string[] };

/** Candidate IDs for a facet, in stable display order. */
export const labelsFor = <F extends Facet>(facet: F): readonly LabelOf<F>[] =>
  TAXONOMIES[facet].map((candidate) => candidate.id) as readonly LabelOf<F>[];

/**
 * Criteria map for a facet's Choice question: label -> criterion, in display order.
 *
 * A candidate with a structured `criterion` sends that object; one without falls back to its
 * plain `definition`. Only static taxonomy text ends up here. User input never reaches a
 * criterion.
 */
export const criteriaFor = (facet: Facet): Record<string, CriterionPayload> =>
  Object.fromEntries(TAXONOMIES[facet].map((candidate) => [candidate.id, payloadFor(candidate)]));

/** Serialize one candidate's criterion, omitting the optional fields it does not define. */
const payloadFor = (candidate: Candidate): CriterionPayload => {
  const criterion = candidate.criterion;
  if (!criterion) return candidate.definition;
  return {
    what: criterion.what,
    ...(criterion.not_for ? { not_for: criterion.not_for } : {}),
    ...(criterion.examples ? { examples: [...criterion.examples] } : {}),
  };
};

/** Zero-based display position of a label, used as the deterministic ranking tie-break. */
export const displayIndexOf = (facet: Facet, label: string): number =>
  TAXONOMIES[facet].findIndex((candidate) => candidate.id === label);

/** Type guard: is `value` one of the given facet's labels? */
export const isLabelOf = <F extends Facet>(facet: F, value: unknown): value is LabelOf<F> =>
  typeof value === "string" && TAXONOMIES[facet].some((candidate) => candidate.id === value);

/** Type guard for facet names, used by the CLI when parsing `--facet`. */
export const isFacet = (value: unknown): value is Facet =>
  typeof value === "string" && (FACETS as readonly string[]).includes(value);
