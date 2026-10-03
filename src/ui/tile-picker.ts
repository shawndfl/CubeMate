/// <reference types="vite/client" />
import { Atlas, type TextureRect } from '../world/atlas.ts';
import { BLOCKS } from '../world/blocks.ts';
import { BlockEditor } from './block-editor.ts';
import blockSource from '../world/blocks.ts?raw';

/** Atlas selection and block definition editing, with explicit texture assignment. */
export class TilePicker {
  private editor = new BlockEditor(BLOCKS);
  private selectedBlock = 1;
  private dirty = false;
  private source = blockSource;
  private rect = Atlas.tile(0, 0);
  private root: HTMLElement;
  private zoom = 1;
  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = `
      <h1>Atlas tile picker</h1>
      <section class="block-editor" aria-label="Block editor">
        <div class="block-toolbar"><label>Block <select class="block-list"></select></label><button class="block-add" type="button">Add block</button></div>
        <div class="block-fields">
          <label>Name <input class="block-name" maxlength="100" required /></label>
          <label>Color <input class="block-color" type="color" /></label>
          <label class="block-checkbox"><input class="block-occludes" type="checkbox" /> Occludes neighboring faces and light</label>
        </div>
        <p>Color is the hotbar fallback. Existing tint, light, and animation settings are preserved. Air (ID 0) is reserved.</p>
        <div class="block-faces"></div>
        <div class="block-toolbar"><label>Apply selection to <select class="block-face"><option value="all">All faces</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="side">Sides</option></select></label><button class="block-apply" type="button">Use selected rectangle</button></div>
        <div class="block-toolbar"><button class="block-save" type="button">Save to blocks.ts</button><button class="block-export" type="button">Copy BLOCKS</button></div>
        <textarea class="block-code" aria-label="BLOCKS definition" readonly rows="5" hidden></textarea>
        <div class="block-message" role="status">Loaded block definitions. Save to apply changes to the project.</div>
      </section>
      <p>Click a 16 × 16 tile, or enter a custom pixel rectangle. Origin is the image's top-left.</p>
      <div class="atlas-toolbar"><label>Zoom <select class="atlas-zoom"><option value="0.5">50%</option><option value="1" selected>100%</option><option value="2">200%</option></select></label><span>Tile selection snaps to 16 pixels.</span></div>
      <div class="atlas-scroll"><div class="atlas-sheet">
        <img src="${Atlas.url}" alt="Block texture atlas" draggable="false" />
        <div class="atlas-selection"></div>
      </div></div>
      <div class="atlas-fields">
        ${['x', 'y', 'width', 'height'].map(field => `<label>${field}<input data-field="${field}" type="number" step="1" min="${field === 'x' || field === 'y' ? 0 : 1}" max="1024" value="${field === 'x' || field === 'y' ? 0 : 16}" /></label>`).join('')}
      </div>
      <div class="atlas-preview" aria-label="Selected tile preview"></div>
      <div class="atlas-coordinates" aria-live="polite"></div>
      <div class="atlas-copy-buttons">
        <button class="atlas-copy-xy" type="button">Copy x, y</button>
        <button class="atlas-copy-rect" type="button">Copy full rectangle</button>
      </div>
      <textarea class="atlas-code" aria-label="Texture rectangle definition" readonly rows="2"></textarea>
      <div class="atlas-message" role="status"></div>
    `;
    const img = root.querySelector('img')!;
    img.addEventListener('load', () => {
      if (img.naturalWidth !== Atlas.width || img.naturalHeight !== Atlas.height)
        this.message(`Image is ${img.naturalWidth} × ${img.naturalHeight}; update Atlas.width and Atlas.height to match.`);
    });
    img.addEventListener('error', () => this.message('Could not load /atlas.png.'));
    img.addEventListener('click', event => {
      const bounds = img.getBoundingClientRect();
      this.rect = Atlas.pick((event.clientX - bounds.left) / bounds.width * Atlas.width, (event.clientY - bounds.top) / bounds.height * Atlas.height);
      this.sync();
    });
    root.querySelector('.atlas-zoom')!.addEventListener('change', event => {
      this.zoom = Number((event.target as HTMLSelectElement).value);
      this.sync();
    });
    root.querySelectorAll<HTMLInputElement>('[data-field]').forEach(input => input.addEventListener('input', () => {
      const candidate = { ...this.rect };
      root.querySelectorAll<HTMLInputElement>('[data-field]').forEach(field => {
        candidate[field.dataset.field as keyof TextureRect] = field.valueAsNumber;
      });
      if (!Atlas.valid(candidate)) { this.message('Enter whole pixels within the atlas, with positive width and height.'); return; }
      this.rect = candidate;
      this.sync();
    }));
    root.querySelector('.atlas-copy-xy')!.addEventListener('click', () => this.copy(`${this.rect.x}, ${this.rect.y}`, 'Coordinates copied.'));
    root.querySelector('.atlas-copy-rect')!.addEventListener('click', () => this.copy(this.rectangleCode(), 'Rectangle copied.'));
    this.setupBlocks();
    this.sync();
  }
  private setupBlocks() {
    this.refreshBlockList();
    const save = this.root.querySelector<HTMLButtonElement>('.block-save')!;
    save.disabled = !import.meta.env.DEV;
    if (!import.meta.env.DEV) this.blockMessage('Saving requires the local dev server. Use Copy BLOCKS to export.');
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        this.editor.definition();
        const response = await fetch('/__block-editor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: this.source, blocks: this.editor.blocks }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Could not save blocks.');
        this.source = result.source;
        this.dirty = false;
        this.blockMessage('Saved to src/world/blocks.ts. The game will reload with these definitions.');
      } catch (error) { this.blockMessage((error as Error).message); }
      finally { save.disabled = false; }
    });
    this.root.querySelector('.block-list')!.addEventListener('change', event => {
      this.selectedBlock = Number((event.target as HTMLSelectElement).value);
      this.showBlock();
    });
    this.root.querySelector('.block-add')!.addEventListener('click', () => {
      try {
        this.selectedBlock = this.editor.add();
        this.refreshBlockList();
        this.changed();
      } catch (error) { this.blockMessage((error as Error).message); }
    });
    for (const selector of ['.block-name', '.block-color', '.block-occludes']) {
      this.root.querySelector(selector)!.addEventListener('input', () => {
        if (!this.selectedBlock) return;
        const block = this.editor.blocks[this.selectedBlock];
        block.name = this.root.querySelector<HTMLInputElement>('.block-name')!.value;
        block.color = this.root.querySelector<HTMLInputElement>('.block-color')!.value;
        block.occludes = this.root.querySelector<HTMLInputElement>('.block-occludes')!.checked;
        this.root.querySelector<HTMLSelectElement>('.block-list')!.options[this.selectedBlock].textContent = `${this.selectedBlock} — ${block.name}`;
        this.changed();
      });
    }
    this.root.querySelector('.block-apply')!.addEventListener('click', () => {
      const face = this.root.querySelector<HTMLSelectElement>('.block-face')!.value as 'all' | 'top' | 'bottom' | 'side';
      this.editor.setTexture(this.selectedBlock, face, this.rect);
      this.showBlock();
      this.changed();
    });
    this.root.querySelector('.block-export')!.addEventListener('click', async () => {
      const output = this.root.querySelector<HTMLTextAreaElement>('.block-code')!;
      try {
        output.value = this.editor.definition();
        output.hidden = false;
        try {
          await navigator.clipboard.writeText(output.value);
          this.blockMessage('Copied. Replace the BLOCKS declaration in src/world/blocks.ts with this definition.');
        } catch {
          output.focus();
          output.select();
          this.blockMessage('Press Ctrl+C or Command+C, then replace the BLOCKS declaration in src/world/blocks.ts.');
        }
      } catch (error) { this.blockMessage((error as Error).message); }
    });
    window.addEventListener('beforeunload', event => {
      if (this.dirty) event.preventDefault();
    });
  }
  private blockMessage(message: string) {
    this.root.querySelector('.block-message')!.textContent = message;
  }
  private changed() {
    this.dirty = true;
    this.root.querySelector<HTMLTextAreaElement>('.block-code')!.hidden = true;
    this.blockMessage('Unsaved block changes. Save to blocks.ts to apply them.');
  }
  private refreshBlockList() {
    const list = this.root.querySelector<HTMLSelectElement>('.block-list')!;
    list.replaceChildren(...this.editor.blocks.map((block, id) => new Option(`${id} — ${block.name}`, String(id))));
    list.value = String(this.selectedBlock);
    this.showBlock();
  }
  private showBlock() {
    const block = this.editor.blocks[this.selectedBlock];
    this.root.querySelector<HTMLInputElement>('.block-name')!.value = block.name;
    this.root.querySelector<HTMLInputElement>('.block-color')!.value = block.color;
    this.root.querySelector<HTMLInputElement>('.block-occludes')!.checked = block.occludes !== false;
    for (const selector of ['.block-name', '.block-color', '.block-occludes', '.block-apply']) {
      this.root.querySelector<HTMLInputElement | HTMLButtonElement>(selector)!.disabled = this.selectedBlock === 0;
    }
    const faces = this.root.querySelector('.block-faces')!;
    faces.replaceChildren();
    for (const face of ['top', 'bottom', 'side'] as const) {
      const rect = block.textures[face];
      const button = document.createElement('button');
      button.type = 'button';
      const preview = document.createElement('span');
      preview.className = 'block-face-preview';
      preview.style.backgroundSize = `${Atlas.width * 3}px ${Atlas.height * 3}px`;
      preview.style.backgroundPosition = `${-rect.x * 3}px ${-rect.y * 3}px`;
      preview.style.width = `${rect.width * 3}px`;
      preview.style.height = `${rect.height * 3}px`;
      const caption = document.createElement('span');
      caption.textContent = `${face === 'side' ? 'Sides' : face}: ${rect.x}, ${rect.y} (${rect.width} × ${rect.height})`;
      button.append(preview, caption);
      button.addEventListener('click', () => {
        this.rect = { ...rect };
        this.root.querySelector<HTMLSelectElement>('.block-face')!.value = face;
        this.sync();
      });
      faces.append(button);
    }
  }
  private message(text: string) { this.root.querySelector('.atlas-message')!.textContent = text; }
  private rectangleCode() {
    return `{ x: ${this.rect.x}, y: ${this.rect.y}, width: ${this.rect.width}, height: ${this.rect.height} }`;
  }
  private async copy(text: string, success: string) {
    const code = this.root.querySelector<HTMLTextAreaElement>('.atlas-code')!;
    code.value = text;
    try { await navigator.clipboard.writeText(text); this.message(success); }
    catch { code.focus(); code.select(); this.message('Press Ctrl+C or Command+C to copy the selected text.'); }
  }
  private sync() {
    const sheet = this.root.querySelector<HTMLElement>('.atlas-sheet')!;
    sheet.style.width = `${Atlas.width * this.zoom}px`;
    sheet.style.height = `${Atlas.height * this.zoom}px`;
    const selection = this.root.querySelector<HTMLElement>('.atlas-selection')!;
    selection.style.left = `${this.rect.x * this.zoom}px`;
    selection.style.top = `${this.rect.y * this.zoom}px`;
    selection.style.width = `${this.rect.width * this.zoom}px`;
    selection.style.height = `${this.rect.height * this.zoom}px`;
    this.root.querySelectorAll<HTMLInputElement>('[data-field]').forEach(field => {
      field.value = String(this.rect[field.dataset.field as keyof TextureRect]);
    });
    const preview = this.root.querySelector<HTMLElement>('.atlas-preview')!;
    const scale = 80 / Math.max(this.rect.width, this.rect.height);
    preview.style.width = `${this.rect.width * scale}px`;
    preview.style.height = `${this.rect.height * scale}px`;
    preview.style.backgroundSize = `${Atlas.width * scale}px ${Atlas.height * scale}px`;
    preview.style.backgroundPosition = `${-this.rect.x * scale}px ${-this.rect.y * scale}px`;
    this.root.querySelector('.atlas-coordinates')!.textContent = `x: ${this.rect.x}, y: ${this.rect.y}`;
    this.root.querySelector<HTMLTextAreaElement>('.atlas-code')!.value = this.rectangleCode();
    this.message('');
  }
}
