# Forma floor plan studio

A Svelte 5 floor plan editor with free-angle walls and connected corners.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run check` and `npm run build` to verify the project.

## Use the editor

- Use the floating toolbar at the bottom of the canvas. Choose **Draw wall** (or press `W`), then click points on the canvas. Hold `Shift` to snap to 15° angles. Click an existing corner to connect a wall to it.
- Choose **Select** (or press `V`) to select walls and drag corners. Set a wall's thickness in the properties panel.
- Drag an empty part of the canvas to pan. Hold `Space` and drag, or use the middle mouse button, to pan while another tool is active. **Reset view** restores the original zoom and position.
- Open **Furniture** to drag any of twelve items onto the canvas. You can also choose an item, then click the canvas to place it. Select furniture to move, rotate, resize, delete, or change its colour and pattern in the properties panel.
- Open the **settings cog** to show or hide the grid and dimensions, toggle grid snapping, and choose light or dark wood or tile flooring. Flooring fills enclosed rooms.
- Use `Delete` to remove a selected wall or furniture item and `Ctrl/Cmd+Z` to undo. Plans save automatically in your browser.
- Export an SVG drawing or JSON plan with furniture finishes and flooring. JSON plans can be imported back into the editor.

Coordinates and wall thicknesses are in centimetres. The sample plan includes slanted walls and can be replaced with **New plan**.
