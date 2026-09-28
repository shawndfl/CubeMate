import type { World } from './world.ts';
export type Vec = { x: number; y: number; z: number };

/**
 * Trace through the world and see with gets hit.
 * @param world
 * @param origin
 * @param direction
 * @param reach
 * @returns
 */
export function trace(world: World, origin: Vec, direction: Vec, reach = 6) {
  const cell = { x: Math.floor(origin.x), y: Math.floor(origin.y), z: Math.floor(origin.z) };
  const axes = ['x', 'y', 'z'] as const;
  const step = { x: Math.sign(direction.x), y: Math.sign(direction.y), z: Math.sign(direction.z) };
  const delta = { x: Math.abs(1 / direction.x), y: Math.abs(1 / direction.y), z: Math.abs(1 / direction.z) };
  const next = { x: Infinity, y: Infinity, z: Infinity };
  for (const a of axes) {
    if (direction[a]) {
      next[a] = (cell[a] + (step[a] > 0 ? 1 : 0) - origin[a]) / direction[a];
    }
  }
  let previous = { ...cell };
  let distance = 0;

  // search for
  while (distance <= reach) {
    if (world.get(cell.x, cell.y, cell.z)) {
      return { block: { ...cell }, adjacent: previous };
    }
    const axis = next.x <= next.y && next.x <= next.z ? 'x' : next.y <= next.z ? 'y' : 'z';
    if (!Number.isFinite(next[axis])) break;
    previous = { ...cell };
    distance = next[axis];
    cell[axis] += step[axis];
    next[axis] += delta[axis];
  }
  return null;
}
