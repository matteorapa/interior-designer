import { defaultFinishForMaterial, defaultMaterialForType, type Furniture, type FurnitureType } from './furniture';
import type { FlooringType } from './flooring';
import type { WallOpening } from './openings';

export type TemplatePlan = {
  name: string;
  vertices: { id: string; x: number; y: number }[];
  walls: { id: string; from: string; to: string; thickness: number }[];
  openings: WallOpening[];
  furniture: Furniture[];
  comments: { id: string; x: number; y: number; text: string }[];
  flooring: FlooringType;
};

type FurnitureSeed = [FurnitureType, number, number, number?, number?];
type Template = {
  id: string;
  name: string;
  type: string;
  description: string;
  spaces: string;
  source: string;
  sourceUrl: string;
  viewBox: string;
  plan: TemplatePlan;
};

function makePlan(
  name: string,
  points: Record<string, [number, number]>,
  edges: [string, string][],
  items: FurnitureSeed[],
  flooring: FlooringType
): TemplatePlan {
  return {
    name,
    vertices: Object.entries(points).map(([id, [x, y]]) => ({ id, x, y })),
    walls: edges.map(([from, to], index) => ({ id: `w${index + 1}`, from, to, thickness: 14 })),
    openings: [],
    furniture: items.map(([type, x, y, rotation = 0, scale = 0.8], index) => {
      const material = defaultMaterialForType(type);
      return { id: `f${index + 1}`, type, x, y, rotation, scale, material, finish: defaultFinishForMaterial(material) };
    }),
    comments: [],
    flooring
  };
}

// These are original schematic layouts based on the spatial programmes in the linked plans.
// They are editable starting points, not surveys or construction drawings.
export const planTemplates: Template[] = [
  {
    id: 'paola-townhouse', name: 'Paola townhouse', type: 'Townhouse',
    description: 'A side hall with separate sitting and kitchen spaces.',
    spaces: 'Hall · sitting · kitchen / dining',
    source: 'Paola townhouse survey',
    sourceUrl: 'https://imagecache.ownersbest.com.mt/146-572269-paola-townhouse.pdf',
    viewBox: '170 35 710 640',
    plan: makePlan('Paola townhouse', {
      a: [230, 90], b: [450, 90], c: [810, 90], d: [810, 350],
      e: [810, 630], f: [450, 630], g: [230, 630], h: [230, 350], j: [450, 350]
    }, [
      ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'a'],
      ['b', 'j'], ['j', 'f'], ['j', 'd']
    ], [
      ['sofa', 625, 205], ['coffee-table-rectangle', 635, 285, 0, 0.75],
      ['dining-round', 645, 455, 0, 0.65], ['counter-straight', 610, 575, 0, 0.8],
      ['toilet', 340, 505, 0, 0.72]
    ], 'terracotta')
  },
  {
    id: 'sliema-maisonette', name: 'Sliema maisonette', type: 'Maisonette',
    description: 'A compact bedroom and bath beside an open living space.',
    spaces: 'Bedroom · bath · open-plan living',
    source: 'Sunshine Court brochure',
    sourceUrl: 'https://langart.net/static/upload/6ccc8c2ca30578ecef9c828afc45e49e/62eaa2c2769275e5cf4fc89522afd415.pdf',
    viewBox: '95 70 790 570',
    plan: makePlan('Sliema maisonette', {
      a: [150, 130], b: [440, 130], c: [840, 130], d: [840, 590],
      e: [440, 590], f: [150, 590], g: [150, 375], h: [440, 375]
    }, [
      ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['g', 'a'],
      ['b', 'h'], ['h', 'e'], ['g', 'h']
    ], [
      ['double-bed', 295, 255, 0, 0.75], ['wardrobe', 225, 340, 0, 0.7],
      ['shower-square', 240, 465, 0, 0.75], ['toilet', 360, 465, 0, 0.75],
      ['sofa', 610, 240], ['dining-round', 680, 415, 0, 0.7],
      ['counter-straight', 600, 540, 0, 0.85]
    ], 'light-oak')
  },
  {
    id: 'ghaxaq-terrace', name: 'Għaxaq terrace', type: 'Terraced house',
    description: 'A garage frontage, compact WC and open family area.',
    spaces: 'Garage · WC · sitting · kitchen / dining',
    source: 'Għaxaq proposed plans',
    sourceUrl: 'https://ici.com.mt/wp-content/uploads/2023/02/M_08_23_PROPOSED-PLANS_FEB-2023-1.pdf',
    viewBox: '80 55 830 620',
    plan: makePlan('Għaxaq terrace', {
      a: [140, 110], b: [390, 110], c: [520, 110], d: [860, 110],
      e: [860, 340], f: [860, 610], g: [390, 610], h: [140, 610],
      j: [390, 340], k: [390, 250], l: [520, 250]
    }, [
      ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'a'],
      ['b', 'k'], ['k', 'j'], ['j', 'g'], ['k', 'l'], ['l', 'c'], ['j', 'e']
    ], [
      ['toilet', 455, 185, 0, 0.7], ['sofa', 690, 230],
      ['coffee-table-round', 690, 300, 0, 0.72], ['dining', 690, 430, 0, 0.7],
      ['island', 605, 545, 0, 0.7]
    ], 'porcelain')
  }
];
