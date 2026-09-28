import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.ts';
import { Player, collides } from '../src/player/physics.ts';

function setup() {
  const world = new World(); world.data.fill(0);
  for (let x = 40; x < 55; x++) for (let z = 40; z < 55; z++) world.set(x, 10, z, 3);
  const player = new Player(world);
  player.position = { x: 48.5, y: 11, z: 48.5 }; player.yaw = 0;
  player.update(1 / 120, new Set());
  return { world, player };
}

test('walking climbs a tall wall and moves onto its top without jumping', () => {
  const { world, player } = setup();
  for (let x = 47; x <= 49; x++) {
    for (let y = 11; y < 21; y++) for (let z = 43; z <= 47; z++) world.set(x, y, z, 3);
  }
  for (let i = 0; i < 450; i++) {
    player.update(1 / 120, new Set(['KeyW']));
    assert.equal(collides(world, player.position), false);
  }
  assert.ok(Math.abs(player.position.y - 21) < 0.001);
  assert.ok(player.position.z < 48);
  assert.equal(player.grounded, true);
});

test('climbing stops at ceilings and never passes through an overhang', () => {
    const { world, player } = setup();
    for (let y = 11; y < 22; y++) world.set(48, y, 47, 3);
    world.set(48, 16, 48, 3);
    for (let i = 0; i < 300; i++) player.update(1 / 120, new Set(['KeyW']));
    assert.ok(player.position.z >= 48.2999);
    assert.ok(Math.abs(player.position.y - 14.2) < 0.001);
    assert.equal(collides(world, player.position), false);
});

test('airborne players can climb and fall when they release movement', () => {
  const { world, player } = setup();
  world.set(48, 11, 47, 3);
  player.position = { x: 48.5, y: 11.3, z: 48.31 };
  player.grounded = false;
  player.update(1 / 120, new Set(['KeyW']));
  assert.ok(player.position.y > 11.3);
  assert.ok(player.position.z >= 48.2999);
  const height = player.position.y;
  player.update(1 / 120, new Set());
  assert.ok(player.position.y < height);
});

test('the invisible world boundary is not climbable', () => {
  const { player } = setup();
  player.position = { x: 0.31, y: 15, z: 48.5 };
  player.update(1 / 120, new Set(['KeyA']));
  assert.ok(player.position.y < 15);
});
