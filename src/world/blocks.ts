import { Atlas } from './atlas.ts';

// Array indices are persistent block IDs: append new definitions, never reorder.
// Color is the hotbar fallback; tint multiplies the atlas pixels on world faces.
export const BLOCKS = [
  { name: 'Air', color: '#ffffff', tint: '#ffffff', occludes: false, textures: Atlas.all(0, 0) },
  {
    name: 'Grass',
    color: '#789d4e',
    tint: '#ffffff',
    occludes: true,
    textures: { top: Atlas.tile(416, 80), bottom: Atlas.tile(272, 160), side: Atlas.tile(320, 96) },
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
  { name: 'Glow Brick', color: '#ffcf83', tint: '#ffffff', occludes: true, textures: Atlas.all(320, 16) },
] as const;
export const CHUNK = 16;
export const SIZE = 96;
export const HEIGHT = 48;
export const GLOW_BRICK = 7;
