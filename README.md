# CubeMate

A small first-person voxel sandbox built with TypeScript, Three.js, and Vite. Original procedural block textures, seeded hills and trees, a six-block palette, chunk meshes, and fixed-step player physics.

## Run

Requires Node.js 22.18+ (or Node.js 24+) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Enter the world** to capture the mouse. WASD moves, mouse looks, Space jumps, Shift runs, left-click breaks, right-click places, 1–6 selects a block, and Escape pauses. Press F to toggle inspect mode: fly in the direction you look with WASD, rise with Space, descend with C, and boost with Shift. Inspect mode ignores terrain and world boundaries. If you exit inspect mode inside a block or beyond the world boundary, you return to the position where you entered it. The bottom stone layer is protected. World edges stop the player in normal mode.

```sh
npm test
npm run build
npm run preview
```

## Structure

- `src/world`: deterministic terrain, block data, edit invalidation, voxel ray traversal.
- `src/rendering`: exposed-face chunk meshes, lighting, procedural texture, target outline.
- `src/player`: player bounds, collision, gravity, jumping.
- `src/input`: keyboard and pointer lock.
- `src/game`: fixed-step simulation and interaction orchestration.
- `src/ui`: start/pause panel and block palette.

The world is 96 × 48 × 96 blocks, split into 16 × 16 horizontal chunks. Only exposed faces are rendered. Edits rebuild the affected chunk and its neighbors at boundaries; replaced GPU geometry is disposed. Physics advances at 120 Hz with a capped frame delta.

This initial framework targets desktop browsers with WebGL and pointer lock. Block edits, player position and view, inspect mode, and selected block save automatically to this browser's local storage and restore on reload. Clearing site data removes the save. The save is local to this browser and origin; private browsing or disabled/full storage may prevent it. There are no mobile controls, multiplayer, crafting, or streamed terrain yet. Fonts optionally load from Google Fonts with system fallbacks.
