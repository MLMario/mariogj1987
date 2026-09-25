// Writes character.json (the character definition) and spritesheet.json
// (the atlas) into characters/host/. Run: npx tsx scripts/export-character.ts
import { writeFileSync } from "node:fs";
import { ARMS, OUTFITS } from "../src/character/char";
import {
  ANIMS,
  atlasFrames,
  CELL_H,
  CELL_W,
  HEAD_X,
  HEAD_Y,
  SHEET_COLS,
  SHEET_ROWS,
} from "../src/character/frames";
import { C } from "../src/pixel/palette";
import { HEAD, HEAD_PAL } from "../src/scene/avatar";

const out = "characters/host";
const frames = atlasFrames();

// Aseprite-compatible "hash" atlas, plus animation tags.
const atlas = {
  frames: Object.fromEntries(
    frames.map((f) => [
      f.name,
      {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        duration: 167,
      },
    ]),
  ),
  meta: {
    app: "pixel-video character exporter",
    image: "spritesheet.png",
    format: "RGBA8888",
    size: { w: SHEET_COLS * CELL_W, h: SHEET_ROWS * CELL_H },
    scale: "1",
    frameTags: [...new Set(frames.map((f) => f.anim))].map((anim) => {
      const idx = frames.flatMap((f, i) => (f.anim === anim ? [i] : []));
      return { name: anim, from: idx[0], to: idx[idx.length - 1], direction: "forward" };
    }),
  },
};
writeFileSync(`${out}/spritesheet.json`, JSON.stringify(atlas, null, 2) + "\n");

const character = {
  name: "host",
  version: 1,
  units: "1 unit = 1 art pixel; render at an integer scale (6x or 12x) with nearest-neighbour",
  cell: { w: CELL_W, h: CELL_H, headOrigin: { x: HEAD_X, y: HEAD_Y } },
  head: { size: { w: 16, h: 18 }, grid: HEAD, palette: HEAD_PAL },
  face: {
    eyes: "2x2 white sockets at (4,7) and (10,7); pupils on the right column so he looks toward the content",
    mouth: { 0: "closed", 1: "half open", 2: "open", 3: "smile" },
    brows: { 0: "normal (row 6)", 1: "raised (row 5)" },
    blink: "eyes replaced by a 2px line on row 8",
  },
  body: {
    torso: { x: -3, w: 22, top: 18 },
    shoulders: { right: [-1, 23], left: [17, 23] },
    standingHeight: 71,
  },
  armPresets: ARMS,
  outfits: OUTFITS,
  animations: Object.fromEntries(Object.entries(ANIMS).map(([k, v]) => [k, v.length])),
  palette: C,
};
writeFileSync(`${out}/character.json`, JSON.stringify(character, null, 2) + "\n");
console.log(`wrote ${frames.length} frames`);
