export class Input {
  readonly keys = new Set<string>();
  locked = false;
  onLock = (_locked: boolean) => {};
  onLook = (_x: number, _y: number) => {};
  onSelect = (_slot: number) => {};
  onAction = (_button: number) => {};
  onInspect = () => {};
  private canvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.keys.clear(); this.onLock(this.locked);
    });
    window.addEventListener('blur', () => { this.keys.clear(); if (this.locked) document.exitPointerLock(); });
    document.addEventListener('keydown', e => {
      if (!this.locked) return;
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyF', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'KeyF' && !e.repeat) this.onInspect();
      if (/^Digit[1-6]$/.test(e.code)) this.onSelect(Number(e.code.slice(-1)) - 1);
    });
    document.addEventListener('keyup', e => this.keys.delete(e.code));
    document.addEventListener('mousemove', e => { if (this.locked) this.onLook(e.movementX, e.movementY); });
    canvas.addEventListener('mousedown', e => { if (this.locked) this.onAction(e.button); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  async lock() { await this.canvas.requestPointerLock(); }
}
