import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BlockEditor } from '../src/ui/block-editor.ts';
import { BLOCKS } from '../src/world/blocks.ts';
import { Atlas } from '../src/world/atlas.ts';

test('block edits preserve IDs, source definitions, and optional rendering properties', () => {
  const editor = new BlockEditor(BLOCKS);
  const id = editor.add();
  assert.equal(id, BLOCKS.length);
  assert.deepEqual(editor.blocks.slice(0, id), BLOCKS);
  editor.setTexture(id, 'all', Atlas.tile(32, 64));
  editor.setTexture(id, 'top', Atlas.tile(48, 80));
  assert.deepEqual(editor.blocks[id].textures.bottom, Atlas.tile(32, 64));
  assert.deepEqual(editor.blocks[id].textures.side, Atlas.tile(32, 64));
  assert.deepEqual(editor.blocks[id].textures.top, Atlas.tile(48, 80));
  editor.setTexture(8, 'bottom', Atlas.tile(0, 16));
  assert.deepEqual(editor.blocks[8].animation, BLOCKS[8].animation);
  assert.equal(editor.blocks[8].light, 15);
  assert.notDeepEqual(editor.blocks[8].textures.bottom, BLOCKS[8].textures.bottom);
  assert.throws(() => editor.setTexture(0, 'all', Atlas.tile(16, 16)));
  assert.throws(() => editor.setTexture(id, 'side', Atlas.tile(1024, 0)));
});

test('saving replaces only BLOCKS, escapes names, and rejects malformed definitions', () => {
  const source = readFileSync(new URL('../src/world/blocks.ts', import.meta.url), 'utf8');
  const editor = new BlockEditor(BLOCKS);
  editor.blocks[1].name = 'A "quoted" block $&';
  const updated = BlockEditor.replaceDefinition(source, editor.blocks);
  assert.ok(updated.includes(JSON.stringify(editor.blocks[1].name)));
  assert.equal(updated.slice(updated.indexOf('export const CHUNK')), source.slice(source.indexOf('export const CHUNK')));
  assert.throws(() => BlockEditor.replaceDefinition(source, [{ name: 'Air' }]));
  editor.blocks[1].name = '';
  assert.throws(() => BlockEditor.replaceDefinition(source, editor.blocks));
});
