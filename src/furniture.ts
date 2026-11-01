import { furnitureInfo, furnitureTypes, type FurnitureType } from './furnitureCatalog';
import { materialFinishes, materialPatternMarkup, type MaterialType } from './materials';
export { furnitureInfo, furnitureTypes, furnitureCategories } from './furnitureCatalog';
export type { FurnitureType, FurnitureCategory } from './furnitureCatalog';

export const furniturePatterns = ['solid', 'stripes', 'dots', 'check'] as const;
export type FurniturePattern = typeof furniturePatterns[number];
export type Furniture = { id: string; type: FurnitureType; x: number; y: number; rotation: number; scale: number; widthScale?: number; lengthScale?: number; color?: string; pattern?: FurniturePattern; material?: MaterialType; finish?: string };
export const furnitureColors = ['#b9d3c0', '#d8be94', '#d3a69b', '#adc1d9', '#d9d1bf', '#8b9f92', '#8f8b9f', '#454f4b'];

const categoryColors = { Living: '#b9d3c0', Kitchen: '#d8be94', Bedroom: '#c5d6c8', Bathroom: '#c4dcd9' };
const originalColors: Partial<Record<FurnitureType, string>> = {
  island: '#b5cec3', plant: '#87b786', 'coffee-table': '#c8ab83', desk: '#c7ad88',
  bookshelf: '#bfa481', wardrobe: '#c5ad89', 'floor-lamp': '#e1c99b'
};
export const defaultColors = Object.fromEntries(furnitureTypes.map((type) => [type, originalColors[type] ?? categoryColors[furnitureInfo[type].category]])) as Record<FurnitureType, string>;

export function defaultMaterialForType(type: FurnitureType): MaterialType {
  const shape = furnitureInfo[type].shape;
  if (['sofa', 'sectional', 'chaise', 'armchair', 'recliner', 'ottoman', 'bench', 'chair', 'bed', 'bunk', 'crib', 'rug-rectangle', 'rug-round'].includes(shape)) return 'fabric';
  if (['island', 'island-l', 'counter', 'counter-l', 'sink', 'double-sink', 'vanity-single', 'vanity-double', 'bathtub', 'shower-square', 'shower-rectangle'].includes(shape)) return 'stone';
  if (['table-square', 'table-rectangle', 'table-round', 'table-oval', 'dining-rectangle', 'dining-square', 'dining-round', 'dining-oval', 'wardrobe', 'pantry', 'dresser', 'desk', 'bookshelf', 'console', 'cabinet', 'cart', 'nightstand'].includes(shape)) return 'wood';
  return 'paint';
}

export function defaultFinishForMaterial(material: MaterialType) {
  return material === 'paint' ? undefined : materialFinishes[material][0].id;
}

