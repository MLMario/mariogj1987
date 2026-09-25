// Character sheet: the same character in eight reusable scenarios.
import { bayer, hash, Pix } from "../pixel/engine";
import { text } from "../pixel/font";
import { C } from "../pixel/palette";
import { AvatarState } from "../scene/avatar";
import { ARMS, drawChar, OUTFITS } from "./char";

export const PW = 90;
export const PH = 100;
const GROUND = 94;

const face = (mouth = 3, look = 0): AvatarState => ({
  from: "rest",
  to: "rest",
  mix: 0,
  mouth,
  blink: false,
  look,
  brows: 0,
  bob: 0,
});

// Vertical dithered gradient between colour stops.
const gradient = (p: Pix, y0: number, y1: number, cols: string[]) => {
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < PW; x++) {
      const t = ((y - y0) / (y1 - y0)) * (cols.length - 1);
      const k = Math.min(cols.length - 1, Math.floor(t + bayer(x, y) - 0.001));
      p.px(x, y, cols[Math.max(0, k)]);
    }
};

const label = (p: Pix, s: string) => {
  const w = s.length * 6 + 5;
  p.rect(3, 3, w, 11, C.ink);
  p.rect(3, 3, 1, 11, C.orange);
  text(p, s, 6, 5, C.cream);
};

const floor = (p: Pix, c1: string, c2: string) => {
  p.rect(0, GROUND, PW, 1, c1);
  gradient(p, GROUND + 1, PH, [c2, C.bg0]);
};

// Standing: character origin so the feet land on the ground line.
const SX = 30;
const SY = GROUND - 71;

const desk = (p: Pix) => {
  gradient(p, 0, 78, [C.bg1, C.bg2, C.bg2, C.bg1]);
  // shelf
  p.rect(60, 50, 26, 1, C.deskEdge);
  [C.teal2, C.orange2, C.blue2, C.cream3].forEach((c, k) => p.rect(62 + k * 3, 42, 2, 8, c));
  // chair
  p.rect(23, 34, 30, 44, C.chair);
  p.rect(21, 42, 34, 36, C.chair);
  p.rect(24, 33, 28, 1, C.chairL);
  const who = {
    outfit: OUTFITS.everyday,
    r: ARMS.deskR,
    l: ARMS.deskL,
    face: face(3, 1),
    seated: true,
  };
  drawChar(p, 30, 30, { ...who, layer: "body" });
  p.rect(0, 78, PW, 1, C.deskEdge);
  p.rect(0, 79, PW, 3, C.deskTop);
  gradient(p, 82, PH, [C.desk, C.deskDark]);
  p.rect(23, 79, 32, 3, C.ink);
  [C.orange, C.pink, C.blue, C.teal].forEach((c, k) => p.rect(26 + k * 7, 80, 2, 1, c));
  p.rect(70, 69, 7, 10, C.cream);
  p.rect(70, 72, 7, 2, C.orange);
  drawChar(p, 30, 30, { ...who, layer: "arms" });
  label(p, "AT THE DESK");
};

const standing = (p: Pix) => {
  gradient(p, 0, GROUND, [C.bg1, C.bg2, C.bg3, C.bg2]);
  floor(p, C.deskEdge, C.deskTop);
  // plant
  p.rect(72, GROUND - 9, 9, 9, C.orange2);
  p.rect(72, GROUND - 9, 9, 1, C.orange);
  p.rect(75, GROUND - 20, 2, 11, C.teal2);
  p.rect(71, GROUND - 17, 4, 2, C.teal);
  p.rect(77, GROUND - 22, 4, 2, C.teal);
  drawChar(p, SX, SY, {
    outfit: OUTFITS.everyday,
    r: ARMS.restR,
    l: ARMS.waveL,
    face: face(2, 1),
  });
  label(p, "STANDING");
};

