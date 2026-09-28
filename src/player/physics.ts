import { SIZE } from '../world/blocks.ts';
import type { World } from '../world/world.ts';
import type { Vec } from '../world/raycast.ts';
export const RADIUS = 0.3;
export const BODY_HEIGHT = 1.8;
export const EYE_HEIGHT = 1.62;

export function overlaps(position: Vec, block: Vec) {
  return (
    position.x + RADIUS > block.x &&
    position.x - RADIUS < block.x + 1 &&
    position.y + BODY_HEIGHT > block.y &&
    position.y < block.y + 1 &&
    position.z + RADIUS > block.z &&
    position.z - RADIUS < block.z + 1
  );
}

export function collides(world: World, p: Vec) {
  if (p.x - RADIUS < 0 || p.z - RADIUS < 0 || p.x + RADIUS > SIZE || p.z + RADIUS > SIZE) return true;
  const epsilon = 0.00001;
  for (let x = Math.floor(p.x - RADIUS + epsilon); x <= Math.floor(p.x + RADIUS - epsilon); x++)
    for (let y = Math.floor(p.y + epsilon); y <= Math.floor(p.y + BODY_HEIGHT - epsilon); y++)
      for (let z = Math.floor(p.z - RADIUS + epsilon); z <= Math.floor(p.z + RADIUS - epsilon); z++)
        if (world.get(x, y, z)) return true;
  return false;
}

export class Player {
  position: Vec = { x: 48.5, y: 30, z: 48.5 };
  yaw = 0.65;
  pitch = -0.12;
  verticalSpeed = 0;
  grounded = false;
  inspecting = false;
  private inspectionStart: Vec | null = null;
  private world: World;
  constructor(world: World) {
    this.world = world;
    this.respawn();
  }
  respawn() {
    this.position = { x: 48.5, y: this.world.surface(48, 48) + 0.02, z: 48.5 };
    this.verticalSpeed = 0;
  }
  toggleInspect() {
    if (!this.inspecting) this.inspectionStart = { ...this.position };
    else if (collides(this.world, this.position) && this.inspectionStart) this.position = { ...this.inspectionStart };
    this.inspecting = !this.inspecting;
    this.verticalSpeed = 0;
    this.grounded = false;
  }

  update(dt: number, keys: Set<string>) {
    if (this.inspecting) {
      const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
      const right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const vertical = Number(keys.has('Space')) - Number(keys.has('KeyC'));
      const horizontal = Math.cos(this.pitch) * forward;
      const length = Math.hypot(horizontal, right, vertical + Math.sin(this.pitch) * forward) || 1;
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 20 : 9;
      this.position.x += ((right * Math.cos(this.yaw) - horizontal * Math.sin(this.yaw)) / length) * speed * dt;
      this.position.y += ((vertical + Math.sin(this.pitch) * forward) / length) * speed * dt;
      this.position.z += ((-right * Math.sin(this.yaw) - horizontal * Math.cos(this.yaw)) / length) * speed * dt;
      return;
    }
    let forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    let right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const length = Math.hypot(forward, right) || 1;
    forward /= length;
    right /= length;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7 : 4.5;
    if (this.grounded && keys.has('Space')) {
      this.verticalSpeed = 8;
      this.grounded = false;
    }
    this.verticalSpeed = Math.max(-30, this.verticalSpeed - 24 * dt);
    const motion = {
      x: (right * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * speed * dt,
      z: (-right * Math.sin(this.yaw) - forward * Math.cos(this.yaw)) * speed * dt,
      y: this.verticalSpeed * dt,
    };
    this.grounded = false;
    for (const axis of ['x', 'z', 'y'] as const) {
      const start = this.position[axis];
      this.position[axis] += motion[axis];
      if (collides(this.world, this.position)) {
        if (
          axis !== 'y' &&
          Math.abs(motion[axis]) > 0.000001 &&
          this.position.x - RADIUS >= 0 &&
          this.position.x + RADIUS <= SIZE &&
          this.position.z - RADIUS >= 0 &&
          this.position.z + RADIUS <= SIZE
        ) {
          // Pushing against a solid wall climbs vertically, even while airborne.
          // The normal Y collision pass still blocks ceilings and overhangs.
          motion.y = 3 * dt;
          this.verticalSpeed = 0;
        }
        let lo = 0,
          hi = 1;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          this.position[axis] = start + motion[axis] * mid;
          if (collides(this.world, this.position)) hi = mid;
          else lo = mid;
        }
        this.position[axis] = start + motion[axis] * lo;
        if (axis === 'y') {
          this.grounded = motion.y < 0;
          this.verticalSpeed = 0;
        }
      }
    }

    // fall to your death
    if (this.position.y < -10) this.respawn();
  }
}
