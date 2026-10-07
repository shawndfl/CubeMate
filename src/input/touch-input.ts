import type { Input } from './input.ts';

/** Pointer capture keeps independent movement, jump, and look fingers active. */
export class TouchInput {
  private held = new Map<number, { key: string; element: HTMLElement }>();
  private look: { id: number; x: number; y: number } | null = null;
  private input: Input;

  constructor(canvas: HTMLCanvasElement, controls: HTMLElement, input: Input) {
    this.input = input;
    controls.querySelectorAll<HTMLElement>('[data-key]').forEach(element => {
      element.addEventListener('pointerdown', event => {
        if (!input.enabled || event.button !== 0) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        const key = element.dataset.key!;
        this.held.set(event.pointerId, { key, element });
        input.keys.add(key);
        element.classList.add('held');
      });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        element.addEventListener(type, event => this.release((event as PointerEvent).pointerId));
      }
    });
    canvas.addEventListener('pointerdown', event => {
      if (!input.enabled || event.pointerType === 'mouse' || this.look) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      this.look = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener('pointermove', event => {
      if (!input.enabled || this.look?.id !== event.pointerId) return;
      input.onLook(event.clientX - this.look.x, event.clientY - this.look.y);
      this.look.x = event.clientX;
      this.look.y = event.clientY;
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(type, event => {
        if (this.look?.id === (event as PointerEvent).pointerId) this.look = null;
      });
    }
    input.onReset = () => this.reset();
  }

  private release(id: number) {
    const held = this.held.get(id);
    if (!held) return;
    this.held.delete(id);
    if (![...this.held.values()].some(value => value.key === held.key)) {
      this.input.keys.delete(held.key);
      held.element.classList.remove('held');
    }
  }

  reset() {
    for (const id of this.held.keys()) this.release(id);
    this.look = null;
  }
}
