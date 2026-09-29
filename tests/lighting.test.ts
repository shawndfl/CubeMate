import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.ts';
import { BLOCKS, GLOW_BRICK } from '../src/world/blocks.ts';
import { VoxelLighting, vertexAO } from '../src/world/lighting.ts';
import { Player } from '../src/player/physics.ts';
import { serialize, restore } from '../src/game/save.ts';

test('ambient occlusion darkens blocked corners, including diagonal chunk boundaries', () => {
  const world = new World(); world.data.fill(0);
  const ao = () => vertexAO(world, 15, 30, 15, [0, 1, 0], [1, 1, 1]);
  assert.equal(ao(), 1);
  world.set(16, 31, 16, 3);
  assert.equal(ao(), 0.82);
  world.set(16, 31, 15, 3); world.set(15, 31, 16, 3);
  assert.equal(ao(), 0.45);
  world.set(16, 31, 15, 0); world.set(15, 31, 16, 0); world.set(16, 31, 16, 0);
  assert.equal(ao(), 1);
});

test('glow spreads across chunks, is blocked by a sealed room, and disappears on removal', () => {
  const world = new World(); world.data.fill(0);
  for (let x = 13; x <= 19; x++) for (let y = 28; y <= 34; y++) for (let z = 13; z <= 19; z++) {
    if (x === 13 || x === 19 || y === 28 || y === 34 || z === 13 || z === 19) world.set(x, y, z, 3);
  }
  world.set(15, 30, 15, GLOW_BRICK);
  const light = new VoxelLighting(); light.update(world);
  assert.equal(light.sample(16, 30, 15)[1], 14 / 15);
  assert.equal(light.sample(17, 30, 15)[1], 13 / 15);
  assert.equal(light.sample(20, 30, 15)[1], 0);
  assert.equal(light.sample(16, 30, 15)[0], 0);
  world.set(19, 30, 15, 0); light.update(world);
  assert.ok(light.sample(20, 30, 15)[1] > 0);
  world.dirty.clear(); world.set(15, 30, 15, 0); light.update(world);
  assert.equal(light.sample(16, 30, 15)[1], 0);
  assert.equal(world.dirty.has('1,0'), true);
});

test('leaf cutouts transmit skylight and do not add ambient occlusion', () => {
  const world = new World(); world.data.fill(0);
  world.set(20, 20, 20, 6);
  world.set(21, 20, 20, 6);
  world.set(22, 20, 20, 3);
  assert.equal(BLOCKS[world.get(20, 20, 20)].occludes, false);
  assert.equal(BLOCKS[world.get(22, 20, 20)].occludes, true);
  const lighting = new VoxelLighting();
  lighting.update(world);
  assert.equal(lighting.sample(20, 20, 20)[0], 1);
  assert.equal(vertexAO(world, 20, 19, 20, [0, 1, 0], [1, 1, 1]), 1);
});

test('glow bricks and their selected hotbar slot survive autosave', () => {
  const world = new World(); world.set(20, 30, 20, GLOW_BRICK);
  const saved = serialize(world, new Player(world), GLOW_BRICK - 1);
  const restored = new World();
  assert.equal(restore(saved, restored, new Player(restored)), GLOW_BRICK - 1);
  assert.equal(restored.get(20, 30, 20), GLOW_BRICK);
});
