const living = (label: string, width: number, height: number, shape: string) => ({ label, category: 'Living' as const, width, height, shape });
const kitchen = (label: string, width: number, height: number, shape: string) => ({ label, category: 'Kitchen' as const, width, height, shape });
const bedroom = (label: string, width: number, height: number, shape: string) => ({ label, category: 'Bedroom' as const, width, height, shape });
const bathroom = (label: string, width: number, height: number, shape: string) => ({ label, category: 'Bathroom' as const, width, height, shape });

// Keep the original IDs so plans saved by earlier versions still load.
export const furnitureInfo = {
  sofa: living('Sofa', 170, 82, 'sofa'),
  loveseat: living('Loveseat', 132, 80, 'sofa'),
  'sectional-sofa': living('Sectional sofa', 210, 145, 'sectional'),
  'chaise-lounge': living('Chaise lounge', 155, 72, 'chaise'),
  armchair: living('Armchair', 84, 88, 'armchair'),
  recliner: living('Recliner', 96, 108, 'recliner'),
  ottoman: living('Ottoman', 68, 54, 'ottoman'),
  'coffee-table-square': living('Coffee table · Square', 82, 82, 'table-square'),
  'coffee-table-round': living('Coffee table · Round', 84, 84, 'table-round'),
  'coffee-table': living('Coffee table · Oval', 112, 66, 'table-oval'),
  'coffee-table-rectangle': living('Coffee table · Rectangle', 126, 68, 'table-rectangle'),
  'side-table-square': living('Side table · Square', 54, 54, 'table-square'),
  'side-table-round': living('Side table · Round', 54, 54, 'table-round'),
  'tv-console': living('TV console', 150, 46, 'console'),
  television: living('Television', 120, 22, 'television'),
  bookshelf: living('Bookshelf', 112, 45, 'bookshelf'),
  'rug-rectangle': living('Rug · Rectangle', 180, 125, 'rug-rectangle'),
  'rug-round': living('Rug · Round', 130, 130, 'rug-round'),
  'floor-lamp': living('Floor lamp', 58, 58, 'lamp'),
  plant: living('Plant', 64, 64, 'plant'),
  fireplace: living('Fireplace', 130, 42, 'fireplace'),

  dining: kitchen('Dining table · Rectangle', 148, 122, 'dining-rectangle'),
  'dining-round': kitchen('Dining table · Round', 125, 125, 'dining-round'),
  'dining-square': kitchen('Dining table · Square', 124, 124, 'dining-square'),
  'dining-oval': kitchen('Dining table · Oval', 165, 116, 'dining-oval'),
  'dining-chair': kitchen('Dining chair', 48, 52, 'chair'),
  'bar-stool': kitchen('Bar stool', 44, 44, 'stool'),
  island: kitchen('Kitchen island', 148, 78, 'island'),
  'island-l': kitchen('L-shaped island', 170, 125, 'island-l'),
  'counter-straight': kitchen('Straight counter', 175, 60, 'counter'),
  'counter-corner': kitchen('Corner counter', 145, 145, 'counter-l'),
  sink: kitchen('Kitchen sink', 78, 62, 'sink'),
  'double-sink': kitchen('Double sink', 120, 62, 'double-sink'),
  cooktop: kitchen('Cooktop', 78, 62, 'cooktop'),
  range: kitchen('Range cooker', 80, 70, 'range'),
  refrigerator: kitchen('Refrigerator', 80, 76, 'fridge'),
  dishwasher: kitchen('Dishwasher', 66, 62, 'dishwasher'),
  oven: kitchen('Oven', 66, 62, 'oven'),
  microwave: kitchen('Microwave', 58, 44, 'microwave'),
  'pantry-cabinet': kitchen('Pantry cabinet', 105, 62, 'pantry'),
  'kitchen-cart': kitchen('Kitchen cart', 76, 54, 'cart'),

  'twin-bed': bedroom('Bed · Twin', 95, 170, 'bed'),
  'double-bed': bedroom('Bed · Double', 135, 180, 'bed'),
  bed: bedroom('Bed · Queen', 142, 170, 'bed'),
  'king-bed': bedroom('Bed · King', 185, 195, 'bed'),
  'bunk-bed': bedroom('Bunk bed', 105, 185, 'bunk'),
  crib: bedroom('Crib', 95, 140, 'crib'),
  nightstand: bedroom('Nightstand', 55, 48, 'nightstand'),
  dresser: bedroom('Dresser', 122, 56, 'dresser'),
  wardrobe: bedroom('Wardrobe', 120, 72, 'wardrobe'),
  'closet-unit': bedroom('Closet unit', 165, 68, 'wardrobe'),
  desk: bedroom('Desk', 138, 70, 'desk'),
  'office-chair': bedroom('Office chair', 58, 58, 'office-chair'),
  vanity: bedroom('Vanity table', 104, 56, 'vanity'),
  'bedroom-bench': bedroom('Bedroom bench', 110, 46, 'bench'),
  mirror: bedroom('Mirror', 58, 20, 'mirror'),

  bathtub: bathroom('Bathtub', 145, 76, 'bathtub'),
  'freestanding-tub': bathroom('Freestanding tub', 150, 86, 'bathtub'),
  'shower-square': bathroom('Shower · Square', 98, 98, 'shower-square'),
  'shower-rectangle': bathroom('Shower · Rectangle', 135, 88, 'shower-rectangle'),
  toilet: bathroom('Toilet', 54, 80, 'toilet'),
  bidet: bathroom('Bidet', 54, 72, 'bidet'),
  'bathroom-sink': bathroom('Bathroom sink', 62, 55, 'basin'),
  'single-vanity': bathroom('Vanity · Single sink', 85, 62, 'vanity-single'),
  'double-vanity': bathroom('Vanity · Double sink', 138, 62, 'vanity-double'),
  'bathroom-cabinet': bathroom('Bathroom cabinet', 78, 38, 'cabinet'),
  'towel-rack': bathroom('Towel rack', 72, 20, 'towel-rack'),
  'washing-machine': bathroom('Washing machine', 66, 66, 'washer'),
  dryer: bathroom('Dryer', 66, 66, 'dryer')
} as const;

export type FurnitureType = keyof typeof furnitureInfo;
export type FurnitureCategory = typeof furnitureInfo[FurnitureType]['category'];
export const furnitureTypes = Object.keys(furnitureInfo) as FurnitureType[];
export const furnitureCategories = ['All', 'Living', 'Kitchen', 'Bedroom', 'Bathroom'] as const;
