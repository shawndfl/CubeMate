import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.ts';
import { Player, collides } from '../src/player/physics.ts';
import { AutoSave, restore, serialize, SAVE_KEY } from '../src/game/save.ts';

test('saved block edits and player state survive world regeneration', () => {
  const world = new World();
  const original = world.get(20, 25, 20);
  assert.equal(world.set(20, 25, 20, 3), true);
  assert.equal(world.set(21, 25, 20, 5), true);
  const player = new Player(world);
  player.position = { x: 22.5, y: 30, z: 23.5 };
  player.yaw = 1.2; player.pitch = 0.4;
  const fresh = new World(), restored = new Player(fresh);
  assert.equal(restore(serialize(world, player, 4), fresh, restored), 4);
  assert.equal(fresh.get(20, 25, 20), 3);
  assert.equal(fresh.get(21, 25, 20), 5);
  assert.deepEqual(restored.position, player.position);
  assert.equal(restored.yaw, 1.2);
  assert.equal(restored.pitch, 0.4);
  world.set(20, 25, 20, original);
  assert.equal(world.savedEdits().some(([x, y, z]) => x === 20 && y === 25 && z === 20), false);
});

test('saved inspect position restores safely even inside terrain', () => {
  const world = new World(), player = new Player(world);
  player.toggleInspect();
  player.position = { x: 20.5, y: 5, z: 20.5 };
  const fresh = new World(), restored = new Player(fresh);
  assert.equal(restore(serialize(world, player, 0), fresh, restored), 0);
  assert.equal(restored.inspecting, true);
  assert.deepEqual(restored.position, player.position);
  restored.toggleInspect();
  assert.equal(collides(fresh, restored.position), false);
});

test('invalid saves leave the generated world and player alone', () => {
  const world = new World(), player = new Player(world);
  const before = world.data.slice(), position = { ...player.position };
  assert.equal(restore('{broken', world, player), null);
  const bad = JSON.parse(serialize(world, player, 0));
  bad.edits = [[20, 25, 20, 3], [1000, 2, 0, 1]];
  assert.equal(restore(JSON.stringify(bad), world, player), null);
  assert.deepEqual(world.data, before);
  assert.deepEqual(player.position, position);
  bad.edits = [];
  bad.seed = 999;
  assert.equal(restore(JSON.stringify(bad), world, player), null);
});

test('autosave writes changes to browser storage and reports storage failures', () => {
  const world = new World(), player = new Player(world);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const writes: [string, string][] = [];
  let errors = 0;
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: (key: string, value: string) => writes.push([key, value]) } });
    const autosave = new AutoSave(world, player, () => 2, () => errors++);
    autosave.flush();
    autosave.flush();
    assert.equal(writes.length, 1);
    assert.equal(writes[0][0], SAVE_KEY);
    world.set(20, 25, 20, 4);
    autosave.flush();
    assert.equal(writes.length, 2);
    assert.deepEqual(JSON.parse(writes[1][1]).edits, [[20, 25, 20, 4]]);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: () => { throw new Error('quota'); } } });
    world.set(21, 25, 20, 5);
    autosave.flush();
    assert.equal(errors, 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
