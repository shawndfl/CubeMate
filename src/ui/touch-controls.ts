export class TouchControls {
  readonly element = document.createElement('div');
  onBlocks = () => {};
  onPause = () => {};
  onAction = (_button: number) => {};
  private placing = true;

  constructor(root: HTMLElement) {
    this.element.className = 'touch-controls';
    this.element.innerHTML = `
      <div class="touch-toolbar">
        <button type="button" class="touch-blocks">▦ Blocks</button>
        <button type="button" class="touch-mode" aria-label="Delete mode" aria-pressed="false">Mode: Add</button>
        <button type="button" class="touch-pause" aria-label="Pause game">Ⅱ Pause</button>
      </div>
      <div class="touch-pad" aria-label="Movement">
        <button type="button" data-key="KeyW" aria-label="Move forward">↑</button>
        <button type="button" data-key="KeyA" aria-label="Move left">←</button>
        <button type="button" data-key="KeyS" aria-label="Move backward">↓</button>
        <button type="button" data-key="KeyD" aria-label="Move right">→</button>
      </div>
      <div class="touch-actions">
        <button type="button" data-key="Space" aria-label="Jump">↥ Jump</button>
        <button type="button" class="touch-edit">＋ Add</button>
      </div>`;
    root.append(this.element);
    this.element.querySelector('.touch-blocks')!.addEventListener('click', () => this.onBlocks());
    this.element.querySelector('.touch-pause')!.addEventListener('click', () => this.onPause());
    this.element.querySelector('.touch-edit')!.addEventListener('click', () => this.onAction(this.placing ? 2 : 0));
    const mode = this.element.querySelector<HTMLButtonElement>('.touch-mode')!;
    mode.addEventListener('click', () => {
      this.placing = !this.placing;
      mode.textContent = this.placing ? 'Mode: Add' : 'Mode: Delete';
      mode.setAttribute('aria-pressed', String(!this.placing));
      this.element.querySelector('.touch-edit')!.textContent = this.placing ? '＋ Add' : '− Delete';
    });
  }
}
