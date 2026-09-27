import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.ts';
import { trace } from '../src/world/raycast.ts';
import { Player, collides, overlaps } from '../src/player/physics.ts';

test('terrain is repeatable and seeds change terrain', () => {
  assert.deepEqual(new World(123).data, new World(123).data);
  assert.notDeepEqual(new World(123).data, new World(124).data);
});
test('boundary edits invalidate both chunks and reject invalid positions', () => {
  const world = new World(); world.dirty.clear();
  assert.equal(world.set(15, 40, 15, 3), true);
  assert.deepEqual([...world.dirty].sort(), ['0,0', '0,1', '1,0']);
  assert.equal(world.set(-1, 20, 0, 1), false);
  assert.equal(world.set(0, 0, 0, 0), false);
  assert.equal(world.set(0.5, 20, 0, 1), false);
  assert.equal(world.set(1, 20, 1, 99), false);
});
test('voxel ray finds the hit and placement face within reach', () => {
  const world = new World(); world.data.fill(0); world.set(4, 10, 4, 3);
  assert.deepEqual(trace(world, { x: 4.5, y: 10.5, z: 8 }, { x: 0, y: 0, z: -1 }), { block: { x: 4, y: 10, z: 4 }, adjacent: { x: 4, y: 10, z: 5 } });
  assert.equal(trace(world, { x: 4.5, y: 10.5, z: 12 }, { x: 0, y: 0, z: -1 }), null);
  assert.equal(trace(world, { x: 1, y: 10, z: 1 }, { x: 0, y: 0, z: 0 }), null);
});
test('player lands, jumps, and cannot walk through a wall', () => {
  const world = new World(); world.data.fill(0);
  for (let x = 40; x < 55; x++) for (let z = 40; z < 55; z++) world.set(x, 10, z, 3);
  for (let x = 40; x < 55; x++) for (let y = 11; y < 15; y++) world.set(x, y, 45, 3);
  const player = new Player(world); player.yaw = 0;
  for (let i = 0; i < 240; i++) player.update(1 / 120, new Set(['KeyW']));
  assert.equal(player.grounded, true); assert.ok(player.position.z >= 46.2999);
  assert.ok(Math.abs(player.position.y - 11) < 0.001); assert.equal(collides(world, player.position), false);
  player.update(1 / 120, new Set(['Space'])); assert.ok(player.verticalSpeed > 0); assert.ok(player.position.y > 11);
  assert.equal(overlaps(player.position, { x: 48, y: 11, z: 46 }), true);
});
