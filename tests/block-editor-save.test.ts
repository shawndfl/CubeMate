import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, unlink, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { BlockEditorPlugin } from '../block-editor-plugin.ts';
import { BLOCKS } from '../src/world/blocks.ts';

test('local save writes definitions and rejects stale or cross-origin requests', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cubemate-editor-'));
  const directory = join(root, 'src', 'world');
  const path = join(directory, 'blocks.ts');
  await mkdir(directory, { recursive: true });
  const source = await readFile(new URL('../src/world/blocks.ts', import.meta.url), 'utf8');
  await writeFile(path, source);
  let handler: any;
  const plugin = BlockEditorPlugin.create();
  const configure = plugin.configureServer as Function;
  configure({ config: { root }, middlewares: { use: (_route: string, callback: Function) => { handler = callback; } } });
  const request = async (payload: object, origin = 'http://localhost:5173') => {
    const input = Object.assign(Readable.from([JSON.stringify(payload)]), {
      method: 'POST', headers: { origin, host: 'localhost:5173', 'content-type': 'application/json' },
    });
    let result = '';
    const output = { statusCode: 0, setHeader() {}, end(body: string) { result = body; } };
    await handler(input, output);
    return { status: output.statusCode, body: JSON.parse(result) };
  };
  try {
    const blocks = structuredClone(BLOCKS);
    blocks[1].name = 'Edited grass';
    assert.equal((await request({ source, blocks }, 'http://example.com')).status, 403);
    assert.equal(await readFile(path, 'utf8'), source);
    const saved = await request({ source, blocks });
    assert.equal(saved.status, 200);
    assert.equal(await readFile(path, 'utf8'), saved.body.source);
    assert.ok(saved.body.source.includes('Edited grass'));
    assert.equal((await request({ source, blocks })).status, 409);
    assert.equal((await request({ source: saved.body.source, blocks: [{}] })).status, 400);
    assert.equal(await readFile(path, 'utf8'), saved.body.source);
  } finally {
    await unlink(path);
    await rmdir(directory);
    await rmdir(join(root, 'src'));
    await rmdir(root);
  }
});
