import { CHUNK, GLOW_BRICK, HEIGHT, SIZE } from './blocks.ts';
import type { World } from './world.ts';

const indexOf = (x: number, y: number, z: number) => x + SIZE * (z + SIZE * y);
const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

// Light occupies air cells. Solid blocks stop both sunlight and emitted light.
export class VoxelLighting {
  sky = new Uint8Array(SIZE * SIZE * HEIGHT);
  block = new Uint8Array(SIZE * SIZE * HEIGHT);
  update(world: World) {
    const sky = new Uint8Array(this.sky.length), block = new Uint8Array(this.block.length);
    const skyQueue: number[] = [], blockQueue: number[] = [];
    for (let x = 0; x < SIZE; x++) for (let z = 0; z < SIZE; z++) {
      for (let y = HEIGHT - 1; y >= 0 && !world.get(x, y, z); y--) {
        const index = indexOf(x, y, z);
        sky[index] = 15; skyQueue.push(index);
      }
    }
    for (let i = 0; i < world.data.length; i++) if (world.data[i] === GLOW_BRICK) {
      block[i] = 15; blockQueue.push(i);
    }
    const spread = (values: Uint8Array, queue: number[]) => {
      for (let head = 0; head < queue.length; head++) {
        const index = queue[head], level = values[index] - 1;
        if (level <= 0) continue;
        const x = index % SIZE, z = Math.floor(index / SIZE) % SIZE, y = Math.floor(index / (SIZE * SIZE));
        for (const [dx, dy, dz] of neighbors) {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (!world.inside(nx, ny, nz) || world.get(nx, ny, nz)) continue;
          const next = indexOf(nx, ny, nz);
          if (values[next] >= level) continue;
          values[next] = level; queue.push(next);
        }
      }
    };
    spread(sky, skyQueue); spread(block, blockQueue);
    // Rebuild only chunks with changed lighting, including faces across borders.
    for (let i = 0; i < sky.length; i++) if (sky[i] !== this.sky[i] || block[i] !== this.block[i]) {
      const x = i % SIZE, z = Math.floor(i / SIZE) % SIZE;
      for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
        if (x + dx >= 0 && x + dx < SIZE && z + dz >= 0 && z + dz < SIZE)
          world.dirty.add(`${Math.floor((x + dx) / CHUNK)},${Math.floor((z + dz) / CHUNK)}`);
      }
    }
    this.sky = sky; this.block = block;
  }
  sample(x: number, y: number, z: number): [number, number] {
    if (x < 0 || z < 0 || y >= HEIGHT || x >= SIZE || z >= SIZE) return [1, 0];
    if (y < 0) return [0, 0];
    const i = indexOf(x, y, z);
    return [this.sky[i] / 15, this.block[i] / 15];
  }
}

// Three cells outside a face meet at each vertex: two sides and their corner.
export function vertexAO(world: World, x: number, y: number, z: number, normal: number[], vertex: number[]) {
  const base = [x + normal[0], y + normal[1], z + normal[2]];
  const axes = [0, 1, 2].filter(axis => normal[axis] === 0);
  const a = [...base], b = [...base], corner = [...base];
  a[axes[0]] += vertex[axes[0]] ? 1 : -1;
  b[axes[1]] += vertex[axes[1]] ? 1 : -1;
  corner[axes[0]] = a[axes[0]]; corner[axes[1]] = b[axes[1]];
  const sideA = Number(!!world.get(a[0], a[1], a[2]));
  const sideB = Number(!!world.get(b[0], b[1], b[2]));
  const diagonal = Number(!!world.get(corner[0], corner[1], corner[2]));
  const level = sideA && sideB ? 0 : 3 - sideA - sideB - diagonal;
  return [0.45, 0.65, 0.82, 1][level];
}
