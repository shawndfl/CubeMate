import { Atlas, type FaceTextures, type TextureRect } from './atlas.ts';

/** Shared data shape for a placeable voxel block and its atlas rendering rules. */
export interface Block {
  name: string;
  color: string;
  tint: string;
  textures: FaceTextures;
  /** Optional looping texture frames, advanced without rebuilding block meshes. */
  animation?: readonly TextureRect[];
  /** False lets alpha-tested cutouts reveal neighboring faces and transmit light. */
  occludes?: boolean;
  /** Light level emitted into nearby air cells, from 1 through 15. */
  light?: number;
}

// Array indices are persistent block IDs: append new definitions, never reorder.
// Color is the hotbar fallback; tint multiplies the atlas pixels on world faces.
export const BLOCKS: readonly Block[] = [
  { name: 'Air', color: '#ffffff', tint: '#ffffff', occludes: false, textures: Atlas.all(0, 0) },
  {
    name: 'Grass',
    color: '#789d4e',
    tint: '#ffffff',
    occludes: true,
    textures: { top: Atlas.tile(336, 80), bottom: Atlas.tile(272, 160), side: Atlas.tile(320, 96) },
  },
  { name: 'Dirt', color: '#9c7653', tint: '#ffffff', occludes: true, textures: Atlas.all(272, 160) },
  { name: 'Stone', color: '#8e9995', tint: '#ffffff', occludes: true, textures: Atlas.all(64, 128) },
  { name: 'Sand', color: '#dfca94', tint: '#ffffff', occludes: true, textures: Atlas.all(432, 112) },
  {
    name: 'Wood',
    color: '#92653f',
    tint: '#ffffff',
    occludes: true,
    textures: { top: Atlas.tile(192, 128), bottom: Atlas.tile(192, 128), side: Atlas.tile(64, 240) },
  },
  { name: 'Leaves', color: '#547b43', tint: '#749950', occludes: false, textures: Atlas.all(224, 96) },
  { name: 'Glow Brick', color: '#ffcf83', tint: '#ffffff', occludes: true, light: 15, textures: Atlas.all(320, 16) },
  {
    name: 'Lava',
    color: '#c92b07',
    tint: '#ffffff',
    light: 15,
    textures: Atlas.all(128, 32),
    animation: [Atlas.tile(128, 32), Atlas.tile(144, 32), Atlas.tile(128, 48), Atlas.tile(144, 48)],
  },
] as const;
export const CHUNK = 16;
export const SIZE = 96;
export const HEIGHT = 48;
export const GLOW_BRICK = 7;
