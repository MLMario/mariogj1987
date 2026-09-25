// Tiny pixel engine: everything is drawn on a low-res canvas with integer
// coordinates, then scaled up with nearest-neighbour so it stays crisp.

export const W = 180;
export const H = 320;
export const SCALE = 6; // 180x320 -> 1080x1920

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Ordered-dither threshold in [0, 1).
export const bayer = (x: number, y: number) =>
  (BAYER4[((y % 4) + 4) % 4][((x % 4) + 4) % 4] + 0.5) / 16;

export type Grid = string[];
export type Pal = Record<string, string>;

export class Pix {
  ctx: CanvasRenderingContext2D;
  ox = 0;
  oy = 0;
  // Dither-dissolve: pixels with bayer < hide are skipped (0 = fully visible).
  hide = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  with(opts: { dx?: number; dy?: number; hide?: number }, fn: () => void) {
    const { ox, oy, hide } = this;
    this.ox += Math.round(opts.dx ?? 0);
    this.oy += Math.round(opts.dy ?? 0);
    this.hide = Math.max(this.hide, opts.hide ?? 0);
    if (this.hide < 1) fn();
    this.ox = ox;
    this.oy = oy;
    this.hide = hide;
  }

  rect(x: number, y: number, w: number, h: number, c: string) {
    x = Math.round(x) + this.ox;
    y = Math.round(y) + this.oy;
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = c;
    if (this.hide <= 0) {
      this.ctx.fillRect(x, y, w, h);
      return;
    }
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (bayer(i, j) >= this.hide) this.ctx.fillRect(i, j, 1, 1);
  }

  px(x: number, y: number, c: string) {
    this.rect(x, y, 1, 1, c);
  }

  // Filled rect with a 1px outline.
  box(x: number, y: number, w: number, h: number, fill: string, edge: string) {
    this.rect(x, y, w, h, edge);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  // 50% checker dither between two colours.
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++)
        this.px(x + i, y + j, (x + i + y + j) % 2 === 0 ? a : b);
  }

  sprite(g: Grid, pal: Pal, x: number, y: number, flip = false) {
    const w = g[0].length;
    for (let j = 0; j < g.length; j++)
      for (let i = 0; i < w; i++) {
        const ch = g[j][flip ? w - 1 - i : i];
        if (ch !== "." && pal[ch]) this.px(x + i, y + j, pal[ch]);
      }
  }

  // Bresenham line stamped with a square brush.
  line(x0: number, y0: number, x1: number, y1: number, size: number, c: string) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const off = Math.floor(size / 2);
    for (;;) {
      this.rect(x0 - off, y0 - off, size, size, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  circle(cx: number, cy: number, r: number, c: string) {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++)
        if (i * i + j * j <= r * r + r * 0.8) this.px(cx + i, cy + j, c);
  }
}

// ---- timing helpers ----
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (t: number, start: number, dur: number) =>
  clamp((t - start) / dur);
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// Overshoot bounce for pop-ins.
export const backOut = (p: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
// Dissolve amount for an element visible in [start, end]: dithers in and out.
export const dissolve = (t: number, start: number, end: number, fade = 0.35) => {
  if (t < start || t > end) return 1;
  const a = 1 - prog(t, start, fade);
  const b = prog(t, end - fade, fade);
  return Math.max(a, b);
};
// Deterministic hash noise.
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
