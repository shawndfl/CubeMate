import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { BlockEditor } from './src/ui/block-editor.ts';

/**
 * Local development endpoint; writes only the project's block declaration.
 */
export class BlockEditorPlugin {
  static create(): Plugin {
    let saving = false;

    return {
      name: 'cubemate-block-editor',
      apply: 'serve',
      configureServer(server) {
        // the hardcoded path to the blocks class that will get the update
        const path = resolve(server.config.root, 'src/world/blocks.ts');

        // handles the post response to "__block-editor"
        server.middlewares.use('/__block-editor', async (request, response) => {
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');

          const reply = (status: number, body: object) => {
            response.statusCode = status;
            response.end(JSON.stringify(body));
          };

          // only handle post commands
          if (request.method !== 'POST') {
            reply(405, { error: 'Use POST.' });
            return;
          }
          const origin = request.headers.origin;
          if (
            !origin ||
            ![`http://${request.headers.host}`, `https://${request.headers.host}`].includes(origin) ||
            request.headers['content-type'] !== 'application/json'
          ) {
            reply(403, { error: 'Save from the local atlas picker.' });
            return;
          }
          if (saving) {
            reply(409, { error: 'Another save is in progress. Retry shortly.' });
            return;
          }
          saving = true;
          try {
            let body = '';
            for await (const chunk of request) {
              body += chunk.toString();

              // limit the size of the request
              if (body.length > 1_000_000) {
                throw new Error('Block definitions are too large.');
              }
            }

            const payload = JSON.parse(body);
            const source = await readFile(path, 'utf8');
            if (payload.source !== source) {
              reply(409, {
                error: 'blocks.ts changed since this picker loaded. Copy your edits, then reload before saving.',
              });
              return;
            }

            const updated = BlockEditor.replaceDefinition(source, payload.blocks);
            await writeFile(path, updated, 'utf8');
            reply(200, { source: updated });
          } catch (error) {
            reply(400, { error: error instanceof Error ? error.message : 'Unable to save blocks.' });
          } finally {
            saving = false;
          }
        });
      },
    };
  }
}
