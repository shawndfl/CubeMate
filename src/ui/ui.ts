import { BLOCKS } from '../world/blocks.ts';
import type { GameState } from '../game/state.ts';
import { Atlas } from '../world/atlas.ts';
export class UI {
  private panel: HTMLElement;
  private status: HTMLElement;
  private slots: HTMLButtonElement[];
  readonly start: HTMLButtonElement;
  selected = 0;
  onSettings = () => {};
  onMainMenu = () => {};
  onBack = () => {};
  onAtlasPicker = () => {};
  onSensitivity = (_value: number) => {};
  constructor(root: HTMLElement) {
    root.insertAdjacentHTML('beforeend', `
      <header class="brand"><span class="brand-icon">◆</span><strong>CUBEMATE</strong><span class="badge">SANDBOX / 01</span></header>
      <div class="world-tag"><span class="live-dot"></span> THE WILDS <span>SEED 7319</span></div>
      <div class="crosshair" aria-hidden="true"></div>
      <section class="panel" aria-labelledby="title">
        <div class="eyebrow">A LITTLE WORLD OF YOUR OWN</div>
        <h1 id="title">Make room<br>for <em>imagination.</em></h1>
        <p>Find your corner of the wilderness.<br>Break a block. Build something new.</p>
        <div class="menu-actions">
          <button class="start">Continue <span>↗</span></button>
          <button class="menu-button settings-button">Settings</button>
          <button class="menu-button main-menu-button" hidden>Return to Main Menu</button>
        </div>
        <div class="settings-panel" hidden>
          <label for="sensitivity">Mouse sensitivity <output for="sensitivity" class="sensitivity-value">1.0×</output></label>
          <input id="sensitivity" type="range" min="0.1" max="3" step="0.1" value="1" aria-describedby="sensitivity-help" />
          <p id="sensitivity-help">Lower values turn more slowly. 1.0× is the default.</p>
          <div class="settings-message" role="status">Changes save automatically.</div>
          <button class="menu-button atlas-picker-button" type="button">Open atlas picker</button>
          <button class="menu-button back-button">Back</button>
        </div>
        <div class="instructions"><span><kbd>W A S D</kbd> Move</span><span><kbd>MOUSE</kbd> Look</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>SHIFT</kbd> Run</span><span><kbd>F</kbd> Inspect</span></div>
        <div class="notice" role="status">Desktop · keyboard & mouse · saves automatically in this browser</div>
      </section>
      <footer class="hud"><div class="selected-name">Grass</div><div class="hotbar" aria-label="Block palette"></div><div class="hints"><span>LEFT CLICK <b>Break</b></span><span>RIGHT CLICK <b>Place</b></span><span>1–${BLOCKS.length - 1} <b>Select</b></span><span>F <b>Inspect</b></span><span>ESC <b>Pause</b></span></div></footer>
      <div class="inspect-status" aria-live="polite" hidden>INSPECT MODE <span>WASD Fly · SPACE Up · C Down · SHIFT Boost · F Exit</span></div>
      <div class="coordinates">EXPLORING THE WILDS</div><div class="version">CREATIVE PROTOTYPE <span>v0.1</span></div>
      <div class="save-status" role="status">AUTOSAVE ON</div>
    `);
    this.panel = root.querySelector('.panel')!; this.start = root.querySelector('.start')!;
    this.status = root.querySelector('.notice')!;
    root.querySelector('.settings-button')!.addEventListener('click', () => this.onSettings());
    root.querySelector('.main-menu-button')!.addEventListener('click', () => this.onMainMenu());
    root.querySelector('.back-button')!.addEventListener('click', () => this.onBack());
    root.querySelector('.atlas-picker-button')!.addEventListener('click', () => this.onAtlasPicker());
    root.querySelector<HTMLInputElement>('#sensitivity')!.addEventListener('input', event => {
      const value = Number((event.target as HTMLInputElement).value);
      this.setSensitivity(value);
      this.onSensitivity(value);
    });
    const bar = root.querySelector('.hotbar')!;
    this.slots = BLOCKS.slice(1).map((block, index) => {
      const button = document.createElement('button');
      button.className = 'slot'; button.title = `${index + 1}: ${block.name}`; button.setAttribute('aria-label', block.name);
      button.innerHTML = `<span class="slot-number">${index + 1}</span><span class="block-icon" style="--block:${block.color}"></span>`;
      const icon = button.querySelector<HTMLElement>('.block-icon')!;
      const rect = block.textures.side;
      icon.style.backgroundImage = `url('${Atlas.url}')`;
      icon.style.backgroundSize = `${Atlas.width * 25 / rect.width}px ${Atlas.height * 27 / rect.height}px`;
      icon.style.backgroundPosition = `${-rect.x * 25 / rect.width}px ${-rect.y * 27 / rect.height}px`;
      button.addEventListener('click', () => this.select(index)); bar.append(button); return button;
    });
    this.select(0);
  }
  select(index: number) {
    this.selected = index;
    this.slots.forEach((slot, i) => { slot.classList.toggle('active', index === i); slot.setAttribute('aria-pressed', String(index === i)); });
    document.querySelector('.selected-name')!.textContent = BLOCKS[index + 1].name;
  }
  setState(state: GameState) {
    const playing = state === 'playing';
    const settings = state === 'settings';
    this.panel.hidden = playing;
    document.body.classList.toggle('playing', playing);
    this.panel.querySelector<HTMLElement>('.menu-actions')!.hidden = settings;
    this.panel.querySelector<HTMLElement>('.settings-panel')!.hidden = !settings;
    this.panel.querySelector<HTMLElement>('.instructions')!.hidden = settings;
    this.panel.querySelector<HTMLElement>('.main-menu-button')!.hidden = state !== 'paused';
    this.panel.querySelector('#title')!.innerHTML = settings ? 'Settings' : state === 'paused' ? 'Take a<br><em>breather.</em>' : 'Make room<br>for <em>imagination.</em>';
    this.panel.querySelector('p')!.textContent = settings ? 'Make the controls feel right for you.' : state === 'paused' ? 'Your world is paused. Pick up where you left off.' : 'Find your corner of the wilderness. Break a block. Build something new.';
    this.start.textContent = state === 'paused' ? 'Resume' : 'Continue';
    if (!playing) {
      const focus = settings ? this.panel.querySelector<HTMLInputElement>('#sensitivity')! : this.start;
      focus.focus();
    }
  }
  setSensitivity(value: number) {
    this.panel.querySelector<HTMLInputElement>('#sensitivity')!.value = String(value);
    this.panel.querySelector('.sensitivity-value')!.textContent = `${value.toFixed(1)}×`;
  }
  settingsStatus(message: string) {
    this.panel.querySelector('.settings-message')!.textContent = message;
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
