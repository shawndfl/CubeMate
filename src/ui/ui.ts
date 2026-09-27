import { BLOCKS } from '../world/blocks.ts';
export class UI {
  private panel: HTMLElement;
  private status: HTMLElement;
  private slots: HTMLButtonElement[];
  readonly start: HTMLButtonElement;
  selected = 0;
  constructor(root: HTMLElement) {
    root.insertAdjacentHTML('beforeend', `
      <header class="brand"><span class="brand-icon">◆</span><strong>CUBEMATE</strong><span class="badge">SANDBOX / 01</span></header>
      <div class="world-tag"><span class="live-dot"></span> THE WILDS <span>SEED 7319</span></div>
      <div class="crosshair" aria-hidden="true"></div>
      <section class="panel" aria-labelledby="title">
        <div class="eyebrow">A LITTLE WORLD OF YOUR OWN</div>
        <h1 id="title">Make room<br>for <em>imagination.</em></h1>
        <p>Find your corner of the wilderness.<br>Break a block. Build something new.</p>
        <button class="start">Enter the world <span>↗</span></button>
        <div class="instructions"><span><kbd>W A S D</kbd> Move</span><span><kbd>MOUSE</kbd> Look</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>SHIFT</kbd> Run</span><span><kbd>F</kbd> Inspect</span></div>
        <div class="notice" role="status">Desktop · keyboard & mouse · saves automatically in this browser</div>
      </section>
      <footer class="hud"><div class="selected-name">Grass</div><div class="hotbar" aria-label="Block palette"></div><div class="hints"><span>LEFT CLICK <b>Break</b></span><span>RIGHT CLICK <b>Place</b></span><span>1–6 <b>Select</b></span><span>F <b>Inspect</b></span><span>ESC <b>Pause</b></span></div></footer>
      <div class="inspect-status" aria-live="polite" hidden>INSPECT MODE <span>WASD Fly · SPACE Up · C Down · SHIFT Boost · F Exit</span></div>
      <div class="coordinates">EXPLORING THE WILDS</div><div class="version">CREATIVE PROTOTYPE <span>v0.1</span></div>
      <div class="save-status" role="status">AUTOSAVE ON</div>
    `);
    this.panel = root.querySelector('.panel')!; this.start = root.querySelector('.start')!;
    this.status = root.querySelector('.notice')!;
    const bar = root.querySelector('.hotbar')!;
    this.slots = BLOCKS.slice(1).map((block, index) => {
      const button = document.createElement('button');
      button.className = 'slot'; button.title = `${index + 1}: ${block.name}`; button.setAttribute('aria-label', block.name);
      button.innerHTML = `<span class="slot-number">${index + 1}</span><span class="block-icon" style="--block:${block.color}"></span>`;
      button.addEventListener('click', () => this.select(index)); bar.append(button); return button;
    });
    this.select(0);
  }
  select(index: number) {
    this.selected = index;
    this.slots.forEach((slot, i) => { slot.classList.toggle('active', index === i); slot.setAttribute('aria-pressed', String(index === i)); });
    document.querySelector('.selected-name')!.textContent = BLOCKS[index + 1].name;
  }
  setLocked(locked: boolean) {
    this.panel.hidden = locked; document.body.classList.toggle('playing', locked);
    this.start.innerHTML = 'Resume exploring <span>↗</span>';
    if (!locked) this.start.focus();
  }
  setInspect(active: boolean) {
    const status = document.querySelector<HTMLElement>('.inspect-status')!;
    status.hidden = !active;
    document.body.classList.toggle('inspecting', active);
  }
  error(message: string) { this.status.textContent = message; }
  saveStatus(message: string) { document.querySelector('.save-status')!.textContent = message.toUpperCase(); }
  coordinates(x: number, y: number, z: number) {
    document.querySelector('.coordinates')!.textContent = `X ${Math.floor(x)} / Y ${Math.floor(y)} / Z ${Math.floor(z)}`;
  }
}
