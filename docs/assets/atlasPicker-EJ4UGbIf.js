import{n as e,t}from"./atlas-HiPdHamr.js";var n=class e{static replaceDefinition(n,r){if(!Array.isArray(r)||!r.length||r.length>256)throw Error(`Invalid block count.`);for(let e of r){if(!e||typeof e.name!=`string`||!e.name.trim()||typeof e.color!=`string`||!/^#[\da-f]{6}$/i.test(e.color)||typeof e.tint!=`string`||!/^#[\da-f]{6}$/i.test(e.tint)||e.occludes!==void 0&&typeof e.occludes!=`boolean`||e.light!==void 0&&(!Number.isInteger(e.light)||e.light<1||e.light>15))throw Error(`Invalid block properties.`);for(let n of[`top`,`bottom`,`side`]){let r=e.textures?.[n];if(!r||!t.valid(r))throw Error(`Invalid face rectangle.`)}if(e.animation!==void 0&&(!Array.isArray(e.animation)||!e.animation.length||!e.animation.every(e=>e&&t.valid(e))))throw Error(`Invalid animation.`)}if(r[0].name!==`Air`||r[0].occludes!==!1)throw Error(`Air must remain block 0.`);let i=/export const BLOCKS: readonly Block\[\] = \[[\s\S]*?\] as const;/;if(!i.test(n))throw Error(`Could not locate the BLOCKS declaration.`);return n.replace(i,()=>new e(r).definition())}blocks;constructor(e){this.blocks=structuredClone(e)}add(){if(this.blocks.length>=256)throw Error(`The world supports at most 256 block IDs.`);return this.blocks.push({name:`New block`,color:`#ffffff`,tint:`#ffffff`,occludes:!0,textures:t.all(0,0)}),this.blocks.length-1}setTexture(e,n,r){if(e===0)throw Error(`Air is reserved.`);if(!t.valid(r))throw Error(`Choose a rectangle inside the atlas.`);let i=this.blocks[e].textures,a=n===`all`?[`top`,`bottom`,`side`]:[n];for(let e of a)i[e]={...r}}definition(){for(let e of this.blocks){if(!e.name.trim())throw Error(`Every block needs a name.`);if(!/^#[\da-f]{6}$/i.test(e.color))throw Error(`Colors must use six hex digits.`);if(!Object.values(e.textures).every(e=>t.valid(e)))throw Error(`Invalid texture rectangle.`)}return`export const BLOCKS: readonly Block[] = ${JSON.stringify(this.blocks,null,2)} as const;`}},r=`import { Atlas, type FaceTextures, type TextureRect } from './atlas.ts';

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
`;new class{editor=new n(e);selectedBlock=1;dirty=!1;source=r;rect=t.tile(0,0);root;zoom=1;constructor(e){this.root=e,e.innerHTML=`
      <h1>Atlas tile picker</h1>
      <section class="block-editor" aria-label="Block editor">
        <div class="block-toolbar"><label>Block <select class="block-list"></select></label><button class="block-add" type="button">Add block</button></div>
        <div class="block-fields">
          <label>Name <input class="block-name" maxlength="100" required /></label>
          <label>Color <input class="block-color" type="color" /></label>
          <label class="block-checkbox"><input class="block-occludes" type="checkbox" /> Occludes neighboring faces and light</label>
        </div>
        <p>Color is the hotbar fallback. Existing tint, light, and animation settings are preserved. Air (ID 0) is reserved.</p>
        <div class="block-faces"></div>
        <div class="block-toolbar"><label>Apply selection to <select class="block-face"><option value="all">All faces</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="side">Sides</option></select></label><button class="block-apply" type="button">Use selected rectangle</button></div>
        <div class="block-toolbar"><button class="block-save" type="button">Save to blocks.ts</button><button class="block-export" type="button">Copy BLOCKS</button></div>
        <textarea class="block-code" aria-label="BLOCKS definition" readonly rows="5" hidden></textarea>
        <div class="block-message" role="status">Loaded block definitions. Save to apply changes to the project.</div>
      </section>
      <p>Click a 16 × 16 tile, or enter a custom pixel rectangle. Origin is the image's top-left.</p>
      <div class="atlas-toolbar"><label>Zoom <select class="atlas-zoom"><option value="0.5">50%</option><option value="1" selected>100%</option><option value="2">200%</option></select></label><span>Tile selection snaps to 16 pixels.</span></div>
      <div class="atlas-scroll"><div class="atlas-sheet">
        <img src="${t.url}" alt="Block texture atlas" draggable="false" />
        <div class="atlas-selection"></div>
      </div></div>
      <div class="atlas-fields">
        ${[`x`,`y`,`width`,`height`].map(e=>`<label>${e}<input data-field="${e}" type="number" step="1" min="${e===`x`||e===`y`?0:1}" max="1024" value="${e===`x`||e===`y`?0:16}" /></label>`).join(``)}
      </div>
      <div class="atlas-preview" aria-label="Selected tile preview"></div>
      <div class="atlas-coordinates" aria-live="polite"></div>
      <div class="atlas-copy-buttons">
        <button class="atlas-copy-xy" type="button">Copy x, y</button>
        <button class="atlas-copy-rect" type="button">Copy full rectangle</button>
      </div>
      <textarea class="atlas-code" aria-label="Texture rectangle definition" readonly rows="2"></textarea>
      <div class="atlas-message" role="status"></div>
    `;let n=e.querySelector(`img`);n.addEventListener(`load`,()=>{(n.naturalWidth!==t.width||n.naturalHeight!==t.height)&&this.message(`Image is ${n.naturalWidth} × ${n.naturalHeight}; update Atlas.width and Atlas.height to match.`)}),n.addEventListener(`error`,()=>this.message(`Could not load /atlas.png.`)),n.addEventListener(`click`,e=>{let r=n.getBoundingClientRect();this.rect=t.pick((e.clientX-r.left)/r.width*t.width,(e.clientY-r.top)/r.height*t.height),this.sync()}),e.querySelector(`.atlas-zoom`).addEventListener(`change`,e=>{this.zoom=Number(e.target.value),this.sync()}),e.querySelectorAll(`[data-field]`).forEach(n=>n.addEventListener(`input`,()=>{let n={...this.rect};if(e.querySelectorAll(`[data-field]`).forEach(e=>{n[e.dataset.field]=e.valueAsNumber}),!t.valid(n)){this.message(`Enter whole pixels within the atlas, with positive width and height.`);return}this.rect=n,this.sync()})),e.querySelector(`.atlas-copy-xy`).addEventListener(`click`,()=>this.copy(`${this.rect.x}, ${this.rect.y}`,`Coordinates copied.`)),e.querySelector(`.atlas-copy-rect`).addEventListener(`click`,()=>this.copy(this.rectangleCode(),`Rectangle copied.`)),this.setupBlocks(),this.sync()}setupBlocks(){this.refreshBlockList();let e=this.root.querySelector(`.block-save`);e.disabled=!0,this.blockMessage(`Saving requires the local dev server. Use Copy BLOCKS to export.`),e.addEventListener(`click`,async()=>{e.disabled=!0;try{this.editor.definition();let e=await fetch(`/__block-editor`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({source:this.source,blocks:this.editor.blocks})}),t=await e.json();if(!e.ok)throw Error(t.error??`Could not save blocks.`);this.source=t.source,this.dirty=!1,this.blockMessage(`Saved to src/world/blocks.ts. The game will reload with these definitions.`)}catch(e){this.blockMessage(e.message)}finally{e.disabled=!1}}),this.root.querySelector(`.block-list`).addEventListener(`change`,e=>{this.selectedBlock=Number(e.target.value),this.showBlock()}),this.root.querySelector(`.block-add`).addEventListener(`click`,()=>{try{this.selectedBlock=this.editor.add(),this.refreshBlockList(),this.changed()}catch(e){this.blockMessage(e.message)}});for(let e of[`.block-name`,`.block-color`,`.block-occludes`])this.root.querySelector(e).addEventListener(`input`,()=>{if(!this.selectedBlock)return;let e=this.editor.blocks[this.selectedBlock];e.name=this.root.querySelector(`.block-name`).value,e.color=this.root.querySelector(`.block-color`).value,e.occludes=this.root.querySelector(`.block-occludes`).checked,this.root.querySelector(`.block-list`).options[this.selectedBlock].textContent=`${this.selectedBlock} — ${e.name}`,this.changed()});this.root.querySelector(`.block-apply`).addEventListener(`click`,()=>{let e=this.root.querySelector(`.block-face`).value;this.editor.setTexture(this.selectedBlock,e,this.rect),this.showBlock(),this.changed()}),this.root.querySelector(`.block-export`).addEventListener(`click`,async()=>{let e=this.root.querySelector(`.block-code`);try{e.value=this.editor.definition(),e.hidden=!1;try{await navigator.clipboard.writeText(e.value),this.blockMessage(`Copied. Replace the BLOCKS declaration in src/world/blocks.ts with this definition.`)}catch{e.focus(),e.select(),this.blockMessage(`Press Ctrl+C or Command+C, then replace the BLOCKS declaration in src/world/blocks.ts.`)}}catch(e){this.blockMessage(e.message)}}),window.addEventListener(`beforeunload`,e=>{this.dirty&&e.preventDefault()})}blockMessage(e){this.root.querySelector(`.block-message`).textContent=e}changed(){this.dirty=!0,this.root.querySelector(`.block-code`).hidden=!0,this.blockMessage(`Unsaved block changes. Save to blocks.ts to apply them.`)}refreshBlockList(){let e=this.root.querySelector(`.block-list`);e.replaceChildren(...this.editor.blocks.map((e,t)=>new Option(`${t} — ${e.name}`,String(t)))),e.value=String(this.selectedBlock),this.showBlock()}showBlock(){let e=this.editor.blocks[this.selectedBlock];this.root.querySelector(`.block-name`).value=e.name,this.root.querySelector(`.block-color`).value=e.color,this.root.querySelector(`.block-occludes`).checked=e.occludes!==!1;for(let e of[`.block-name`,`.block-color`,`.block-occludes`,`.block-apply`])this.root.querySelector(e).disabled=this.selectedBlock===0;let n=this.root.querySelector(`.block-faces`);n.replaceChildren();for(let r of[`top`,`bottom`,`side`]){let i=e.textures[r],a=document.createElement(`button`);a.type=`button`;let o=document.createElement(`span`);o.className=`block-face-preview`,o.style.backgroundSize=`${t.width*3}px ${t.height*3}px`,o.style.backgroundPosition=`${-i.x*3}px ${-i.y*3}px`,o.style.width=`${i.width*3}px`,o.style.height=`${i.height*3}px`;let s=document.createElement(`span`);s.textContent=`${r===`side`?`Sides`:r}: ${i.x}, ${i.y} (${i.width} × ${i.height})`,a.append(o,s),a.addEventListener(`click`,()=>{this.rect={...i},this.root.querySelector(`.block-face`).value=r,this.sync()}),n.append(a)}}message(e){this.root.querySelector(`.atlas-message`).textContent=e}rectangleCode(){return`{ x: ${this.rect.x}, y: ${this.rect.y}, width: ${this.rect.width}, height: ${this.rect.height} }`}async copy(e,t){let n=this.root.querySelector(`.atlas-code`);n.value=e;try{await navigator.clipboard.writeText(e),this.message(t)}catch{n.focus(),n.select(),this.message(`Press Ctrl+C or Command+C to copy the selected text.`)}}sync(){let e=this.root.querySelector(`.atlas-sheet`);e.style.width=`${t.width*this.zoom}px`,e.style.height=`${t.height*this.zoom}px`;let n=this.root.querySelector(`.atlas-selection`);n.style.left=`${this.rect.x*this.zoom}px`,n.style.top=`${this.rect.y*this.zoom}px`,n.style.width=`${this.rect.width*this.zoom}px`,n.style.height=`${this.rect.height*this.zoom}px`,this.root.querySelectorAll(`[data-field]`).forEach(e=>{e.value=String(this.rect[e.dataset.field])});let r=this.root.querySelector(`.atlas-preview`),i=80/Math.max(this.rect.width,this.rect.height);r.style.width=`${this.rect.width*i}px`,r.style.height=`${this.rect.height*i}px`,r.style.backgroundSize=`${t.width*i}px ${t.height*i}px`,r.style.backgroundPosition=`${-this.rect.x*i}px ${-this.rect.y*i}px`,this.root.querySelector(`.atlas-coordinates`).textContent=`x: ${this.rect.x}, y: ${this.rect.y}`,this.root.querySelector(`.atlas-code`).value=this.rectangleCode(),this.message(``)}}(document.querySelector(`#atlas-picker`));