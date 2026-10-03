export type TextureRect = { x: number; y: number; width: number; height: number };
export type FaceTextures = { top: TextureRect; bottom: TextureRect; side: TextureRect };

/** Pixel rectangles use the image's top-left origin; UVs use a bottom-left origin. */
export class Atlas {
  static readonly url = './atlas.png';
  static readonly width = 1024;
  static readonly height = 1024;
  static tile(x: number, y: number): TextureRect { return { x, y, width: 16, height: 16 }; }
  static all(x: number, y: number): FaceTextures {
    const rect = Atlas.tile(x, y);
    return { top: rect, bottom: rect, side: rect };
  }
  static valid(rect: TextureRect) {
    return Object.values(rect).every(Number.isInteger) && rect.x >= 0 && rect.y >= 0 &&
      rect.width > 0 && rect.height > 0 && rect.x + rect.width <= Atlas.width && rect.y + rect.height <= Atlas.height;
  }
  static face(textures: FaceTextures, normalY: number) {
    return normalY > 0 ? textures.top : normalY < 0 ? textures.bottom : textures.side;
  }
  static uvs(rect: TextureRect) {
    if (!Atlas.valid(rect)) throw new Error('Texture rectangle is outside the atlas');
    // Half-pixel insets keep samples inside the tile at shared edges.
    const left = (rect.x + 0.5) / Atlas.width;
    const right = (rect.x + rect.width - 0.5) / Atlas.width;
    const top = 1 - (rect.y + 0.5) / Atlas.height;
    const bottom = 1 - (rect.y + rect.height - 0.5) / Atlas.height;
    return [left, bottom, right, bottom, right, top, left, top];
  }
  static pick(x: number, y: number): TextureRect {
    return Atlas.tile(Math.max(0, Math.min(1008, Math.floor(x / 16) * 16)), Math.max(0, Math.min(1008, Math.floor(y / 16) * 16)));
  }
}
