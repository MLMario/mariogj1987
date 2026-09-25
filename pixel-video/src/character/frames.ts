// Sprite-sheet frames: one animation per row, standing then seated.
import { Pix } from "../pixel/engine";
import { C } from "../pixel/palette";
import { AvatarState } from "../scene/avatar";
import { ARMS, drawChar, Limb, Outfit, OUTFITS } from "./char";

// Cell size in pixels at 1x, and where the head's top-left sits in a cell.
export const CELL_W = 80;
export const CELL_H = 84;
export const HEAD_X = 26;
export const HEAD_Y = 10;

type FrameSpec = {
  face?: Partial<AvatarState>;
  r?: Limb;
  l?: Limb;
};

const shift = (a: Limb, dx: number, dy = 0): Limb => ({
  ...a,
  hd: [a.hd[0] + dx, a.hd[1] + dy],
});

export const ANIMS: Record<string, FrameSpec[]> = {
  idle: [{}, {}, {}, { face: { blink: true } }],
  talk: [
    { face: { mouth: 0 } },
    { face: { mouth: 1 } },
    { face: { mouth: 2 } },
    { face: { mouth: 1 } },
  ],
  wave: [0, 3, 0, -3].map((dx) => ({ l: shift(ARMS.waveL, dx), face: { mouth: 3 } })),
  point: [
    { l: ARMS.pointL, face: { mouth: 2 } },
    { l: shift(ARMS.pointL, 1, -1), face: { mouth: 0 } },
  ],
  thumbs: [
    { l: ARMS.thumbsL, face: { mouth: 3 } },
    { l: shift(ARMS.thumbsL, 0, -1), face: { mouth: 3, brows: 1 } },
  ],
  shrug: [
    { r: ARMS.shrugR, l: ARMS.shrugL, face: { mouth: 3, brows: 1 } },
    { r: shift(ARMS.shrugR, 0, -1), l: shift(ARMS.shrugL, 0, -1), face: { mouth: 0, brows: 1 } },
  ],
};

export const MODES = ["standing", "seated"] as const;
export type Mode = (typeof MODES)[number];

export type AtlasFrame = {
  name: string;
  anim: string;
  mode: Mode;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const ANIM_NAMES = Object.keys(ANIMS);
export const SHEET_COLS = Math.max(...Object.values(ANIMS).map((a) => a.length));
export const SHEET_ROWS = ANIM_NAMES.length * MODES.length;

export const atlasFrames = (): AtlasFrame[] =>
  MODES.flatMap((mode, m) =>
    ANIM_NAMES.flatMap((anim, a) =>
      ANIMS[anim].map((_, i) => ({
        name: `${mode}_${anim}_${i}`,
        anim: `${mode}_${anim}`,
        mode,
        index: i,
        x: i * CELL_W,
        y: (m * ANIM_NAMES.length + a) * CELL_H,
        w: CELL_W,
        h: CELL_H,
      })),
    ),
  );

const baseFace: AvatarState = {
  from: "rest",
  to: "rest",
  mix: 0,
  mouth: 0,
  blink: false,
  look: 1,
  brows: 0,
  bob: 0,
};

const drawChair = (p: Pix, x: number, y: number) => {
  p.rect(x - 7, y + 4, 30, 50, C.chair);
  p.rect(x - 9, y + 12, 34, 42, C.chair);
  p.rect(x - 6, y + 3, 28, 1, C.chairL);
  p.rect(x - 9, y + 12, 1, 42, C.chairL);
};

// Draw one frame with the head's top-left at (x, y).
export const drawFrame = (
  p: Pix,
  mode: Mode,
  anim: string,
  i: number,
  x: number,
  y: number,
  outfit: Outfit = OUTFITS.everyday,
) => {
  const spec = ANIMS[anim][i % ANIMS[anim].length];
  const seated = mode === "seated";
  const r = spec.r ?? (seated ? ARMS.deskR : ARMS.restR);
  const l = spec.l ?? (seated ? ARMS.deskL : ARMS.restL);
  if (seated) drawChair(p, x, y);
  drawChar(p, x, y, {
    outfit,
    r,
    l,
    seated,
    face: { ...baseFace, ...spec.face },
  });
};

export const drawSpriteSheet = (p: Pix, outfit?: Outfit) => {
  for (const f of atlasFrames())
    drawFrame(p, f.mode, f.anim.slice(f.mode.length + 1), f.index, f.x + HEAD_X, f.y + HEAD_Y, outfit);
};
