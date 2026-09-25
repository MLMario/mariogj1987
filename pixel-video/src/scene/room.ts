import { bayer, hash, Pix } from "../pixel/engine";
import { C } from "../pixel/palette";

// Foreground layout uses 2x units: a 90x160 grid over the 180x320 canvas.
export const FW = 90;
export const FH = 160;
export const DESK_Y = 142;

// Fine-grained dithered glow on the wall (1x units), brightest behind the stage.
const wall = (p: Pix) => {
  const levels = [C.bg0, C.bg1, C.bg2, C.bg3];
  const deskPx = DESK_Y * 2;
  for (let y = 0; y < deskPx; y++)
    for (let x = 0; x < FW * 2; x++) {
      const dx = (x - 90) / 115;
      const dy = (y - 95) / 160;
      const t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 3.2;
      const k = Math.min(3, Math.floor(t + bayer(x, y) - 0.2));
      let c = levels[Math.max(0, k)];
      if (x % 8 === 4 && y % 8 === 4 && y < 190 && k >= 1) c = C.dot;
      p.px(x, y, c);
    }
};

const shelf = (p: Pix) => {
  const y = 122;
  p.rect(52, y, 36, 2, C.deskEdge);
  p.rect(52, y + 2, 36, 1, C.deskDark);
  const books = [
    [54, 3, 10, C.teal2],
    [57, 2, 8, C.orange2],
    [59, 3, 11, C.blue2],
    [62, 2, 7, C.cream3],
    [64, 3, 9, C.teal2],
  ] as const;
  for (const [x, w, h, c] of books) {
    p.rect(x, y - h, w, h, c);
    p.rect(x, y - h + 2, w, 1, C.bg0);
  }
  p.line(69, y - 1, 72, y - 8, 2, C.red);
  // small plant
  p.rect(79, y - 5, 6, 5, C.orange2);
  p.rect(79, y - 5, 6, 1, C.orange);
  p.rect(80, y - 9, 1, 4, C.teal2);
  p.rect(82, y - 11, 1, 6, C.teal);
  p.rect(78, y - 8, 2, 1, C.teal2);
  p.rect(83, y - 9, 2, 1, C.teal);
};

const desk = (p: Pix) => {
  p.rect(0, DESK_Y, FW, 1, C.deskEdge);
  p.rect(0, DESK_Y + 1, FW, 3, C.deskTop);
  p.rect(0, DESK_Y + 4, FW, 1, C.deskDark);
  for (let y = DESK_Y + 5; y < FH; y++)
    for (let x = 0; x < FW; x++)
      p.px(x, y, bayer(x, y) < (y - DESK_Y - 5) / 16 ? C.deskDark : C.desk);
};

// Keyboard with slowly cycling RGB keys.
const keyboard = (p: Pix, t: number) => {
  p.rect(5, DESK_Y + 1, 32, 3, C.ink);
  const rgb = [C.orange, C.pink, C.blue, C.teal];
  for (let k = 0; k < 10; k++) {
    const c = rgb[Math.floor(k / 3 + t * 1.5) % rgb.length];
    p.px(7 + k * 3, DESK_Y + 2, c);
  }
};

const mug = (p: Pix, t: number) => {
  const x = 72;
  const y = DESK_Y - 9;
  p.rect(x, y, 7, 10, C.cream);
  p.rect(x + 6, y, 1, 10, C.cream2);
  p.rect(x, y + 3, 7, 2, C.orange);
  p.rect(x + 7, y + 2, 2, 1, C.cream2);
  p.rect(x + 8, y + 2, 1, 4, C.cream2);
  p.rect(x + 7, y + 5, 2, 1, C.cream2);
  for (let s = 0; s < 2; s++) {
    const ph = (t * 0.6 + s / 2) % 1;
    const sy = y - 2 - ph * 9;
    const sx = x + 2 + s * 2 + Math.round(Math.sin(ph * 6 + s));
    if (hash(s + Math.floor(t * 4)) > 0.25)
      p.with({ hide: ph * 0.9 }, () => p.px(sx, sy, C.cream3));
  }
};

export const drawBack = (bg: Pix, fg: Pix) => {
  wall(bg);
  shelf(fg);
};

export const drawDesk = (p: Pix, t: number) => {
  desk(p);
  keyboard(p, t);
  mug(p, t);
};
