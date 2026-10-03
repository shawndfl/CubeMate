# CubeMate

A small first-person voxel sandbox built with TypeScript, Three.js, and Vite. Original procedural block textures, seeded hills and trees, a seven-block palette, chunk meshes, and fixed-step player physics.

## Run

Requires Node.js 22.18+ (or Node.js 24+) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Continue** to capture the mouse and enter the world. WASD moves, mouse looks, Space jumps, Shift runs, left-click breaks, right-click places, 1–7 selects a block, and Escape pauses. Press F to toggle inspect mode: fly in the direction you look with WASD, rise with Space, descend with C, and boost with Shift. Inspect mode ignores terrain and world boundaries. If you exit inspect mode inside a block or beyond the world boundary, you return to the position where you entered it. The bottom stone layer is protected. World edges stop the player in normal mode.

The main menu offers **Continue** and **Settings**. Escape opens the pause menu with **Resume**, **Settings**, and **Return to Main Menu**. Settings has a mouse sensitivity slider from 0.1× to 3.0×; the default is 1.0×. Changes apply immediately and persist in browser storage separately from the world save. Back (or Escape in Settings) returns to the menu you came from. Click Continue or Resume to capture the mouse again.

All menus stop movement, block actions, and the day/night cycle. Leaving gameplay clears held controls and immediately flushes autosave. Switching tabs or losing window focus also pauses. Returning to the main menu keeps the current world intact.

Hold left or right mouse button to keep breaking or placing blocks. The first action happens immediately, then repeats every 200 ms until release.

Select **7 — Glow Brick** to place a warm light source. Glow bricks stay bright at night and illuminate nearby air up to 14 blocks away along unobstructed paths. Solid blocks stop the light; removing a glow brick updates nearby surfaces. Vertex ambient occlusion darkens corners and crevices, while fixed face shading and propagated skylight give terrain a voxel-style appearance. Light and AO update across chunk boundaries. Existing saves remain compatible.

Lava (block ID 8) animates through the four atlas frames at 5 frames per second. Its chunk geometry stays intact; only the affected UV attributes update as the animation advances.

A sun and moon track a ten-minute day/night cycle with changing sky, fog, and lighting. The cycle pauses when gameplay is paused and its progress is autosaved. Night retains enough ambient light to build and explore. Adjust `DAY_DURATION` in `src/world/day-cycle.ts` to change the cycle length.

```sh
npm test
npm run build
npm run preview
```

For GitHub Pages, `npm run build` writes the production site to `docs/`, including `.nojekyll`. Commit and push `docs/` along with source changes after rebuilding. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select your publishing branch and **/docs**, then save. Relative asset paths support hosting under `/CubeMate/`. The hosted atlas editor supports copying definitions; direct saves require the local development server. Keep `docs/` dedicated to generated site files because each build replaces its contents.

## Structure

### Atlas textures and new blocks

World faces and hotbar icons use `public/atlas.png`. The image is 1024 × 1024 pixels; texture rectangles are measured from its top-left corner. Rendering uses nearest filtering without mipmaps, plus half-pixel UV insets to avoid neighboring tiles bleeding into faces. AO, face shading, and glow lighting still multiply the textured surface.

Open **Settings → Open atlas picker** to launch the atlas in a separate window. Click a tile to select a 16 × 16 rectangle. Zoom and scroll to inspect small tiles, or type x, y, width, and height for larger/non-grid rectangles. Use **Copy x, y** for a concise pair such as `416, 80`, or **Copy full rectangle** for all four values. The preview and coordinates update immediately. Selecting a tile only inspects it; it does not edit your world or block definitions.

The picker also loads `BLOCKS` into a block editor. Select an existing block or click **Add block**, then edit its name, color, and occlusion. Select an atlas rectangle and use **Use selected rectangle** to assign it to the top, bottom, sides, or all faces. Click a face preview to inspect its current rectangle. Color controls the hotbar fallback; existing tint, light, and animation properties are preserved (animated blocks still render their animation frames).