const hiking = (p: Pix) => {
  gradient(p, 0, 60, [C.bg2, C.blue2, C.orange2, C.orange]);
  p.circle(70, 44, 6, C.orangeL);
  // far mountains
  for (let x = 0; x < PW; x++) {
    const h1 = 40 + Math.abs(((x + 10) % 44) - 22) * 1.1;
    const h2 = 58 + Math.abs(((x + 30) % 32) - 16) * 0.9;
    p.rect(x, Math.round(h1), 1, GROUND - Math.round(h1), C.blue2);
    if (h1 < 48) p.rect(x, Math.round(h1), 1, 3, C.cream);
    p.rect(x, Math.round(h2), 1, GROUND - Math.round(h2), C.teal2);
  }
  // pines
  for (const tx of [6, 14, 78]) {
    for (let k = 0; k < 4; k++) p.rect(tx - k - 1, 70 + k * 4, 2 * k + 3, 4, "#1d4a47");
    p.rect(tx, 86, 1, 8, C.ink);
  }
  floor(p, "#6b5b41", "#4a3d2c");
  const hands = drawChar(p, SX, SY, {
    outfit: OUTFITS.hiking,
    r: ARMS.poleR,
    l: ARMS.pointL,
    face: face(3, 1),
  });
  // trekking pole
  p.line(hands.r[0], hands.r[1] - 4, hands.r[0] - 3, GROUND, 1, C.cream3);
  p.rect(hands.r[0] - 1, hands.r[1] - 5, 2, 2, C.ink);
  label(p, "HIKING");
};

const beach = (p: Pix) => {
  gradient(p, 0, 58, [C.blue, "#8fb0ec", C.orangeL]);
  p.circle(68, 22, 8, C.orangeL);
  p.circle(68, 22, 6, C.orange);
  // sea
  for (let y = 58; y < 76; y++)
    for (let x = 0; x < PW; x++) {
      const w = (x + y * 3) % 17 === 0;
      p.px(x, y, w ? C.white : (y + (x >> 3)) % 4 === 0 ? C.teal : C.blue2);
    }
  gradient(p, 76, PH, [C.cream, C.cream2, C.cream3]);
  // palm
  p.line(80, GROUND - 2, 74, 36, 3, C.orange2);
  for (const [dx, dy] of [[-12, 4], [12, 5], [-8, -4], [9, -3], [0, -6]])
    p.line(74, 36, 74 + dx, 36 + dy, 2, C.teal2);
  p.rect(72, 36, 3, 3, "#5a3a26");
  const hands = drawChar(p, SX, SY + 1, {
    outfit: OUTFITS.beach,
    r: ARMS.restR,
    l: ARMS.holdL,
    face: face(3, 1),
  });
  // coconut drink
  const [hx, hy] = hands.l;
  p.circle(hx + 1, hy - 3, 4, "#6b4a2e");
  p.rect(hx - 2, hy - 7, 6, 1, C.cream);
  p.line(hx + 2, hy - 7, hx + 5, hy - 13, 1, C.pink);
  label(p, "BEACH");
};

const scientist = (p: Pix) => {
  gradient(p, 0, GROUND, [C.bg1, C.bg2, C.bg2]);
  // shelf with flasks
  p.rect(58, 40, 30, 2, C.deskEdge);
  const flask = (x: number, y: number, c: string) => {
    p.rect(x + 2, y - 10, 3, 4, C.cream2);
    p.rect(x, y - 6, 7, 6, C.cream2);
    p.rect(x + 1, y - 4, 5, 4, c);
  };
  flask(60, 40, C.teal);
  flask(70, 40, C.pink);
  flask(80, 40, C.orange);
  floor(p, C.deskEdge, C.deskTop);
  const hands = drawChar(p, SX, SY, {
    outfit: OUTFITS.scientist,
    r: ARMS.restR,
    l: ARMS.holdL,
    face: face(2, 1),
  });
  const [hx, hy] = hands.l;
  p.rect(hx, hy - 12, 3, 5, C.cream2);
  p.rect(hx - 2, hy - 7, 7, 7, C.cream2);
  p.rect(hx - 1, hy - 5, 5, 5, C.teal);
  p.px(hx + 1, hy - 15, C.teal);
  p.px(hx + 3, hy - 18, C.teal);
  p.px(hx, hy - 21, C.teal);
  label(p, "SCIENTIST");
};

