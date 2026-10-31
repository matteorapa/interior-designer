export const furnitureTypes = ['sofa', 'dining', 'island', 'bed', 'armchair', 'plant', 'coffee-table', 'desk', 'bookshelf', 'wardrobe', 'bathtub', 'floor-lamp'] as const;
export type FurnitureType = typeof furnitureTypes[number];
export const furniturePatterns = ['solid', 'stripes', 'dots', 'check'] as const;
export type FurniturePattern = typeof furniturePatterns[number];
export type Furniture = { id: string; type: FurnitureType; x: number; y: number; rotation: number; scale: number; color?: string; pattern?: FurniturePattern };
export const furnitureColors = ['#b9d3c0', '#d8be94', '#d3a69b', '#adc1d9', '#d9d1bf', '#8b9f92', '#8f8b9f', '#454f4b'];

export const furnitureInfo: Record<FurnitureType, { label: string; width: number; height: number }> = {
  sofa: { label: 'Sofa', width: 170, height: 82 }, dining: { label: 'Dining table', width: 148, height: 122 },
  island: { label: 'Kitchen island', width: 148, height: 78 }, bed: { label: 'Bed', width: 142, height: 170 },
  armchair: { label: 'Armchair', width: 84, height: 88 }, plant: { label: 'Plant', width: 64, height: 64 },
  'coffee-table': { label: 'Coffee table', width: 112, height: 66 }, desk: { label: 'Desk', width: 138, height: 70 },
  bookshelf: { label: 'Bookshelf', width: 112, height: 45 }, wardrobe: { label: 'Wardrobe', width: 120, height: 72 },
  bathtub: { label: 'Bathtub', width: 145, height: 76 }, 'floor-lamp': { label: 'Floor lamp', width: 58, height: 58 }
};

export const defaultColors: Record<FurnitureType, string> = {
  sofa: '#b9d3c0', dining: '#d8be94', island: '#b5cec3', bed: '#c5d6c8',
  armchair: '#b9d3c0', plant: '#87b786', 'coffee-table': '#c8ab83',
  desk: '#c7ad88', bookshelf: '#bfa481', wardrobe: '#c5ad89',
  bathtub: '#c4dcd9', 'floor-lamp': '#e1c99b'
};

// The same top-view illustration appears in the picker, canvas, and SVG export.
// Every filled part uses the chosen colour; neutral strokes define its form.
function baseFurnitureMarkup(type: FurnitureType, surface: string, ink: string): string {
  const edge = `stroke="${ink}" stroke-opacity=".5" stroke-width="2.5"`;
  const line = `fill="none" stroke="${ink}" stroke-opacity=".42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  switch (type) {
    case 'sofa': return `<rect x="-84" y="-40" width="168" height="80" rx="15" fill="${surface}" ${edge}/><path d="M-70-25H70M-70-25V27M70-25V27M0-23V28M-70 28H70" ${line}/>`;
    case 'dining': return `<rect x="-37" y="-60" width="74" height="23" rx="9" fill="${surface}" ${edge}/><rect x="-37" y="37" width="74" height="23" rx="9" fill="${surface}" ${edge}/><rect x="-73" y="-24" width="23" height="48" rx="9" fill="${surface}" ${edge}/><rect x="50" y="-24" width="23" height="48" rx="9" fill="${surface}" ${edge}/><rect x="-47" y="-34" width="94" height="68" rx="23" fill="${surface}" ${edge}/>`;
    case 'island': return `<rect x="-73" y="-38" width="146" height="76" rx="9" fill="${surface}" ${edge}/><rect x="-61" y="-27" width="122" height="54" rx="5" ${line}/><rect x="-52" y="-18" width="37" height="36" rx="6" ${line}/><circle cx="29" cy="0" r="12" ${line}/>`;
    case 'bed': return `<rect x="-70" y="-84" width="140" height="168" rx="10" fill="${surface}" ${edge}/><path d="M-60-28H60M-60 72H60" ${line}/><rect x="-57" y="-70" width="51" height="30" rx="8" ${line}/><rect x="6" y="-70" width="51" height="30" rx="8" ${line}/>`;
    case 'armchair': return `<rect x="-41" y="-43" width="82" height="86" rx="17" fill="${surface}" ${edge}/><path d="M-30-27H30M-28-10V28H28V-10M-30 28H30" ${line}/>`;
    case 'plant': return `<circle r="31" fill="${surface}" ${edge}/><path d="M0 0Q-21-27-18-24Q-4-28 0 0ZM0 0Q19-27 25-17Q24-5 0 0ZM0 0Q27 17 14 25Q0 25 0 0ZM0 0Q-28 18-25 5Q-14-4 0 0Z" ${line}/><circle r="3" fill="${ink}" fill-opacity=".55"/>`;
    case 'coffee-table': return `<ellipse rx="55" ry="32" fill="${surface}" ${edge}/><ellipse rx="44" ry="22" ${line}/>`;
    case 'desk': return `<rect x="-68" y="-34" width="136" height="68" rx="8" fill="${surface}" ${edge}/><rect x="-55" y="-23" width="50" height="34" rx="4" ${line}/><path d="M-51 20H-10M21-18H53M21-9H46" ${line}/>`;
    case 'bookshelf': return `<rect x="-55" y="-21" width="110" height="42" rx="5" fill="${surface}" ${edge}/><path d="M-46-7H46M-46 8H46M-34-18V-8M-18-18V-8M0-18V-8M18-18V-8M33-18V-8M-28-5V7M-8-5V7M11-5V7M30-5V7" ${line}/>`;
    case 'wardrobe': return `<rect x="-59" y="-35" width="118" height="70" rx="6" fill="${surface}" ${edge}/><path d="M0-34V34M-10-8V9M10-8V9" ${line}/>`;
    case 'bathtub': return `<rect x="-71" y="-37" width="142" height="74" rx="30" fill="${surface}" ${edge}/><rect x="-59" y="-26" width="118" height="52" rx="24" ${line}/><circle cx="43" cy="0" r="4" fill="${ink}" fill-opacity=".55"/>`;
    case 'floor-lamp': return `<circle r="28" fill="${surface}" ${edge}/><circle r="18" ${line}/><circle r="5" fill="${ink}" fill-opacity=".45"/>`;
  }
}

export function furnitureMarkup(type: FurnitureType, color = defaultColors[type], pattern: FurniturePattern = 'solid', id = 'preview'): string {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : defaultColors[type];
  const safePattern = furniturePatterns.includes(pattern) ? pattern : 'solid';
  const safeId = id.replace(/[^a-z0-9_-]/gi, '');
  const patternId = `finish-${safeId}`;
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
