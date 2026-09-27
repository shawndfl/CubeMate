import { Vector3 } from 'three';
import { World } from '../world/world.ts';
import { trace } from '../world/raycast.ts';
import { Player, EYE_HEIGHT, overlaps } from '../player/physics.ts';
import { Input } from '../input/input.ts';
import { View } from '../rendering/renderer.ts';
import { UI } from '../ui/ui.ts';

export class Game {
  constructor(root: HTMLElement) {
    const ui = new UI(root);
    let view: View;
    try {
      view = new View(root);
    } catch {
      ui.error('WebGL is unavailable. Try a browser with hardware acceleration enabled.');
      ui.start.disabled = true;
      return;
    }
    const world = new World(),
      player = new Player(world),
      input = new Input(view.renderer.domElement);
    const direction = new Vector3();
    const aim = () => trace(world, view.camera.position, view.camera.getWorldDirection(direction));
    const syncCamera = () => {
      view.camera.position.set(player.position.x, player.position.y + EYE_HEIGHT, player.position.z);
      view.camera.rotation.set(player.pitch, player.yaw, 0);
      view.camera.updateMatrixWorld();
    };
    input.onLock = (locked) => ui.setLocked(locked);
    input.onLook = (x, y) => {
      player.yaw -= x * 0.002;
      player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch - y * 0.002));
    };
    input.onSelect = (slot) => ui.select(slot);
    input.onInspect = () => {
      player.toggleInspect();
      ui.setInspect(player.inspecting);
    };
    input.onAction = (button) => {
      syncCamera();
      const hit = aim();
      if (!hit) return;
      if (button === 0) world.set(hit.block.x, hit.block.y, hit.block.z, 0);
      if (
        button === 2 &&
        !overlaps(player.position, hit.adjacent) &&
        !world.get(hit.adjacent.x, hit.adjacent.y, hit.adjacent.z)
      )
        world.set(hit.adjacent.x, hit.adjacent.y, hit.adjacent.z, ui.selected + 1);
    };
    ui.start.addEventListener('click', () => {
      input.lock().catch(() => ui.error('Mouse capture was blocked. Click Enter again to retry.'));
    });
    document.addEventListener('pointerlockerror', () =>
      ui.error('Mouse capture was blocked. Click the button to retry.'),
    );
    view.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      document.exitPointerLock();
      ui.error('Graphics connection lost. Reload the page to restart.');
      ui.start.disabled = true;
    });
    view.rebuild(world);
    let last = performance.now(),
      accumulator = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (input.locked) {
        accumulator += dt;
        while (accumulator >= 1 / 120) {
          player.update(1 / 120, input.keys);
          accumulator -= 1 / 120;
        }
      } else accumulator = 0;
      syncCamera();
      view.rebuild(world);
      const hit = input.locked ? aim() : null;
      view.outline.visible = !!hit;
      if (hit) view.outline.position.set(hit.block.x + 0.5, hit.block.y + 0.5, hit.block.z + 0.5);
      ui.coordinates(player.position.x, player.position.y, player.position.z);
      view.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
