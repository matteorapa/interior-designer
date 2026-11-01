# Forma floor plan studio

A Svelte 5 floor plan editor with free-angle walls and connected corners.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run check` and `npm run build` to verify the project.

## Use the editor

- Use the floating toolbar at the bottom of the canvas. Choose **Draw wall** (or press `W`), then click points on the canvas. Hold `Shift` to snap to 15° angles. Finish by clicking the first corner again to enclose the room; clicking an existing corner connects the wall to that exact point.
- Use the workspace toolbar above the canvas for **Export**, **Import**, **Undo**, and **Redo**. **New plan** sits beside the plan tabs in the same row and opens a chooser for a blank plan or a Maltese building template. New and imported plans open in separate tabs. Switch tabs to move between plans; use the pencil on the active tab to rename it or the × to close it. Each tab has its own undo history, and open plans save in your browser.
- Choose **Select** (or press `V`) to select walls and drag corners. Set a wall's thickness in the properties panel. Use **+ Door** or **+ Window** on a selected wall to insert an opening. Select or drag an opening along its wall; adjust its width and position in Properties. Doors and windows leave the room enclosed for flooring.
- Drag an empty part of the canvas to pan. Hold `Space` and drag, or use the middle mouse button, to pan while another tool is active. **Reset view** restores the original zoom and position.
- Open **Furniture** to browse 69 items across living room, kitchen, bedroom, and bathroom categories, or search by name. The catalog includes square, round, oval, and rectangular coffee tables alongside other furniture and fixtures. Drag an item onto the canvas, or choose it and click the canvas to place it. Select furniture to move, rotate, resize, or delete it. Choose a material and finish in Properties: wood grains, fabric weaves, stone surfaces, or a painted colour and pattern.
- The canvas spans the editor. **Properties** floats over its right side and can be closed or reopened. Selecting an item opens it automatically.
- Select a furniture item, then drag the circular handle to rotate it or the corner handle to adjust width and length independently. Its measurements appear on the canvas, and the properties popup has separate width and length sliders in centimetres. Hold `Shift` while rotating to snap to 15° increments.
- Choose **Comment** in the floating toolbar, click the canvas, type a note, and save it. Drag its speech bubble icon to move it; click the icon to read, edit, or delete the text. Closed notes show only the icon.
- Open the **settings cog** to show or hide the grid and dimensions, toggle grid snapping, and choose wood or tile flooring, including 60 × 120 cm marble, concrete, and terrazzo tiles. The settings show how many rooms are enclosed. Flooring fills enclosed rooms; open wall ends are highlighted when a floor is selected. If one connected wall chain has two open ends, use **Connect the two open ends** to close it.
- Use `Delete` to remove a selected wall, opening, or furniture item and `Ctrl/Cmd+Z` to undo. Plans save automatically in your browser.
- Export an SVG drawing or JSON plan with furniture finishes and flooring. JSON plans can be imported back into the editor.

Coordinates and wall thicknesses are in centimetres. The sample plan includes slanted walls and remains available when you open a new plan tab.

## Maltese starting templates

The templates are original, editable sketches inspired by published plans. Their dimensions and room placements are illustrative, so they should not be used as surveys or construction drawings. Each template links to its source in the chooser and plan overview.

- **Paola townhouse:** side hall, sitting area, and kitchen/dining, informed by an [Ownersbest townhouse survey](https://imagecache.ownersbest.com.mt/146-572269-paola-townhouse.pdf).
- **Sliema maisonette:** bedroom and bathroom beside an open living space, informed by the [Sunshine Court brochure](https://langart.net/static/upload/6ccc8c2ca30578ecef9c828afc45e49e/62eaa2c2769275e5cf4fc89522afd415.pdf).
- **Għaxaq terrace:** garage frontage, WC, sitting area, and kitchen/dining, informed by [published proposed plans](https://ici.com.mt/wp-content/uploads/2023/02/M_08_23_PROPOSED-PLANS_FEB-2023-1.pdf).
