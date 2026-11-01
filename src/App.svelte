<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    ArrowUpRight, Check, ChevronDown, CircleAlert, CircleHelp, Download, Grid2X2, Magnet, Maximize,
    MessageSquarePlus, MousePointer2, Pencil, Plus, Redo2, Ruler, Search, Settings2, Sofa, Trash2, Undo2,
    Upload, X, ZoomIn, ZoomOut
  } from '@lucide/svelte';
  import { defaultColors, defaultFinishForMaterial, defaultMaterialForType, furnitureCategories, furnitureColors, furnitureInfo, furnitureMarkup, furniturePatterns, furnitureTypes, type Furniture, type FurniturePattern, type FurnitureType } from './furniture';
  import { materialFinishes, materialLabels, materialTypes, type MaterialType } from './materials';
  import { fitOpening, openingBounds, openingMarkup, wallSegments, type OpeningType, type WallOpening } from './openings';
  import { closedRoomPolygons, flooringDefs, flooringInfo, flooringTypes, type FlooringType } from './flooring';
  import { planTemplates } from './templates';

  type Vertex = { id: string; x: number; y: number };
  type Wall = { id: string; from: string; to: string; thickness: number };
  type PlanComment = { id: string; x: number; y: number; text: string };
  type Plan = { name: string; vertices: Vertex[]; walls: Wall[]; openings: WallOpening[]; furniture: Furniture[]; comments: PlanComment[]; flooring: FlooringType; templateId?: string };
  type PlanTab = { id: string; plan: Plan; history: Plan[]; future: Plan[] };
  type DrawStart = { x: number; y: number; vertexId?: string };
  const WALL_SNAP_PX = 12;

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
      { id: 'f1', type: 'sofa', x: 305, y: 265, rotation: 0, scale: 0.85, material: 'fabric', finish: 'linen' },
      { id: 'f2', type: 'dining', x: 570, y: 380, rotation: 0, scale: 0.8, material: 'wood', finish: 'oak' },
      { id: 'f3', type: 'island', x: 365, y: 405, rotation: 0, scale: 0.8, material: 'stone', finish: 'marble' }
    ], openings: [], comments: []
  };

  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const commentIconMarkup = '<path d="M-9-11 H9 Q13-11 13-7 V5 Q13 9 9 9 H-3 L-9 14 V9 Q-13 9-13 5 V-7 Q-13-11-9-11 Z" fill="#5c735e" stroke="#405844" stroke-width="1.5" stroke-linejoin="round"/><circle cx="-6" cy="-1" r="1.7" fill="#fffdf6"/><circle cx="0" cy="-1" r="1.7" fill="#fffdf6"/><circle cx="6" cy="-1" r="1.7" fill="#fffdf6"/>';
  let planTabs = $state<PlanTab[]>([{ id: 'starter', plan: clone(initialPlan), history: [], future: [] }]);
  let activeTabId = $state('starter');
  let editingTabId = $state<string | null>(null);
  let showTemplatePicker = $state(false);
  let tabNameDraft = $state('');
  let activeTab = $derived(planTabs.find((tab) => tab.id === activeTabId) ?? planTabs[0]);
  let plan = $derived(activeTab.plan);
  let activeTemplate = $derived(planTemplates.find((template) => template.id === plan.templateId));
  let tool = $state<'select' | 'wall' | 'furniture' | 'comment'>('select');
  let selectedWallId = $state<string | null>(null);
  let selectedOpeningId = $state<string | null>(null);
  let selectedFurnitureId = $state<string | null>(null);
  let commentEditor = $state<{ id: string | null; x: number; y: number; left: number; top: number } | null>(null);
  let commentDraft = $state('');
  let placementType = $state<FurnitureType>('sofa');
  let paletteDrag = $state<{ type: FurnitureType; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  let showFurnitureDrawer = $state(false);
  let furnitureQuery = $state('');
  let furnitureCategory = $state<(typeof furnitureCategories)[number]>('All');
  let showSettings = $state(false);
  let showInspector = $state(true);
  let drawStart = $state<DrawStart | null>(null);
  let cursor = $state<DrawStart | null>(null);
  let dragging: { id: string; before: Plan; moved: boolean; snapTargetId?: string } | null = null;
  let draggingFurniture: { id: string; before: Plan; moved: boolean } | null = null;
  let draggingComment: { id: string; before: Plan; moved: boolean; offsetX: number; offsetY: number } | null = null;
  let draggingOpening: { id: string; before: Plan; moved: boolean } | null = null;
  let transformingFurniture: { id: string; mode: 'rotate' | 'resize'; before: Plan; startAngle: number; rotation: number; startLocalX: number; startLocalY: number; widthScale: number; lengthScale: number; moved: boolean } | null = null;
  let suppressCanvasClick = false;
  let suppressCommentClick = false;
  let history = $derived(activeTab.history);
  let future = $derived(activeTab.future);
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
  let selectedOpening = $derived(plan.openings.find((opening) => opening.id === selectedOpeningId));
  let selectedFurniture = $derived(plan.furniture.find((item) => item.id === selectedFurnitureId));
  let matchingFurniture = $derived(furnitureTypes.filter((type) => {
    const query = furnitureQuery.trim().toLowerCase();
    return query ? furnitureInfo[type].label.toLowerCase().includes(query) : furnitureCategory === 'All' || furnitureInfo[type].category === furnitureCategory;
  }));
  let floorPolygons = $derived(closedRoomPolygons(plan.vertices, plan.walls));
  let openWallEnds = $derived.by(() => {
    const degree = new Map<string, number>();
    for (const wall of plan.walls) {
      degree.set(wall.from, (degree.get(wall.from) ?? 0) + 1);
      degree.set(wall.to, (degree.get(wall.to) ?? 0) + 1);
    }
    return plan.vertices.filter((point) => degree.get(point.id) === 1);
  });
  let canConnectEnds = $derived.by(() => {
    if (openWallEnds.length !== 2 || plan.walls.length < 2) return false;
    const connected = new Map<string, string[]>();
    for (const wall of plan.walls) {
      connected.set(wall.from, [...(connected.get(wall.from) ?? []), wall.to]);
      connected.set(wall.to, [...(connected.get(wall.to) ?? []), wall.from]);
    }
    const visited = new Set<string>();
    const pending = [openWallEnds[0].id];
    while (pending.length) {
      const current = pending.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      pending.push(...(connected.get(current) ?? []));
    }
    return visited.has(openWallEnds[1].id);
  });
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
  function widthScale(item: Furniture) { return item.widthScale ?? item.scale; }
  function lengthScale(item: Furniture) { return item.lengthScale ?? item.scale; }
  function furnitureWidth(item: Furniture) { return Math.round(furnitureInfo[item.type].width * widthScale(item)); }
  function furnitureLength(item: Furniture) { return Math.round(furnitureInfo[item.type].height * lengthScale(item)); }
  function furnitureArt(item: Furniture, id = item.id) { return furnitureMarkup(item.type, item.color, item.pattern, id, item.material, item.finish); }
  function furniturePreview(type: FurnitureType, id: string) {
    const material = defaultMaterialForType(type);
    return furnitureMarkup(type, defaultColors[type], 'solid', id, material, defaultFinishForMaterial(material));
  }
  function openingsOnWall(wallId: string) { return plan.openings.filter((opening) => opening.wallId === wallId); }
  function openingTransform(opening: WallOpening, a: Vertex, b: Vertex) {
    const wallLength = distance(a, b);
    const center = openingBounds(opening, wallLength).center / wallLength;
    return `translate(${a.x + (b.x - a.x) * center} ${a.y + (b.y - a.y) * center}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI})`;
  }
  function addOpening(type: OpeningType) {
    if (!selectedWall) return;
    const available = fitOpening(length(selectedWall), openingsOnWall(selectedWall.id), type === 'door' ? 90 : 120);
    if (!available) return;
    remember();
    const opening: WallOpening = { id: uid(), wallId: selectedWall.id, type, ...available };
    plan.openings.push(opening);
    selectedOpeningId = opening.id;
  }
  function changeOpening(property: 'width' | 'position', event: Event) {
    if (!selectedOpening || !selectedWall) return;
    const wallLength = length(selectedWall);
    const others = openingsOnWall(selectedWall.id).filter((item) => item.id !== selectedOpeningId);
    const value = Number((event.currentTarget as HTMLInputElement).value);
    const fitted = fitOpening(wallLength, others, property === 'width' ? value : selectedOpening.width, property === 'position' ? value / 100 : selectedOpening.position);
    if (!fitted || (fitted.width === selectedOpening.width && Math.abs(fitted.position - selectedOpening.position) < 0.001)) return;
    remember();
    selectedOpening.width = fitted.width;
    selectedOpening.position = fitted.position;
  }
  function deleteOpening() {
    if (!selectedOpeningId) return;
    remember();
    plan.openings = plan.openings.filter((opening) => opening.id !== selectedOpeningId);
    selectedOpeningId = null;
  }
  function startOpeningDrag(event: PointerEvent, id: string) {
    if (event.button !== 0 || tool !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    selectedOpeningId = id;
    selectedWallId = plan.openings.find((opening) => opening.id === id)?.wallId ?? null;
    selectedFurnitureId = null;
    showInspector = true;
    suppressCanvasClick = true;
    draggingOpening = { id, before: clone(plan), moved: false };
    svg.setPointerCapture(event.pointerId);
  }
  function localFurniturePoint(point: { x: number; y: number }, item: Furniture) {
    const radians = -item.rotation * Math.PI / 180;
    const x = point.x - item.x, y = point.y - item.y;
    return { x: x * Math.cos(radians) - y * Math.sin(radians), y: x * Math.sin(radians) + y * Math.cos(radians) };
  }
  function remember() {
    activeTab.history = [...history.slice(-49), clone(plan)];
    activeTab.future = [];
  }
  function undo() {
    if (!history.length) return;
    activeTab.future = [clone(plan), ...future];
    activeTab.plan = history.at(-1)!;
    activeTab.history = history.slice(0, -1);
    selectedWallId = null;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    drawStart = null;
    commentEditor = null;
  }
  function redo() {
    if (!future.length) return;
    activeTab.history = [...history, clone(plan)];
    activeTab.plan = future[0];
    activeTab.future = future.slice(1);
    selectedWallId = null;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    drawStart = null;
    commentEditor = null;
  }
  function setTool(next: 'select' | 'wall' | 'comment') {
    tool = next;
    drawStart = null;
    selectedWallId = null;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    commentEditor = null;
    showFurnitureDrawer = false;
    showSettings = false;
  }
  function chooseFurniture(type: FurnitureType) {
    tool = 'furniture';
    placementType = type;
    drawStart = null;
    selectedWallId = null;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    commentEditor = null;
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
      rotation: 0, scale: 1, widthScale: 1, lengthScale: 1, color: defaultColors[type], pattern: 'solid',
      material: defaultMaterialForType(type), finish: defaultFinishForMaterial(defaultMaterialForType(type))
    };
    plan.furniture.push(item);
    selectedFurnitureId = item.id;
    selectedWallId = null;
    selectedOpeningId = null;
    showInspector = true;
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
  function openCommentEditor(point: { x: number; y: number }, id: string | null, text: string, event?: MouseEvent) {
    const bounds = svg.getBoundingClientRect();
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = point.x;
    svgPoint.y = point.y;
    const screen = svgPoint.matrixTransform(svg.getScreenCTM()!);
    const clientX = event?.clientX ?? screen.x;
    const clientY = event?.clientY ?? screen.y;
    commentEditor = {
      id, x: point.x, y: point.y,
      left: Math.max(8, Math.min(bounds.width - 278, clientX - bounds.left + 14)),
      top: Math.max(8, Math.min(bounds.height - 205, clientY - bounds.top + 14))
    };
    commentDraft = text;
    selectedWallId = null;
    selectedFurnitureId = null;
    showFurnitureDrawer = false;
    showSettings = false;
    void tick().then(() => document.querySelector<HTMLTextAreaElement>('.comment-editor textarea')?.focus());
  }
  function saveComment() {
    if (!commentEditor) return;
    const text = commentDraft.trim();
    if (!text) return;
    const existing = commentEditor.id ? plan.comments.find((note) => note.id === commentEditor!.id) : null;
    if (!existing || existing.text !== text) {
      remember();
      if (existing) existing.text = text;
      else plan.comments.push({ id: uid(), x: Math.round(commentEditor.x), y: Math.round(commentEditor.y), text });
    }
    commentEditor = null;
    tool = 'select';
  }
  function deleteComment() {
    if (!commentEditor?.id) return;
    remember();
    plan.comments = plan.comments.filter((note) => note.id !== commentEditor!.id);
    commentEditor = null;
  }
  function nearestVertex(point: { x: number; y: number }, excluded = new Set<string>()) {
    const matrix = svg.getScreenCTM();
    const pixelsPerUnit = Math.hypot(matrix?.a ?? zoom, matrix?.b ?? 0) || 1;
    const snapRadius = WALL_SNAP_PX / pixelsPerUnit;
    let nearest: Vertex | undefined;
    let nearestDistance = snapRadius;
    for (const item of plan.vertices) {
      if (excluded.has(item.id)) continue;
      const candidateDistance = distance(item, point);
      if (candidateDistance < nearestDistance) {
        nearest = item;
        nearestDistance = candidateDistance;
      }
    }
    return nearest;
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
    const snapped = nearestVertex({ x, y });
    if (snapped) return { x: snapped.x, y: snapped.y, vertexId: snapped.id };
    return { x, y };
  }
  function canvasClick(event: MouseEvent) {
    if (suppressCanvasClick) { suppressCanvasClick = false; return; }
    showFurnitureDrawer = false;
    showSettings = false;
    if (tool === 'select') { selectedWallId = null; selectedOpeningId = null; selectedFurnitureId = null; commentEditor = null; return; }
    if (tool === 'furniture') { addFurniture(placementType, screenPoint(event)); return; }
    if (tool === 'comment') { openCommentEditor(screenPoint(event), null, '', event); return; }
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
    selectedOpeningId = null;
    showInspector = true;
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
    if (draggingOpening) {
      const opening = plan.openings.find((item) => item.id === draggingOpening!.id);
      const wall = plan.walls.find((item) => item.id === opening?.wallId);
      const a = wall && vertex(wall.from), b = wall && vertex(wall.to);
      if (opening && a && b) {
        const point = screenPoint(event);
        const dx = b.x - a.x, dy = b.y - a.y;
        const wallLength = Math.hypot(dx, dy);
        const position = ((point.x - a.x) * dx + (point.y - a.y) * dy) / (wallLength * wallLength);
        const fitted = fitOpening(wallLength, openingsOnWall(wall!.id).filter((item) => item.id !== opening.id), opening.width, position);
        if (fitted && (Math.abs(opening.position - fitted.position) > 0.001 || opening.width !== fitted.width)) { opening.position = fitted.position; opening.width = fitted.width; draggingOpening.moved = true; }
      }
      return;
    }
    if (transformingFurniture) {
      const target = plan.furniture.find((item) => item.id === transformingFurniture!.id);
      if (!target) return;
      const point = screenPoint(event);
      if (transformingFurniture.mode === 'rotate') {
        const currentAngle = Math.atan2(point.y - target.y, point.x - target.x);
        let value = transformingFurniture.rotation + (currentAngle - transformingFurniture.startAngle) * 180 / Math.PI;
        if (event.shiftKey) value = Math.round(value / 15) * 15;
        value = Math.round((value % 360 + 360) % 360);
        if (target.rotation !== value) { target.rotation = value; transformingFurniture.moved = true; }
      } else {
        const local = localFurniturePoint(point, target);
        const width = Math.round(Math.max(0.4, Math.min(2.5, transformingFurniture.widthScale * local.x / transformingFurniture.startLocalX)) * 100) / 100;
        const length = Math.round(Math.max(0.4, Math.min(2.5, transformingFurniture.lengthScale * local.y / transformingFurniture.startLocalY)) * 100) / 100;
        if (widthScale(target) !== width || lengthScale(target) !== length) {
          target.widthScale = width;
          target.lengthScale = length;
          transformingFurniture.moved = true;
        }
      }
      return;
    }
    if (dragging) {
      const point = screenPoint(event);
      const target = vertex(dragging.id);
      if (target) {
        const excluded = new Set([dragging.id]);
        for (const wall of plan.walls) {
          if (wall.from === dragging.id) excluded.add(wall.to);
          if (wall.to === dragging.id) excluded.add(wall.from);
        }
        const nearby = nearestVertex(point, excluded);
        dragging.snapTargetId = nearby?.id;
        const x = nearby?.x ?? (snapGrid ? Math.round(point.x / 10) * 10 : Math.round(point.x));
        const y = nearby?.y ?? (snapGrid ? Math.round(point.y / 10) * 10 : Math.round(point.y));
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
    if (draggingComment) {
      const point = screenPoint(event);
      const target = plan.comments.find((note) => note.id === draggingComment!.id);
      if (target) {
        const x = Math.round(point.x - draggingComment.offsetX);
        const y = Math.round(point.y - draggingComment.offsetY);
        if (target.x !== x || target.y !== y) {
          target.x = x;
          target.y = y;
          draggingComment.moved = true;
        }
      }
      return;
    }
    if (tool === 'wall') cursor = constrain(screenPoint(event), event.shiftKey);
    else if (tool === 'furniture' || tool === 'comment') cursor = screenPoint(event);
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
    selectedOpeningId = null;
    showInspector = true;
    tool = 'select';
    suppressCanvasClick = true;
    svg.setPointerCapture(event.pointerId);
    draggingFurniture = { id, before: clone(plan), moved: false };
  }
  function startCommentDrag(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const note = plan.comments.find((item) => item.id === id);
    if (!note) return;
    const point = screenPoint(event);
    draggingComment = { id, before: clone(plan), moved: false, offsetX: point.x - note.x, offsetY: point.y - note.y };
    commentEditor = null;
    tool = 'select';
    svg.setPointerCapture(event.pointerId);
  }
  function startFurnitureTransform(event: PointerEvent, id: string, mode: 'rotate' | 'resize') {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const item = plan.furniture.find((furniture) => furniture.id === id);
    if (!item) return;
    const point = screenPoint(event);
    const local = localFurniturePoint(point, item);
    transformingFurniture = {
      id, mode, before: clone(plan),
      startAngle: Math.atan2(point.y - item.y, point.x - item.x), rotation: item.rotation,
      startLocalX: Math.max(1, local.x), startLocalY: Math.max(1, local.y),
      widthScale: widthScale(item), lengthScale: lengthScale(item), moved: false
    };
    suppressCanvasClick = true;
    svg.setPointerCapture(event.pointerId);
  }
  function stopDrag(event: PointerEvent) {
    if (panning?.moved) suppressCanvasClick = true;
    if (dragging?.moved && dragging.snapTargetId) {
      const sourceId = dragging.id;
      const targetId = dragging.snapTargetId;
      for (const wall of plan.walls) {
        if (wall.from === sourceId) wall.from = targetId;
        if (wall.to === sourceId) wall.to = targetId;
      }
      plan.walls = plan.walls.filter((wall) => wall.from !== wall.to);
      plan.openings = plan.openings.filter((opening) => plan.walls.some((wall) => wall.id === opening.wallId));
      plan.vertices = plan.vertices.filter((point) => point.id !== sourceId);
      if (selectedWallId && !plan.walls.some((wall) => wall.id === selectedWallId)) selectedWallId = null;
    }
    if (draggingComment) {
      suppressCanvasClick = true;
      suppressCommentClick = true;
      if (!draggingComment.moved) {
        const note = plan.comments.find((item) => item.id === draggingComment!.id);
        if (note) openCommentEditor(note, note.id, note.text);
      }
    }
    if (dragging?.moved || draggingFurniture?.moved || draggingComment?.moved || draggingOpening?.moved || transformingFurniture?.moved) {
      activeTab.history = [...history.slice(-49), (dragging ?? draggingFurniture ?? draggingComment ?? draggingOpening ?? transformingFurniture)!.before];
      activeTab.future = [];
    }
    dragging = null;
    draggingFurniture = null;
    draggingComment = null;
    draggingOpening = null;
    transformingFurniture = null;
    panning = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { suppressCanvasClick = false; suppressCommentClick = false; }, 0);
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
    if (event.key === 'Enter') { selectedFurnitureId = id; selectedWallId = null; selectedOpeningId = null; showInspector = true; return; }
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
  function keyboardFurnitureTransform(event: KeyboardEvent, mode: 'rotate' | 'resize') {
    if (!selectedFurniture || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    remember();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1;
    if (mode === 'rotate') selectedFurniture.rotation = (selectedFurniture.rotation + direction * 15 + 360) % 360;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') selectedFurniture.widthScale = Math.round(Math.max(0.4, Math.min(2.5, widthScale(selectedFurniture) + direction * 0.05)) * 100) / 100;
    else selectedFurniture.lengthScale = Math.round(Math.max(0.4, Math.min(2.5, lengthScale(selectedFurniture) + direction * 0.05)) * 100) / 100;
  }
  function deleteSelected() {
    if (commentEditor?.id) { deleteComment(); return; }
    if (selectedFurnitureId) {
      remember();
      plan.furniture = plan.furniture.filter((item) => item.id !== selectedFurnitureId);
      selectedFurnitureId = null;
      return;
    }
    if (selectedOpeningId) { deleteOpening(); return; }
    deleteWall();
  }
  function deleteWall() {
    if (!selectedWallId) return;
    remember();
    plan.walls = plan.walls.filter((wall) => wall.id !== selectedWallId);
    plan.openings = plan.openings.filter((opening) => opening.wallId !== selectedWallId);
    const used = new Set(plan.walls.flatMap((wall) => [wall.from, wall.to]));
    plan.vertices = plan.vertices.filter((point) => used.has(point.id));
    selectedWallId = null;
    selectedOpeningId = null;
  }
  function setThickness(event: Event) {
    if (!selectedWall) return;
    remember();
    selectedWall.thickness = Number((event.target as HTMLInputElement).value);
  }
  function setFurnitureProperty(property: 'rotation', event: Event) {
    if (!selectedFurniture) return;
    const value = Number((event.target as HTMLInputElement).value);
    if (selectedFurniture[property] === value) return;
    remember();
    selectedFurniture[property] = value;
  }
  function setFurnitureDimension(axis: 'widthScale' | 'lengthScale', base: number, event: Event) {
    if (!selectedFurniture) return;
    const value = Number((event.target as HTMLInputElement).value) / base;
    if (selectedFurniture[axis] === value) return;
    remember();
    selectedFurniture[axis] = value;
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
  function setFurnitureMaterial(material: MaterialType) {
    if (!selectedFurniture || (selectedFurniture.material ?? 'paint') === material) return;
    remember();
    selectedFurniture.material = material;
    selectedFurniture.finish = defaultFinishForMaterial(material);
  }
  function setFurnitureFinish(finish: string) {
    if (!selectedFurniture || !selectedFurniture.material || selectedFurniture.material === 'paint' ||
      !materialFinishes[selectedFurniture.material].some((item) => item.id === finish) || selectedFurniture.finish === finish) return;
    remember();
    selectedFurniture.finish = finish;
  }
  function setFlooring(flooring: FlooringType) {
    if (plan.flooring === flooring) return;
    remember();
    plan.flooring = flooring;
  }
  function connectOpenEnds() {
    if (!canConnectEnds) return;
    remember();
    const wall = { id: uid(), from: openWallEnds[0].id, to: openWallEnds[1].id, thickness: 16 };
    plan.walls.push(wall);
    selectedWallId = wall.id;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    drawStart = null;
    tool = 'select';
    showInspector = true;
  }
  function clearPlanInteraction() {
    selectedWallId = null;
    selectedOpeningId = null;
    selectedFurnitureId = null;
    drawStart = null;
    cursor = null;
    commentEditor = null;
    showFurnitureDrawer = false;
    showSettings = false;
    showExport = false;
    tool = 'select';
  }
  function switchPlan(id: string) {
    if (activeTabId === id || !planTabs.some((tab) => tab.id === id)) return;
    saveTabName();
    activeTabId = id;
    showTemplatePicker = false;
    clearPlanInteraction();
  }
  async function startRenameTab(id: string) {
    const tab = planTabs.find((item) => item.id === id);
    if (!tab) return;
    editingTabId = id;
    tabNameDraft = tab.plan.name;
    await tick();
    const input = document.getElementById(`plan-name-${id}`) as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }
  function saveTabName() {
    if (!editingTabId) return;
    const tab = planTabs.find((item) => item.id === editingTabId);
    const name = tabNameDraft.trim();
    if (tab && name && name !== tab.plan.name) {
      tab.history = [...tab.history.slice(-49), clone(tab.plan)];
      tab.future = [];
      tab.plan.name = name;
    }
    editingTabId = null;
  }
  function closePlanTab(id: string) {
    if (planTabs.length === 1) return;
    saveTabName();
    const index = planTabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    const tab = planTabs[index];
    if ((tab.plan.walls.length || tab.plan.furniture.length || tab.plan.comments.length) && !window.confirm(`Close “${tab.plan.name}”? This removes the plan from your browser.`)) return;
    const remaining = planTabs.filter((item) => item.id !== id);
    planTabs = remaining;
    if (activeTabId === id) {
      activeTabId = remaining[Math.max(0, index - 1)].id;
      clearPlanInteraction();
    }
  }
  async function tabKeydown(event: KeyboardEvent, index: number) {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? planTabs.length - 1 : direction ? (index + direction + planTabs.length) % planTabs.length : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    switchPlan(planTabs[nextIndex].id);
    await tick();
    document.getElementById(`plan-tab-${planTabs[nextIndex].id}`)?.focus();
  }
  function newPlan(templateId?: string) {
    saveTabName();
    const template = planTemplates.find((item) => item.id === templateId);
    let number = 1;
    while (planTabs.some((tab) => tab.plan.name === `Untitled plan ${number}`)) number++;
    const nextPlan: Plan = template ? { ...clone(template.plan), templateId: template.id } :
      { name: `Untitled plan ${number}`, vertices: [], walls: [], openings: [], furniture: [], comments: [], flooring: 'none' };
    const tab: PlanTab = { id: uid(), plan: nextPlan, history: [], future: [] };
    planTabs = [...planTabs, tab];
    activeTabId = tab.id;
    clearPlanInteraction();
    showTemplatePicker = false;
    tool = template ? 'select' : 'wall';
    zoom = 1;
    pan = { x: 0, y: 0 };
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
      if (!a || !b) return '';
      const segments = wallSegments(a, b, openingsOnWall(wall.id)).map((segment) => `<line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" stroke="#3b3934" stroke-width="${wall.thickness}" stroke-linecap="butt"/>`).join('');
      const openings = openingsOnWall(wall.id).map((opening) => `<g transform="${openingTransform(opening, a, b)}">${openingMarkup(opening, distance(a, b))}</g>`).join('');
      return segments + openings;
    }).join('');
    const furnishings = plan.furniture.map((item) => `<g transform="translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${widthScale(item)} ${lengthScale(item)})">${furnitureArt(item)}</g>`).join('');
    const notes = plan.comments.map((note) => `<g transform="translate(${note.x} ${note.y})">${commentIconMarkup}</g>`).join('');
    const image = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="864" viewBox="0 0 1000 720"><defs>${flooringDefs}</defs><rect width="1000" height="720" fill="#fbf7ec"/>${floors}${lines}${furnishings}${notes}</svg>`;
    download(image, filename('svg'), 'image/svg+xml');
  }
  function exportJson() { download(JSON.stringify(plan, null, 2), filename('json'), 'application/json'); }
  function normalizePlan(value: unknown): Plan | null {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<Plan>;
    if (typeof candidate.name !== 'string' || !Array.isArray(candidate.vertices) || !Array.isArray(candidate.walls) ||
      !candidate.vertices.every((point) => typeof point.id === 'string' && Number.isFinite(point.x) && Number.isFinite(point.y)) ||
      !candidate.walls.every((wall) => typeof wall.id === 'string' && typeof wall.from === 'string' && typeof wall.to === 'string' && Number.isFinite(wall.thickness)) ||
      !candidate.walls.every((wall) => candidate.vertices!.some((point) => point.id === wall.from) && candidate.vertices!.some((point) => point.id === wall.to)) ||
      (candidate.openings !== undefined && (!Array.isArray(candidate.openings) || !candidate.openings.every((opening) =>
        typeof opening.id === 'string' && typeof opening.wallId === 'string' && candidate.walls!.some((wall) => wall.id === opening.wallId) &&
        (opening.type === 'door' || opening.type === 'window') && Number.isFinite(opening.position) && opening.position >= 0 && opening.position <= 1 &&
        Number.isFinite(opening.width) && opening.width >= 50 && opening.width <= 300))) ||
      (candidate.flooring !== undefined && !flooringTypes.includes(candidate.flooring)) ||
      (candidate.comments !== undefined && (!Array.isArray(candidate.comments) || !candidate.comments.every((note) =>
        typeof note.id === 'string' && Number.isFinite(note.x) && Number.isFinite(note.y) && typeof note.text === 'string' && note.text.length <= 500))) ||
      (candidate.furniture !== undefined && (!Array.isArray(candidate.furniture) || !candidate.furniture.every((item) =>
        typeof item.id === 'string' && furnitureTypes.includes(item.type) && Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.rotation) && Number.isFinite(item.scale) && item.scale > 0 &&
        (item.widthScale === undefined || (Number.isFinite(item.widthScale) && item.widthScale > 0)) &&
        (item.lengthScale === undefined || (Number.isFinite(item.lengthScale) && item.lengthScale > 0)) &&
        (item.color === undefined || /^#[0-9a-f]{6}$/i.test(item.color)) && (item.pattern === undefined || furniturePatterns.includes(item.pattern)) &&
        (item.material === undefined || materialTypes.includes(item.material)) &&
        (item.finish === undefined || (item.material !== undefined && item.material !== 'paint' && materialFinishes[item.material]?.some((finish) => finish.id === item.finish))))))) return null;
    const templateId = planTemplates.find((template) => template.id === candidate.templateId)?.id;
    return { name: candidate.name, vertices: candidate.vertices, walls: candidate.walls, openings: candidate.openings ?? [], furniture: candidate.furniture ?? [], comments: candidate.comments ?? [], flooring: candidate.flooring ?? 'none', templateId };
  }
  async function importJson(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const imported = normalizePlan(JSON.parse(await file.text()));
      if (!imported) throw new Error('Invalid plan');
      saveTabName();
      const tab: PlanTab = { id: uid(), plan: imported, history: [], future: [] };
      planTabs = [...planTabs, tab];
      activeTabId = tab.id;
      clearPlanInteraction();
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
    if (event.key === 'Escape') { drawStart = null; selectedWallId = null; selectedOpeningId = null; selectedFurnitureId = null; commentEditor = null; showHelp = false; showExport = false; showFurnitureDrawer = false; showSettings = false; showTemplatePicker = false; tool = 'select'; }
    if (event.key.toLowerCase() === 'v') setTool('select');
    if (event.key.toLowerCase() === 'w') setTool('wall');
    if (event.key.toLowerCase() === 'c') setTool('comment');
    if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected();
  }
  function keyup(event: KeyboardEvent) { if (event.code === 'Space') spaceHeld = false; }
  onMount(() => {
    if (window.innerWidth <= 700) showInspector = false;
    try {
      const savedWorkspace = localStorage.getItem('forma-workspace-v2');
      let restored = false;
      if (savedWorkspace) {
        const value = JSON.parse(savedWorkspace);
        if (value && Array.isArray(value.tabs)) {
          const seen = new Set<string>();
          const tabs: PlanTab[] = [];
          for (const entry of value.tabs) {
            const restoredPlan = normalizePlan(entry?.plan);
            if (typeof entry?.id === 'string' && entry.id && !seen.has(entry.id) && restoredPlan) {
              seen.add(entry.id);
              tabs.push({ id: entry.id, plan: restoredPlan, history: [], future: [] });
            }
          }
          if (tabs.length) {
            planTabs = tabs;
            activeTabId = tabs.some((tab) => tab.id === value.activeTabId) ? value.activeTabId : tabs[0].id;
            restored = true;
          }
        }
      }
      if (!restored) {
        const legacy = localStorage.getItem('forma-plan-v1');
        const restoredPlan = legacy ? normalizePlan(JSON.parse(legacy)) : null;
        if (restoredPlan) planTabs = [{ id: 'starter', plan: restoredPlan, history: [], future: [] }];
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
  $effect(() => {
    if (hydrated) localStorage.setItem('forma-workspace-v2', JSON.stringify({ tabs: planTabs.map((tab) => ({ id: tab.id, plan: tab.plan })), activeTabId }));
  });
</script>

<svelte:head>
  <title>{plan.name} · Forma</title>
</svelte:head>

<div class="app-shell">
  <main class="main-content">
    <div class="workspace">
      <div class="workspace-toolbar">
        <div class="plan-tabs" role="tablist" aria-label="Open floor plans">
          {#each planTabs as tab, index (tab.id)}
            <div class="plan-tab" class:active={activeTabId === tab.id}>
              {#if editingTabId === tab.id}
                <input id={`plan-name-${tab.id}`} class="plan-tab-name-input" aria-label="Plan name" maxlength="60" bind:value={tabNameDraft} onblur={saveTabName} onkeydown={(event) => { if (event.key === 'Enter') saveTabName(); if (event.key === 'Escape') editingTabId = null; }} />
              {:else}
                <button id={`plan-tab-${tab.id}`} class="plan-tab-select" type="button" role="tab" aria-selected={activeTabId === tab.id} aria-controls="plan-panel" tabindex={activeTabId === tab.id ? 0 : -1} title={tab.plan.name} onclick={() => switchPlan(tab.id)} ondblclick={() => startRenameTab(tab.id)} onkeydown={(event) => tabKeydown(event, index)}>{tab.plan.name}</button>
              {/if}
              {#if activeTabId === tab.id && editingTabId !== tab.id}<button class="plan-tab-action" type="button" aria-label={`Rename ${tab.plan.name}`} title="Rename plan" onclick={() => startRenameTab(tab.id)}><Pencil size={12}/></button>{/if}
              {#if planTabs.length > 1}<button class="plan-tab-action" type="button" aria-label={`Close ${tab.plan.name}`} title="Close plan" onclick={() => closePlanTab(tab.id)}><X size={13}/></button>{/if}
            </div>
          {/each}
          <button class="new-plan-tab" type="button" aria-label="New plan" aria-haspopup="dialog" aria-expanded={showTemplatePicker} title="New plan" onclick={() => showTemplatePicker = true}><Plus size={15}/><span>New plan</span></button>
        </div>
        <div class="toolbar-actions">
          <div class="saved-status"><span class="saved-dot"></span> Saved locally</div><span class="toolbar-divider saved-divider"></span>
          <button title="Undo (⌘Z)" aria-label="Undo" disabled={!history.length} onclick={undo}><Undo2 size={17} /></button>
          <button title="Redo (⌘⇧Z)" aria-label="Redo" disabled={!future.length} onclick={redo}><Redo2 size={17} /></button>
          <button title="Import JSON" aria-label="Import plan" onclick={() => fileInput.click()}><Upload size={17} /></button>
          <input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={importJson} />
          <span class="toolbar-divider"></span>
          <button class="primary-button export-button" type="button" aria-label="Export" aria-expanded={showExport} onclick={() => showExport = !showExport}><Download size={17} /><span>Export</span><ChevronDown size={14} /></button>
          {#if showExport}<div class="export-menu"><button type="button" onclick={exportSvg}>Export as SVG <span>Vector drawing</span></button><button type="button" onclick={exportJson}>Export as JSON <span>Editable plan</span></button></div>{/if}
        </div>
      </div>

      <div id="plan-panel" class="canvas-wrap" class:drawing={tool === 'wall'} class:commenting={tool === 'comment'} role="tabpanel" aria-labelledby={`plan-tab-${activeTabId}`}>
        <svg bind:this={svg} class="plan-canvas" viewBox={`${500 - 500 / zoom - pan.x} ${360 - 360 / zoom - pan.y} ${1000 / zoom} ${720 / zoom}`} role="button" tabindex="0" aria-label="Interactive floor plan canvas" onclick={canvasClick} onpointerdown={startPan} onkeydown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Escape') drawStart = null; if (event.key === 'Enter' && (tool === 'wall' || tool === 'comment')) { const bounds = svg.getBoundingClientRect(); canvasClick(new MouseEvent('click', { clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2 })); } }} onpointermove={canvasMove} onpointerup={stopDrag} onpointercancel={stopDrag} onpointerleave={() => cursor = null}>
          <defs><pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e2d7" stroke-width="1" /></pattern><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#smallGrid)"/><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d8cfc0" stroke-width="1.2" /></pattern><pattern id="paperGrain" width="43" height="37" patternUnits="userSpaceOnUse"><circle cx="7" cy="12" r="0.7" fill="#cbbfae" opacity=".34"/><circle cx="31" cy="29" r="0.6" fill="#cbbfae" opacity=".27"/></pattern>{@html flooringDefs}</defs>
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="#fbf7ec" data-pan-surface="" />
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#paperGrain)" pointer-events="none" />
          {#if showGrid}<rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" opacity="0.65" pointer-events="none" />{/if}
          {#if plan.flooring !== 'none'}{#each floorPolygons as points}<polygon {points} fill={`url(#floor-${plan.flooring})`} data-pan-surface="" />{/each}{/if}
          {#if plan.walls.length === 7 && plan.furniture.length === 0 && plan.name === 'Hillside Residence'}<text x="442" y="345" class="room-name" text-anchor="middle">LIVING SPACE</text><text x="442" y="369" class="room-subtitle" text-anchor="middle">Open floor plan</text>{/if}
          {#each plan.walls as wall (wall.id)}
            {@const a = vertex(wall.from)}{@const b = vertex(wall.to)}
            {#if a && b}
              {#each wallSegments(a, b, openingsOnWall(wall.id)) as segment}
                <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke="#e2d8c8" stroke-width={wall.thickness + 8} stroke-linecap="butt" class="wall-halo" />
                <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={selectedWallId === wall.id ? '#736d50' : '#3b3934'} stroke-width={wall.thickness} stroke-linecap="butt" class="wall-line" />
              {/each}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" stroke-width="32" class="wall-hit" role="button" tabindex="0" aria-label={`Select wall ${plan.walls.indexOf(wall) + 1}`} onclick={(event) => { event.stopPropagation(); if (tool !== 'select') canvasClick(event); else { selectedWallId = wall.id; selectedOpeningId = null; selectedFurnitureId = null; showInspector = true; } }} onkeydown={(event) => { if (event.key === 'Enter') { selectedWallId = wall.id; selectedOpeningId = null; selectedFurnitureId = null; showInspector = true; } }} />
              {#each openingsOnWall(wall.id) as opening (opening.id)}
                <g transform={openingTransform(opening, a, b)} class="wall-opening" class:selected={selectedOpeningId === opening.id} role="button" tabindex="0" aria-label={`${opening.type === 'door' ? 'Door' : 'Window'}, ${Math.round(opening.width)} centimetres wide. Drag to move along wall.`} onpointerdown={(event) => startOpeningDrag(event, opening.id)} onclick={(event) => { event.stopPropagation(); selectedOpeningId = opening.id; selectedWallId = wall.id; selectedFurnitureId = null; showInspector = true; }} onkeydown={(event) => { if (event.key === 'Enter') { selectedOpeningId = opening.id; selectedWallId = wall.id; selectedFurnitureId = null; showInspector = true; } }}>
                  {@html openingMarkup(opening, distance(a, b))}
                  <rect x={-openingBounds(opening, distance(a, b)).width / 2} y="-15" width={openingBounds(opening, distance(a, b)).width} height="30" fill="transparent" />
                </g>
              {/each}
              {#if showDimensions && distance(a, b) > 0}<g transform={`translate(${(a.x + b.x) / 2 + (b.y - a.y) / distance(a, b) * 27}, ${(a.y + b.y) / 2 - (b.x - a.x) / distance(a, b) * 27})`}><rect x="-29" y="-11" width="58" height="22" rx="6" class="dimension-bg"/><text y="4" text-anchor="middle" class="dimension-text">{meters(length(wall))}</text></g>{/if}
            {/if}
          {/each}
          {#if plan.flooring !== 'none'}
            {#each openWallEnds as point (point.id)}<circle cx={point.x} cy={point.y} r="16" class="open-wall-end" pointer-events="none" />{/each}
          {/if}
          {#each plan.furniture as item (item.id)}
            {@const info = furnitureInfo[item.type]}
            <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${widthScale(item)} ${lengthScale(item)})`} class="furniture-item" role="button" tabindex="0" aria-label={`${info.label}, ${furnitureWidth(item)} by ${furnitureLength(item)} centimetres, drag to move`} onpointerdown={(event) => startFurnitureDrag(event, item.id)} onclick={(event) => { event.stopPropagation(); selectedFurnitureId = item.id; selectedWallId = null; selectedOpeningId = null; showInspector = true; }} onkeydown={(event) => nudgeFurniture(event, item.id)}>
              {@html furnitureArt(item)}
            </g>
          {/each}
          {#each plan.comments as note, index (note.id)}
            <g class="comment-note" class:selected={commentEditor?.id === note.id} transform={`translate(${note.x} ${note.y})`} role="button" tabindex="0" aria-label={`Open or move comment ${index + 1}`} onpointerdown={(event) => startCommentDrag(event, note.id)} onclick={(event) => { event.stopPropagation(); if (suppressCommentClick) return; openCommentEditor(note, note.id, note.text, event); tool = 'select'; }} onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); openCommentEditor(note, note.id, note.text); tool = 'select'; } }}>
              {@html commentIconMarkup}
            </g>
          {/each}
          {#if selectedFurniture}
            {@const info = furnitureInfo[selectedFurniture.type]}
            {@const halfWidth = furnitureWidth(selectedFurniture) / 2}
            {@const halfHeight = furnitureLength(selectedFurniture) / 2}
            <g transform={`translate(${selectedFurniture.x} ${selectedFurniture.y}) rotate(${selectedFurniture.rotation})`} class="furniture-selection">
              <rect x={-halfWidth - 8} y={-halfHeight - 8} width={halfWidth * 2 + 16} height={halfHeight * 2 + 16} rx="10" fill="none" stroke="#238060" stroke-width="2" stroke-dasharray="7 5" pointer-events="none" />
              <g class="furniture-measurement" pointer-events="none"><line x1={-halfWidth} y1={halfHeight + 27} x2={halfWidth} y2={halfHeight + 27}/><line x1={-halfWidth} y1={halfHeight + 22} x2={-halfWidth} y2={halfHeight + 32}/><line x1={halfWidth} y1={halfHeight + 22} x2={halfWidth} y2={halfHeight + 32}/><rect x="-32" y={halfHeight + 17} width="64" height="20" rx="5"/><text y={halfHeight + 31} text-anchor="middle">{furnitureWidth(selectedFurniture)} cm</text><line x1={halfWidth + 32} y1={-halfHeight} x2={halfWidth + 32} y2={halfHeight}/><line x1={halfWidth + 27} y1={-halfHeight} x2={halfWidth + 37} y2={-halfHeight}/><line x1={halfWidth + 27} y1={halfHeight} x2={halfWidth + 37} y2={halfHeight}/><g transform={`translate(${halfWidth + 32} 0) rotate(90)`}><rect x="-32" y="-10" width="64" height="20" rx="5"/><text y="4" text-anchor="middle">{furnitureLength(selectedFurniture)} cm</text></g></g>
              <line x1="0" y1={-halfHeight - 8} x2="0" y2={-halfHeight - 32} stroke="#238060" stroke-width="2" pointer-events="none" />
              <circle class="transform-handle rotate-handle" cx="0" cy={-halfHeight - 34} r="12" fill="#fff" stroke="#238060" stroke-width="2" role="button" tabindex="0" aria-label={`Rotate ${info.label}`} onpointerdown={(event) => startFurnitureTransform(event, selectedFurniture!.id, 'rotate')} onclick={(event) => event.stopPropagation()} onkeydown={(event) => keyboardFurnitureTransform(event, 'rotate')} />
              <path d={`M-5 ${-halfHeight - 34}a5 5 0 1 1 4 5m-1-4v-4h4`} fill="none" stroke="#238060" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none" />
              <rect class="transform-handle resize-handle" x={halfWidth - 3} y={halfHeight - 3} width="22" height="22" rx="6" fill="#fff" stroke="#238060" stroke-width="2" role="button" tabindex="0" aria-label={`Resize ${info.label}`} onpointerdown={(event) => startFurnitureTransform(event, selectedFurniture!.id, 'resize')} onclick={(event) => event.stopPropagation()} onkeydown={(event) => keyboardFurnitureTransform(event, 'resize')} />
              <path d={`M${halfWidth + 4} ${halfHeight + 12}l8-8M${halfWidth + 8} ${halfHeight + 12}h4v-4`} fill="none" stroke="#238060" stroke-width="1.5" stroke-linecap="round" pointer-events="none" />
            </g>
          {/if}
          {#if tool === 'select'}
            {#each plan.vertices as point (point.id)}<circle cx={point.x} cy={point.y} r="9" class="vertex-halo" /><circle cx={point.x} cy={point.y} r="5" class="vertex-point" role="button" tabindex="0" aria-label="Move wall corner with arrow keys" onpointerdown={(event) => startDrag(event, point.id)} onclick={(event) => event.stopPropagation()} onkeydown={(event) => nudgeVertex(event, point.id)} />{/each}
          {/if}
          {#if tool === 'wall' && cursor?.vertexId}<circle cx={cursor.x} cy={cursor.y} r="12" fill="none" stroke="#228367" stroke-width="2" stroke-dasharray="3 3" pointer-events="none" />{/if}
          {#if tool === 'wall' && drawStart && cursor}<line x1={drawStart.x} y1={drawStart.y} x2={cursor.x} y2={cursor.y} stroke="#228367" stroke-width="3" stroke-dasharray="8 7" pointer-events="none" /><circle cx={drawStart.x} cy={drawStart.y} r="7" fill="#228367" pointer-events="none" /><circle cx={cursor.x} cy={cursor.y} r="5" fill="white" stroke="#228367" stroke-width="2" pointer-events="none" />{/if}
          {#if tool === 'furniture' && cursor}<g transform={`translate(${cursor.x} ${cursor.y})`} opacity="0.58" pointer-events="none">{@html furniturePreview(placementType, 'placement-preview')}</g>{/if}
          {#if tool === 'comment' && cursor}<g transform={`translate(${cursor.x} ${cursor.y})`} opacity="0.65" pointer-events="none">{@html commentIconMarkup}</g>{/if}
        </svg>
        {#if plan.flooring !== 'none' && floorPolygons.length === 0}
          <div class="floor-warning" role="status"><CircleAlert size={17}/><div><strong>No enclosed room yet</strong><span>{openWallEnds.length ? 'Join the highlighted wall ends to apply the selected floor.' : 'Draw connected walls and return to the first corner.'}</span>{#if canConnectEnds}<button type="button" onclick={connectOpenEnds}>Connect the two open ends</button>{/if}</div></div>
        {/if}
        {#if commentEditor}<div class="comment-editor" role="dialog" aria-label={commentEditor.id ? 'Edit comment' : 'New comment'} style:left={`${commentEditor.left}px`} style:top={`${commentEditor.top}px`}>
          <div class="comment-editor-heading"><strong>{commentEditor.id ? 'Edit comment' : 'New comment'}</strong><button type="button" aria-label="Close comment editor" onclick={() => commentEditor = null}><X size={15}/></button></div>
          <textarea aria-label="Comment text" placeholder="Add a note about this spot..." maxlength="500" rows="4" bind:value={commentDraft}></textarea>
          <div class="comment-editor-actions">{#if commentEditor.id}<button type="button" class="comment-delete" onclick={deleteComment}><Trash2 size={14}/> Delete</button>{/if}<button type="button" onclick={() => commentEditor = null}>Cancel</button><button type="button" class="comment-save" disabled={!commentDraft.trim()} onclick={saveComment}>Save</button></div>
        </div>{/if}
        {#if showFurnitureDrawer}
          <div class="floating-popover furniture-popover">
            <div class="furniture-picker-controls">
              <div class="popover-heading"><div><strong>Add furniture</strong><span>Drag onto the plan or click to place</span></div><button type="button" aria-label="Close furniture picker" onclick={() => showFurnitureDrawer = false}><X size={16}/></button></div>
              <label class="furniture-search"><Search size={16}/><input type="search" aria-label="Search furniture" placeholder="Search all furniture..." bind:value={furnitureQuery}/></label>
              <div class="furniture-categories" role="group" aria-label="Furniture rooms">{#each furnitureCategories as category}<button type="button" class:active={furnitureCategory === category && !furnitureQuery.trim()} aria-pressed={furnitureCategory === category && !furnitureQuery.trim()} onclick={() => { furnitureCategory = category; furnitureQuery = ''; }}>{category}</button>{/each}</div>
            </div>
            <div class="furniture-result-count">{matchingFurniture.length} {matchingFurniture.length === 1 ? 'item' : 'items'}{furnitureQuery.trim() ? ' found' : furnitureCategory === 'All' ? ' in catalog' : ` in ${furnitureCategory.toLowerCase()}`}</div>
            <div class="furniture-choices">
              {#each matchingFurniture as type}
                {@const info = furnitureInfo[type]}
                <button class:chosen={tool === 'furniture' && placementType === type} type="button" onpointerdown={(event) => palettePointerDown(event, type)} onclick={(event) => { if (event.detail === 0) chooseFurniture(type); }}><svg class="furniture-choice-picture" viewBox={`${-info.width / 2 - 12} ${-info.height / 2 - 12} ${info.width + 24} ${info.height + 24}`} aria-hidden="true">{@html furniturePreview(type, `picker-${type}`)}</svg><span>{info.label}</span></button>
              {/each}
            </div>
            {#if matchingFurniture.length === 0}<p class="furniture-empty">No furniture matches “{furnitureQuery}”.</p>{/if}
          </div>
        {/if}
        {#if showSettings}
          <div class="floating-popover settings-popover">
            <div class="popover-heading"><div><strong>View settings</strong><span>Customize the plan canvas</span></div><button type="button" aria-label="Close view settings" onclick={() => showSettings = false}><X size={16}/></button></div>
            <button class="settings-row" type="button" aria-pressed={showGrid} onclick={() => showGrid = !showGrid}><Grid2X2 size={17} /><span>Show grid</span><span class:checked={showGrid} class="toggle"><i></i></span></button>
            <button class="settings-row" type="button" aria-pressed={snapGrid} onclick={() => snapGrid = !snapGrid}><Magnet size={17} /><span>Snap to grid</span><span class:checked={snapGrid} class="toggle"><i></i></span></button>
            <button class="settings-row" type="button" aria-pressed={showDimensions} onclick={() => showDimensions = !showDimensions}><Ruler size={17} /><span>Show dimensions</span><span class:checked={showDimensions} class="toggle"><i></i></span></button>
            <div class:open={floorPolygons.length === 0} class="room-status"><span class="room-status-icon">{#if floorPolygons.length}<Check size={15}/>{:else}<CircleAlert size={15}/>{/if}</span><div><strong>{floorPolygons.length ? `${floorPolygons.length} enclosed ${floorPolygons.length === 1 ? 'room' : 'rooms'}` : 'No enclosed room'}</strong><small>{openWallEnds.length ? `${openWallEnds.length} open wall ${openWallEnds.length === 1 ? 'end' : 'ends'} · connect them to close a room` : floorPolygons.length ? 'Flooring fills the enclosed space' : 'Draw at least three connected walls and return to the first corner'}</small></div></div>
            <div class="setting-group-label">FLOORING</div>
            <div class="floor-choices">{#each flooringTypes as floor}<button type="button" class:chosen={plan.flooring === floor} aria-pressed={plan.flooring === floor} onclick={() => setFlooring(floor)}><span class="floor-swatch" class:large-tile={floor.endsWith('60x120')} style:background={flooringInfo[floor].swatch}></span><span><strong>{flooringInfo[floor].label}</strong><small>{flooringInfo[floor].category}</small></span></button>{/each}</div>
           </div>
        {/if}
        <div class="editor-pill" role="toolbar" aria-label="Floor plan tools">
          <button class:active={tool === 'select'} type="button" title="Select (V)" aria-label="Select and edit" aria-pressed={tool === 'select'} onclick={() => setTool('select')}><MousePointer2 size={17} /><span>Select</span></button>
          <button class:active={tool === 'wall'} type="button" title="Draw wall (W)" aria-label="Draw walls" aria-pressed={tool === 'wall'} onclick={() => setTool('wall')}><Pencil size={17} /><span>Draw wall</span></button>
          <button class:active={tool === 'furniture' || showFurnitureDrawer} type="button" title="Add furniture" aria-label="Add furniture" aria-expanded={showFurnitureDrawer} onclick={() => { showFurnitureDrawer = !showFurnitureDrawer; showSettings = false; }}><Sofa size={17} /><span>Furniture</span></button>
          <button class:active={tool === 'comment'} type="button" title="Add comment (C)" aria-label="Add comment" aria-pressed={tool === 'comment'} onclick={() => setTool('comment')}><MessageSquarePlus size={17}/><span>Comment</span></button>
          <span class="pill-divider"></span>
          <button class:active={showSettings} class="settings-trigger" type="button" title="View settings" aria-label="View settings" aria-expanded={showSettings} onclick={() => { showSettings = !showSettings; showFurnitureDrawer = false; }}><Settings2 size={18} /></button>
        </div>
        {#if !plan.walls.length && !plan.furniture.length && !plan.comments.length}<div class="empty-state"><span class="empty-icon"><Pencil size={24} /></span><h2>Start with a wall</h2><p>Click anywhere on the canvas to place the first point, then click again to draw a wall.</p><button type="button" onclick={() => setTool('wall')}>Draw a wall <ArrowUpRight size={16} /></button></div>{/if}
        <div class="canvas-bottom-left"><span class="scale-mark"></span> 1 m <span class="bottom-separator"></span> {plan.walls.length} walls · {plan.furniture.length} items · {plan.comments.length} notes</div>
        <div class="zoom-controls"><button aria-label="Zoom out" title="Zoom out" onclick={() => zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10)}><ZoomOut size={17} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" title="Zoom in" onclick={() => zoom = Math.min(2.5, Math.round((zoom + 0.1) * 10) / 10)}><ZoomIn size={17} /></button><button aria-label="Reset view" title="Reset view" onclick={() => { zoom = 1; pan = { x: 0, y: 0 }; }}><Maximize size={16} /></button></div>
        {#if showInspector}
          <aside class="inspector"><div class="inspector-heading"><div><span class="eyebrow">PROPERTIES</span><h2>{selectedFurniture ? 'Furniture details' : selectedWall ? 'Wall details' : 'Plan overview'}</h2></div><button class="inspector-close" type="button" aria-label="Close properties" onclick={() => showInspector = false}><X size={17} /></button></div>
            {#if selectedFurniture}
              {@const selectedInfo = furnitureInfo[selectedFurniture.type]}
              <div class="inspector-section compact-identity"><div class="wall-preview"><svg class="furniture-identity-picture" viewBox={`${-selectedInfo.width / 2 - 10} ${-selectedInfo.height / 2 - 10} ${selectedInfo.width + 20} ${selectedInfo.height + 20}`} role="img" aria-label={`${selectedInfo.label} top view`}>{@html furnitureArt(selectedFurniture, `identity-${selectedFurniture.id}`)}</svg><strong>{selectedInfo.label}</strong><small>{selectedFurniture.id.slice(0, 6).toUpperCase()}</small></div></div>
              <div class="inspector-section compact-placement">
                <div class="property-row"><span>Position</span><strong>{meters(selectedFurniture.x)}, {meters(selectedFurniture.y)}</strong></div>
                <label class="compact-range" for="furniture-rotation"><span>Rotate</span><input id="furniture-rotation" type="range" min="0" max="359" step="1" value={selectedFurniture.rotation} onchange={(event) => setFurnitureProperty('rotation', event)} /><strong>{selectedFurniture.rotation}°</strong></label>
                <label class="compact-range" for="furniture-width"><span>Width</span><input id="furniture-width" type="range" min={Math.round(selectedInfo.width * 0.4)} max={Math.round(selectedInfo.width * 2.5)} step="1" value={furnitureWidth(selectedFurniture)} onchange={(event) => setFurnitureDimension('widthScale', selectedInfo.width, event)} /><strong>{furnitureWidth(selectedFurniture)} cm</strong></label>
                <label class="compact-range" for="furniture-length"><span>Length</span><input id="furniture-length" type="range" min={Math.round(selectedInfo.height * 0.4)} max={Math.round(selectedInfo.height * 2.5)} step="1" value={furnitureLength(selectedFurniture)} onchange={(event) => setFurnitureDimension('lengthScale', selectedInfo.height, event)} /><strong>{furnitureLength(selectedFurniture)} cm</strong></label>
              </div>
              <div class="inspector-section compact-finish">
                <div class="compact-finish-heading"><span class="inspector-label">MATERIAL &amp; FINISH</span>{#if (selectedFurniture.material ?? 'paint') === 'paint'}<label class="custom-color" for="furniture-color">Custom <input id="furniture-color" type="color" value={selectedFurniture.color ?? defaultColors[selectedFurniture.type]} onchange={(event) => setFurnitureColor(event.currentTarget.value)} /></label>{/if}</div>
                <div class="material-types">{#each materialTypes as material}<button type="button" class:chosen={(selectedFurniture.material ?? 'paint') === material} aria-pressed={(selectedFurniture.material ?? 'paint') === material} onclick={() => setFurnitureMaterial(material)}>{materialLabels[material]}</button>{/each}</div>
                {#if selectedFurniture.material && selectedFurniture.material !== 'paint'}
                  <div class="material-finishes">{#each materialFinishes[selectedFurniture.material] as finish}<button type="button" class:chosen={selectedFurniture.finish === finish.id} aria-label={`${finish.label} finish`} aria-pressed={selectedFurniture.finish === finish.id} onclick={() => setFurnitureFinish(finish.id)}><span class="material-swatch" style:background={finish.swatch}></span><span>{finish.label}</span></button>{/each}</div>
                {:else}
                  <div class="finish-color-row">{#each furnitureColors as color}<button type="button" class:chosen={(selectedFurniture.color ?? defaultColors[selectedFurniture.type]) === color} aria-label={`Choose ${color} colour`} aria-pressed={(selectedFurniture.color ?? defaultColors[selectedFurniture.type]) === color} style:background={color} onclick={() => setFurnitureColor(color)}></button>{/each}</div>
                  <div class="pattern-choices">{#each furniturePatterns as pattern}<button type="button" class:chosen={(selectedFurniture.pattern ?? 'solid') === pattern} aria-pressed={(selectedFurniture.pattern ?? 'solid') === pattern} onclick={() => setFurniturePattern(pattern)}>{pattern === 'check' ? 'Checked' : pattern[0].toUpperCase() + pattern.slice(1)}</button>{/each}</div>
                {/if}
              </div>
              <div class="inspector-section compact-actions"><button class="danger-button" type="button" onclick={deleteSelected}><Trash2 size={15} /> Delete furniture</button></div>
            {:else if selectedWall}
              <div class="inspector-section compact-identity"><div class="wall-preview"><span></span><strong>Wall {plan.walls.findIndex((wall) => wall.id === selectedWallId) + 1}</strong><small>{selectedWall.id.slice(0, 6).toUpperCase()}</small></div></div>
              <div class="inspector-section compact-placement"><div class="compact-metrics"><div><span>Length</span><strong>{meters(length(selectedWall))}</strong></div><div><span>Angle</span><strong>{angle(selectedWall)}°</strong></div><div><span>Thickness</span><strong>{selectedWall.thickness} cm</strong></div></div><label class="compact-range wall-range" for="thickness"><span>Thickness</span><input id="thickness" type="range" min="6" max="40" step="2" value={selectedWall.thickness} onchange={setThickness} /></label></div>
              <div class="inspector-section compact-openings"><span class="inspector-label">DOORS &amp; WINDOWS</span><div class="opening-add-row"><button type="button" onclick={() => addOpening('door')} disabled={!fitOpening(length(selectedWall), openingsOnWall(selectedWall.id), 90)}>+ Door</button><button type="button" onclick={() => addOpening('window')} disabled={!fitOpening(length(selectedWall), openingsOnWall(selectedWall.id), 120)}>+ Window</button></div>
                {#if selectedOpening && selectedOpening.wallId === selectedWall.id}
                  <div class="opening-detail-heading"><strong>{selectedOpening.type === 'door' ? 'Door' : 'Window'}</strong><button type="button" aria-label={`Delete ${selectedOpening.type}`} onclick={deleteOpening}><Trash2 size={14}/></button></div>
                  <label class="compact-range" for="opening-width"><span>Width</span><input id="opening-width" type="range" min="50" max={Math.min(240, Math.floor(length(selectedWall) - 20))} step="1" value={selectedOpening.width} onchange={(event) => changeOpening('width', event)}/><strong>{Math.round(selectedOpening.width)} cm</strong></label>
                  <label class="compact-range" for="opening-position"><span>Position</span><input id="opening-position" type="range" min="0" max="100" step="1" value={Math.round(selectedOpening.position * 100)} onchange={(event) => changeOpening('position', event)}/><strong>{Math.round(selectedOpening.position * 100)}%</strong></label>
                {:else if openingsOnWall(selectedWall.id).length}
                  <div class="opening-chips">{#each openingsOnWall(selectedWall.id) as opening}<button type="button" onclick={() => selectedOpeningId = opening.id}>{opening.type === 'door' ? 'Door' : 'Window'} · {Math.round(opening.width)} cm</button>{/each}</div>
                {/if}
              </div>
              <div class="inspector-section compact-actions"><button class="danger-button" type="button" onclick={deleteWall}><Trash2 size={15} /> Delete wall</button></div>
            {:else}
              <div class="inspector-section compact-overview"><strong>{plan.name}</strong><small>Floor plan · Draft</small></div>
              <div class="inspector-section compact-overview-stats"><div class="stat-grid"><div class="stat-card"><span>WALLS</span><strong>{plan.walls.length}</strong></div><div class="stat-card"><span>FURNITURE</span><strong>{plan.furniture.length}</strong></div></div><div class="property-row"><span>Total wall length</span><strong>{meters(totalLength)}</strong></div><div class="property-row"><span>Grid spacing</span><strong>20 cm</strong></div></div>
              <div class="inspector-section compact-floor"><span class="inspector-label">FLOORING</span><div class="floor-summary"><span class="floor-swatch" class:large-tile={plan.flooring.endsWith('60x120')} style:background={flooringInfo[plan.flooring].swatch}></span><span><strong>{flooringInfo[plan.flooring].label}</strong><small>{plan.flooring === 'none' ? 'Change in View settings' : floorPolygons.length ? `Applied to ${floorPolygons.length} ${floorPolygons.length === 1 ? 'room' : 'rooms'}` : 'Connect wall ends to apply'}</small></span></div>{#if activeTemplate}<a class="template-origin" href={activeTemplate.sourceUrl} target="_blank" rel="noopener noreferrer">Started from {activeTemplate.source} <ArrowUpRight size={13}/></a>{/if}</div>
            {/if}
          </aside>
        {:else}
          <button class="properties-reopen" type="button" onclick={() => showInspector = true}><Ruler size={16} /> Properties</button>
        {/if}
      </div>

      <div class="status-bar"><div><span class="status-pulse"></span>{tool === 'wall' ? (drawStart ? 'Click to place the next point · Esc to stop' : 'Click to start drawing a wall') : tool === 'furniture' ? `Click to place ${furnitureInfo[placementType].label.toLowerCase()}` : tool === 'comment' ? 'Click the canvas to add a comment' : 'Drag empty canvas to pan · Select objects to edit'}</div><div>Space + drag to pan anytime <span>•</span> Autosaved in this browser</div></div>
    </div>
  </main>


</div>

{#if showTemplatePicker}
  <div class="template-picker-backdrop" role="presentation" onpointerdown={(event) => { if (event.target === event.currentTarget) showTemplatePicker = false; }}>
    <div class="template-picker" role="dialog" aria-modal="true" aria-label="Start a new plan" tabindex="-1">
      <div class="template-picker-heading"><div><span class="eyebrow">NEW PLAN</span><h2>Choose a starting point</h2><p>Original sketches inspired by published Maltese plans. Layouts and sizes are illustrative.</p></div><button type="button" aria-label="Close templates" onclick={() => showTemplatePicker = false}><X size={18}/></button></div>
      <div class="template-grid">
        <div class="template-card">
          <button class="template-card-action" type="button" onclick={() => newPlan()} aria-label="Create blank plan">
            <span class="template-preview blank-preview"><Plus size={33}/></span>
            <span class="template-card-copy"><small>START FROM SCRATCH</small><strong>Blank plan</strong><span>Draw your own walls and rooms.</span></span>
          </button>
          <div class="template-card-footer"><span>Empty canvas</span></div>
        </div>
        {#each planTemplates as template (template.id)}
          <div class="template-card">
            <button class="template-card-action" type="button" onclick={() => newPlan(template.id)} aria-label={`Use ${template.name} template`}>
              <span class="template-preview"><svg viewBox={template.viewBox} aria-hidden="true">
                {#each closedRoomPolygons(template.plan.vertices, template.plan.walls) as points}<polygon {points} fill="#ece5d4" />{/each}
                {#each template.plan.walls as wall}{@const a = template.plan.vertices.find((point) => point.id === wall.from)}{@const b = template.plan.vertices.find((point) => point.id === wall.to)}{#if a && b}<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#57554b" stroke-width={wall.thickness + 4} stroke-linecap="round" />{/if}{/each}
                {#each template.plan.furniture as item}<g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}>{@html furnitureArt(item, `${template.id}-${item.id}`)}</g>{/each}
              </svg></span>
              <span class="template-card-copy"><small>{template.type.toUpperCase()}</small><strong>{template.name}</strong><span>{template.description}</span></span>
            </button>
            <div class="template-card-footer"><span>{template.spaces}</span><a href={template.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`View source for ${template.name}`}>Source <ArrowUpRight size={12}/></a></div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if paletteDrag?.moved}{@const dragInfo = furnitureInfo[paletteDrag.type]}<div class="furniture-drag-ghost" style:left={`${paletteDrag.x + 13}px`} style:top={`${paletteDrag.y + 13}px`}><svg class="furniture-drag-picture" viewBox={`${-dragInfo.width / 2 - 8} ${-dragInfo.height / 2 - 8} ${dragInfo.width + 16} ${dragInfo.height + 16}`} aria-hidden="true">{@html furniturePreview(paletteDrag.type, 'drag-preview')}</svg><span>{dragInfo.label}</span></div>{/if}

{#if showHelp}<div class="modal-backdrop" role="presentation" onpointerdown={(event) => { if (event.target === event.currentTarget) showHelp = false; }}><div class="modal" role="dialog" tabindex="-1" aria-modal="true" aria-label="How to use Forma"><button class="modal-close" aria-label="Close" onclick={() => showHelp = false}><X size={20} /></button><span class="eyebrow">GUIDE</span><h2>Design your space</h2><p>Draw walls by clicking points on the canvas. Wall ends snap together when they are close. Drag a corner onto another corner to join existing walls.</p><ul><li><strong>W</strong> Draw walls at any angle</li><li><strong>Shift</strong> Snap while drawing to 15° increments</li><li><strong>V</strong> Select walls, furniture, and corners</li><li><strong>Drag canvas</strong> Pan on empty space, or hold Space while dragging</li><li><strong>Furniture</strong> Select an item to change its colour and pattern</li><li><strong>Settings</strong> Choose wood or tile flooring</li><li><strong>Delete</strong> Remove the selected item</li><li><strong>⌘/Ctrl + Z</strong> Undo an edit</li></ul><button class="primary-button" onclick={() => showHelp = false}>Got it <ArrowUpRight size={16} /></button></div></div>{/if}
