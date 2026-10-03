import * as THREE from 'three';
import { BLOCKS, CHUNK, HEIGHT } from '../world/blocks.ts';
import type { World } from '../world/world.ts';
import { Sky } from './sky.ts';
import { VoxelLighting, vertexAO } from '../world/lighting.ts';
import { daylight } from '../world/day-cycle.ts';
import { voxelMaterial } from './voxel-material.ts';
import { Atlas } from '../world/atlas.ts';
import { AtlasTexture } from './atlas-texture.ts';
import { LavaAnimation } from './lava-animation.ts';

const faces = [
  {
    n: [1, 0, 0],
    v: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    n: [-1, 0, 0],
    v: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    n: [0, 1, 0],
    v: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    n: [0, -1, 0],
    v: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    n: [0, 0, 1],
    v: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  {
    n: [0, 0, -1],
    v: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
];

/**
 * Owns CubeMate's Three.js rendering state and converts voxel world data into
 * visible chunk meshes. The game controls the camera transform, target outline,
 * and when dirty chunks are rebuilt; View handles geometry, voxel lighting,
 * sky rendering, fog, and canvas resizing.
 */
export class View {
  /** Scene containing terrain chunks and the block-selection outline. */
  readonly scene = new THREE.Scene();

  /** First-person camera positioned and rotated by the game loop. */
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.05, 160);

  /** WebGL renderer whose canvas is inserted into the supplied container. */
  readonly renderer = new THREE.WebGLRenderer({ antialias: true });

  private sky = new Sky(this.scene);

  private meshes = new Map<string, THREE.Mesh>();

  private lighting = new VoxelLighting();

  private daylight = { value: 1 };

  private material = voxelMaterial(AtlasTexture.load(), this.daylight);

  private lavaAnimation = new LavaAnimation();

  private lastRenderAt = 0;

  private lavaFaces = new Map<string, { uv: THREE.BufferAttribute; offsets: number[] }>();

  /** Wireframe shown around the solid block currently under the crosshair. */
  readonly outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006)),
    new THREE.LineBasicMaterial({ color: 0xfff1c8 }),
  );

  /** Creates the rendering pipeline and attaches its canvas to the page. */
  constructor(container: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    container.prepend(this.renderer.domElement);
    this.renderer.autoClear = false;
    this.scene.fog = new THREE.Fog('#b8d8de', 38, 105);
    this.scene.add(this.outline);
    this.outline.visible = false;
    this.camera.rotation.order = 'YXZ';
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** Keeps the camera projection and canvas resolution matched to the viewport. */
  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Recomputes voxel lighting, then replaces meshes for chunks marked dirty by
   * world generation or block edits. Hidden block faces are omitted, while each
   * visible vertex receives face shading, ambient occlusion, and light levels.
   */
  rebuild(world: World) {
    // Skip rebuilding until a world edit marks a chunk dirty.
    if (!world.dirty.size) {
      return;
    }

    // Refresh lighting before rebuilding affected chunk meshes.
    this.lighting.update(world);

    for (const key of world.dirty) {
      const old = this.meshes.get(key);
      if (old) {
        this.scene.remove(old);
        old.geometry.dispose();
      }

      this.lavaFaces.delete(key);
      const chunkCoordinates = key.split(',').map(Number);
      const cx = chunkCoordinates[0];
      const cz = chunkCoordinates[1];

      const positions: number[] = [];
      const normals: number[] = [];
      const colors: number[] = [];
      const lights: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const lavaOffsets: number[] = [];
      for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
        for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) {
          for (let y = 0; y < HEIGHT; y++) {
            const block = world.get(x, y, z);
            if (!block) {
              continue;
            }

            for (const face of faces) {
              const neighbor = world.get(x + face.n[0], y + face.n[1], z + face.n[2]);
              if (neighbor && BLOCKS[neighbor].occludes !== false) {
                continue;
              }

              const offset = positions.length / 3;
              const color = new THREE.Color(BLOCKS[block].tint);
              color.multiplyScalar(0.94 + ((x * 13 + y * 7 + z * 3) % 9) * 0.009);
              const emission = BLOCKS[block].light ?? 0;
              const glowing = emission > 0;
              const shade = face.n[1] > 0 ? 1 : face.n[1] < 0 ? 0.5 : face.n[0] ? 0.72 : 0.86;
              const ao = face.v.map((v) => (glowing ? 1 : vertexAO(world, x, y, z, face.n, v)));
              const light = this.lighting.sample(x + face.n[0], y + face.n[1], z + face.n[2]);

              for (let corner = 0; corner < face.v.length; corner++) {
                const v = face.v[corner];
                const brightness = ao[corner] * (glowing ? 1 : shade);
                positions.push(x + v[0], y + v[1], z + v[2]);
                normals.push(...face.n);
                colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
                lights.push(light[0], light[1], emission / 15);
              }

              const rect =
                BLOCKS[block].animation?.[this.lavaAnimation.frame] ?? Atlas.face(BLOCKS[block].textures, face.n[1]);
              if (BLOCKS[block].animation) {
                lavaOffsets.push(uvs.length);
              }

              uvs.push(...Atlas.uvs(rect));
              if (ao[0] + ao[2] > ao[1] + ao[3]) {
                indices.push(offset, offset + 1, offset + 3, offset + 1, offset + 2, offset + 3);
              } else {
                indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
              }
            }
          }
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('voxelLight', new THREE.Float32BufferAttribute(lights, 3));
      const uv = new THREE.Float32BufferAttribute(uvs, 2);
      uv.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('uv', uv);
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, this.material);
      this.meshes.set(key, mesh);
      this.scene.add(mesh);
      if (lavaOffsets.length) {
        this.lavaFaces.set(key, { uv, offsets: lavaOffsets });
      }
    }

    world.dirty.clear();
  }

  /** Draws the distant sky first, then the voxel scene for the given time of day. */
  render(time: number) {
    const now = performance.now();
    if (this.lastRenderAt) {
      const elapsed = Math.min((now - this.lastRenderAt) / 1000, 0.1);
      if (this.lavaAnimation.advance(elapsed)) this.updateLavaFrames();
    }
    this.lastRenderAt = now;
    this.daylight.value = daylight(time).brightness;
    this.sky.update(time, this.camera, this.scene.fog as THREE.Fog);
    this.renderer.clear();
    this.renderer.render(this.sky.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }

  private updateLavaFrames() {
    const frames = BLOCKS.find((block) => block.animation)?.animation;
    if (!frames) {
      return;
    }

    //console.debug('lava frame: ' + this.lavaAnimation.frame);
    const frameUVs = Atlas.uvs(frames[this.lavaAnimation.frame]);
    for (const lavaFace of this.lavaFaces.values()) {
      const uv = lavaFace.uv;
      const offsets = lavaFace.offsets;
      //console.debug('  lava face: ', offsets);

      for (const offset of offsets) {
        for (let component = 0; component < frameUVs.length; component++) {
          //console.debug('    lava component: ' + component);
          uv.array[offset + component] = frameUVs[component];
        }
      }

      uv.needsUpdate = true;
    }
  }
}
