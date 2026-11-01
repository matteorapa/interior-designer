export type OpeningType = 'door' | 'window';
export type WallOpening = { id: string; wallId: string; type: OpeningType; position: number; width: number };
export type Point = { x: number; y: number };

export function openingBounds(opening: WallOpening, wallLength: number) {
  const width = Math.min(opening.width, Math.max(0, wallLength - 20));
  const center = Math.max(10 + width / 2, Math.min(wallLength - 10 - width / 2, opening.position * wallLength));
  return { start: center - width / 2, end: center + width / 2, center, width };
}

export function wallSegments(a: Point, b: Point, openings: WallOpening[]) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!length) return [];
  const spans = openings.map((opening) => openingBounds(opening, length)).sort((x, y) => x.start - y.start);
  const intervals: [number, number][] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) intervals.push([cursor, span.start]);
    cursor = Math.max(cursor, span.end);
  }
  if (cursor < length) intervals.push([cursor, length]);
  return intervals.map(([start, end]) => ({
    x1: a.x + (b.x - a.x) * start / length,
    y1: a.y + (b.y - a.y) * start / length,
    x2: a.x + (b.x - a.x) * end / length,
    y2: a.y + (b.y - a.y) * end / length
  }));
}

export function fitOpening(wallLength: number, others: WallOpening[], desiredWidth: number, preferredPosition = 0.5) {
  if (wallLength < 75) return null;
  const blocked = others.map((opening) => openingBounds(opening, wallLength)).sort((a, b) => a.start - b.start);
  const gaps: [number, number][] = [];
  let cursor = 10;
  for (const span of blocked) {
    if (span.start - cursor >= 55) gaps.push([cursor, span.start]);
    cursor = Math.max(cursor, span.end);
  }
  if (wallLength - 10 - cursor >= 55) gaps.push([cursor, wallLength - 10]);
  const possible = gaps.map(([start, end]) => {
    const width = Math.min(desiredWidth, end - start - 8);
    const center = Math.max(start + width / 2 + 4, Math.min(end - width / 2 - 4, preferredPosition * wallLength));
    return { position: center / wallLength, width: Math.round(width), distance: Math.abs(center / wallLength - preferredPosition) };
  }).filter((item) => item.width >= 50).sort((a, b) => a.distance - b.distance);
  return possible[0] ? { position: possible[0].position, width: possible[0].width } : null;
}

export function openingMarkup(opening: WallOpening, wallLength: number) {
  const { width } = openingBounds(opening, wallLength);
  const half = width / 2;
  const ink = '#455247';
  if (opening.type === 'door') {
    return `<path d="M${-half} -12V12M${half} -12V12" stroke="${ink}" stroke-width="3" fill="none"/><path d="M${-half} 0V${-width}" stroke="${ink}" stroke-width="3" fill="none"/><path d="M${-half} ${-width}A${width} ${width} 0 0 1 ${half} 0" stroke="${ink}" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>`;
  }
  return `<path d="M${-half} -13V13M${half} -13V13" stroke="${ink}" stroke-width="3" fill="none"/><path d="M${-half} -6H${half}M${-half} 6H${half}" stroke="#6c9a9d" stroke-width="2.2" fill="none"/><path d="M${-half} 0H${half}" stroke="#a9c8c9" stroke-width="6" stroke-opacity=".65"/>`;
}
