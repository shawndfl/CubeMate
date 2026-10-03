import { Atlas, type FaceTextures, type TextureRect } from '../world/atlas.ts';
import type { Block } from '../world/blocks.ts';

/** Editable copies retain persistent IDs and properties outside the editor. */
export class BlockEditor {
  static replaceDefinition(source: string, blocks: unknown) {
    // limited to 256 blocks
    if (!Array.isArray(blocks) || !blocks.length || blocks.length > 256) {
      throw new Error('Invalid block count.');
    }

    for (const block of blocks) {
      if (
        !block ||
        typeof block.name !== 'string' ||
        !block.name.trim() ||
        typeof block.color !== 'string' ||
        !/^#[\da-f]{6}$/i.test(block.color) ||
        typeof block.tint !== 'string' ||
        !/^#[\da-f]{6}$/i.test(block.tint) ||
        (block.occludes !== undefined && typeof block.occludes !== 'boolean') ||
        (block.light !== undefined && (!Number.isInteger(block.light) || block.light < 1 || block.light > 15))
      ) {
        throw new Error('Invalid block properties.');
      }

      for (const face of ['top', 'bottom', 'side']) {
        const rect = block.textures?.[face];
        if (!rect || !Atlas.valid(rect)) {
          throw new Error('Invalid face rectangle.');
        }
      }
      if (
        block.animation !== undefined &&
        (!Array.isArray(block.animation) ||
          !block.animation.length ||
          !block.animation.every((rect: TextureRect) => rect && Atlas.valid(rect)))
      )
        throw new Error('Invalid animation.');
    }
    if (blocks[0].name !== 'Air' || blocks[0].occludes !== false) {
      throw new Error('Air must remain block 0.');
    }

    const pattern = /export const BLOCKS: readonly Block\[\] = \[[\s\S]*?\] as const;/;
    if (!pattern.test(source)) {
      throw new Error('Could not locate the BLOCKS declaration.');
    }

    // replace the source with the new value
    return source.replace(pattern, () => new BlockEditor(blocks).definition());
  }

  readonly blocks: Block[];

  constructor(blocks: readonly Block[]) {
    this.blocks = structuredClone(blocks) as Block[];
  }

  add() {
    if (this.blocks.length >= 256) throw new Error('The world supports at most 256 block IDs.');
    this.blocks.push({
      name: 'New block',
      color: '#ffffff',
      tint: '#ffffff',
      occludes: true,
      textures: Atlas.all(0, 0),
    });
    return this.blocks.length - 1;
  }

  setTexture(id: number, face: keyof FaceTextures | 'all', rect: TextureRect) {
    if (id === 0) throw new Error('Air is reserved.');
    if (!Atlas.valid(rect)) throw new Error('Choose a rectangle inside the atlas.');
    const textures = this.blocks[id].textures;
    const faces: (keyof FaceTextures)[] = face === 'all' ? ['top', 'bottom', 'side'] : [face];
    for (const target of faces) textures[target] = { ...rect };
  }

  definition() {
    for (const block of this.blocks) {
      if (!block.name.trim()) throw new Error('Every block needs a name.');
      if (!/^#[\da-f]{6}$/i.test(block.color)) throw new Error('Colors must use six hex digits.');
      if (!Object.values(block.textures).every((rect) => Atlas.valid(rect)))
        throw new Error('Invalid texture rectangle.');
    }
    return `export const BLOCKS: readonly Block[] = ${JSON.stringify(this.blocks, null, 2)} as const;`;
  }
}
