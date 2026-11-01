export const materialTypes = ['paint', 'wood', 'fabric', 'stone'] as const;
export type MaterialType = typeof materialTypes[number];
export type TexturedMaterial = Exclude<MaterialType, 'paint'>;

export const materialLabels: Record<MaterialType, string> = {
  paint: 'Painted', wood: 'Wood', fabric: 'Fabric', stone: 'Stone'
};

export type MaterialFinish = { id: string; label: string; color: string; swatch: string };
export const materialFinishes: Record<TexturedMaterial, MaterialFinish[]> = {
  wood: [
    { id: 'oak', label: 'Light oak', color: '#d8bb91', swatch: 'repeating-linear-gradient(6deg,#d8bb91 0 7px,#b9956b 8px,#e1c9a5 10px 18px)' },
    { id: 'walnut', label: 'Walnut', color: '#896347', swatch: 'repeating-linear-gradient(5deg,#896347 0 7px,#684832 8px,#a77c57 10px 18px)' },
    { id: 'ash', label: 'Pale ash', color: '#d9d0bc', swatch: 'repeating-linear-gradient(4deg,#d9d0bc 0 7px,#beb29a 8px,#eee4d1 10px 18px)' },
    { id: 'smoked-oak', label: 'Smoked oak', color: '#70675a', swatch: 'repeating-linear-gradient(5deg,#70675a 0 7px,#4f493f 8px,#8a7f6b 10px 18px)' }
  ],
  fabric: [
    { id: 'linen', label: 'Linen', color: '#d8cbb7', swatch: 'repeating-linear-gradient(0deg,transparent 0 3px,#b7ab9955 4px),repeating-linear-gradient(90deg,#d8cbb7 0 3px,#b7ab9955 4px)' },
    { id: 'sage-weave', label: 'Sage weave', color: '#aebda8', swatch: 'repeating-linear-gradient(0deg,transparent 0 3px,#78917d66 4px),repeating-linear-gradient(90deg,#aebda8 0 3px,#78917d66 4px)' },
    { id: 'boucle', label: 'Bouclé', color: '#ece5d8', swatch: 'radial-gradient(circle at 3px 4px,#c9c0b1 0 1.5px,transparent 2px),radial-gradient(circle at 9px 10px,#c9c0b1 0 1.5px,transparent 2px),#ece5d8' },
    { id: 'ticking', label: 'Blue ticking', color: '#c7d1d4', swatch: 'repeating-linear-gradient(90deg,#c7d1d4 0 7px,#748b9a 8px 10px,#c7d1d4 11px 15px)' }
  ],
  stone: [
    { id: 'marble', label: 'White marble', color: '#e9e9e4', swatch: 'linear-gradient(132deg,transparent 28%,#bbc4c5 30%,transparent 33%),linear-gradient(26deg,transparent 65%,#c7ced0 67%,transparent 70%),#e9e9e4' },
    { id: 'travertine', label: 'Travertine', color: '#d8c8ad', swatch: 'repeating-linear-gradient(0deg,#d8c8ad 0 8px,#c7b598 9px,#e3d5bb 11px 19px)' },
    { id: 'slate', label: 'Slate', color: '#777f7c', swatch: 'radial-gradient(circle at 4px 5px,#a0aaa4 0 1px,transparent 2px),#777f7c' },
    { id: 'terrazzo', label: 'Terrazzo', color: '#eeeae1', swatch: 'radial-gradient(circle at 4px 5px,#9daaa4 0 2px,transparent 3px),radial-gradient(circle at 13px 14px,#cbb9a6 0 2px,transparent 3px),#eeeae1' }
  ]
};

export function resolveFinish(material: TexturedMaterial, finishId?: string) {
  return materialFinishes[material].find((finish) => finish.id === finishId) ?? materialFinishes[material][0];
}

export function materialPatternMarkup(material: TexturedMaterial, finishId: string | undefined, patternId: string) {
  const finish = resolveFinish(material, finishId);
  const grain = material === 'wood'
    ? `<path d="M0 4Q9 1 21 5T48 4M0 13Q12 10 24 13T48 12M0 23Q9 21 20 24T48 22" fill="none" stroke="${finish.id === 'ash' ? '#9d9078' : '#563d2c'}" stroke-opacity=".26" stroke-width="1.7"/><path d="M5 8Q13 7 17 9M29 18Q36 16 45 18" fill="none" stroke="#fff7e8" stroke-opacity=".3" stroke-width="1.2"/>`
    : material === 'fabric'
      ? finish.id === 'boucle'
        ? '<circle cx="3" cy="3" r="1.5" fill="#b8ae9d"/><circle cx="10" cy="10" r="1.8" fill="#c7bba8"/><circle cx="12" cy="3" r=".8" fill="#fff"/><circle cx="4" cy="11" r=".8" fill="#fff"/>'
        : finish.id === 'ticking'
          ? '<path d="M4 0V16M6 0V16M13 0V16" stroke="#748b9a" stroke-opacity=".65" stroke-width="1.5"/>'
          : '<path d="M0 4H16M0 8H16M0 12H16M4 0V16M8 0V16M12 0V16" stroke="#5c705d" stroke-opacity=".19" stroke-width=".8"/>'
      : finish.id === 'marble'
        ? '<path d="M-2 37Q18 29 25 13T62-3M20 56Q35 46 42 32T67 17" fill="none" stroke="#aab7b9" stroke-opacity=".7" stroke-width="1.7"/>'
        : finish.id === 'travertine'
          ? '<path d="M0 8H48M0 19H48M0 31H48" stroke="#ad997a" stroke-opacity=".3" stroke-width="1.5"/><path d="M5 4h9m12 10h13M8 27h12" stroke="#a58d6d" stroke-opacity=".35" stroke-width="1"/>'
          : finish.id === 'slate'
            ? '<circle cx="4" cy="7" r="1.3" fill="#b5bdb7"/><circle cx="18" cy="3" r=".8" fill="#454e4a"/><circle cx="22" cy="19" r="1.1" fill="#b5bdb7"/>'
            : '<path d="M3 4l4-2 2 4-4 2zM15 9l4-2 3 4-4 2zM7 20l5-2 2 4-5 2zM21 23l3-2 3 3-4 3z" fill="#a8b4ad"/><path d="M22 3l3-2 2 3-4 2zM1 15l3-2 2 3-4 2z" fill="#cbb9a6"/>';
  const size = material === 'wood' ? [48, 28] : material === 'fabric' ? [16, 16] : finish.id === 'marble' ? [64, 56] : finish.id === 'travertine' ? [48, 38] : [28, 28];
  const defs = `<defs><pattern id="${patternId}" width="${size[0]}" height="${size[1]}" patternUnits="userSpaceOnUse"><rect width="${size[0]}" height="${size[1]}" fill="${finish.color}"/>${grain}</pattern></defs>`;
  return { defs, surface: `url(#${patternId})`, ink: finish.id === 'walnut' || finish.id === 'smoked-oak' || finish.id === 'slate' ? '#f7f4ed' : '#34433a' };
}
