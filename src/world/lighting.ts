import { BLOCKS, CHUNK, HEIGHT, SIZE } from './blocks.ts';
import type { World } from './world.ts';

const indexOf = (x: number, y: number, z: number) => x + SIZE * (z + SIZE * y);
const LAYER = SIZE * SIZE;

// Light occupies air cells. Solid blocks stop both sunlight and emitted light.
export class VoxelLighting {
  sky = new Uint8Array(SIZE * SIZE * HEIGHT);
  block = new Uint8Array(SIZE * SIZE * HEIGHT);
  update(world: World) {
    const sky = new Uint8Array(this.sky.length),
      block = new Uint8Array(this.block.length);
    const skyQueue: number[] = [],
      blockQueue: number[] = [];
    for (let x = 0; x < SIZE; x++)
      for (let z = 0; z < SIZE; z++) {
        for (let y = HEIGHT - 1; y >= 0 && !this.occludes(world.get(x, y, z)); y--) {
          const index = indexOf(x, y, z);
          sky[index] = 15;
        }
      }
    for (let i = 0; i < world.data.length; i++) {
      const emittedLight = BLOCKS[world.data[i]].light;
      if (emittedLight) {
        block[i] = emittedLight;
        blockQueue.push(i);
      }
    }
    // Only the edge of direct sunlight needs propagation into shaded air.
    for (let i = 0; i < sky.length; i++)
      if (sky[i] === 15) {
        const x = i % SIZE,
          z = Math.floor(i / SIZE) % SIZE;
        if (
          (x > 0 && !sky[i - 1] && !this.occludes(world.data[i - 1])) ||
          (x < SIZE - 1 && !sky[i + 1] && !this.occludes(world.data[i + 1])) ||
          (z > 0 && !sky[i - SIZE] && !this.occludes(world.data[i - SIZE])) ||
          (z < SIZE - 1 && !sky[i + SIZE] && !this.occludes(world.data[i + SIZE]))
        )
          skyQueue.push(i);
      }
    const spread = (values: Uint8Array, queue: number[]) => {
      for (let head = 0; head < queue.length; head++) {
        const index = queue[head];
        const level = values[index] - 1;
        if (level <= 0) {
          continue;
        }
        const x = index % SIZE;
        const z = Math.floor(index / SIZE) % SIZE;
        const visit = (next: number) => {
          if (this.occludes(world.data[next]) || values[next] >= level) return;
          values[next] = level;
          queue.push(next);
        };
        if (x > 0) visit(index - 1);
        if (x < SIZE - 1) visit(index + 1);
        if (z > 0) visit(index - SIZE);
        if (z < SIZE - 1) visit(index + SIZE);
        if (index >= LAYER) visit(index - LAYER);
        if (index < values.length - LAYER) visit(index + LAYER);
      }
    };
    spread(sky, skyQueue);
    spread(block, blockQueue);
    // Rebuild only chunks with changed lighting, including faces across borders.
    const changedColumns = new Uint8Array(LAYER);
    for (let i = 0; i < sky.length; i++)
      if (sky[i] !== this.sky[i] || block[i] !== this.block[i]) changedColumns[i % LAYER] = 1;
    for (let column = 0; column < LAYER; column++)
      if (changedColumns[column]) {
        const x = column % SIZE,
          z = Math.floor(column / SIZE);
        for (const dx of [-1, 0, 1])
          for (const dz of [-1, 0, 1]) {
            if (x + dx >= 0 && x + dx < SIZE && z + dz >= 0 && z + dz < SIZE)
              world.dirty.add(`${Math.floor((x + dx) / CHUNK)},${Math.floor((z + dz) / CHUNK)}`);
          }
      }
    this.sky = sky;
    this.block = block;
  }
  sample(x: number, y: number, z: number): [number, number] {
    if (x < 0 || z < 0 || y >= HEIGHT || x >= SIZE || z >= SIZE) return [1, 0];
    if (y < 0) return [0, 0];
    const i = indexOf(x, y, z);
    return [this.sky[i] / 15, this.block[i] / 15];
  }
  private occludes(block: number) { return block !== 0 && BLOCKS[block].occludes !== false; }
}

// Three cells outside a face meet at each vertex: two sides and their corner.
export function vertexAO(world: World, x: number, y: number, z: number, normal: number[], vertex: number[]) {
  const base = [x + normal[0], y + normal[1], z + normal[2]];
  const axes = [0, 1, 2].filter((axis) => normal[axis] === 0);
  const a = [...base],
    b = [...base],
    corner = [...base];
  a[axes[0]] += vertex[axes[0]] ? 1 : -1;
  b[axes[1]] += vertex[axes[1]] ? 1 : -1;
  corner[axes[0]] = a[axes[0]];
  corner[axes[1]] = b[axes[1]];
  const sideA = Number(occludes(world.get(a[0], a[1], a[2])));
  const sideB = Number(occludes(world.get(b[0], b[1], b[2])));
  const diagonal = Number(occludes(world.get(corner[0], corner[1], corner[2])));
  const level = sideA && sideB ? 0 : 3 - sideA - sideB - diagonal;
  return [0.45, 0.65, 0.82, 1][level];
}

function occludes(block: number) { return block !== 0 && BLOCKS[block].occludes !== false; }
