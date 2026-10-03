export type GameState = 'main' | 'playing' | 'paused' | 'settings' | 'blocks';

type Effects = {
  resetInput: () => void;
  releasePointer: () => void;
  flushSave: () => void;
  changed: (state: GameState) => void;
};

/** Owns navigation and only enters gameplay after a requested pointer lock succeeds. */
export class GameStates {
  private current: GameState = 'main';
  private settingsOrigin: 'main' | 'paused' = 'main';
  private pendingPlay = false;
  private effects: Effects;

  constructor(effects: Effects) { this.effects = effects; }
  get state() { return this.current; }
  get playing() { return this.current === 'playing'; }

  requestPlay() {
    if (this.pendingPlay || (this.current !== 'main' && this.current !== 'paused' && this.current !== 'blocks')) return false;
    this.pendingPlay = true;
    return true;
  }
  cancelPlay() { this.pendingPlay = false; }
  pointerChanged(locked: boolean) {
    if (locked) {
      if (this.playing) return;
      if (this.pendingPlay && (this.current === 'main' || this.current === 'paused' || this.current === 'blocks')) {
        this.pendingPlay = false;
        this.transition('playing');
      } else this.effects.releasePointer();
    } else if (this.playing) this.transition('paused');
  }
  pause() {
    this.pendingPlay = false;
    this.transition(this.playing ? 'paused' : this.current);
  }
  mainMenu() { this.transition('main'); }
  blocks() { if (this.playing) this.transition('blocks'); }
  settings() {
    if (this.current === 'settings') return;
    this.settingsOrigin = this.current === 'main' ? 'main' : 'paused';
    this.transition('settings');
  }
  back() {
    if (this.current === 'settings') this.transition(this.settingsOrigin);
  }
  private transition(next: GameState) {
    const leavingPlay = this.playing && next !== 'playing';
    this.current = next;
    this.pendingPlay = false;
    this.effects.resetInput();
    this.effects.changed(next);
    if (leavingPlay) this.effects.flushSave();
    if (next !== 'playing') this.effects.releasePointer();
  }
}
