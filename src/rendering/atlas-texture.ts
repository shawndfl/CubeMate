import * as THREE from 'three';
import { Atlas } from '../world/atlas.ts';

export class AtlasTexture {
  static load() {
    const texture = new THREE.TextureLoader().load(Atlas.url, loaded => {
      if (loaded.image.width !== Atlas.width || loaded.image.height !== Atlas.height)
        console.error(`Atlas dimensions must be ${Atlas.width} × ${Atlas.height}.`);
    }, undefined, () => {
      const status = document.querySelector('.save-status');
      if (status) status.textContent = 'Atlas failed to load. Check public/atlas.png and reload.';
    });
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
