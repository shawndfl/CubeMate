import { BLOCKS } from '../world/blocks.ts';
import { Atlas } from '../world/atlas.ts';
import type { Hotbar } from '../game/hotbar.ts';

export class BlockPicker {
  private dialog = document.createElement('dialog');
  private slots: HTMLButtonElement[] = [];
  private target = 0;
  private hotbar: Hotbar;
  onChange = () => {};
  onClose = () => {};

  constructor(root: HTMLElement, hotbar: Hotbar) {
    this.hotbar = hotbar;
    this.dialog.className = 'block-picker';
    this.dialog.setAttribute('aria-labelledby', 'block-picker-title');
    this.dialog.innerHTML = `<h2 id="block-picker-title">Choose your blocks</h2>
      <p>Select a hotbar slot, then choose a block below. Blocks already on your hotbar swap slots.</p>
      <div class="picker-slots" aria-label="Active slots"></div>
      <p class="picker-status" role="status"></p>
      <div class="picker-grid" aria-label="Available blocks"></div>
      <button class="menu-button picker-done" type="button">Done — return to game</button>`;
    root.append(this.dialog);
    const slots = this.dialog.querySelector('.picker-slots')!;
    this.slots = hotbar.blocks.map((_, slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot';
      button.addEventListener('click', () => { this.target = slot; this.refresh(); });
      slots.append(button);
      return button;
    });
    const grid = this.dialog.querySelector('.picker-grid')!;
    BLOCKS.slice(1).forEach((block, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const name = document.createElement('span');
      name.textContent = block.name;
      button.append(BlockPicker.icon(index + 1), name);
      button.addEventListener('click', () => {
        hotbar.replace(this.target, index + 1);
        this.refresh();
        this.onChange();
      });
      grid.append(button);
    });
    this.dialog.querySelector('.picker-done')!.addEventListener('click', () => this.onClose());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.onClose(); });
  }

  static icon(id: number) {
    const icon = document.createElement('span');
    icon.className = 'block-icon';
    const block = BLOCKS[id];
    const rect = block.textures.side;
    icon.style.setProperty('--block', block.color);
    icon.style.backgroundImage = `url('${Atlas.url}')`;
    icon.style.backgroundSize = `${Atlas.width * 25 / rect.width}px ${Atlas.height * 27 / rect.height}px`;
    icon.style.backgroundPosition = `${-rect.x * 25 / rect.width}px ${-rect.y * 27 / rect.height}px`;
    return icon;
  }

  show(slot: number) {
    this.target = slot;
    this.refresh();
    if (!this.dialog.open) this.dialog.showModal();
    this.slots[slot].focus();
  }
  hide() { this.dialog.close(); }
  error(message: string) { this.dialog.querySelector('.picker-status')!.textContent = message; }
  private refresh() {
    this.slots.forEach((button, slot) => {
      const id = this.hotbar.blocks[slot];
      button.replaceChildren(BlockPicker.icon(id));
      const number = document.createElement('span');
      number.className = 'slot-number';
      number.textContent = String(slot + 1);
      button.append(number);
      button.classList.toggle('active', slot === this.target);
      button.setAttribute('aria-pressed', String(slot === this.target));
      button.setAttribute('aria-label', `Slot ${slot + 1}: ${BLOCKS[id].name}`);
      button.title = `Slot ${slot + 1}: ${BLOCKS[id].name}`;
    });
    this.error(`Replacing slot ${this.target + 1}: ${BLOCKS[this.hotbar.blocks[this.target]].name}`);
  }
}
