import { Grid, hash, lerp, Pix } from "../pixel/engine";
import { C } from "../pixel/palette";

// Head: short buzzed hair with receding temples, stubble, visible ears.
// Eyes, brows and mouth are drawn on top so they can animate.
export const HEAD: Grid = [
  "....HHHHHHHH....",
  "..HHhHHHHhHHHH..",
  ".HHHHHhHHHHhHHH.",
  ".HHhSSSSSSSSHHH.",
  ".HHSSSSSSSSSSHH.",
  ".HSSSSSSSSSSSSH.",
  ".SSSSSSSSSSSSSS.",
  "sSSSSSSSSSSSSSSs",
  "sSSSSSSSSSSSSSSs",
  "sSSSSSSSSnSSSSSs",
  "sSSSSSSSSnSSSSSs",
  ".SSSSSSnnSSSSSS.",
  ".BSSSSSSSSSSSSB.",
  ".BSBSSSSSSSSBSB.",
  "..BSBSSSSSSBSB..",
  "...BBSBSBSBBB...",
  ".....SSSSSS.....",
  ".....sSSSSs.....",
];
export const HEAD_PAL = {
  H: C.hair,
  h: C.hairL,
  S: C.skin,
  s: C.skinS,
  n: C.skinS,
  B: C.stub,
};

export type Pose = "rest" | "raise" | "point" | "thumbs" | "shrug";

export type Arm = { el: [number, number]; hd: [number, number] };
// Joint targets relative to the body origin (head top-left).
// "r" is the arm on screen-left, "l" on screen-right.
const POSES: Record<Pose, { r: Arm; l: Arm }> = {
  rest: {
    r: { el: [-9, 36], hd: [-1, 48] },
    l: { el: [25, 36], hd: [17, 48] },
  },
  raise: {
    r: { el: [-9, 36], hd: [-1, 48] },
    l: { el: [32, 12], hd: [32, -6] },
  },
  point: {
    r: { el: [-9, 36], hd: [-1, 48] },
    l: { el: [34, 20], hd: [46, 6] },
  },
  thumbs: {
    r: { el: [-9, 36], hd: [-1, 48] },
    l: { el: [30, 38], hd: [26, 26] },
  },
  shrug: {
    r: { el: [-14, 36], hd: [-22, 26] },
    l: { el: [30, 36], hd: [38, 26] },
  },
};

export type AvatarState = {
  from: Pose;
  to: Pose;
  mix: number; // 0..1 blend between poses
  mouth: number; // 0 closed, 1 half, 2 open, 3 smile
  blink: boolean;
  look: number; // 0 camera, 1 up-right toward the stage
  brows: number; // 0 normal, 1 raised
  bob: number; // vertical px offset
};

const lerpArm = (a: Arm, b: Arm, m: number): Arm => ({
  el: [lerp(a.el[0], b.el[0], m), lerp(a.el[1], b.el[1], m)],
  hd: [lerp(a.hd[0], b.hd[0], m), lerp(a.hd[1], b.hd[1], m)],
});

const drawChair = (p: Pix, x: number, y: number) => {
  // backrest rising behind the head
  p.rect(x - 7, y + 4, 30, 72, C.chair);
  p.rect(x - 9, y + 12, 34, 64, C.chair);
  p.rect(x - 6, y + 3, 28, 1, C.chairL);
  p.rect(x - 9, y + 12, 1, 64, C.chairL);
  // stitched side panels
  p.rect(x - 6, y + 10, 1, 60, C.chairL);
  p.rect(x + 21, y + 10, 1, 60, C.chairL);
};

const drawTorso = (p: Pix, x: number, y: number) => {
  const top = y + 18;
  p.rect(x + 1, top, 14, 1, C.tee);
  p.rect(x - 2, top + 1, 20, 1, C.tee);
  p.rect(x - 5, top + 2, 26, 1, C.tee);
  p.rect(x - 6, top + 3, 28, 70, C.tee);
  // shading
  p.rect(x - 6, top + 3, 2, 70, C.teeS);
  p.rect(x + 20, top + 3, 2, 70, C.teeS);
  p.rect(x + 8, top + 26, 1, 30, C.teeS);
  p.px(x + 3, top + 10, C.teeL);
  p.px(x + 4, top + 11, C.teeL);
  p.px(x + 12, top + 14, C.teeL);
  // crew neck
  p.rect(x + 5, top, 6, 2, C.skin);
  p.rect(x + 6, top + 2, 4, 1, C.skinS);
  p.rect(x + 4, top, 1, 2, C.teeS);
  p.rect(x + 11, top, 1, 2, C.teeS);
};

// White over-ear headphones resting around the neck.
const drawHeadphones = (p: Pix, x: number, y: number) => {
  const cy = y + 16;
  p.rect(x + 3, cy - 1, 2, 1, C.hpS);
  p.rect(x + 11, cy - 1, 2, 1, C.hpS);
  for (const cx of [x - 1, x + 12]) {
    p.rect(cx + 1, cy, 3, 6, C.hp);
    p.rect(cx, cy + 1, 5, 4, C.hp);
    p.rect(cx + 4, cy + 1, 1, 4, C.hpS);
    p.rect(cx + 1, cy + 5, 3, 1, C.hpS);
  }
  // inner pads face each other
  p.rect(x + 3, cy + 1, 1, 4, C.hpD);
  p.rect(x + 12, cy + 1, 1, 4, C.hpD);
};

