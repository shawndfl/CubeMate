import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/input/input.ts';

test('held mouse buttons repeat every 200 ms and stop on release or lost focus', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const canvas = new EventTarget();
  const doc = new EventTarget() as EventTarget & { pointerLockElement: EventTarget | null; exitPointerLock: () => void };
  doc.pointerLockElement = canvas;
  doc.exitPointerLock = () => { doc.pointerLockElement = null; doc.dispatchEvent(new Event('pointerlockchange')); };
  const win = new EventTarget();
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win });
  const mouse = (type: string, button: number) => {
    const event = new Event(type);
    Object.defineProperty(event, 'button', { value: button });
    (type === 'mousedown' ? canvas : doc).dispatchEvent(event);
  };
  try {
    const input = new Input(canvas as HTMLCanvasElement);
    const actions: number[] = [];
    input.onAction = button => actions.push(button);
    doc.dispatchEvent(new Event('pointerlockchange'));
    mouse('mousedown', 0);
    mouse('mousedown', 0);
    assert.deepEqual(actions, [0]);
    t.mock.timers.tick(199);
    assert.deepEqual(actions, [0]);
    t.mock.timers.tick(1);
    assert.deepEqual(actions, [0, 0]);
    mouse('mouseup', 0);
    t.mock.timers.tick(1000);
    assert.deepEqual(actions, [0, 0]);
    mouse('mousedown', 2);
    assert.deepEqual(actions, [0, 0, 2]);
    // Entering a menu must stop held actions before pointer-lock loss arrives.
    doc.pointerLockElement = canvas;
    doc.dispatchEvent(new Event('pointerlockchange'));
    mouse('mousedown', 0);
    input.keys.add('KeyW');
    input.enabled = false;
    input.reset();
    assert.equal(input.keys.size, 0);
    t.mock.timers.tick(1000);
    mouse('mousedown', 2);
    assert.deepEqual(actions, [0, 0, 2, 0]);
    input.enabled = true;
    t.mock.timers.tick(1000);
    assert.deepEqual(actions, [0, 0, 2, 0]);
    mouse('mousedown', 2);
    win.dispatchEvent(new Event('blur'));
    t.mock.timers.tick(1000);
    assert.deepEqual(actions, [0, 0, 2, 0, 2]);
  } finally {
    win.dispatchEvent(new Event('blur'));
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else Reflect.deleteProperty(globalThis, 'document');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
