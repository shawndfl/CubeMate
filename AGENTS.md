# CubeMate

Browser-based first-person voxel sandbox using TypeScript, Three.js, and Vite.

- Keep world data independent of Three.js and the DOM. Blocks use integer coordinates; air is block 0.
- World bounds are finite. Update neighboring chunk meshes when editing a boundary block.
- Keep input, player physics, rendering, and UI in their respective modules.
- Use original or procedurally generated visuals; do not add Minecraft assets.
- Run `npm test` and `npm run build` after gameplay changes. Add focused tests for world or collision edge cases.
- Manually check pointer lock, movement, jumping, and block edits in a browser when browser automation is available. Report any checks that could not be run.
- Do not commit generated `dist` or `node_modules` files.

Start locally with `npm install` then `npm run dev`.
