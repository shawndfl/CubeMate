import { Atlas, type TextureRect } from '../world/atlas.ts';

/** Read-only atlas inspector. Selecting a rectangle never changes the world. */
export class TilePicker {
  private rect = Atlas.tile(0, 0);
  private root: HTMLElement;
  private zoom = 1;
  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = `
      <h1>Atlas tile picker</h1>
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
    this.sync();
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
