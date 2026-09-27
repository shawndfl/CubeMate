import { BLOCKS, CHUNK, HEIGHT, SIZE } from './blocks.ts';
import { START_TIME } from './day-cycle.ts';

export class World {
  timeOfDay = START_TIME;
  readonly data = new Uint8Array(SIZE * SIZE * HEIGHT);
  readonly dirty = new Set<string>();
  readonly edits = new Map<number, number>();
  private original: Uint8Array;
  readonly seed: number;
  constructor(seed = 7319) { this.seed = seed; this.generate(); this.original = this.data.slice(); }
  inside(x: number, y: number, z: number) {
    return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) && x >= 0 && z >= 0 && y >= 0 && x < SIZE && z < SIZE && y < HEIGHT;
  }
  get(x: number, y: number, z: number): number {
    return this.inside(x, y, z) ? this.data[x + SIZE * (z + SIZE * y)] : 0;
  }
  set(x: number, y: number, z: number, block: number): boolean {
    if (!this.inside(x, y, z) || y === 0 || !Number.isInteger(block) || block < 0 || block >= BLOCKS.length) return false;
    if (this.get(x, y, z) === block) return false;
    const index = x + SIZE * (z + SIZE * y);
    this.data[index] = block;
    if (this.original) {
      if (block === this.original[index]) this.edits.delete(index);
      else this.edits.set(index, block);
    }
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
      if (x + dx >= 0 && x + dx < SIZE && z + dz >= 0 && z + dz < SIZE)
        this.dirty.add(`${Math.floor((x + dx) / CHUNK)},${Math.floor((z + dz) / CHUNK)}`);
    }
    return true;
  }
  surface(x: number, z: number) {
    for (let y = HEIGHT - 1; y >= 0; y--) if (this.get(x, y, z)) return y + 1;
    return 1;
  }
  savedEdits(): number[][] {
    return [...this.edits].map(([index, block]) => {
      const x = index % SIZE, z = Math.floor(index / SIZE) % SIZE, y = Math.floor(index / (SIZE * SIZE));
      return [x, y, z, block];
    });
  }
  private noise(x: number, z: number) {
    const value = Math.sin(x * 127.1 + z * 311.7 + this.seed) * 43758.5453;
    return value - Math.floor(value);
  }
  private smooth(x: number, z: number, scale: number) {
    const gx = Math.floor(x / scale), gz = Math.floor(z / scale);
    const fx = x / scale - gx, fz = z / scale - gz;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = this.noise(gx, gz) * (1 - u) + this.noise(gx + 1, gz) * u;
    const b = this.noise(gx, gz + 1) * (1 - u) + this.noise(gx + 1, gz + 1) * u;
    return a * (1 - v) + b * v;
  }
  private generate() {
    for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
      const top = Math.floor(7 + this.smooth(x, z, 24) * 12 + this.smooth(x, z, 8) * 3);
      for (let y = 0; y <= top; y++)
        this.data[x + SIZE * (z + SIZE * y)] = y === top ? (top < 11 ? 4 : 1) : y > top - 4 ? 2 : 3;
    }
    for (let z = 5; z < SIZE - 5; z += 5) for (let x = 5; x < SIZE - 5; x += 5) {
      if (this.noise(x, z) < 0.68 || Math.hypot(x - 48, z - 48) < 8) continue;
      const base = this.surface(x, z);
      if (this.get(x, base - 1, z) !== 1) continue;
      for (let y = base + 2; y < base + 6; y++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.max(0, y - base - 3) < 5 && !this.get(x + dx, y, z + dz)) this.set(x + dx, y, z + dz, 6);
      }
      for (let y = base; y < base + 4; y++) this.set(x, y, z, 5);
    }
    for (let z = 0; z < SIZE / CHUNK; z++) for (let x = 0; x < SIZE / CHUNK; x++) this.dirty.add(`${x},${z}`);
  }
}
