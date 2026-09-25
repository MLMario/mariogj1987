import { bayer, H, hash, Pix, W } from "../pixel/engine";
import { C } from "../pixel/palette";

export const DESK_Y = 284;

// Dithered radial glow on the wall, brightest behind the animation stage.
const wall = (p: Pix) => {
  const levels = [C.bg0, C.bg1, C.bg2, C.bg3];
  for (let y = 0; y < DESK_Y; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x - 90) / 110;
      const dy = (y - 128) / 150;
      const t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 3.2;
      const k = Math.min(3, Math.floor(t + bayer(x, y) - 0.2));
      let c = levels[Math.max(0, k)];
      // faint dot grid
      if (x % 8 === 4 && y % 8 === 4 && y < 230 && k >= 1) c = C.dot;
      p.px(x, y, c);
    }
};

const shelf = (p: Pix) => {
  // plank
  p.rect(112, 246, 60, 3, C.deskEdge);
  p.rect(112, 249, 60, 1, C.deskDark);
  const books = [
    [115, 4, 14, C.teal2],
    [119, 3, 12, C.orange2],
    [122, 5, 15, C.blue2],
    [127, 3, 11, C.cream3],
    [130, 4, 13, C.teal2],
  ] as const;
  for (const [x, w, h, c] of books) {
    p.rect(x, 246 - h, w, h, c);
    p.rect(x, 246 - h + 3, w, 1, C.bg0);
  }
  // leaning book
  p.line(137, 245, 142, 234, 3, C.red);
  // small plant
  p.rect(158, 238, 9, 8, C.orange2);
  p.rect(158, 238, 9, 1, C.orange);
  p.rect(160, 231, 2, 7, C.teal2);
  p.rect(163, 229, 2, 9, C.teal);
  p.rect(156, 233, 3, 2, C.teal2);
  p.rect(165, 232, 3, 2, C.teal);
};

const desk = (p: Pix) => {
  p.rect(0, DESK_Y, W, 2, C.deskEdge);
  p.rect(0, DESK_Y + 2, W, 5, C.deskTop);
  p.rect(0, DESK_Y + 7, W, 1, C.deskDark);
  for (let y = DESK_Y + 8; y < H; y++)
    for (let x = 0; x < W; x++)
      p.px(x, y, bayer(x, y) < (y - DESK_Y - 8) / 30 ? C.deskDark : C.desk);
};

// Keyboard with slowly cycling RGB keys.
const keyboard = (p: Pix, t: number) => {
  p.rect(14, DESK_Y + 1, 52, 5, C.ink);
  const rgb = [C.orange, C.pink, C.blue, C.teal];
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 12; k++) {
      const c = rgb[Math.floor(k / 3 + t * 1.5 + r) % rgb.length];
      p.px(16 + k * 4, DESK_Y + 2 + r * 2, c);
      p.px(17 + k * 4, DESK_Y + 2 + r * 2, C.bg2);
    }
};

const mug = (p: Pix, t: number) => {
  const x = 142;
  const y = DESK_Y - 13;
  p.rect(x, y, 10, 14, C.cream);
  p.rect(x, y, 10, 1, C.cream2);
  p.rect(x + 9, y + 1, 1, 13, C.cream2);
  p.rect(x, y + 5, 10, 3, C.orange);
  p.rect(x + 10, y + 3, 3, 1, C.cream2);
  p.rect(x + 12, y + 3, 1, 6, C.cream2);
  p.rect(x + 10, y + 8, 3, 1, C.cream2);
  // steam wisps
  for (let s = 0; s < 3; s++) {
    const ph = (t * 0.6 + s / 3) % 1;
    const sy = y - 2 - ph * 14;
    const sx = x + 3 + s * 2 + Math.round(Math.sin(ph * 6 + s) * 1.5);
    if (hash(s + Math.floor(t * 4)) > 0.25)
      p.with({ hide: ph * 0.9 }, () => p.px(sx, sy, C.cream3));
  }
};

export const drawBack = (p: Pix) => {
  wall(p);
  shelf(p);
};

export const drawDesk = (p: Pix, t: number) => {
  desk(p);
  keyboard(p, t);
  mug(p, t);
};
