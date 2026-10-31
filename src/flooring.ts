export const flooringTypes = ['none', 'light-oak', 'walnut', 'porcelain', 'terracotta', 'marble-60x120', 'concrete-60x120', 'terrazzo-60x120'] as const;
export type FlooringType = typeof flooringTypes[number];
export const flooringInfo: Record<FlooringType, { label: string; category: string; swatch: string }> = {
  none: { label: 'No floor', category: 'Plain', swatch: 'linear-gradient(135deg,#fafbf8,#f0f4ef)' },
  'light-oak': { label: 'Light oak', category: 'Wood', swatch: 'repeating-linear-gradient(90deg,#d8bc94 0 18px,#bfa27e 19px,#e1cba9 20px 38px,#bfa27e 39px)' },
  walnut: { label: 'Walnut', category: 'Wood', swatch: 'repeating-linear-gradient(90deg,#9b7656 0 18px,#74553f 19px,#ad8764 20px 38px,#74553f 39px)' },
  porcelain: { label: 'Porcelain tile', category: 'Tile', swatch: 'linear-gradient(90deg,#ddd 1px,transparent 1px),linear-gradient(#ddd 1px,transparent 1px),#f0eee8' },
  terracotta: { label: 'Terracotta tile', category: 'Tile', swatch: 'linear-gradient(90deg,#b57355 1px,transparent 1px),linear-gradient(#b57355 1px,transparent 1px),#cd8d6d' },
  'marble-60x120': { label: 'Marble effect', category: 'Tile · 60 × 120 cm', swatch: 'linear-gradient(112deg,transparent 35%,#c6ccd0 37%,transparent 40%),linear-gradient(20deg,transparent 54%,#d2d7da 56%,transparent 59%),linear-gradient(90deg,#d5d9d9 1px,transparent 1px),linear-gradient(#d5d9d9 1px,transparent 1px),#f4f5f3' },
  'concrete-60x120': { label: 'Light grey concrete', category: 'Tile · 60 × 120 cm', swatch: 'radial-gradient(circle at 25% 35%,#c7cbca 0 1px,transparent 2px),linear-gradient(90deg,#bfc5c5 1px,transparent 1px),linear-gradient(#bfc5c5 1px,transparent 1px),#daddda' },
  'terrazzo-60x120': { label: 'White terrazzo', category: 'Tile · 60 × 120 cm', swatch: 'radial-gradient(circle at 25% 35%,#aeb7b0 0 2px,transparent 3px),radial-gradient(circle at 75% 70%,#c8b9aa 0 2px,transparent 3px),linear-gradient(90deg,#d5d7d1 1px,transparent 1px),linear-gradient(#d5d7d1 1px,transparent 1px),#f5f4ef' }
};

export const flooringDefs = `
<pattern id="floor-light-oak" width="76" height="32" patternUnits="userSpaceOnUse"><rect width="76" height="32" fill="#dfc9a7"/><path d="M0 0H76M0 16H76M25 0V16M58 16V32" stroke="#b89a72" stroke-width="2"/><path d="M4 7H21M31 23H53M48 7H70" stroke="#c2a47d" stroke-width="1"/></pattern>
<pattern id="floor-walnut" width="76" height="32" patternUnits="userSpaceOnUse"><rect width="76" height="32" fill="#a58160"/><path d="M0 0H76M0 16H76M25 0V16M58 16V32" stroke="#75543d" stroke-width="2"/><path d="M4 7H21M31 23H53M48 7H70" stroke="#886548" stroke-width="1"/></pattern>
<pattern id="floor-porcelain" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f0eee8"/><path d="M0 0H60M0 0V60" stroke="#d0d2cc" stroke-width="3"/><path d="M10 17L22 12M40 38L49 34" stroke="#e1e0da" stroke-width="1"/></pattern>
<pattern id="floor-terracotta" width="58" height="58" patternUnits="userSpaceOnUse"><rect width="58" height="58" fill="#ce906e"/><path d="M0 0H58M0 0V58" stroke="#aa6c50" stroke-width="3"/><path d="M8 8L25 13M31 42L45 37" stroke="#dcaa89" stroke-width="1"/></pattern>
<pattern id="floor-marble-60x120" width="240" height="120" patternUnits="userSpaceOnUse"><rect width="240" height="120" fill="#f3f4f2"/><path d="M0 0H240M0 60H240M0 0V60M120 0V60M60 60V120M180 60V120" fill="none" stroke="#d4d8d8" stroke-width="2"/><path d="M10 45Q35 40 52 20T103 8M126 47Q148 39 158 26T222 9M72 111Q97 104 109 84T174 69M190 116Q210 101 231 83" fill="none" stroke="#c9ced0" stroke-width="1.8" opacity=".75"/><path d="M4 52Q30 45 44 29M140 53Q166 35 193 31M84 117Q115 94 139 91" fill="none" stroke="#e2e4e3" stroke-width="2"/></pattern>
<pattern id="floor-concrete-60x120" width="240" height="120" patternUnits="userSpaceOnUse"><rect width="240" height="120" fill="#daddda"/><path d="M0 0H240M0 60H240M0 0V60M120 0V60M60 60V120M180 60V120" fill="none" stroke="#bdc4c3" stroke-width="2"/><path d="M8 16H37M85 41H113M138 20H178M193 49H221M30 87H58M98 108H138M174 82H209" stroke="#c7ccca" stroke-width="3" opacity=".6"/><circle cx="42" cy="28" r="2" fill="#c0c6c4"/><circle cx="185" cy="23" r="1.5" fill="#c0c6c4"/><circle cx="105" cy="83" r="2" fill="#c0c6c4"/><circle cx="220" cy="99" r="1.5" fill="#c0c6c4"/></pattern>
<pattern id="floor-terrazzo-60x120" width="240" height="120" patternUnits="userSpaceOnUse"><rect width="240" height="120" fill="#f5f4ef"/><path d="M0 0H240M0 60H240M0 0V60M120 0V60M60 60V120M180 60V120" fill="none" stroke="#d6d8d2" stroke-width="2"/><path d="M22 19l6-3 3 5-5 4zM68 42l7-2 3 5-6 3zM142 18l5-3 4 4-4 5zM204 43l6-2 2 5-5 3zM34 94l6-3 3 5-5 4zM91 79l5-3 4 5-5 3zM159 98l6-2 3 5-6 3zM217 78l5-3 4 5-4 3z" fill="#b9c1b8"/><path d="M47 35l5-2 2 4-4 3zM106 15l6-2 2 4-5 4zM177 35l5-3 4 5-5 3zM18 73l5-3 3 5-5 3zM124 100l6-2 2 5-6 2zM197 105l6-3 3 5-6 3z" fill="#d2c3b4"/></pattern>`;

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
