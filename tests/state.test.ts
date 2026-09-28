import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameStates } from '../src/game/state.ts';
import { DEFAULT_SENSITIVITY, parseSensitivity, SETTINGS_KEY, storeSensitivity } from '../src/game/settings.ts';

function setup() {
  const effects: string[] = [];
  const states = new GameStates({
    resetInput: () => effects.push('reset'),
    releasePointer: () => effects.push('unlock'),
    flushSave: () => effects.push('save'),
    changed: state => effects.push(state),
  });
  return { states, effects };
}

test('Continue waits for pointer lock; losing capture pauses and saves once', () => {
  const fixture = setup();
  const states = fixture.states;
  const effects = fixture.effects;
  assert.equal(states.state, 'main');
  assert.equal(states.requestPlay(), true);
  assert.equal(states.playing, false);
  states.pointerChanged(true);
  assert.equal(states.playing, true);
  states.pointerChanged(false);
  assert.equal(states.state, 'paused');
  assert.deepEqual(effects.slice(-4), ['reset', 'paused', 'save', 'unlock']);
  states.pointerChanged(false);
  assert.equal(effects.filter(effect => effect === 'save').length, 1);
  states.requestPlay();
  assert.equal(states.playing, false);
  states.pointerChanged(true);
  assert.equal(states.playing, true);
});

test('Settings returns to the originating menu and never resumes automatically', () => {
  const states = setup().states;
  states.settings();
  assert.equal(states.state, 'settings');
  assert.equal(states.requestPlay(), false);
  states.back();
  assert.equal(states.state, 'main');
  states.requestPlay();
  states.pointerChanged(true);
  states.settings();
  states.pointerChanged(false);
  assert.equal(states.state, 'settings');
  states.back();
  assert.equal(states.state, 'paused');
  states.mainMenu();
  assert.equal(states.state, 'main');
});

test('failed or cancelled capture cannot start gameplay after menu navigation', () => {
  const fixture = setup();
  const states = fixture.states;
  const effects = fixture.effects;
  states.requestPlay();
  states.cancelPlay();
  states.pointerChanged(true);
  assert.equal(states.state, 'main');
  assert.equal(effects.at(-1), 'unlock');
  states.requestPlay();
  states.settings();
  states.pointerChanged(true);
  assert.equal(states.state, 'settings');
  assert.equal(effects.at(-1), 'unlock');
});

test('returning to main menu from play resets controls and flushes the save', () => {
  const fixture = setup();
  const states = fixture.states;
  const effects = fixture.effects;
  states.requestPlay();
  states.pointerChanged(true);
  states.mainMenu();
  assert.deepEqual(effects.slice(-4), ['reset', 'main', 'save', 'unlock']);
  assert.equal(states.playing, false);
});

test('sensitivity settings round-trip and invalid settings fall back safely', () => {
  assert.equal(parseSensitivity('{"sensitivity":2.4}'), 2.4);
  for (const raw of [null, '{broken', '{}', '{"sensitivity":0}', '{"sensitivity":4}', '{"sensitivity":"2"}']) {
    assert.equal(parseSensitivity(raw), DEFAULT_SENSITIVITY);
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = '';
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      setItem: (key: string, value: string) => { assert.equal(key, SETTINGS_KEY); saved = value; },
    } });
    assert.equal(storeSensitivity(0.7), true);
    assert.equal(parseSensitivity(saved), 0.7);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('blocked'); } });
    assert.equal(storeSensitivity(1), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
