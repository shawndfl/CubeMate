import { BLOCKS } from '../world/blocks.ts';

/** Nine persistent slots, with no duplicate block selections. */
export class Hotbar {
  readonly blocks = Array.from({ length: Math.min(9, BLOCKS.length - 1) }, (_, index) => index + 1);

  replace(slot: number, block: number) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= this.blocks.length ||
      !Number.isInteger(block) || block <= 0 || block >= BLOCKS.length) return false;
    const existing = this.blocks.indexOf(block);
    if (existing >= 0) this.blocks[existing] = this.blocks[slot];
    this.blocks[slot] = block;
    return true;
  }

  restore(raw: string | null) {
    try {
      const blocks: unknown = JSON.parse(raw ?? 'null');
      if (!Array.isArray(blocks) || blocks.length !== this.blocks.length || new Set(blocks).size !== blocks.length ||
        !blocks.every(id => Number.isInteger(id) && id > 0 && id < BLOCKS.length)) return;
      this.blocks.splice(0, this.blocks.length, ...blocks);
    } catch { /* Keep defaults for missing or invalid preferences. */ }
  }
}