const teacher = (p: Pix) => {
  gradient(p, 0, GROUND, [C.bg1, C.bg2, C.bg2]);
  // chalkboard
  p.rect(50, 18, 38, 40, C.orange2);
  p.rect(52, 20, 34, 36, "#244440");
  text(p, "1+1=2", 55, 23, C.cream);
  p.rect(64, 48, 3, 5, C.cream2);
  p.rect(70, 44, 3, 9, C.cream2);
  p.rect(76, 38, 3, 15, C.orange);
  p.rect(52, 57, 34, 2, C.orange2);
  floor(p, C.deskEdge, C.deskTop);
  const hands = drawChar(p, 18, SY, {
    outfit: OUTFITS.teacher,
    r: ARMS.restR,
    l: ARMS.pointL,
    face: face(2, 1),
  });
  p.line(hands.l[0] + 4, hands.l[1] - 4, 62, 40, 1, C.orange2);
  label(p, "TEACHER");
};

const speaker = (p: Pix) => {
  gradient(p, 0, GROUND, [C.bg0, C.bg1]);
  // curtains
  for (const cx of [0, 80])
    for (let i = 0; i < 10; i++) p.rect(cx + i, 0, 1, GROUND, i % 3 === 0 ? C.red : "#8c3a44");
  // spotlight cone
  for (let y = 0; y < GROUND; y++) {
    const half = 6 + y * 0.28;
    for (let x = Math.round(38 - half); x < 38 + half; x++)
      if (bayer(x, y) < 0.3) p.px(x, y, C.cream3);
  }
  floor(p, C.orange2, "#5a3a26");
  p.rect(20, GROUND, 40, 1, C.orangeL);
  const hands = drawChar(p, SX, SY, {
    outfit: OUTFITS.speaker,
    r: ARMS.micR,
    l: ARMS.openL,
    face: face(2, 1),
  });
  const [mx, my] = hands.r;
  p.rect(mx - 1, my - 1, 3, 7, C.ink);
  p.rect(mx - 2, my - 5, 5, 4, C.cream3);
  p.px(mx - 1, my - 4, C.white);
  label(p, "ON STAGE");
};

const astronaut = (p: Pix) => {
  p.rect(0, 0, PW, PH, C.bg0);
  for (let k = 0; k < 40; k++)
    p.px(Math.floor(hash(k) * PW), Math.floor(hash(k + 99) * 80), k % 5 ? C.cream3 : C.white);
  // ringed planet
  p.circle(70, 24, 9, C.orange2);
  p.circle(68, 22, 6, C.orange);
  p.line(55, 30, 85, 18, 1, C.orangeL);
  // moon ground
  for (let y = 82; y < PH; y++)
    for (let x = 0; x < PW; x++)
      p.px(x, y, bayer(x, y) < (y - 82) / 24 ? C.cream3 : C.cream2);
  p.rect(0, 82, PW, 1, C.white);
  p.rect(10, 88, 8, 2, C.cream3);
  p.rect(66, 92, 10, 2, C.cream3);
  drawChar(p, SX, SY - 4, {
    outfit: OUTFITS.astronaut,
    r: ARMS.restR,
    l: ARMS.waveL,
    face: face(3, 1),
  });
  // shadow under the floating astronaut
  p.rect(24, 88, 30, 1, C.cream3);
  label(p, "ASTRONAUT");
};

export const PANELS = [desk, standing, hiking, beach, scientist, teacher, speaker, astronaut];

export const drawSheet = (p: Pix) => {
  PANELS.forEach((panel, k) => {
    const dx = (k % 2) * PW;
    const dy = Math.floor(k / 2) * PH;
    p.with({ dx, dy }, () => {
      panel(p);
      // panel frame
      p.rect(0, 0, PW, 1, C.ink);
      p.rect(0, 0, 1, PH, C.ink);
    });
  });
};
