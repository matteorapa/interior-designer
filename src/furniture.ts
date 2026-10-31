export const furnitureTypes = ['sofa', 'dining', 'island', 'bed', 'armchair', 'plant', 'coffee-table', 'desk', 'bookshelf', 'wardrobe', 'bathtub', 'floor-lamp'] as const;
export type FurnitureType = typeof furnitureTypes[number];
export const furniturePatterns = ['solid', 'stripes', 'dots', 'check'] as const;
export type FurniturePattern = typeof furniturePatterns[number];
export type Furniture = { id: string; type: FurnitureType; x: number; y: number; rotation: number; scale: number; color?: string; pattern?: FurniturePattern };
export const furnitureColors = ['#b9d3c0', '#d8be94', '#d3a69b', '#adc1d9', '#d9d1bf', '#8b9f92', '#8f8b9f', '#454f4b'];

export const furnitureInfo: Record<FurnitureType, { label: string; width: number; height: number }> = {
  sofa: { label: 'Sofa', width: 170, height: 82 },
  dining: { label: 'Dining table', width: 148, height: 122 },
  island: { label: 'Kitchen island', width: 148, height: 78 },
  bed: { label: 'Bed', width: 142, height: 170 },
  armchair: { label: 'Armchair', width: 84, height: 88 },
  plant: { label: 'Plant', width: 64, height: 64 },
  'coffee-table': { label: 'Coffee table', width: 112, height: 66 },
  desk: { label: 'Desk', width: 138, height: 70 },
  bookshelf: { label: 'Bookshelf', width: 112, height: 45 },
  wardrobe: { label: 'Wardrobe', width: 120, height: 72 },
  bathtub: { label: 'Bathtub', width: 145, height: 76 },
  'floor-lamp': { label: 'Floor lamp', width: 58, height: 58 }
};

// Static SVG drawings shared by the canvas and SVG export.
function baseFurnitureMarkup(type: FurnitureType): string {
  switch (type) {
    case 'sofa': return `
      <rect x="-85" y="-41" width="170" height="82" rx="17" fill="#d7e7dc" stroke="#7b9f88" stroke-width="3"/>
      <rect x="-73" y="-32" width="146" height="22" rx="9" fill="#bad5c3" stroke="#83a88d" stroke-width="2"/>
      <rect x="-72" y="-5" width="69" height="37" rx="8" fill="#eaf4e9" stroke="#91b29a" stroke-width="2"/>
      <rect x="3" y="-5" width="69" height="37" rx="8" fill="#eaf4e9" stroke="#91b29a" stroke-width="2"/>
      <rect x="-85" y="-23" width="14" height="58" rx="7" fill="#accbb7"/>
      <rect x="71" y="-23" width="14" height="58" rx="7" fill="#accbb7"/>`;
    case 'dining': return `
      <rect x="-39" y="-61" width="78" height="25" rx="10" fill="#d9e5dd" stroke="#92a996" stroke-width="2"/>
      <rect x="-39" y="36" width="78" height="25" rx="10" fill="#d9e5dd" stroke="#92a996" stroke-width="2"/>
      <rect x="-74" y="-25" width="26" height="50" rx="10" fill="#d9e5dd" stroke="#92a996" stroke-width="2"/>
      <rect x="48" y="-25" width="26" height="50" rx="10" fill="#d9e5dd" stroke="#92a996" stroke-width="2"/>
      <rect x="-48" y="-35" width="96" height="70" rx="25" fill="#e8dbc2" stroke="#a99978" stroke-width="3"/>
      <path d="M-29 0H29" stroke="#c3ae8a" stroke-width="2" stroke-linecap="round"/>`;
    case 'island': return `
      <rect x="-74" y="-39" width="148" height="78" rx="10" fill="#dce9e2" stroke="#789887" stroke-width="3"/>
      <rect x="-65" y="-29" width="130" height="58" rx="5" fill="#f5f3e9" stroke="#b7b7a9" stroke-width="2"/>
      <rect x="-53" y="-19" width="43" height="38" rx="7" fill="#d8e8e7" stroke="#9aada7" stroke-width="2"/>
      <circle cx="29" cy="0" r="13" fill="none" stroke="#9bafa6" stroke-width="2"/>
      <circle cx="29" cy="0" r="6" fill="none" stroke="#9bafa6" stroke-width="2"/>`;
    case 'bed': return `
      <rect x="-71" y="-85" width="142" height="170" rx="9" fill="#d9e7dd" stroke="#809d8a" stroke-width="3"/>
      <rect x="-62" y="-75" width="124" height="42" rx="7" fill="#a9c8b5"/>
      <rect x="-57" y="-65" width="52" height="28" rx="8" fill="#f7f8ed" stroke="#c2d0bf"/>
      <rect x="5" y="-65" width="52" height="28" rx="8" fill="#f7f8ed" stroke="#c2d0bf"/>
      <path d="M-61-22H61V72H-61Z" fill="#eaf1e9" stroke="#bed0c1" stroke-width="2"/>
      <path d="M-56 44Q0 55 56 44" fill="none" stroke="#b7ceba" stroke-width="2"/>`;
    case 'armchair': return `
      <rect x="-42" y="-44" width="84" height="88" rx="19" fill="#d8e6dc" stroke="#829f89" stroke-width="3"/>
      <rect x="-32" y="-35" width="64" height="22" rx="9" fill="#adcbb7"/>
      <rect x="-30" y="-8" width="60" height="39" rx="10" fill="#edf4e9" stroke="#a4bea8" stroke-width="2"/>
      <rect x="-42" y="-20" width="13" height="52" rx="6" fill="#afcbb7"/>
      <rect x="29" y="-20" width="13" height="52" rx="6" fill="#afcbb7"/>`;
    case 'plant': return `
      <circle r="32" fill="#e8f1e5" stroke="#8eac91" stroke-width="2"/>
      <path d="M0 0Q-27-27-17-25Q-6-27 0 0ZM0 0Q21-30 28-18Q25-5 0 0ZM0 0Q31 21 16 27Q1 26 0 0ZM0 0Q-29 20-27 5Q-15-3 0 0Z" fill="#79ad80" stroke="#5f9167" stroke-width="1.5"/>
      <circle r="5" fill="#4f845a"/>`;
    case 'coffee-table': return `<ellipse rx="56" ry="33" fill="#c9b69c" stroke="#846f57" stroke-width="3"/><ellipse rx="43" ry="23" fill="none" stroke="#e5d8c5" stroke-width="2"/><circle cx="-18" cy="1" r="8" fill="#f4eee4" stroke="#846f57"/><path d="M12-9L28 6M20-12L32 0" stroke="#846f57" stroke-width="2"/>`;
    case 'desk': return `<rect x="-69" y="-35" width="138" height="70" rx="7" fill="#c9b69c" stroke="#846f57" stroke-width="3"/><rect x="-57" y="-25" width="53" height="36" rx="3" fill="#edf2ec" stroke="#846f57" stroke-width="2"/><path d="M-53 18H-8M19-20H52M19-11H46" stroke="#846f57" stroke-width="2" stroke-linecap="round"/><circle cx="44" cy="18" r="7" fill="#f4eee4" stroke="#846f57"/>`;
    case 'bookshelf': return `<rect x="-56" y="-22" width="112" height="44" rx="4" fill="#c9b69c" stroke="#846f57" stroke-width="3"/><path d="M-48-10H48M-48 7H48" stroke="#846f57" stroke-width="3"/><path d="M-39-18V-11M-30-18V-11M-20-17V-11M-7-17V-11M5-18V-11M18-18V-11M31-17V-11M40-18V-11M-34-6V6M-22-6V6M-8-6V6M4-6V6M18-6V6M34-6V6" stroke="#f4eee4" stroke-width="5"/>`;
    case 'wardrobe': return `<rect x="-60" y="-36" width="120" height="72" rx="6" fill="#c9b69c" stroke="#846f57" stroke-width="3"/><path d="M0-33V33" stroke="#846f57" stroke-width="2"/><path d="M-9-7V8M9-7V8" stroke="#846f57" stroke-width="3" stroke-linecap="round"/><path d="M-50-25H-16M17-25H50" stroke="#e5d8c5" stroke-width="2"/>`;
    case 'bathtub': return `<rect x="-72" y="-38" width="144" height="76" rx="32" fill="#c9b69c" stroke="#846f57" stroke-width="3"/><rect x="-60" y="-27" width="120" height="54" rx="25" fill="#f4f7f3" stroke="#846f57" stroke-width="2"/><circle cx="46" cy="0" r="5" fill="#846f57"/><path d="M-61-27V-37H-43" fill="none" stroke="#846f57" stroke-width="4" stroke-linecap="round"/>`;
    case 'floor-lamp': return `<circle r="29" fill="#f4eee4" stroke="#846f57" stroke-width="2"/><circle r="19" fill="#c9b69c" stroke="#846f57" stroke-width="2"/><circle r="5" fill="#846f57"/><path d="M-10-7Q0-16 11-7" fill="none" stroke="#fff8ec" stroke-width="2"/>`;
  }
}