With `npm run dev`, **Save to blocks.ts** writes the definitions directly to `src/world/blocks.ts`; the game reloads to use them. The editor rejects saves if that file changed after the picker loaded. **Copy BLOCKS** exports the declaration for manual use, including on production builds where direct saving is disabled. New blocks append to the array to preserve saved IDs; Air is read-only. Unsaved edits stay in the picker window.

Alternatively, in `src/world/blocks.ts`, append a new entry to `BLOCKS`:

```ts
{
  name: 'Custom Block',
  color: '#ffffff', // Hotbar fallback color
  tint: '#ffffff', // White preserves the atlas colors
  textures: {
    top: { x: 192, y: 128, width: 16, height: 16 },
    bottom: { x: 192, y: 128, width: 16, height: 16 },
    side: { x: 16, y: 240, width: 16, height: 16 },
  },
},
```

Replace these example wood rectangles with values from the picker. `Atlas.all(x, y)` uses one 16 × 16 tile for all faces. `Atlas.tile(x, y)` defines a single 16 × 16 rectangle. Never reorder existing block entries: IDs 0–7 remain Air through Glow Brick, and saves store those IDs. The hotbar populates from this list; number keys support slots 1–9. Glow behavior remains assigned to `GLOW_BRICK` (ID 7).

If replacing the image with a differently sized atlas, update `Atlas.width` and `Atlas.height` and the block rectangles. Existing world saves do not store textures and need no migration.

Manual atlas checks pending (browser automation unavailable): open the picker in a separate window; select tiles after scrolling and zooming; try both clipboard buttons and the clipboard fallback; inspect grass/log top, bottom, and side faces; verify glow bricks at night and AO at corners; reload an existing save.

- `src/world`: deterministic terrain, block data, edit invalidation, voxel ray traversal.
- `src/rendering`: exposed-face chunk meshes, lighting, procedural texture, target outline.
- `src/player`: player bounds, collision, gravity, jumping.
- `src/input`: keyboard and pointer lock.
- `src/game`: fixed-step simulation and interaction orchestration.
- `src/game/state.ts`: main, playing, paused, and settings transitions; pointer-lock entry and pause effects.
- `src/game/settings.ts`: sensitivity validation and browser persistence.
- `src/ui`: start/pause panel and block palette.

The world is 96 × 48 × 96 blocks, split into 16 × 16 horizontal chunks. Only exposed faces are rendered. Edits rebuild the affected chunk and its neighbors at boundaries; replaced GPU geometry is disposed. Physics advances at 120 Hz with a capped frame delta.

This initial framework targets desktop browsers with WebGL and pointer lock. Block edits, player position and view, inspect mode, and selected block save automatically to this browser's local storage and restore on reload. Clearing site data removes the save. The save is local to this browser and origin; private browsing or disabled/full storage may prevent it. There are no mobile controls, multiplayer, crafting, or streamed terrain yet. Fonts optionally load from Google Fonts with system fallbacks.

## Stage 1 manual browser checks

Automated tests cover state transitions, failed/cancelled pointer capture, input reset, settings validation and storage failures. These browser checks remain pending because browser automation was unavailable:

1. Load the main menu, open Settings, change sensitivity, reload, and verify the value persists. Verify Back and Escape return to the main menu.
2. Click Continue, then hold movement and a mouse button while pressing Escape. Confirm the pause menu appears, the cursor is free, actions stop, and the sun/moon stops moving.
3. Open Settings from pause, return, and click Resume. Confirm there is no movement or block action until you press controls again, and mouse speed matches the setting.
4. Place a block, pause immediately, return to the main menu, and reload. Continue should restore the edit, position, inspect mode, and time of day.
5. Switch tabs or focus another window while playing. Returning should show the pause menu. Denied pointer capture should leave the menu visible with a retry message.
6. Check menus using keyboard navigation and on a short browser window; verify wall climbing, building, inspect mode, and glow lighting still work after resuming.


Press **Tab** during play to open the block picker and release the cursor. Select one of the nine hotbar slots, then choose a block from the grid. Choosing an already active block swaps its slot with the target slot. Click **Done** to recapture the mouse and resume. The hotbar layout is saved in this browser; number keys **1–9** select its slots.
