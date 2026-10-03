import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Atlas } from '../src/world/atlas.ts';
import { BLOCKS, GLOW_BRICK } from '../src/world/blocks.ts';
import { World } from '../src/world/world.ts';
import { Player } from '../src/player/physics.ts';
import { serialize, restore } from '../src/game/save.ts';
import { Texture } from 'three';
import { voxelMaterial } from '../src/rendering/voxel-material.ts';
import { LavaAnimation } from '../src/rendering/lava-animation.ts';

test('atlas UVs flip the image Y axis and stay inside the selected rectangle', () => {
  const rect = { x: 32, y: 64, width: 16, height: 32 };
  const uv = Atlas.uvs(rect);
  assert.equal(uv[0], 32.5 / 1024);
  assert.equal(uv[1], 1 - 95.5 / 1024);
  assert.equal(uv[4], 47.5 / 1024);
  assert.equal(uv[5], 1 - 64.5 / 1024);
  assert.ok(Atlas.uvs(Atlas.tile(1008, 1008)).every(value => value > 0 && value < 1));
  assert.throws(() => Atlas.uvs(Atlas.tile(1024, 0)));
});

test('face mapping chooses top, bottom, and side without changing block IDs', () => {
  assert.deepEqual(BLOCKS.map(block => block.name), ['Air', 'Grass', 'Dirt', 'Stone', 'Sand', 'Wood', 'Leaves', 'Glow Brick', 'Lava']);
  assert.equal(GLOW_BRICK, 7);
  for (const block of BLOCKS) {
    assert.ok(Atlas.valid(block.textures.top));
    assert.ok(Atlas.valid(block.textures.bottom));
    assert.ok(Atlas.valid(block.textures.side));
  }
  const grass = BLOCKS[1].textures;
  assert.equal(Atlas.face(grass, 1), grass.top);
  assert.equal(Atlas.face(grass, -1), grass.bottom);
  assert.equal(Atlas.face(grass, 0), grass.side);
});

test('picker snaps to 16-pixel tiles and custom rectangles reject invalid sizes', () => {
  assert.deepEqual(Atlas.pick(47.9, 65), { x: 32, y: 64, width: 16, height: 16 });
  assert.deepEqual(Atlas.pick(1024, 1024), Atlas.tile(1008, 1008));
  assert.equal(Atlas.valid({ x: 1, y: 2, width: 32, height: 48 }), true);
  assert.equal(Atlas.valid({ x: 0, y: 0, width: 0, height: 16 }), false);
  assert.equal(Atlas.valid({ x: NaN, y: 0, width: 16, height: 16 }), false);
});

test('world saves remain independent of atlas appearance', () => {
  const world = new World();
  const player = new Player(world);
  world.set(20, 30, 20, GLOW_BRICK);
  const raw = serialize(world, player, 6);
  const fresh = new World();
  assert.equal(restore(raw, fresh, new Player(fresh)), 6);
  assert.equal(fresh.get(20, 30, 20), GLOW_BRICK);
  assert.equal(raw.includes('textures'), false);
});

test('voxel atlas material cuts out alpha without enabling blending', () => {
  const material = voxelMaterial(new Texture(), { value: 1 });
  assert.equal(material.alphaTest, 0.5);
  assert.equal(material.transparent, false);
  assert.equal(material.depthWrite, true);
  material.dispose();
});

test('lava animation follows its four atlas frames and loops at a steady rate', () => {
  const lava = BLOCKS[8];
  assert.deepEqual(lava.animation?.map(rect => [rect.x, rect.y]), [[128, 32], [144, 32], [144, 48], [128, 32]]);
  const animation = new LavaAnimation();
  assert.equal(animation.frame, 0);
  assert.equal(animation.advance(0.19), false);
  assert.equal(animation.advance(0.01), true);
  assert.equal(animation.frame, 1);
  assert.equal(animation.advance(0.2), true);
  assert.equal(animation.frame, 2);
  assert.equal(animation.advance(0.2), true);
  assert.equal(animation.frame, 3);
  assert.equal(animation.advance(0.2), true);
  assert.equal(animation.frame, 0);
  assert.equal(animation.advance(-1), false);
});