// Minimal top views shared by the picker, canvas, and SVG export.
// The selected colour fills every solid part. Neutral strokes describe the shape.
function baseFurnitureMarkup(type: FurnitureType, surface: string, ink: string): string {
  const { width: w, height: h, shape } = furnitureInfo[type];
  const edge = `stroke="${ink}" stroke-opacity=".52" stroke-width="2.5"`;
  const line = `fill="none" stroke="${ink}" stroke-opacity=".44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const rect = (x: number, y: number, width: number, height: number, radius = 6) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${surface}" ${edge}/>`;
  const outlineRect = (x: number, y: number, width: number, height: number, radius = 5) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ${line}/>`;
  const circle = (x: number, y: number, radius: number) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${surface}" ${edge}/>`;
  const outlineCircle = (x: number, y: number, radius: number) => `<circle cx="${x}" cy="${y}" r="${radius}" ${line}/>`;
  const ellipse = (rx: number, ry: number) => `<ellipse rx="${rx}" ry="${ry}" fill="${surface}" ${edge}/>`;
  const outlineEllipse = (rx: number, ry: number) => `<ellipse rx="${rx}" ry="${ry}" ${line}/>`;
  const path = (d: string) => `<path d="${d}" ${line}/>`;
  const body = (radius = 8) => rect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, radius);

  switch (shape) {
    case 'sofa': return body(14) + path(`M${-w/2+15} ${-h/2+17}H${w/2-15}M${-w/2+15} ${-h/2+17}V${h/2-12}M${w/2-15} ${-h/2+17}V${h/2-12}M0 ${-h/2+18}V${h/2-12}M${-w/2+15} ${h/2-12}H${w/2-15}`);
    case 'sectional': return `<path d="M${-w/2+2} ${-h/2+2}H${w/2-2}Q${w/2} ${-h/2+2} ${w/2} ${-h/2+15}V${-h/2+68}Q${w/2} ${-h/2+80} ${w/2-12} ${-h/2+80}H${-w/2+70}V${h/2-12}Q${-w/2+70} ${h/2} ${-w/2+58} ${h/2}H${-w/2+12}Q${-w/2} ${h/2} ${-w/2} ${h/2-12}V${-h/2+14}Q${-w/2} ${-h/2+2} ${-w/2+2} ${-h/2+2}Z" fill="${surface}" ${edge}/>` + path(`M${-w/2+15} ${-h/2+18}H${w/2-15}M${-w/2+15} ${-h/2+18}V${h/2-15}M${-w/2+15} ${-h/2+18}V${-h/2+15}M${-w/2+70} ${-h/2+18}V${-h/2+79}M0 ${-h/2+18}V${-h/2+79}M${-w/2+15} ${-h/2+79}H${-w/2+70}`);
    case 'chaise': return body(20) + outlineRect(-w/2+13, -h/2+11, 35, h-22, 10) + path(`M${-w/2+58} ${-h/2+12}V${h/2-12}M${w/2-19} ${-h/2+12}V${h/2-12}`);
    case 'armchair': case 'recliner': return body(17) + path(`M${-w/2+12} ${-h/2+16}H${w/2-12}M${-w/2+12} ${-h/2+16}V${h/2-12}H${w/2-12}V${-h/2+16}`) + (shape === 'recliner' ? path(`M${-w/2+15} ${h/2-25}H${w/2-15}`) : '');
    case 'ottoman': case 'bench': return body(11) + outlineRect(-w/2+9, -h/2+9, w-18, h-18, 7);
    case 'table-square': case 'table-rectangle': return body(shape === 'table-square' ? 4 : 7) + outlineRect(-w/2+8, -h/2+8, w-16, h-16, 2);
    case 'table-round': return circle(0, 0, w/2-2) + outlineCircle(0, 0, w/2-11);
    case 'table-oval': return ellipse(w/2-2, h/2-2) + outlineEllipse(w/2-11, h/2-10);
    case 'dining-rectangle': case 'dining-square': case 'dining-round': case 'dining-oval': {
      const chairs = rect(-19, -h/2+2, 38, 19, 8) + rect(-19, h/2-21, 38, 19, 8) + rect(-w/2+2, -17, 19, 34, 8) + rect(w/2-21, -17, 19, 34, 8);
      const table = shape === 'dining-round' ? circle(0, 0, Math.min(w,h)/2-24) : shape === 'dining-oval' ? ellipse(w/2-25,h/2-22) : rect(-w/2+25,-h/2+24,w-50,h-48,shape === 'dining-square' ? 5 : 15);
      return chairs + table;
    }
    case 'chair': return body(9) + path(`M${-w/2+8} ${-h/2+14}H${w/2-8}`);
    case 'stool': return circle(0, 0, w/2-2) + outlineCircle(0, 0, w/2-10);
    case 'island': return body(9) + outlineRect(-w/2+11,-h/2+10,w-22,h-20,4) + outlineRect(-w/2+20,-h/2+18,36,h-36,6) + outlineCircle(w/2-39,0,12);
    case 'island-l': case 'counter-l': return `<path d="M${-w/2+2} ${-h/2+2}H${w/2-2}V${-h/2+53}H${-w/2+53}V${h/2-2}H${-w/2+2}Z" fill="${surface}" ${edge}/>` + path(`M${-w/2+13} ${-h/2+14}H${w/2-14}M${-w/2+13} ${-h/2+14}V${h/2-14}`);
    case 'counter': return body(4) + path(`M${-w/2+12} ${-h/2+11}H${w/2-12}`);
    case 'sink': case 'double-sink': return body(6) + (shape === 'sink' ? outlineRect(-w/2+12,-h/2+11,w-24,h-22,8) + outlineCircle(0,0,3) : outlineRect(-w/2+10,-h/2+10,w/2-15,h-20,8) + outlineRect(5,-h/2+10,w/2-15,h-20,8) + outlineCircle(-w/4,0,3) + outlineCircle(w/4,0,3));
    case 'cooktop': case 'range': return body(5) + [-1,1].map((x) => [-1,1].map((y) => outlineCircle(x*w*.24,y*h*.22,Math.min(w,h)*.13)).join('')).join('') + (shape === 'range' ? path(`M${-w/2+10} ${h/2-9}H${w/2-10}`) : '');
    case 'fridge': return body(7) + path(`M0 ${-h/2+3}V${h/2-3}M${-w/2+10} ${-h/2+12}V${h/2-12}M${w/2-10} ${-h/2+12}V${h/2-12}`);
    case 'dishwasher': case 'oven': case 'microwave': return body(6) + outlineRect(-w/2+9,-h/2+12,w-18,h-24,4) + path(`M${-w/2+10} ${-h/2+7}H${w/2-10}`) + outlineCircle(w/2-14,-h/2+7,2);
    case 'pantry': case 'wardrobe': return body(6) + path(`M0 ${-h/2+2}V${h/2-2}M-10-8V8M10-8V8`);
    case 'cart': return body(7) + outlineRect(-w/2+9,-h/2+9,w-18,h-18,4) + circle(-w/2+10,h/2-2,4) + circle(w/2-10,h/2-2,4);
    case 'bed': return body(10) + path(`M${-w/2+9} ${-h/2+52}H${w/2-9}M${-w/2+9} ${h/2-12}H${w/2-9}`) + (w < 110 ? outlineRect(-w/2+12,-h/2+12,w-24,29,8) : outlineRect(-w/2+12,-h/2+12,(w-30)/2,29,8) + outlineRect(3,-h/2+12,(w-30)/2,29,8));
    case 'bunk': return body(9) + outlineRect(-w/2+12,-h/2+12,w-24,h/2-19,5) + outlineRect(-w/2+12,7,w-24,h/2-19,5) + path(`M${w/2-14} ${-h/2+8}V${h/2-8}M${w/2-20} -20H${w/2-8}M${w/2-20} 0H${w/2-8}M${w/2-20} 20H${w/2-8}`);
    case 'crib': return body(10) + Array.from({length:7},(_,i)=>path(`M${-w/2+12+i*(w-24)/6} ${-h/2+9}V${h/2-9}`)).join('');
    case 'nightstand': return body(5) + path(`M${-w/2+8} 0H${w/2-8}`) + outlineCircle(0,h/4,2);
    case 'dresser': return body(6) + path(`M${-w/2+8} ${-h/2+18}H${w/2-8}M${-w/2+8} ${h/2-18}H${w/2-8}`) + [-1,0,1].map((i)=>outlineCircle(0,i*h*.28,2)).join('');
    case 'desk': return body(7) + outlineRect(-w/2+12,-h/2+10,48,h-30,3) + path(`M${w/2-48} ${-h/2+16}H${w/2-13}M${w/2-48} ${-h/2+7}H${w/2-13}`);
    case 'office-chair': return circle(0,0,w/2-2) + outlineRect(-w/2+10,-h/2+12,w-20,h-24,10) + path(`M${-w/2+13} ${-h/2+15}H${w/2-13}`);
    case 'vanity': return body(6) + outlineEllipse(w*.22,h*.28) + path(`M${-w/2+10} ${-h/2+9}H${w/2-10}`);
    case 'mirror': return body(9) + outlineRect(-w/2+7,-h/2+5,w-14,h-10,5);
    case 'console': return body(5) + path(`M${-w/2+10} 0H${w/2-10}M0 ${-h/2+3}V${h/2-3}`);
    case 'television': return body(3) + outlineRect(-w/2+6,-h/2+4,w-12,h-8,2);
    case 'bookshelf': return body(5) + path(`M${-w/2+8} -7H${w/2-8}M${-w/2+8} 7H${w/2-8}`) + [-w*.32,-w*.12,w*.12,w*.32].map(x=>path(`M${x} ${-h/2+5}V${h/2-5}`)).join('');
    case 'rug-rectangle': return body(6) + outlineRect(-w/2+12,-h/2+12,w-24,h-24,3);
    case 'rug-round': return circle(0,0,w/2-2) + outlineCircle(0,0,w/2-14);
    case 'lamp': return circle(0,0,w/2-2) + outlineCircle(0,0,w/2-12) + outlineCircle(0,0,5);
    case 'plant': return circle(0,0,w/2-2) + path('M0 0Q-20-27-18-23Q-5-26 0 0ZM0 0Q20-27 25-16Q22-4 0 0ZM0 0Q27 16 14 25Q1 23 0 0ZM0 0Q-27 17-24 5Q-12-3 0 0Z') + outlineCircle(0,0,3);
    case 'fireplace': return body(4) + outlineRect(-w/2+10,-h/2+8,w-20,h-16,3) + path('M-25 7Q-14-10-5 7Q6-13 17 7Q24-3 29 7');
    case 'bathtub': return body(29) + outlineRect(-w/2+12,-h/2+11,w-24,h-22,23) + outlineCircle(w/2-29,0,4);
    case 'shower-square': case 'shower-rectangle': return body(5) + outlineRect(-w/2+9,-h/2+9,w-18,h-18,3) + outlineCircle(w/2-21,-h/2+21,7) + path(`M${-w/2+13} ${h/2-17}L${w/2-17} ${-h/2+13}`);
    case 'toilet': case 'bidet': return rect(-w/2+6,-h/2+2,w-12,21,5) + `<ellipse cy="${h*.13}" rx="${w*.38}" ry="${h*.32}" fill="${surface}" ${edge}/>` + outlineEllipse(w*.28,h*.21);
    case 'basin': return body(12) + outlineEllipse(w*.34,h*.31) + outlineCircle(0,h*.15,3);
    case 'vanity-single': case 'vanity-double': return body(5) + (shape === 'vanity-single' ? outlineEllipse(w*.29,h*.29) + outlineCircle(0,0,3) : outlineEllipse(w*.2,h*.29).replace('<ellipse ',`<ellipse cx="${-w*.24}" `) + outlineEllipse(w*.2,h*.29).replace('<ellipse ',`<ellipse cx="${w*.24}" `)) + path(`M${-w/2+10} ${-h/2+8}H${w/2-10}`);
    case 'cabinet': return body(4) + path(`M0 ${-h/2+2}V${h/2-2}M-9-6V6M9-6V6`);
    case 'towel-rack': return body(3) + path(`M${-w/2+10} -4H${w/2-10}M${-w/2+10} 4H${w/2-10}`);
    case 'washer': case 'dryer': return body(5) + outlineCircle(0,3,w*.29) + path(`M${-w/2+8} ${-h/2+10}H${w/2-8}`) + outlineCircle(w/2-13,-h/2+7,2);
    default: return body();
  }
}

