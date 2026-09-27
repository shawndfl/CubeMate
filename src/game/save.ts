import { BLOCKS, HEIGHT, SIZE } from '../world/blocks.ts';
import type { World } from '../world/world.ts';
import { collides, type Player } from '../player/physics.ts';

export const SAVE_KEY = 'cubemate.save.v1';
type Save = {
  version: 1;
  seed: number;
  edits: number[][];
  player: { x: number; y: number; z: number; yaw: number; pitch: number; inspecting: boolean };
  selected: number;
};

function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function validEdit(edit: unknown): edit is number[] {
  return Array.isArray(edit) && edit.length === 4 && edit.every(Number.isInteger) &&
    edit[0] >= 0 && edit[0] < SIZE && edit[1] > 0 && edit[1] < HEIGHT &&
    edit[2] >= 0 && edit[2] < SIZE && edit[3] >= 0 && edit[3] < BLOCKS.length;
}

export function restore(raw: string | null, world: World, player: Player): number | null {
  if (!raw) return null;
  try {
    const save: unknown = JSON.parse(raw);
    if (!save || typeof save !== 'object') return null;
    const data = save as Partial<Save>;
    if (data.version !== 1 || data.seed !== world.seed || !Array.isArray(data.edits) ||
      !data.edits.every(validEdit) || !data.player || !finite(data.player.x) || !finite(data.player.y) ||
      !finite(data.player.z) || !finite(data.player.yaw) || !finite(data.player.pitch) ||
      typeof data.player.inspecting !== 'boolean' ||
      !Number.isInteger(data.selected) || data.selected! < 0 || data.selected! >= BLOCKS.length - 1) return null;
    for (const [x, y, z, block] of data.edits) world.set(x, y, z, block);
    const position = { x: data.player.x, y: data.player.y, z: data.player.z };
    if (data.player.inspecting) {
      player.toggleInspect();
      player.position = position;
    } else if (!collides(world, position) && position.y >= 0 && position.y < HEIGHT + 64) player.position = position;
    player.yaw = data.player.yaw;
    player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, data.player.pitch));
    return data.selected!;
  } catch { return null; }
}

export function serialize(world: World, player: Player, selected: number): string {
  const save: Save = {
    version: 1, seed: world.seed, edits: world.savedEdits(),
    player: { ...player.position, yaw: player.yaw, pitch: player.pitch, inspecting: player.inspecting }, selected,
  };
  return JSON.stringify(save);
}

export class AutoSave {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private last = '';
  private world: World;
  private player: Player;
  private getSelected: () => number;
  private onError: () => void;
  constructor(world: World, player: Player, getSelected: () => number, onError: () => void) {
    this.world = world; this.player = player; this.getSelected = getSelected; this.onError = onError;
  }
  schedule() {
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = undefined; this.flush(); }, 750);
  }
  flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = undefined; }
    const value = serialize(this.world, this.player, this.getSelected());
    if (value === this.last) return;
    try { localStorage.setItem(SAVE_KEY, value); this.last = value; }
    catch { this.onError(); }
  }
}
