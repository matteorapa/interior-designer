<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Armchair, ArrowUpRight, Bath, BedDouble, BookOpen, Check, ChevronDown, CircleHelp, Coffee, CookingPot,
    Download, DoorClosed, Flower2, Grid2X2, LampFloor, Laptop, Magnet, Maximize, MousePointer2, Pencil,
    Plus, Redo2, Ruler, Settings2, Sofa, Trash2, Undo2, Upload, UtensilsCrossed, X, ZoomIn, ZoomOut
  } from '@lucide/svelte';
  import { defaultColors, furnitureColors, furnitureInfo, furnitureMarkup, furniturePatterns, furnitureTypes, type Furniture, type FurniturePattern, type FurnitureType } from './furniture';
  import { closedRoomPolygons, flooringDefs, flooringInfo, flooringTypes, type FlooringType } from './flooring';

  type Vertex = { id: string; x: number; y: number };
  type Wall = { id: string; from: string; to: string; thickness: number };
  type Plan = { name: string; vertices: Vertex[]; walls: Wall[]; furniture: Furniture[]; flooring: FlooringType };
  type DrawStart = { x: number; y: number; vertexId?: string };

  const initialPlan: Plan = {
    name: 'Hillside Residence', flooring: 'light-oak',
    vertices: [
      { id: 'v1', x: 176, y: 160 }, { id: 'v2', x: 600, y: 160 },
      { id: 'v3', x: 720, y: 280 }, { id: 'v4', x: 720, y: 562 },
      { id: 'v5', x: 487, y: 562 }, { id: 'v6', x: 412, y: 486 },
      { id: 'v7', x: 176, y: 486 }
    ],
    walls: [
      { id: 'w1', from: 'v1', to: 'v2', thickness: 16 },
      { id: 'w2', from: 'v2', to: 'v3', thickness: 16 },
      { id: 'w3', from: 'v3', to: 'v4', thickness: 16 },
      { id: 'w4', from: 'v4', to: 'v5', thickness: 16 },
      { id: 'w5', from: 'v5', to: 'v6', thickness: 16 },
      { id: 'w6', from: 'v6', to: 'v7', thickness: 16 },
      { id: 'w7', from: 'v7', to: 'v1', thickness: 16 }
    ],
    furniture: [
      { id: 'f1', type: 'sofa', x: 305, y: 265, rotation: 0, scale: 0.85 },
      { id: 'f2', type: 'dining', x: 570, y: 380, rotation: 0, scale: 0.8 },
      { id: 'f3', type: 'island', x: 365, y: 405, rotation: 0, scale: 0.8 }
    ]
  };

  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const furnitureIcons = { sofa: Sofa, dining: UtensilsCrossed, island: CookingPot, bed: BedDouble, armchair: Armchair, plant: Flower2, 'coffee-table': Coffee, desk: Laptop, bookshelf: BookOpen, wardrobe: DoorClosed, bathtub: Bath, 'floor-lamp': LampFloor };
  let plan = $state<Plan>(clone(initialPlan));
  let tool = $state<'select' | 'wall' | 'furniture'>('select');
  let selectedWallId = $state<string | null>(null);
  let selectedFurnitureId = $state<string | null>(null);
  let placementType = $state<FurnitureType>('sofa');
  let paletteDrag = $state<{ type: FurnitureType; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  let showFurnitureDrawer = $state(false);
  let showSettings = $state(false);
  let drawStart = $state<DrawStart | null>(null);
  let cursor = $state<{ x: number; y: number } | null>(null);
  let dragging: { id: string; before: Plan; moved: boolean } | null = null;
  let draggingFurniture: { id: string; before: Plan; moved: boolean } | null = null;
  let suppressCanvasClick = false;
  let history = $state<Plan[]>([]);
  let future = $state<Plan[]>([]);
  let showGrid = $state(true);
  let snapGrid = $state(true);
  let showDimensions = $state(true);
  let zoom = $state(1);
  let pan = $state({ x: 0, y: 0 });
  let panning: { startX: number; startY: number; x: number; y: number; moved: boolean } | null = null;
  let spaceHeld = false;
  let hydrated = $state(false);
  let showHelp = $state(false);
  let showExport = $state(false);
  let fileInput: HTMLInputElement;
  let svg: SVGSVGElement;

  let selectedWall = $derived(plan.walls.find((wall) => wall.id === selectedWallId));
  let selectedFurniture = $derived(plan.furniture.find((item) => item.id === selectedFurnitureId));
  let floorPolygons = $derived(closedRoomPolygons(plan.vertices, plan.walls));
  let totalLength = $derived(plan.walls.reduce((sum, wall) => {
    const a = vertex(wall.from), b = vertex(wall.to);
    return sum + (a && b ? distance(a, b) : 0);
  }, 0));

  function vertex(id: string) { return plan.vertices.find((point) => point.id === id); }
  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  function length(wall: Wall) {
    const a = vertex(wall.from), b = vertex(wall.to);
    return a && b ? distance(a, b) : 0;
  }
  function angle(wall: Wall) {
    const a = vertex(wall.from), b = vertex(wall.to);
    if (!a || !b) return 0;
    const degrees = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return Math.round((degrees + 360) % 180);
  }
  function meters(value: number) { return `${(value / 100).toFixed(2)} m`; }
  function remember() {
    history = [...history.slice(-49), clone(plan)];
    future = [];
  }
  function undo() {
    if (!history.length) return;
    future = [clone(plan), ...future];
    plan = history.at(-1)!;
    history = history.slice(0, -1);
    selectedWallId = null;
    selectedFurnitureId = null;
    drawStart = null;
  }
  function redo() {
    if (!future.length) return;
    history = [...history, clone(plan)];
    plan = future[0];
    future = future.slice(1);
    selectedWallId = null;
    selectedFurnitureId = null;
    drawStart = null;
  }
  function setTool(next: 'select' | 'wall') {
    tool = next;
    drawStart = null;
    selectedWallId = null;
    selectedFurnitureId = null;
    showFurnitureDrawer = false;
    showSettings = false;
  }
  function chooseFurniture(type: FurnitureType) {
    tool = 'furniture';
    placementType = type;
    drawStart = null;
    selectedWallId = null;
    selectedFurnitureId = null;
    showFurnitureDrawer = false;
    showSettings = false;
  }
  function addFurniture(type: FurnitureType, position: { x: number; y: number }) {
    remember();
    const info = furnitureInfo[type];
    const item: Furniture = {
      id: uid(), type,
      x: Math.round(Math.max(info.width / 2, Math.min(1000 - info.width / 2, position.x))),
      y: Math.round(Math.max(info.height / 2, Math.min(720 - info.height / 2, position.y))),
      rotation: 0, scale: 1, color: defaultColors[type], pattern: 'solid'
    };
    plan.furniture.push(item);
    selectedFurnitureId = item.id;
    selectedWallId = null;
    tool = 'select';
    showFurnitureDrawer = false;
  }
  function palettePointerDown(event: PointerEvent, type: FurnitureType) {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    paletteDrag = { type, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false };
  }
  function palettePointerMove(event: PointerEvent) {
    if (!paletteDrag) return;
    paletteDrag.x = event.clientX;
    paletteDrag.y = event.clientY;
    if (Math.hypot(event.clientX - paletteDrag.startX, event.clientY - paletteDrag.startY) > 6) paletteDrag.moved = true;
  }
  function palettePointerUp(event: PointerEvent) {
    if (!paletteDrag) return;
    const { type, moved } = paletteDrag;
    paletteDrag = null;
    if (!moved) { chooseFurniture(type); return; }
    const bounds = svg.getBoundingClientRect();
    if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
      addFurniture(type, screenPoint(event));
    }
  }
  function screenPoint(event: PointerEvent | MouseEvent) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const result = point.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: result.x, y: result.y };
  }
  function nearestVertex(point: { x: number; y: number }) {
    return plan.vertices.find((item) => distance(item, point) < 15 / zoom);
  }
  function constrain(point: { x: number; y: number }, shift: boolean) {
    const nearby = nearestVertex(point);
    if (nearby) return { x: nearby.x, y: nearby.y, vertexId: nearby.id };
    let x = snapGrid ? Math.round(point.x / 10) * 10 : Math.round(point.x);
    let y = snapGrid ? Math.round(point.y / 10) * 10 : Math.round(point.y);
    if (shift && drawStart) {
      const radius = Math.hypot(x - drawStart.x, y - drawStart.y);
      const radians = Math.round(Math.atan2(y - drawStart.y, x - drawStart.x) / (Math.PI / 12)) * Math.PI / 12;
      x = Math.round(drawStart.x + Math.cos(radians) * radius);
      y = Math.round(drawStart.y + Math.sin(radians) * radius);
    }
    return { x, y };
  }
  function canvasClick(event: MouseEvent) {
    if (suppressCanvasClick) { suppressCanvasClick = false; return; }
    showFurnitureDrawer = false;
    showSettings = false;
    if (tool === 'select') { selectedWallId = null; selectedFurnitureId = null; return; }
    if (tool === 'furniture') { addFurniture(placementType, screenPoint(event)); return; }
    const point = constrain(screenPoint(event), event.shiftKey);
    if (!drawStart) { drawStart = point; return; }
    if (distance(drawStart, point) < 8) { drawStart = null; return; }
    remember();
    const startId = drawStart.vertexId ?? uid();
    const endId = point.vertexId ?? uid();
    if (!drawStart.vertexId) plan.vertices.push({ id: startId, x: drawStart.x, y: drawStart.y });
    if (!point.vertexId) plan.vertices.push({ id: endId, x: point.x, y: point.y });
    const wall = { id: uid(), from: startId, to: endId, thickness: 16 };
    plan.walls.push(wall);
    selectedWallId = wall.id;
    drawStart = point.vertexId ? null : { x: point.x, y: point.y, vertexId: endId };
  }
  function startPan(event: PointerEvent) {
    const target = event.target as Element;
    const background = target === svg || !!target.closest('[data-pan-surface]');
    if (event.button !== 1 && !(event.button === 0 && (spaceHeld || (tool === 'select' && background)))) return;
    event.preventDefault();
    panning = { startX: event.clientX, startY: event.clientY, x: pan.x, y: pan.y, moved: false };
    svg.setPointerCapture(event.pointerId);
  }
  function canvasMove(event: PointerEvent) {
    if (panning) {
      const scale = svg.getScreenCTM()?.a || 1;
      pan = { x: panning.x + (event.clientX - panning.startX) / scale, y: panning.y + (event.clientY - panning.startY) / scale };
      if (Math.hypot(event.clientX - panning.startX, event.clientY - panning.startY) > 3) panning.moved = true;
      return;
    }
    if (dragging) {
      const point = screenPoint(event);
      const target = vertex(dragging.id);
      if (target) {
        const x = snapGrid ? Math.round(point.x / 10) * 10 : Math.round(point.x);
        const y = snapGrid ? Math.round(point.y / 10) * 10 : Math.round(point.y);
        if (target.x !== x || target.y !== y) {
          target.x = x;
          target.y = y;
          dragging.moved = true;
        }
      }
      return;
    }
    if (draggingFurniture) {
      const point = screenPoint(event);
      const target = plan.furniture.find((item) => item.id === draggingFurniture!.id);
      if (target) {
        const x = snapGrid ? Math.round(point.x / 10) * 10 : Math.round(point.x);
        const y = snapGrid ? Math.round(point.y / 10) * 10 : Math.round(point.y);
        if (target.x !== x || target.y !== y) {
          target.x = x;
          target.y = y;
          draggingFurniture.moved = true;
        }
      }
      return;
    }
    if (tool === 'wall') cursor = constrain(screenPoint(event), event.shiftKey);
    else if (tool === 'furniture') cursor = screenPoint(event);
  }
  function startDrag(event: PointerEvent, id: string) {
    if (tool !== 'select') return;
    event.stopPropagation();
    svg.setPointerCapture(event.pointerId);
    dragging = { id, before: clone(plan), moved: false };
  }
  function startFurnitureDrag(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    selectedFurnitureId = id;
    selectedWallId = null;
    tool = 'select';
    suppressCanvasClick = true;
    svg.setPointerCapture(event.pointerId);
    draggingFurniture = { id, before: clone(plan), moved: false };
  }
  function stopDrag(event: PointerEvent) {
    if (panning?.moved) suppressCanvasClick = true;
    if (dragging?.moved || draggingFurniture?.moved) {
      history = [...history.slice(-49), (dragging ?? draggingFurniture)!.before];
      future = [];
    }
    dragging = null;
    draggingFurniture = null;
    panning = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { suppressCanvasClick = false; }, 0);
  }
  function nudgeVertex(event: KeyboardEvent, id: string) {
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    event.stopPropagation();
    const target = vertex(id);
    if (!target) return;
    remember();
    target.x += offset[0] * (event.shiftKey ? 10 : 1);
    target.y += offset[1] * (event.shiftKey ? 10 : 1);
  }
  function nudgeFurniture(event: KeyboardEvent, id: string) {
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
    };
    if (event.key === 'Enter') { selectedFurnitureId = id; selectedWallId = null; return; }
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    event.stopPropagation();
    const target = plan.furniture.find((item) => item.id === id);
    if (!target) return;
    remember();
    target.x += offset[0] * (event.shiftKey ? 10 : 1);
    target.y += offset[1] * (event.shiftKey ? 10 : 1);
  }
  function deleteSelected() {
    if (selectedFurnitureId) {
      remember();
      plan.furniture = plan.furniture.filter((item) => item.id !== selectedFurnitureId);
      selectedFurnitureId = null;
      return;
    }
    if (!selectedWallId) return;
    remember();
    plan.walls = plan.walls.filter((wall) => wall.id !== selectedWallId);
    const used = new Set(plan.walls.flatMap((wall) => [wall.from, wall.to]));
    plan.vertices = plan.vertices.filter((point) => used.has(point.id));
    selectedWallId = null;
  }
  function setThickness(event: Event) {
    if (!selectedWall) return;
    remember();
    selectedWall.thickness = Number((event.target as HTMLInputElement).value);
  }
  function setFurnitureProperty(property: 'rotation' | 'scale', event: Event) {
    if (!selectedFurniture) return;
    const value = Number((event.target as HTMLInputElement).value);
    if (selectedFurniture[property] === value) return;
    remember();
    selectedFurniture[property] = value;
  }
  function setFurnitureColor(color: string) {
    if (!selectedFurniture || !/^#[0-9a-f]{6}$/i.test(color) || selectedFurniture.color === color) return;
    remember();
    selectedFurniture.color = color;
  }
  function setFurniturePattern(pattern: FurniturePattern) {
    if (!selectedFurniture || selectedFurniture.pattern === pattern) return;
    remember();
    selectedFurniture.pattern = pattern;
  }
  function setFlooring(flooring: FlooringType) {
    if (plan.flooring === flooring) return;
    remember();
    plan.flooring = flooring;
  }
  function newPlan() {
    if (!window.confirm('Create a new blank plan? Your current plan will be replaced.')) return;
    remember();
    plan = { name: 'Untitled floor plan', vertices: [], walls: [], furniture: [], flooring: 'none' };
    selectedWallId = null;
    selectedFurnitureId = null;
    drawStart = null;
    tool = 'wall';
  }
  function download(content: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showExport = false;
  }
  function filename(ext: string) {
    return `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'floor-plan'}.${ext}`;
  }
  function exportSvg() {
    const floors = plan.flooring === 'none' ? '' : closedRoomPolygons(plan.vertices, plan.walls).map((points) => `<polygon points="${points}" fill="url(#floor-${plan.flooring})"/>`).join('');
    const lines = plan.walls.map((wall) => {
      const a = vertex(wall.from), b = vertex(wall.to);
      return a && b ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#233c38" stroke-width="${wall.thickness}" stroke-linecap="round"/>` : '';
    }).join('');
    const furnishings = plan.furniture.map((item) => `<g transform="translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})">${furnitureMarkup(item.type, item.color, item.pattern, item.id)}</g>`).join('');
    const image = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="864" viewBox="0 0 1000 720"><defs>${flooringDefs}</defs><rect width="1000" height="720" fill="#fffefb"/>${floors}${lines}${furnishings}</svg>`;
    download(image, filename('svg'), 'image/svg+xml');
  }
  function exportJson() { download(JSON.stringify(plan, null, 2), filename('json'), 'application/json'); }
  async function importJson(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (typeof value.name !== 'string' || !Array.isArray(value.vertices) || !Array.isArray(value.walls) ||
        !value.vertices.every((point: Vertex) => typeof point.id === 'string' && Number.isFinite(point.x) && Number.isFinite(point.y)) ||
        !value.walls.every((wall: Wall) => typeof wall.id === 'string' && typeof wall.from === 'string' && typeof wall.to === 'string' && Number.isFinite(wall.thickness)) ||
        !value.walls.every((wall: Wall) => value.vertices.some((point: Vertex) => point.id === wall.from) && value.vertices.some((point: Vertex) => point.id === wall.to)) ||
        (value.flooring !== undefined && !flooringTypes.includes(value.flooring)) ||
        (value.furniture !== undefined && (!Array.isArray(value.furniture) || !value.furniture.every((item: Furniture) =>
          typeof item.id === 'string' && furnitureTypes.includes(item.type) && Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.rotation) && Number.isFinite(item.scale) && item.scale > 0 &&
          (item.color === undefined || /^#[0-9a-f]{6}$/i.test(item.color)) && (item.pattern === undefined || furniturePatterns.includes(item.pattern)))))) {
        throw new Error('Invalid plan');
      }
      remember();
      plan = { ...value, furniture: value.furniture ?? [], flooring: value.flooring ?? 'none' };
      selectedWallId = null;
      selectedFurnitureId = null;
      drawStart = null;
    } catch { window.alert('This file is not a valid Forma floor plan.'); }
    (event.target as HTMLInputElement).value = '';
  }
  function keydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); spaceHeld = true; return; }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
      return;
    }
    if (event.key === 'Escape') { drawStart = null; selectedWallId = null; selectedFurnitureId = null; showHelp = false; showExport = false; showFurnitureDrawer = false; showSettings = false; tool = 'select'; }
    if (event.key.toLowerCase() === 'v') setTool('select');
    if (event.key.toLowerCase() === 'w') setTool('wall');
    if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected();
  }
  function keyup(event: KeyboardEvent) { if (event.code === 'Space') spaceHeld = false; }
  onMount(() => {
    try {
      const saved = localStorage.getItem('forma-plan-v1');
      if (saved) {
        const value = JSON.parse(saved);
        if (value && Array.isArray(value.vertices) && Array.isArray(value.walls)) plan = { ...value, furniture: Array.isArray(value.furniture) ? value.furniture : [], flooring: flooringTypes.includes(value.flooring) ? value.flooring : 'none' };
      }
    } catch { /* Ignore invalid local data. */ }
    hydrated = true;
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('pointermove', palettePointerMove);
    window.addEventListener('pointerup', palettePointerUp);
    window.addEventListener('pointercancel', palettePointerUp);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('pointermove', palettePointerMove);
      window.removeEventListener('pointerup', palettePointerUp);
      window.removeEventListener('pointercancel', palettePointerUp);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  });
  $effect(() => { if (hydrated) localStorage.setItem('forma-plan-v1', JSON.stringify(plan)); });
</script>

<svelte:head>
  <title>{plan.name} · Forma</title>
</svelte:head>

<div class="app-shell">
  <main class="main-content">
    <header class="topbar">
      <div class="top-actions"><div class="saved-status"><span class="saved-dot"></span> Saved locally</div><span class="top-divider"></span><button class="text-button" type="button" onclick={newPlan}><Plus size={17} /> New plan</button><button class="primary-button" type="button" onclick={() => showExport = !showExport}><Download size={17} /> Export <ChevronDown size={14} /></button>
      {#if showExport}<div class="export-menu"><button type="button" onclick={exportSvg}>Export as SVG <span>Vector drawing</span></button><button type="button" onclick={exportJson}>Export as JSON <span>Editable plan</span></button></div>{/if}</div>
    </header>

    <div class="workspace">
      <div class="workspace-toolbar"><div class="canvas-heading"><span class="live-indicator"></span><span>PLAN EDITOR</span><span class="heading-divider"></span><span class="muted">1 unit = 1 cm</span></div><div class="toolbar-actions"><button title="Undo (⌘Z)" aria-label="Undo" disabled={!history.length} onclick={undo}><Undo2 size={17} /></button><button title="Redo (⌘⇧Z)" aria-label="Redo" disabled={!future.length} onclick={redo}><Redo2 size={17} /></button><span class="toolbar-divider"></span><button title="Import JSON" aria-label="Import plan" onclick={() => fileInput.click()}><Upload size={17} /></button><input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={importJson} /></div></div>

      <div class="canvas-wrap" class:drawing={tool === 'wall'}>
        <svg bind:this={svg} class="plan-canvas" viewBox={`${500 - 500 / zoom - pan.x} ${360 - 360 / zoom - pan.y} ${1000 / zoom} ${720 / zoom}`} role="button" tabindex="0" aria-label="Interactive floor plan canvas" onclick={canvasClick} onpointerdown={startPan} onkeydown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Escape') drawStart = null; if (event.key === 'Enter' && tool === 'wall') { const bounds = svg.getBoundingClientRect(); canvasClick(new MouseEvent('click', { clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2 })); } }} onpointermove={canvasMove} onpointerup={stopDrag} onpointercancel={stopDrag} onpointerleave={() => cursor = null}>
          <defs><pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8ece8" stroke-width="1" /></pattern><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#smallGrid)"/><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d6ded8" stroke-width="1.2" /></pattern>{@html flooringDefs}</defs>
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="#fcfdfb" data-pan-surface="" />
          {#if plan.flooring !== 'none'}{#each floorPolygons as points}<polygon {points} fill={`url(#floor-${plan.flooring})`} data-pan-surface="" />{/each}{/if}
          {#if showGrid}<rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" opacity="0.65" pointer-events="none" />{/if}
          {#if plan.walls.length === 7 && plan.furniture.length === 0 && plan.name === 'Hillside Residence'}<text x="442" y="345" class="room-name" text-anchor="middle">LIVING SPACE</text><text x="442" y="369" class="room-subtitle" text-anchor="middle">Open floor plan</text>{/if}
          {#each plan.walls as wall (wall.id)}
            {@const a = vertex(wall.from)}{@const b = vertex(wall.to)}
            {#if a && b}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d8e2dc" stroke-width={wall.thickness + 8} stroke-linecap="round" class="wall-halo" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={selectedWallId === wall.id ? '#226b58' : '#293f3b'} stroke-width={wall.thickness} stroke-linecap="round" class="wall-line" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" stroke-width="32" class="wall-hit" role="button" tabindex="0" aria-label={`Select wall ${plan.walls.indexOf(wall) + 1}`} onclick={(event) => { event.stopPropagation(); if (tool !== 'select') canvasClick(event); else { selectedWallId = wall.id; selectedFurnitureId = null; } }} onkeydown={(event) => { if (event.key === 'Enter') { selectedWallId = wall.id; selectedFurnitureId = null; } }} />
              {#if showDimensions && distance(a, b) > 0}<g transform={`translate(${(a.x + b.x) / 2 + (b.y - a.y) / distance(a, b) * 27}, ${(a.y + b.y) / 2 - (b.x - a.x) / distance(a, b) * 27})`}><rect x="-29" y="-11" width="58" height="22" rx="6" class="dimension-bg"/><text y="4" text-anchor="middle" class="dimension-text">{meters(length(wall))}</text></g>{/if}
            {/if}
          {/each}
          {#each plan.furniture as item (item.id)}
            {@const info = furnitureInfo[item.type]}
            <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})`} class="furniture-item" role="button" tabindex="0" aria-label={`${info.label}, drag to move`} onpointerdown={(event) => startFurnitureDrag(event, item.id)} onclick={(event) => { event.stopPropagation(); selectedFurnitureId = item.id; selectedWallId = null; }} onkeydown={(event) => nudgeFurniture(event, item.id)}>
              {#if selectedFurnitureId === item.id}<rect x={-info.width / 2 - 8} y={-info.height / 2 - 8} width={info.width + 16} height={info.height + 16} rx="12" fill="none" stroke="#238060" stroke-width="2" stroke-dasharray="7 5" />{/if}
              {@html furnitureMarkup(item.type, item.color, item.pattern, item.id)}
            </g>
          {/each}
          {#if tool === 'select'}
            {#each plan.vertices as point (point.id)}<circle cx={point.x} cy={point.y} r="9" class="vertex-halo" /><circle cx={point.x} cy={point.y} r="5" class="vertex-point" role="button" tabindex="0" aria-label="Move wall corner with arrow keys" onpointerdown={(event) => startDrag(event, point.id)} onclick={(event) => event.stopPropagation()} onkeydown={(event) => nudgeVertex(event, point.id)} />{/each}
          {/if}
          {#if tool === 'wall' && drawStart && cursor}<line x1={drawStart.x} y1={drawStart.y} x2={cursor.x} y2={cursor.y} stroke="#228367" stroke-width="3" stroke-dasharray="8 7" pointer-events="none" /><circle cx={drawStart.x} cy={drawStart.y} r="7" fill="#228367" pointer-events="none" /><circle cx={cursor.x} cy={cursor.y} r="5" fill="white" stroke="#228367" stroke-width="2" pointer-events="none" />{/if}
          {#if tool === 'furniture' && cursor}<g transform={`translate(${cursor.x} ${cursor.y})`} opacity="0.58" pointer-events="none">{@html furnitureMarkup(placementType)}</g>{/if}
        </svg>
        {#if showFurnitureDrawer}
          <div class="floating-popover furniture-popover">
            <div class="popover-heading"><div><strong>Add furniture</strong><span>Drag onto the plan or click to place</span></div><button type="button" aria-label="Close furniture picker" onclick={() => showFurnitureDrawer = false}><X size={16}/></button></div>
            <div class="furniture-choices">
              {#each furnitureTypes as type}
                {@const Icon = furnitureIcons[type]}
                <button class:chosen={tool === 'furniture' && placementType === type} type="button" onpointerdown={(event) => palettePointerDown(event, type)} onclick={(event) => { if (event.detail === 0) chooseFurniture(type); }}><span class="choice-icon"><Icon size={21} strokeWidth={1.6}/></span><span>{furnitureInfo[type].label}</span></button>
              {/each}
            </div>
          </div>
        {/if}
        {#if showSettings}
          <div class="floating-popover settings-popover">
            <div class="popover-heading"><div><strong>View settings</strong><span>Customize the plan canvas</span></div><button type="button" aria-label="Close view settings" onclick={() => showSettings = false}><X size={16}/></button></div>
            <button class="settings-row" type="button" aria-pressed={showGrid} onclick={() => showGrid = !showGrid}><Grid2X2 size={17} /><span>Show grid</span><span class:checked={showGrid} class="toggle"><i></i></span></button>
            <button class="settings-row" type="button" aria-pressed={snapGrid} onclick={() => snapGrid = !snapGrid}><Magnet size={17} /><span>Snap to grid</span><span class:checked={snapGrid} class="toggle"><i></i></span></button>
            <button class="settings-row" type="button" aria-pressed={showDimensions} onclick={() => showDimensions = !showDimensions}><Ruler size={17} /><span>Show dimensions</span><span class:checked={showDimensions} class="toggle"><i></i></span></button>
            <div class="setting-group-label">FLOORING</div>
            <div class="floor-choices">{#each flooringTypes as floor}<button type="button" class:chosen={plan.flooring === floor} aria-pressed={plan.flooring === floor} onclick={() => setFlooring(floor)}><span class="floor-swatch" style:background={flooringInfo[floor].swatch}></span><span><strong>{flooringInfo[floor].label}</strong><small>{flooringInfo[floor].category}</small></span></button>{/each}</div>
            <div class="popover-foot"><button type="button" onclick={() => { showSettings = false; showHelp = true; }}><CircleHelp size={16} /> How to use Forma</button><span>Hold Shift for 15° angles</span></div>
          </div>
        {/if}
        <div class="editor-pill" role="toolbar" aria-label="Floor plan tools">
          <button class:active={tool === 'select'} type="button" title="Select (V)" aria-label="Select and edit" aria-pressed={tool === 'select'} onclick={() => setTool('select')}><MousePointer2 size={17} /><span>Select</span></button>
          <button class:active={tool === 'wall'} type="button" title="Draw wall (W)" aria-label="Draw walls" aria-pressed={tool === 'wall'} onclick={() => setTool('wall')}><Pencil size={17} /><span>Draw wall</span></button>
          <button class:active={tool === 'furniture' || showFurnitureDrawer} type="button" title="Add furniture" aria-label="Add furniture" aria-expanded={showFurnitureDrawer} onclick={() => { showFurnitureDrawer = !showFurnitureDrawer; showSettings = false; }}><Sofa size={17} /><span>Furniture</span></button>
          <span class="pill-divider"></span>
          <button class:active={showSettings} class="settings-trigger" type="button" title="View settings" aria-label="View settings" aria-expanded={showSettings} onclick={() => { showSettings = !showSettings; showFurnitureDrawer = false; }}><Settings2 size={18} /></button>
        </div>
        {#if !plan.walls.length && !plan.furniture.length}<div class="empty-state"><span class="empty-icon"><Pencil size={24} /></span><h2>Start with a wall</h2><p>Click anywhere on the canvas to place the first point, then click again to draw a wall.</p><button type="button" onclick={() => setTool('wall')}>Draw a wall <ArrowUpRight size={16} /></button></div>{/if}
        <div class="canvas-bottom-left"><span class="scale-mark"></span> 1 m <span class="bottom-separator"></span> {plan.walls.length} walls · {plan.furniture.length} items</div>
        <div class="zoom-controls"><button aria-label="Zoom out" title="Zoom out" onclick={() => zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10)}><ZoomOut size={17} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" title="Zoom in" onclick={() => zoom = Math.min(2.5, Math.round((zoom + 0.1) * 10) / 10)}><ZoomIn size={17} /></button><button aria-label="Reset view" title="Reset view" onclick={() => { zoom = 1; pan = { x: 0, y: 0 }; }}><Maximize size={16} /></button></div>
      </div>

      <div class="status-bar"><div><span class="status-pulse"></span>{tool === 'wall' ? (drawStart ? 'Click to place the next point · Esc to stop' : 'Click to start drawing a wall') : tool === 'furniture' ? `Click to place ${furnitureInfo[placementType].label.toLowerCase()}` : 'Drag empty canvas to pan · Select objects to edit'}</div><div>Space + drag to pan anytime <span>•</span> Autosaved in this browser</div></div>
    </div>
  </main>

  <aside class="inspector"><div class="inspector-heading"><div><span class="eyebrow">PROPERTIES</span><h2>{selectedFurniture ? 'Furniture details' : selectedWall ? 'Wall details' : 'Plan overview'}</h2></div><span class="inspector-icon">{#if selectedFurniture}<Sofa size={19} />{:else}<Ruler size={19} />{/if}</span></div>
    {#if selectedFurniture}
      {@const Icon = furnitureIcons[selectedFurniture.type]}
      <div class="inspector-section"><div class="inspector-label">SELECTED FURNITURE <span class="selection-tag">ACTIVE</span></div><div class="wall-preview"><span class="furniture-preview-icon"><Icon size={17}/></span><strong>{furnitureInfo[selectedFurniture.type].label}</strong><small>{selectedFurniture.id.slice(0, 6).toUpperCase()}</small></div></div>
      <div class="inspector-section"><div class="inspector-label">PLACEMENT</div><div class="property-row"><span>Position</span><strong>{meters(selectedFurniture.x)}, {meters(selectedFurniture.y)}</strong></div><div class="property-row"><span>Rotation</span><strong>{selectedFurniture.rotation}°</strong></div><label class="range-label" for="furniture-rotation">Rotate</label><input id="furniture-rotation" type="range" min="0" max="345" step="15" value={selectedFurniture.rotation} onchange={(event) => setFurnitureProperty('rotation', event)} /><div class="range-limits"><span>0°</span><span>345°</span></div><div class="property-row furniture-size-row"><span>Size</span><strong>{Math.round(selectedFurniture.scale * 100)}%</strong></div><label class="range-label" for="furniture-scale">Resize</label><input id="furniture-scale" type="range" min="0.5" max="1.5" step="0.05" value={selectedFurniture.scale} onchange={(event) => setFurnitureProperty('scale', event)} /><div class="range-limits"><span>50%</span><span>150%</span></div></div>
      <div class="inspector-section finish-section"><div class="inspector-label">COLOUR &amp; PATTERN</div><div class="finish-color-row">{#each furnitureColors as color}<button type="button" class:chosen={(selectedFurniture.color ?? defaultColors[selectedFurniture.type]) === color} aria-label={`Choose ${color} colour`} aria-pressed={(selectedFurniture.color ?? defaultColors[selectedFurniture.type]) === color} style:background={color} onclick={() => setFurnitureColor(color)}></button>{/each}</div><label class="custom-color" for="furniture-color">Custom colour <input id="furniture-color" type="color" value={selectedFurniture.color ?? defaultColors[selectedFurniture.type]} onchange={(event) => setFurnitureColor(event.currentTarget.value)} /></label><div class="pattern-choices">{#each furniturePatterns as pattern}<button type="button" class:chosen={(selectedFurniture.pattern ?? 'solid') === pattern} aria-pressed={(selectedFurniture.pattern ?? 'solid') === pattern} onclick={() => setFurniturePattern(pattern)}>{pattern === 'check' ? 'Checked' : pattern[0].toUpperCase() + pattern.slice(1)}</button>{/each}</div></div>
      <div class="inspector-section wall-actions"><button class="danger-button" type="button" onclick={deleteSelected}><Trash2 size={16} /> Delete furniture</button></div>
    {:else if selectedWall}
      <div class="inspector-section"><div class="inspector-label">SELECTED WALL <span class="selection-tag">ACTIVE</span></div><div class="wall-preview"><span></span><strong>Wall {plan.walls.findIndex((wall) => wall.id === selectedWallId) + 1}</strong><small>{selectedWall.id.slice(0, 6).toUpperCase()}</small></div></div>
      <div class="inspector-section"><div class="inspector-label">MEASUREMENTS</div><div class="property-row"><span>Length</span><strong>{meters(length(selectedWall))}</strong></div><div class="property-row"><span>Angle</span><strong>{angle(selectedWall)}°</strong></div><div class="property-row"><span>Thickness</span><strong>{selectedWall.thickness} cm</strong></div><label class="range-label" for="thickness">Adjust thickness</label><input id="thickness" type="range" min="6" max="40" step="2" value={selectedWall.thickness} onchange={setThickness} /><div class="range-limits"><span>6 cm</span><span>40 cm</span></div></div>
      <div class="inspector-section wall-actions"><button class="danger-button" type="button" onclick={deleteSelected}><Trash2 size={16} /> Delete wall</button></div>
    {:else}
      <div class="inspector-section"><div class="inspector-label">YOUR SPACE</div><div class="overview-card"><div class="overview-art"><div class="art-outline"></div></div><div class="overview-card-text"><strong>{plan.name}</strong><span>Floor plan · Draft</span></div></div></div>
      <div class="inspector-section"><div class="inspector-label">AT A GLANCE</div><div class="stat-grid"><div class="stat-card"><span>WALLS</span><strong>{plan.walls.length}</strong></div><div class="stat-card"><span>FURNITURE</span><strong>{plan.furniture.length}</strong></div></div><div class="property-row"><span>Total wall length</span><strong>{meters(totalLength)}</strong></div><div class="property-row"><span>Grid spacing</span><strong>20 cm</strong></div></div>
      <div class="inspector-section"><div class="inspector-label">FLOORING</div><div class="floor-summary"><span class="floor-swatch" style:background={flooringInfo[plan.flooring].swatch}></span><span><strong>{flooringInfo[plan.flooring].label}</strong><small>Choose another finish in View settings</small></span></div></div>
      <div class="inspector-section"><div class="inspector-label">GET STARTED</div><div class="steps"><div><span>01</span><p>Draw walls by clicking points at any angle.</p></div><div><span>02</span><p>Drag furniture from the palette onto your plan.</p></div><div><span>03</span><p>Select an item to move, rotate, or resize it.</p></div></div></div>
    {/if}
    <div class="inspector-footer"><div class="footer-check"><Check size={15} /></div><span>Changes save automatically</span></div>
  </aside>
</div>

{#if paletteDrag?.moved}<div class="furniture-drag-ghost" style:left={`${paletteDrag.x + 13}px`} style:top={`${paletteDrag.y + 13}px`}><Sofa size={17}/><span>{furnitureInfo[paletteDrag.type].label}</span></div>{/if}

{#if showHelp}<div class="modal-backdrop" role="presentation" onpointerdown={(event) => { if (event.target === event.currentTarget) showHelp = false; }}><div class="modal" role="dialog" tabindex="-1" aria-modal="true" aria-label="How to use Forma"><button class="modal-close" aria-label="Close" onclick={() => showHelp = false}><X size={20} /></button><span class="eyebrow">GUIDE</span><h2>Design your space</h2><p>Draw walls by clicking points on the canvas. Each new click continues the wall chain. Click an existing corner to connect to it.</p><ul><li><strong>W</strong> Draw walls at any angle</li><li><strong>Shift</strong> Snap while drawing to 15° increments</li><li><strong>V</strong> Select walls, furniture, and corners</li><li><strong>Drag canvas</strong> Pan on empty space, or hold Space while dragging</li><li><strong>Furniture</strong> Select an item to change its colour and pattern</li><li><strong>Settings</strong> Choose wood or tile flooring</li><li><strong>Delete</strong> Remove the selected item</li><li><strong>⌘/Ctrl + Z</strong> Undo an edit</li></ul><button class="primary-button" onclick={() => showHelp = false}>Got it <ArrowUpRight size={16} /></button></div></div>{/if}