export function furnitureMarkup(type: FurnitureType, color = defaultColors[type], pattern: FurniturePattern = 'solid', id = 'preview', material?: MaterialType, finish?: string): string {
  const safeId = id.replace(/[^a-z0-9_-]/gi, '');
  const patternId = `finish-${safeId}`;
  if (material && material !== 'paint') {
    const textured = materialPatternMarkup(material, finish, patternId);
    return textured.defs + baseFurnitureMarkup(type, textured.surface, textured.ink);
  }
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : defaultColors[type];
  const safePattern = furniturePatterns.includes(pattern) ? pattern : 'solid';
  const brightness = (parseInt(safeColor.slice(1, 3), 16) * 299 + parseInt(safeColor.slice(3, 5), 16) * 587 + parseInt(safeColor.slice(5, 7), 16) * 114) / 1000;
  const ink = brightness < 120 ? '#ffffff' : '#263e33';
  const surface = safePattern === 'solid' ? safeColor : `url(#${patternId})`;
  const marks: Record<Exclude<FurniturePattern, 'solid'>, string> = {
    stripes: `<path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="${ink}" stroke-opacity=".28" stroke-width="2"/>`,
    dots: `<circle cx="3" cy="3" r="1.5" fill="${ink}" fill-opacity=".28"/><circle cx="9" cy="9" r="1.5" fill="${ink}" fill-opacity=".28"/>`,
    check: `<path d="M6 0V12M0 6H12" stroke="${ink}" stroke-opacity=".25" stroke-width="1.5"/>`
  };
  const defs = safePattern === 'solid' ? '' : `<defs><pattern id="${patternId}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${safeColor}"/>${marks[safePattern]}</pattern></defs>`;
  return defs + baseFurnitureMarkup(type, surface, ink);
}
