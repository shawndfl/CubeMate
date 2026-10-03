import { Vector3 } from 'three';
import { World } from '../world/world.ts';
import { trace } from '../world/raycast.ts';
import { Player, EYE_HEIGHT, overlaps } from '../player/physics.ts';
import { Input } from '../input/input.ts';
import { View } from '../rendering/renderer.ts';
import { UI } from '../ui/ui.ts';
import { AutoSave, restore, SAVE_KEY } from './save.ts';
import { advanceTime } from '../world/day-cycle.ts';
import { GameStates } from './state.ts';
import { DEFAULT_SENSITIVITY, parseSensitivity, SETTINGS_KEY, storeSensitivity } from './settings.ts';

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
    const world = new World();
    const player = new Player(world);
    const input = new Input(view.renderer.domElement);
    input.enabled = false;
    let sensitivity = DEFAULT_SENSITIVITY;
    try { sensitivity = parseSensitivity(localStorage.getItem(SETTINGS_KEY)); }
    catch { ui.settingsStatus('Settings storage is unavailable. Changes apply for this session.'); }
    ui.setSensitivity(sensitivity);
    let stored: string | null = null;
    try { stored = localStorage.getItem(SAVE_KEY); }
    catch { ui.saveStatus('Autosave unavailable'); }
    const selected = restore(stored, world, player);
    if (selected !== null) { ui.select(selected); ui.setInspect(player.inspecting); ui.saveStatus('World restored'); }
    const autosave = new AutoSave(world, player, () => ui.selected, () => ui.saveStatus('Autosave unavailable'));
    let accumulator = 0;
    const states = new GameStates({
      resetInput: () => input.reset(),
      releasePointer: () => { if (document.pointerLockElement) document.exitPointerLock(); },
      flushSave: () => autosave.flush(),
      changed: state => {
        input.enabled = state === 'playing';
        accumulator = 0;
        ui.setState(state);
      },
    });
    ui.setState(states.state);
    ui.onSettings = () => states.settings();
    ui.onMainMenu = () => states.mainMenu();
    ui.onBack = () => states.back();
    ui.onAtlasPicker = () => {
      const picker = window.open('/atlas-picker.html', 'cubemate-atlas-picker', 'popup,width=1120,height=850,resizable=yes,scrollbars=yes');
      if (!picker) ui.settingsStatus('The picker window was blocked. Allow popups for this site and retry.');
    };
    ui.onSensitivity = value => {
      sensitivity = value;
      ui.settingsStatus(storeSensitivity(value) ? 'Settings saved.' : 'Could not save settings. Changes apply for this session.');
    };
    const direction = new Vector3();
    const aim = () => trace(world, view.camera.position, view.camera.getWorldDirection(direction));
    const syncCamera = () => {
      view.camera.position.set(player.position.x, player.position.y + EYE_HEIGHT, player.position.z);
      view.camera.rotation.set(player.pitch, player.yaw, 0);
      view.camera.updateMatrixWorld();
    };
    input.onLock = locked => states.pointerChanged(locked);
    input.onBlur = () => states.pause();
    input.onLook = (x, y) => {
      if (!states.playing) return;
      player.yaw -= x * 0.002 * sensitivity;
      player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch - y * 0.002 * sensitivity));
      autosave.schedule();
    };
    input.onSelect = (slot) => { if (states.playing) { ui.select(slot); autosave.schedule(); } };
    input.onInspect = () => {
      if (!states.playing) return;
      player.toggleInspect();
      ui.setInspect(player.inspecting);
      autosave.schedule();
    };
    input.onAction = (button) => {
      if (!states.playing) return;
      syncCamera();
      const hit = aim();
      if (!hit) return;
      let changed = false;
      if (button === 0) changed = world.set(hit.block.x, hit.block.y, hit.block.z, 0);
      if (
        button === 2 &&
        !overlaps(player.position, hit.adjacent) &&
        !world.get(hit.adjacent.x, hit.adjacent.y, hit.adjacent.z)
      )
        changed = world.set(hit.adjacent.x, hit.adjacent.y, hit.adjacent.z, ui.selectedBlock);
      if (changed) autosave.schedule();
    };
    window.addEventListener('pagehide', () => { states.pause(); autosave.flush(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { states.pause(); autosave.flush(); } });
    document.addEventListener('keydown', event => {
      if (event.code === 'Tab' && states.playing) {
        event.preventDefault();
        if (!event.repeat) states.blocks();
        return;
      }
      if (states.state === 'blocks') return;
      if (event.code !== 'Escape') return;
      if (states.state === 'settings') states.back();
      else states.pause();
    });
    const resume = () => {
      if (!states.requestPlay()) return;
      input.lock().catch(() => {
        states.cancelPlay();
        if (states.state === 'blocks') ui.picker.error('Mouse capture was blocked. Click Done to retry.');
        else ui.error('Mouse capture was blocked. Click Continue or Resume to retry.');
      });
    };
    ui.start.addEventListener('click', resume);
    ui.picker.onClose = resume;
    document.addEventListener('pointerlockerror', () => {
      states.cancelPlay();
      if (states.state === 'blocks') ui.picker.error('Mouse capture was blocked. Click Done to retry.');
      ui.error('Mouse capture was blocked. Click Continue or Resume to retry.');
    });
    view.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      states.pause();
      ui.error('Graphics connection lost. Reload the page to restart.');
      ui.start.disabled = true;
    });
    view.rebuild(world);
    let last = performance.now();
    let positionSave = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (states.playing) {
        world.timeOfDay = advanceTime(world.timeOfDay, dt);
        accumulator += dt;
        while (accumulator >= 1 / 120) {
          player.update(1 / 120, input.keys);
          accumulator -= 1 / 120;
        }
        positionSave += dt;
        if (positionSave >= 2) { positionSave = 0; autosave.schedule(); }
      } else accumulator = 0;
      syncCamera();
      view.rebuild(world);
      const hit = states.playing ? aim() : null;
      view.outline.visible = !!hit;
      if (hit) view.outline.position.set(hit.block.x + 0.5, hit.block.y + 0.5, hit.block.z + 0.5);
      ui.coordinates(player.position.x, player.position.y, player.position.z);
      view.render(world.timeOfDay);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
