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
  {
    "name": "Air",
    "color": "#ffffff",
    "tint": "#ffffff",
    "occludes": false,
    "textures": {
      "top": {
        "x": 0,
        "y": 0,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 0,
        "y": 0,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 0,
        "y": 0,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Grass",
    "color": "#789d4e",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 336,
        "y": 80,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 272,
        "y": 160,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 320,
        "y": 96,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Dirt",
    "color": "#9c7653",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 272,
        "y": 160,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 272,
        "y": 160,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 272,
        "y": 160,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Stone",
    "color": "#8e9995",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 64,
        "y": 128,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 64,
        "y": 128,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 64,
        "y": 128,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Sand",
    "color": "#dfca94",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 432,
        "y": 112,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 432,
        "y": 112,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 432,
        "y": 112,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Wood",
    "color": "#92653f",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 192,
        "y": 128,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 192,
        "y": 128,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 64,
        "y": 240,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Leaves",
    "color": "#547b43",
    "tint": "#749950",
    "occludes": false,
    "textures": {
      "top": {
        "x": 224,
        "y": 96,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 224,
        "y": 96,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 224,
        "y": 96,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Glow Brick",
    "color": "#ffcf83",
    "tint": "#ffffff",
    "occludes": true,
    "light": 15,
    "textures": {
      "top": {
        "x": 320,
        "y": 16,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 320,
        "y": 16,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 320,
        "y": 16,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "Lava",
    "color": "#c92b07",
    "tint": "#ffffff",
    "light": 15,
    "textures": {
      "top": {
        "x": 128,
        "y": 32,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 128,
        "y": 32,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 128,
        "y": 32,
        "width": 16,
        "height": 16
      }
    },
    "animation": [
      {
        "x": 128,
        "y": 32,
        "width": 16,
        "height": 16
      },
      {
        "x": 144,
        "y": 32,
        "width": 16,
        "height": 16
      },
      {
        "x": 128,
        "y": 48,
        "width": 16,
        "height": 16
      },
      {
        "x": 144,
        "y": 48,
        "width": 16,
        "height": 16
      }
    ]
  },
  {
    "name": "window",
    "color": "#765656",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 448,
        "y": 64,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 448,
        "y": 64,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 448,
        "y": 64,
        "width": 16,
        "height": 16
      }
    }
  },
  {
    "name": "plant",
    "color": "#ffffff",
    "tint": "#ffffff",
    "occludes": true,
    "textures": {
      "top": {
        "x": 0,
        "y": 0,
        "width": 16,
        "height": 16
      },
      "bottom": {
        "x": 0,
        "y": 0,
        "width": 16,
        "height": 16
      },
      "side": {
        "x": 192,
        "y": 0,
        "width": 16,
        "height": 16
      }
    }
  }
] as const;
export const CHUNK = 16;
export const SIZE = 96;
export const HEIGHT = 48;
export const GLOW_BRICK = 7;
