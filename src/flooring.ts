export const flooringTypes = ['none', 'light-oak', 'walnut', 'porcelain', 'terracotta'] as const;
export type FlooringType = typeof flooringTypes[number];
export const flooringInfo: Record<FlooringType, { label: string; category: string; swatch: string }> = {
  none: { label: 'No floor', category: 'Plain', swatch: 'linear-gradient(135deg,#fafbf8,#f0f4ef)' },
  'light-oak': { label: 'Light oak', category: 'Wood', swatch: 'repeating-linear-gradient(90deg,#d8bc94 0 18px,#bfa27e 19px,#e1cba9 20px 38px,#bfa27e 39px)' },
  walnut: { label: 'Walnut', category: 'Wood', swatch: 'repeating-linear-gradient(90deg,#9b7656 0 18px,#74553f 19px,#ad8764 20px 38px,#74553f 39px)' },
  porcelain: { label: 'Porcelain tile', category: 'Tile', swatch: 'linear-gradient(90deg,#ddd 1px,transparent 1px),linear-gradient(#ddd 1px,transparent 1px),#f0eee8' },
  terracotta: { label: 'Terracotta tile', category: 'Tile', swatch: 'linear-gradient(90deg,#b57355 1px,transparent 1px),linear-gradient(#b57355 1px,transparent 1px),#cd8d6d' }
};

export const flooringDefs = `<pattern id="floor-light-oak" width="76" height="32" patternUnits="userSpaceOnUse"><rect width="76" height="32" fill="#dfc9a7"/><path d="M0 0H76M0 16H76M25 0V16M58 16V32" stroke="#b89a72" stroke-width="2"/><path d="M4 7H21M31 23H53M48 7H70" stroke="#c2a47d" stroke-width="1"/></pattern><pattern id="floor-walnut" width="76" height="32" patternUnits="userSpaceOnUse"><rect width="76" height="32" fill="#a58160"/><path d="M0 0H76M0 16H76M25 0V16M58 16V32" stroke="#75543d" stroke-width="2"/><path d="M4 7H21M31 23H53M48 7H70" stroke="#886548" stroke-width="1"/></pattern><pattern id="floor-porcelain" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f0eee8"/><path d="M0 0H60M0 0V60" stroke="#d0d2cc" stroke-width="3"/><path d="M10 17L22 12M40 38L49 34" stroke="#e1e0da" stroke-width="1"/></pattern><pattern id="floor-terracotta" width="58" height="58" patternUnits="userSpaceOnUse"><rect width="58" height="58" fill="#ce906e"/><path d="M0 0H58M0 0V58" stroke="#aa6c50" stroke-width="3"/><path d="M8 8L25 13M31 42L45 37" stroke="#dcaa89" stroke-width="1"/></pattern>`;

// Walk directed wall edges to find bounded faces, including rooms with shared walls.
export function closedRoomPolygons(vertices: { id: string; x: number; y: number }[], walls: { from: string; to: string }[]) {
  const points = new Map(vertices.map((point) => [point.id, point]));
  const adjacency = new Map<string, string[]>();
  for (const wall of walls) {
    if (!points.has(wall.from) || !points.has(wall.to) || wall.from === wall.to) continue;
    adjacency.set(wall.from, [...new Set([...(adjacency.get(wall.from) ?? []), wall.to])]);
    adjacency.set(wall.to, [...new Set([...(adjacency.get(wall.to) ?? []), wall.from])]);
  }
  for (const [id, neighbors] of adjacency) {
    const center = points.get(id)!;
    neighbors.sort((a, b) => Math.atan2(points.get(a)!.y - center.y, points.get(a)!.x - center.x) - Math.atan2(points.get(b)!.y - center.y, points.get(b)!.x - center.x));
  }
  const visitedEdges = new Set<string>();
  const rooms: string[] = [];
  for (const [start, neighbors] of adjacency) for (const neighbor of neighbors) {
    const firstEdge = JSON.stringify([start, neighbor]);
    if (visitedEdges.has(firstEdge)) continue;
    const ordered: string[] = [];
    let from = start;
    let to = neighbor;
    let closed = false;
    for (let step = 0; step <= walls.length * 2; step++) {
      const edge = JSON.stringify([from, to]);
      if (visitedEdges.has(edge)) { closed = edge === firstEdge; break; }
      visitedEdges.add(edge);
      ordered.push(from);
      const nextNeighbors = adjacency.get(to)!;
      const incomingIndex = nextNeighbors.indexOf(from);
      const next = nextNeighbors[(incomingIndex - 1 + nextNeighbors.length) % nextNeighbors.length];
      from = to;
      to = next;
    }
    if (!closed || ordered.length < 3) continue;
    const area = ordered.reduce((sum, id, index) => {
      const a = points.get(id)!;
      const b = points.get(ordered[(index + 1) % ordered.length])!;
      return sum + a.x * b.y - b.x * a.y;
    }, 0);
    if (area > 1) rooms.push(ordered.map((id) => `${points.get(id)!.x},${points.get(id)!.y}`).join(' '));
  }
  return rooms;
}
