import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scene, PerspectiveCamera, Fog } from 'three';
import { advanceTime, daylight, DAY_DURATION, START_TIME } from '../src/world/day-cycle.ts';
import { Sky } from '../src/rendering/sky.ts';
import { World } from '../src/world/world.ts';
import { Player } from '../src/player/physics.ts';
import { serialize, restore } from '../src/game/save.ts';

test('cycle crosses midnight and distinguishes noon, midnight, and twilight', () => {
  assert.ok(Math.abs(advanceTime(0.9, DAY_DURATION * 0.2) - 0.1) < 1e-12);
  assert.equal(daylight(0.5).brightness, 1);
  assert.equal(daylight(0).brightness, 0);
  assert.equal(daylight(0.25).twilight, 1);
  assert.ok(Math.abs(daylight(0.75).twilight - 1) < 1e-12);
});

test('sky follows the camera and swaps solar light for moonlight at night', () => {
  const scene = new Scene(), sky = new Sky(scene);
  const camera = new PerspectiveCamera(), fog = new Fog('#ffffff', 38, 105);
  camera.position.set(400, 80, -300);
  sky.update(0.5, camera, fog);
  assert.ok(sky.sunLight.intensity > 2);
  assert.equal(sky.moonLight.intensity, 0);
  assert.ok(Math.abs(sky.sunLight.position.distanceTo(camera.position) - 100) < 1e-10);
  const dayColor = fog.color.clone();
  sky.update(0, camera, fog);
  assert.equal(sky.sunLight.intensity, 0);
  assert.ok(sky.moonLight.intensity > 0);
  assert.ok(sky.ambient.intensity > 0);
  assert.equal(fog.color.equals(dayColor), false);
});

test('autosave preserves time while old saves start in the morning', () => {
  const world = new World(), player = new Player(world);
  world.timeOfDay = 0.82;
  const raw = serialize(world, player, 0);
  const fresh = new World();
  assert.equal(restore(raw, fresh, new Player(fresh)), 0);
  assert.equal(fresh.timeOfDay, 0.82);
  const legacy = JSON.parse(raw);
  delete legacy.timeOfDay;
  const older = new World();
  assert.equal(restore(JSON.stringify(legacy), older, new Player(older)), 0);
  assert.equal(older.timeOfDay, START_TIME);
  legacy.timeOfDay = -1;
  assert.equal(restore(JSON.stringify(legacy), older, new Player(older)), null);
});