const drawArm = (
  p: Pix,
  sx: number,
  sy: number,
  a: Arm,
  bx: number,
  by: number,
  hand: Pose,
  side: "r" | "l",
) => {
  const ex = bx + a.el[0];
  const ey = by + a.el[1];
  const hx = bx + a.hd[0];
  const hy = by + a.hd[1];
  // skin arm with darker outline
  p.line(sx, sy, ex, ey, 6, C.skinS);
  p.line(ex, ey, hx, hy, 6, C.skinS);
  p.line(sx, sy, ex, ey, 4, C.skin);
  p.line(ex, ey, hx, hy, 4, C.skin);
  // short sleeve over the upper arm
  const mx = lerp(sx, ex, 0.35);
  const my = lerp(sy, ey, 0.35);
  p.line(sx, sy, mx, my, 7, C.teeS);
  p.line(sx, sy, mx, my, 5, C.tee);

  const X = Math.round(hx);
  const Y = Math.round(hy);
  const dir = side === "l" ? 1 : -1;
  if (hand === "raise") {
    // open palm with fingers
    p.box(X - 3, Y - 2, 7, 7, C.skin, C.skinS);
    for (let f = 0; f < 4; f++) p.rect(X - 3 + f * 2, Y - 5, 1, 3, C.skin);
    p.rect(X + 4, Y, 2, 2, C.skin);
  } else if (hand === "point") {
    p.box(X - 3, Y - 3, 6, 6, C.skin, C.skinS);
    p.line(X + 2, Y - 2, X + 6, Y - 5, 2, C.skin);
  } else if (hand === "thumbs") {
    p.box(X - 3, Y - 2, 7, 6, C.skin, C.skinS);
    p.rect(X - 1, Y - 6, 2, 4, C.skin);
    p.rect(X - 2, Y - 6, 1, 4, C.skinS);
  } else if (hand === "shrug") {
    p.box(X - 3 + dir, Y - 2, 7, 4, C.skin, C.skinS);
  } else {
    p.box(X - 3, Y - 2, 7, 5, C.skin, C.skinS);
  }
};

export const drawFace = (p: Pix, x: number, y: number, s: AvatarState) => {
  const by = y + (s.brows > 0.5 ? 5 : 6);
  p.rect(x + 3, by, 4, 1, C.hair);
  p.rect(x + 9, by, 4, 1, C.hair);
  if (s.blink) {
    p.rect(x + 4, y + 8, 2, 1, C.skinD);
    p.rect(x + 10, y + 8, 2, 1, C.skinD);
  } else {
    // Pupils sit on the inner-right side so he always looks toward the
    // stage; "look" lifts them up toward the image.
    const up = s.look > 0.5 ? 0 : 1;
    p.rect(x + 4, y + 7, 2, 2, C.white);
    p.rect(x + 10, y + 7, 2, 2, C.white);
    p.rect(x + 5, y + 7, 1, 1 + up, C.ink);
    p.rect(x + 11, y + 7, 1, 1 + up, C.ink);
  }
  const m = s.mouth;
  if (m === 0) {
    p.rect(x + 6, y + 13, 4, 1, C.skinD);
  } else if (m === 1) {
    p.rect(x + 6, y + 13, 4, 1, C.mouth);
    p.rect(x + 7, y + 14, 2, 1, C.mouth);
  } else if (m === 2) {
    p.rect(x + 6, y + 13, 4, 2, C.mouth);
    p.rect(x + 7, y + 13, 2, 1, C.white);
    p.rect(x + 7, y + 15, 2, 1, C.mouth);
  } else {
    p.rect(x + 6, y + 13, 4, 1, C.skinD);
    p.px(x + 5, y + 12, C.skinD);
    p.px(x + 10, y + 12, C.skinD);
  }
};

// x, y: head top-left.
export const drawAvatarBack = (p: Pix, x: number, y: number) => {
  drawChair(p, x, y);
};

export const drawAvatar = (p: Pix, x: number, y0: number, s: AvatarState) => {
  const y = y0 + s.bob;
  drawTorso(p, x, y);
  p.sprite(HEAD, HEAD_PAL, x, y);
  drawFace(p, x, y, s);
  drawHeadphones(p, x, y);
};

// Arms go after the desk so hands can rest on the keyboard.
export const drawArms = (p: Pix, x: number, y0: number, s: AvatarState) => {
  const y = y0 + s.bob;
  const a = POSES[s.from];
  const b = POSES[s.to];
  const hand = s.mix < 0.5 ? s.from : s.to;
  const r = lerpArm(a.r, b.r, s.mix);
  const l = lerpArm(a.l, b.l, s.mix);
  drawArm(p, x - 4, y + 23, r, x, y, hand === "shrug" ? "shrug" : "rest", "r");
  drawArm(p, x + 20, y + 23, l, x, y, hand, "l");
};

// Blink roughly every 3-4 s, deterministic.
export const isBlinking = (frame: number) => {
  const period = 105;
  const k = Math.floor(frame / period);
  const at = k * period + Math.floor(hash(k) * 60);
  return frame >= at && frame < at + 4;
};
