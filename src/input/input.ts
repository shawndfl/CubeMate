import { BLOCKS } from '../world/blocks.ts';

export class Input {
  private readonly repeatTimers = new Map<number, ReturnType<typeof setInterval>>();
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

    // setups the first person interaction
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.keys.clear();
      if (!this.locked) this.stopActions();
      this.onLock(this.locked);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.stopActions();
      if (this.locked) document.exitPointerLock();
    });

    // keyboard events
    document.addEventListener('keydown', (e) => {
      if (!this.locked) return;
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyF', 'ShiftLeft', 'ShiftRight'].includes(e.code))
        e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'KeyF' && !e.repeat) this.onInspect();
      if (/^Digit[1-9]$/.test(e.code) && Number(e.code.slice(-1)) < BLOCKS.length)
        this.onSelect(Number(e.code.slice(-1)) - 1);
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // mouse events
    document.addEventListener('mousemove', (e) => {
      if (this.locked) this.onLook(e.movementX, e.movementY);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.locked || (e.button !== 0 && e.button !== 2) || this.repeatTimers.has(e.button)) return;
      this.onAction(e.button);
      this.repeatTimers.set(
        e.button,
        setInterval(() => {
          if (this.locked) this.onAction(e.button);
        }, 200),
      );
    });
    document.addEventListener('mouseup', (e) => this.stopAction(e.button));
    // no right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  async lock() {
    await this.canvas.requestPointerLock();
  }
  private stopAction(button: number) {
    const timer = this.repeatTimers.get(button);
    if (timer !== undefined) clearInterval(timer);
    this.repeatTimers.delete(button);
  }
  private stopActions() {
    for (const button of this.repeatTimers.keys()) this.stopAction(button);
  }
}
