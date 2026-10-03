import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hotbar } from '../src/game/hotbar.ts';
import { BLOCKS } from '../src/world/blocks.ts';
import { GameStates } from '../src/game/state.ts';

test('nine-slot hotbar swaps duplicates, replaces slots, and restores valid preferences', () => {
  const hotbar = new Hotbar();
  assert.equal(hotbar.blocks.length, Math.min(9, BLOCKS.length - 1));
  hotbar.replace(0, 2);
  assert.equal(hotbar.blocks[0], 2);
  assert.equal(hotbar.blocks[1], 1);
  hotbar.replace(8, BLOCKS.length - 1);
  assert.equal(hotbar.blocks[8], BLOCKS.length - 1);
  assert.equal(new Set(hotbar.blocks).size, hotbar.blocks.length);
  assert.equal(hotbar.replace(9, 1), false);
  assert.equal(hotbar.replace(0, 0), false);
  assert.equal(hotbar.replace(0, BLOCKS.length), false);
  const restored = new Hotbar();
  restored.restore(JSON.stringify(hotbar.blocks));
  assert.deepEqual(restored.blocks, hotbar.blocks);
  for (const raw of ['null', '{broken', '[0]', JSON.stringify(Array(9).fill(1))]) {
    restored.restore(raw);
    assert.deepEqual(restored.blocks, hotbar.blocks);
  }
});

test('picker stays paused after unlocking or failed recapture and resumes only after requested lock', () => {
  const effects: string[] = [];
  const states = new GameStates({ resetInput: () => effects.push('reset'), releasePointer: () => effects.push('unlock'),
    flushSave: () => effects.push('save'), changed: state => effects.push(state) });
  states.blocks();
  assert.equal(states.state, 'main');
  states.requestPlay();
  states.pointerChanged(true);
  states.blocks();
  assert.deepEqual(effects.slice(-4), ['reset', 'blocks', 'save', 'unlock']);
  states.pointerChanged(false);
  assert.equal(states.state, 'blocks');
  assert.equal(states.playing, false);
  states.requestPlay();
  states.cancelPlay();
  states.pointerChanged(true);
  assert.equal(states.state, 'blocks');
  assert.equal(effects.at(-1), 'unlock');
  states.requestPlay();
  states.pointerChanged(true);
  assert.equal(states.playing, true);
});
