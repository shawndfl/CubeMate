import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TouchInput } from '../src/input/touch-input.ts';
import type { Input } from '../src/input/input.ts';
import { GameStates } from '../src/game/state.ts';

class Surface extends EventTarget {
  dataset: { key?: string } = {};
  classList = { add: (_name: string) => {}, remove: (_name: string) => {} };
  setPointerCapture(_id: number) {}
  pointer(type: string, id: number, x = 0, y = 0) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: id, pointerType: 'touch', button: 0, clientX: x, clientY: y });
    this.dispatchEvent(event);
  }
}

test('movement, jump and drag work together; cancellation and menus clear touches', () => {
  const canvas = new Surface();
  const forward = new Surface();
  forward.dataset.key = 'KeyW';
  const jump = new Surface();
  jump.dataset.key = 'Space';
  const moves: number[][] = [];
  const input = { enabled: true, keys: new Set<string>(), onLook: (x: number, y: number) => moves.push([x, y]), onReset: () => {} };
  const controls = { querySelectorAll: () => [forward, jump] };
  new TouchInput(canvas as unknown as HTMLCanvasElement, controls as unknown as HTMLElement, input as unknown as Input);
  forward.pointer('pointerdown', 1);
  jump.pointer('pointerdown', 2);
  canvas.pointer('pointerdown', 3, 10, 20);
  canvas.pointer('pointermove', 4, 100, 100);
  canvas.pointer('pointermove', 3, 15, 18);
  assert.deepEqual(moves, [[5, -2]]);
  assert.deepEqual([...input.keys], ['KeyW', 'Space']);
  jump.pointer('pointercancel', 2);
  assert.deepEqual([...input.keys], ['KeyW']);
  input.onReset();
  assert.equal(input.keys.size, 0);
  canvas.pointer('pointermove', 3, 30, 30);
  assert.equal(moves.length, 1);
  input.enabled = false;
  forward.pointer('pointerdown', 5);
  assert.equal(input.keys.size, 0);
  input.enabled = true;
  forward.pointer('pointerdown', 6);
  forward.pointer('lostpointercapture', 6);
  assert.equal(input.keys.size, 0);
});

test('touch play starts without pointer lock and resumes after blocks and pause', () => {
  const states = new GameStates({ resetInput: () => {}, releasePointer: () => {}, flushSave: () => {}, changed: () => {} });
  states.startTouch();
  assert.equal(states.playing, true);
  states.blocks();
  assert.equal(states.state, 'blocks');
  states.startTouch();
  assert.equal(states.playing, true);
  states.pause();
  assert.equal(states.state, 'paused');
  states.startTouch();
  assert.equal(states.playing, true);
  states.settings();
  states.startTouch();
  assert.equal(states.state, 'settings');
});