export const defaultColors: Record<FurnitureType, string> = {
  sofa: '#b9d3c0', dining: '#d8be94', island: '#b5cec3', bed: '#c5d6c8',
  armchair: '#b9d3c0', plant: '#87b786', 'coffee-table': '#c8ab83',
  desk: '#c7ad88', bookshelf: '#bfa481', wardrobe: '#c5ad89',
  bathtub: '#c4dcd9', 'floor-lamp': '#e1c99b'
};
const primaryFills: Record<FurnitureType, string[]> = {
  sofa: ['#d7e7dc', '#eaf4e9'], dining: ['#e8dbc2'], island: ['#dce9e2'],
  bed: ['#d9e7dd', '#eaf1e9'], armchair: ['#d8e6dc', '#edf4e9'], plant: ['#79ad80'],
  'coffee-table': ['#c9b69c'], desk: ['#c9b69c'], bookshelf: ['#c9b69c'],
  wardrobe: ['#c9b69c'], bathtub: ['#c9b69c'], 'floor-lamp': ['#c9b69c']
};

export function furnitureMarkup(type: FurnitureType, color = defaultColors[type], pattern: FurniturePattern = 'solid', id = 'preview'): string {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : defaultColors[type];
  const safePattern = furniturePatterns.includes(pattern) ? pattern : 'solid';
  const safeId = id.replace(/[^a-z0-9_-]/gi, '');
  const patternId = `finish-${safeId}`;
  const surface = safePattern === 'solid' ? safeColor : `url(#${patternId})`;
  const defs = safePattern === 'solid' ? '' : `<defs><pattern id="${patternId}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${safeColor}"/>${safePattern === 'stripes' ? '<path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="#ffffff" stroke-opacity=".55" stroke-width="2"/>' : safePattern === 'dots' ? '<circle cx="3" cy="3" r="1.7" fill="#294239" fill-opacity=".4"/><circle cx="9" cy="9" r="1.7" fill="#294239" fill-opacity=".4"/>' : '<path d="M6 0V12M0 6H12" stroke="#ffffff" stroke-opacity=".55" stroke-width="2"/>'}</pattern></defs>`;
  let drawing = baseFurnitureMarkup(type);
  for (const fill of primaryFills[type]) drawing = drawing.replaceAll(`fill="${fill}"`, `fill="${surface}"`);
  return defs + drawing;
}
