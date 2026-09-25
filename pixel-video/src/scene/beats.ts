import {
  backOut,
  clamp,
  dissolve,
  easeInOut,
  easeOut,
  hash,
  lerp,
  Pix,
  prog,
} from "../pixel/engine";
import { text, textC, textWidth } from "../pixel/font";
import { C } from "../pixel/palette";
import mouthData from "../data/mouth.json";
import { AvatarState, isBlinking, Pose } from "./avatar";

// Sentence timings (seconds, trimmed audio).
export const T = {
  s1: 0.3,
  s2: 8.6,
  s3: 18.8,
  s4: 24.2,
  s5: 33.2,
  s6: 40.5,
  end: 57.0,
};

// ---------- shared props ----------

const sparkle = (p: Pix, x: number, y: number, ph: number, c = C.cream) => {
  const s = Math.floor(((ph % 1) + 1) % 1 * 4);
  if (s === 0) p.px(x, y, c);
  if (s === 1 || s === 3) {
    p.px(x, y, c);
    p.px(x - 1, y, c);
    p.px(x + 1, y, c);
    p.px(x, y - 1, c);
    p.px(x, y + 1, c);
  }
  if (s === 2) {
    p.px(x, y, C.white);
    for (let k = 1; k <= 2; k++) {
      p.px(x - k, y, c);
      p.px(x + k, y, c);
      p.px(x, y - k, c);
      p.px(x, y + k, c);
    }
  }
};

// Dark plate used for the few highlight words.
const plate = (p: Pix, cx: number, y: number, w: number, h: number) => {
  const x = Math.round(cx - w / 2);
  p.rect(x + 2, y + 2, w, h, C.ink);
  p.rect(x, y, w, h, C.bg0);
  p.rect(x, y, 2, h, C.orange);
  p.rect(x, y, w, 1, C.bg3);
};

const crate = (p: Pix, cx: number, y: number, lidDy: number, lidHide: number) => {
  const w = 44;
  const h = 34;
  const x = Math.round(cx - w / 2);
  p.rect(x, y, w, h, C.ink);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.orange2);
  for (let k = 0; k < 4; k++) p.rect(x + 1, y + 2 + k * 8, w - 2, 1, C.orange);
  p.rect(x + 1, y + 1, 3, h - 2, C.orange);
  p.rect(x + w - 4, y + 1, 3, h - 2, C.red);
  // label plate
  p.rect(x + 6, y + 8, w - 12, 19, C.cream);
  p.rect(x + 6, y + 26, w - 12, 1, C.cream3);
  textC(p, "NEW", cx, y + 10, C.ink);
  textC(p, "MODEL", cx, y + 18, C.ink);
  // lid
  p.with({ dy: lidDy, hide: lidHide }, () => {
    p.rect(x - 2, y - 5, w + 4, 6, C.ink);
    p.rect(x - 1, y - 4, w + 2, 4, C.orange);
    p.rect(x - 1, y - 1, w + 2, 1, C.orange2);
  });
};

const BOOK_W = 68;
const BOOK_H = 34;

const bookClosed = (
  p: Pix,
  cx: number,
  y: number,
  cover: string,
  spine: string,
  lines: string[],
) => {
  const x = Math.round(cx - BOOK_W / 2);
  p.rect(x + 2, y + 2, BOOK_W, BOOK_H, C.ink);
  p.rect(x, y, BOOK_W, BOOK_H, cover);
  p.rect(x, y, 5, BOOK_H, spine);
  p.rect(x + BOOK_W - 2, y + 2, 2, BOOK_H - 3, C.cream2);
  p.rect(x + 5, y + BOOK_H - 2, BOOK_W - 5, 2, C.cream2);
  p.rect(x + 9, y + 4, BOOK_W - 15, 1, C.orange);
  p.rect(x + 9, y + BOOK_H - 6, BOOK_W - 15, 1, C.orange);
  lines.forEach((l, k) =>
    textC(p, l, cx + 2, y + 8 + k * 9 + (lines.length === 1 ? 4 : 0), C.cream),
  );
};

const page = (p: Pix, x: number, y: number, w: number, h: number, seed: number) => {
  p.rect(x, y, w, h, C.cream);
  for (let r = 0; r < Math.floor((h - 6) / 5); r++) {
    const len = Math.floor((w - 8) * (0.55 + hash(seed + r) * 0.45));
    if (len > 0) p.rect(x + 4, y + 5 + r * 5, len, 1, C.cream3);
  }
};

const bookOpen = (p: Pix, cx: number, y: number, t: number) => {
  const pw = 34;
  const ph = 36;
  const x = Math.round(cx - pw);
  p.rect(x - 2, y - 1, pw * 2 + 4, ph + 4, C.blue2);
  p.rect(x - 2, y + ph + 1, pw * 2 + 4, 2, C.ink);
  page(p, x, y, pw, ph, 1);
  page(p, x + pw, y, pw, ph, 9);
  p.rect(x + pw, y, 1, ph, C.cream3);
  // flipping page, one every 0.9 s
  const ph01 = (t % 0.9) / 0.9;
  if (ph01 < 0.6) {
    const a = ph01 / 0.6;
    const w = Math.round(Math.abs(Math.cos(a * Math.PI)) * pw);
    if (a < 0.5) page(p, x + pw, y - 1, w, ph + 1, 20);
    else page(p, x + pw - w, y - 1, w, ph + 1, 20);
    p.rect(x + pw, y - 1, 1, ph + 1, C.cream3);
  }
};

const toolbox = (p: Pix, cx: number, y: number) => {
  const w = 52;
  const x = Math.round(cx - w / 2);
  // tools sticking out
  p.line(x + 12, y - 2, x + 16, y - 16, 3, C.cream3); // wrench handle
  p.rect(x + 14, y - 20, 6, 5, C.cream3);
  p.rect(x + 16, y - 20, 2, 2, C.bg1);
  p.line(x + 34, y - 2, x + 40, y - 18, 3, C.orange); // pencil
  p.px(x + 41, y - 20, C.ink);
  p.px(x + 40, y - 19, C.cream2);
  // handle
  p.rect(x + 18, y - 8, 16, 2, C.ink);
  p.rect(x + 18, y - 8, 2, 8, C.ink);
  p.rect(x + 32, y - 8, 2, 8, C.ink);
  // body
  p.rect(x + 2, y + 2, w, 28, C.ink);
  p.rect(x, y, w, 28, C.orange2);
  p.rect(x, y, w, 7, C.orange);
  p.rect(x, y + 7, w, 1, C.red);
  p.rect(x + 22, y + 5, 8, 5, C.cream);
  p.rect(x + 24, y + 7, 4, 1, C.cream3);
};

// Three different little robots, each with its own quirk.
const robot = (p: Pix, kind: number, cx: number, y: number, t: number) => {
  const x = Math.round(cx - 13);
  const body = [C.teal, C.blue, C.pink][kind];
  const shade = [C.teal2, C.blue2, C.red][kind];
  if (kind === 0) {
    // quirk: head wobbles side to side
    const wob = Math.sin(t * 5) > 0 ? 1 : -1;
    p.rect(x + 12 + wob, y - 8, 2, 7, C.cream3);
    p.rect(x + 11 + wob, y - 11, 4, 3, Math.sin(t * 7) > 0 ? C.orange : C.orange2);
    p.with({ dx: wob }, () => {
      p.box(x, y, 26, 12, body, C.ink);
    });
    p.box(x, y + 11, 26, 13, body, C.ink);
    p.rect(x + 1, y + 11, 24, 1, shade);
    p.with({ dx: wob }, () => {
      p.rect(x + 5, y + 5, 5, 5, C.white);
      p.rect(x + 16, y + 5, 5, 5, C.white);
      p.rect(x + 7, y + 7, 2, 2, C.ink);
      p.rect(x + 18, y + 7, 2, 2, C.ink);
    });
    p.rect(x + 8, y + 17, 10, 2, C.ink);
  } else if (kind === 1) {
    // quirk: glasses with a travelling glint
    p.rect(x + 12, y - 7, 2, 7, C.cream3);
    p.rect(x + 11, y - 10, 4, 3, C.teal);
    p.box(x, y, 26, 24, body, C.ink);
    p.rect(x + 1, y + 20, 24, 3, shade);
    p.box(x + 2, y + 6, 10, 8, C.bg0, C.cream);
    p.box(x + 14, y + 6, 10, 8, C.bg0, C.cream);
    p.rect(x + 12, y + 8, 2, 1, C.cream);
    p.rect(x + 6, y + 9, 2, 2, C.white);
    p.rect(x + 18, y + 9, 2, 2, C.white);
    const g = Math.floor((t * 1.2 % 1.6) * 12);
    if (g < 8) {
      p.px(x + 3 + g, y + 7, C.white);
      p.px(x + 15 + g, y + 7, C.white);
    }
    for (let k = 0; k < 4; k++) p.rect(x + 7 + k * 3, y + 17, 2, 2, C.ink);
  } else {
    // quirk: bent antenna, mismatched eyes, one wanders
    p.line(x + 6, y - 1, x + 3, y - 6, 2, C.cream3);
    p.line(x + 3, y - 6, x + 8, y - 10, 2, C.cream3);
    const on = Math.floor(t * 3) % 3 === 0;
    p.rect(x + 7, y - 13, 4, 3, on ? C.orange : C.orange2);
    p.box(x, y, 26, 24, body, C.ink);
    p.rect(x + 1, y + 20, 24, 3, shade);
    p.rect(x + 3, y + 5, 9, 9, C.white);
    const wx = Math.round(Math.sin(t * 2.3) * 2);
    const wy = Math.round(Math.cos(t * 1.7) * 2);
    p.rect(x + 6 + wx, y + 8 + wy, 3, 3, C.ink);
    p.rect(x + 16, y + 7, 5, 5, C.white);
    p.rect(x + 18, y + 9, 2, 2, C.ink);
    p.rect(x + 8, y + 17, 3, 2, C.ink);
    p.rect(x + 11, y + 18, 4, 1, C.ink);
    p.rect(x + 15, y + 17, 3, 2, C.ink);
  }
};

const clipboard = (p: Pix, cx: number, y: number, checks: number) => {
  const w = 50;
  const h = 64;
  const x = Math.round(cx - w / 2);
  p.rect(x + 2, y + 2, w, h, C.ink);
  p.rect(x, y, w, h, C.orange2);
  p.rect(x + 4, y + 6, w - 8, h - 10, C.cream);
  p.rect(x + 16, y - 3, 18, 7, C.cream3);
  p.rect(x + 20, y - 5, 10, 3, C.cream3);
  p.rect(x + 18, y + 2, 14, 2, C.ink);
  for (let r = 0; r < 4; r++) {
    const ry = y + 14 + r * 12;
    p.box(x + 8, ry, 7, 7, C.cream, C.ink);
    p.rect(x + 18, ry + 3, 20 - (r % 2) * 5, 1, C.cream3);
    if (r < checks) {
      p.px(x + 9, ry + 3, C.teal2);
      p.px(x + 10, ry + 4, C.teal2);
      p.px(x + 11, ry + 5, C.teal2);
      p.px(x + 12, ry + 4, C.teal2);
      p.px(x + 13, ry + 3, C.teal2);
      p.px(x + 14, ry + 2, C.teal2);
      p.px(x + 15, ry + 1, C.teal2);
    }
  }
};

const gear = (p: Pix, cx: number, cy: number, r: number, a: number, c: string, hole: string) => {
  const teeth = 8;
  for (let k = 0; k < teeth; k++) {
    const ang = a + (k / teeth) * Math.PI * 2;
    const tx = cx + Math.cos(ang) * (r + 1);
    const ty = cy + Math.sin(ang) * (r + 1);
    p.rect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3, c);
  }
  p.circle(cx, cy, r, c);
  p.circle(cx, cy, Math.max(1, Math.floor(r / 3)), hole);
};

const stopwatch = (p: Pix, cx: number, cy: number, t: number) => {
  const r = 22;
  p.rect(cx - 3, cy - r - 7, 6, 5, C.orange);
  p.rect(cx - 2, cy - r - 3, 4, 3, C.cream3);
  p.circle(cx + 2, cy + 2, r + 2, C.ink);
  p.circle(cx, cy, r + 2, C.cream3);
  p.circle(cx, cy, r, C.cream);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    p.px(Math.round(cx + Math.cos(a) * (r - 3)), Math.round(cy + Math.sin(a) * (r - 3)), C.ink);
  }
  // 10-15 minute wedge
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++) {
      const d = Math.sqrt(i * i + j * j);
      let a = Math.atan2(i, -j) / (Math.PI * 2);
      if (a < 0) a += 1;
      if (d < r - 5 && d > 3 && a >= 10 / 60 && a <= 15 / 60 && (i + j) % 2 === 0)
        p.px(cx + i, cy + j, C.orange);
    }
  const a = (t / 1.6) * Math.PI * 2;
  p.line(cx, cy, cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6), 2, C.red);
  p.rect(cx - 1, cy - 1, 3, 3, C.ink);
};

// ---------- the beats ----------

// Stage: the area above the avatar, 90 x 92 foreground units.
export const drawBeats = (p: Pix, t: number) => drawStage(p, t);

const drawStage = (p: Pix, t: number) => {
  // B1 + B2a: crate drops, then opens to reveal the model name.
  if (t >= T.s1 && t < 13.2) {
    const hide = dissolve(t, T.s1, 13.1, 0.3);
    const fall = backOut(prog(t, 0.5, 0.7));
    const cy = lerp(-40, 46, fall);
    const shake =
      t > 2 && t < 8.8 && Math.floor(t * 10) % 20 < 2
        ? Math.floor(t * 30) % 2
          ? 1
          : -1
        : 0;
    const lidP = easeOut(prog(t, 8.9, 0.7));
    p.with({ hide: t < 1 ? 0 : hide, dx: shake }, () => {
      if (t > 9.0) {
        const ray = prog(t, 9.0, 0.5);
        for (let k = 0; k < 5; k++) {
          const rx = 26 + k * 9;
          p.with({ hide: Math.max(1 - ray, 0.5 + (k % 2) * 0.15) }, () =>
            p.rect(rx, 2, 4, 44, C.orangeL),
          );
        }
      }
      crate(p, 45, Math.round(cy), -lidP * 50, lidP);
    });
    const dust = prog(t, 1.15, 0.6);
    if (dust > 0 && dust < 1)
      p.with({ hide: dust }, () => {
        for (let k = 0; k < 3; k++) {
          const d = Math.round(dust * 10) + k * 2;
          p.rect(20 - d, 78 - k, 2, 1, C.cream3);
          p.rect(68 + d, 78 - k, 2, 1, C.cream3);
        }
      });
    if (t > 2 && t < 8.9)
      [
        [14, 40],
        [76, 46],
        [20, 24],
        [70, 28],
      ].forEach(([x, y], k) => sparkle(p, x, y, t * 1.3 + k * 0.27, C.orangeL));

    // highlight 1: model name rising out of the crate
    if (t > 9.2) {
      const up = easeOut(prog(t, 9.2, 0.8));
      const ty = Math.round(lerp(40, 12, up));
      p.with({ hide: Math.max(1 - prog(t, 9.2, 0.3), hide) }, () => {
        plate(p, 45, ty - 5, 62, 17);
        textC(p, "OPUS 5.5", 46, ty, C.orange, 1, C.ink);
      });
    }
  }

  // B2b + B3: prompting guide book, then the Fable guide joins it.
  if (t >= 13.2 && t < T.s4 + 0.4) {
    const hide = dissolve(t, 13.2, T.s4 + 0.4, 0.35);
    const inP = backOut(prog(t, 13.2, 0.7));
    const up = easeInOut(prog(t, T.s3, 0.6));
    const cx = lerp(130, 45, inP);
    const y = Math.round(lerp(lerp(-40, 28, inP), 6, up));
    p.with({ hide }, () => {
      const open = t > 14.3 && t < T.s3 + 0.1;
      if (open) bookOpen(p, cx, y + 2, t - 14.3);
      else bookClosed(p, cx, y, C.blue2, C.ink, ["PROMPTING", "GUIDE"]);
      if (t > T.s3 + 0.3) {
        const fin = backOut(prog(t, T.s3 + 0.3, 0.7));
        const fx = lerp(140, 45, fin);
        bookClosed(p, fx, 50, C.teal2, C.bg1, ["FABLE", "GUIDE"]);
        if (t > 22.2)
          [
            [8, 52],
            [84, 58],
            [80, 86],
            [10, 82],
            [66, 46],
          ].forEach(([x, yy], k) => sparkle(p, x, yy, t * 1.6 + k * 0.21, C.orangeL));
      }
    });
  }

  // B4: the usual toolbox, then three quirky models.
  if (t >= T.s4 + 0.4 && t < T.s5 + 0.2) {
    const tbHide = dissolve(t, T.s4 + 0.4, 28.0, 0.35);
    if (tbHide < 1) {
      const pop = backOut(prog(t, T.s4 + 0.4, 0.5));
      p.with({ hide: tbHide }, () => toolbox(p, 45, Math.round(lerp(100, 46, pop))));
    }
    const out = dissolve(t, 28.0, T.s5 + 0.2, 0.3);
    [28.1, 28.7, 29.3].forEach((st, k) => {
      if (t < st) return;
      const pop = backOut(prog(t, st, 0.45));
      const y = Math.round(lerp(4, 16, pop));
      p.with({ hide: Math.max(out, 1 - prog(t, st, 0.2)) }, () =>
        robot(p, k, 15 + k * 30, y, t),
      );
    });
    // highlight 2
    if (t > 30.0) {
      const n = Math.floor(prog(t, 30.0, 0.9) * 20);
      p.with({ hide: out }, () => {
        plate(p, 45, 52, 76, 28);
        const l1 = "EACH MODEL";
        const x1 = 46 - textWidth(l1) / 2;
        text(p, l1.slice(0, n), x1, 56, C.cream, 1, C.ink);
        const k = Math.max(0, n - 10);
        const x2 = 46 - textWidth("HAS QUIRKS") / 2;
        text(p, "HAS ".slice(0, k), x2, 67, C.cream, 1, C.ink);
        text(p, "QUIRKS".slice(0, Math.max(0, k - 4)), x2 + 24, 67, C.orange, 1, C.ink);
      });
    }
  }

  // B5: guide pages fly into your prompt evals / design checklist.
  if (t >= T.s5 && t < T.s6) {
    const hide = dissolve(t, T.s5, T.s6, 0.35);
    p.with({ hide }, () => {
      bookClosedMini(p, 2, 22, C.blue2);
      bookClosedMini(p, 2, 48, C.teal2);
      clipboard(p, 52, 16, Math.floor(clamp((t - 35.3) / 0.8 + 1, 0, 4)));
      const a = t * 2.2;
      gear(p, 81, 70, 6, a, C.orange, C.bg1);
      gear(p, 83, 85, 4, -a * 1.5 + 0.3, C.teal, C.bg1);
      for (let k = 0; k < 4; k++) {
        const st = 33.7 + k * 0.45;
        const f = prog(t, st, 0.6);
        if (f <= 0 || f >= 1) continue;
        const e = easeInOut(f);
        const sy = k % 2 ? 52 : 26;
        const px = lerp(12, 46, e);
        const py = lerp(sy, 44, e) - Math.sin(e * Math.PI) * 20;
        p.rect(px, py, 7, 9, C.cream);
        p.rect(px + 1, py + 2, 4, 1, C.cream3);
        p.rect(px + 1, py + 5, 4, 1, C.cream3);
      }
    });
  }

  // B6: 10-15 minutes, then a big payoff.
  if (t >= T.s6) {
    const swHide = dissolve(t, T.s6, 46.0, 0.35);
    if (swHide < 1) {
      const pop = backOut(prog(t, T.s6, 0.5));
      p.with({ hide: swHide, dy: Math.round((1 - pop) * 30) }, () => {
        stopwatch(p, 45, 36, t);
        if (t > 41.0) {
          const n = Math.floor(prog(t, 41.0, 0.5) * 9);
          plate(p, 45, 70, 66, 17);
          textC(p, "10-15 MIN", 46, 75, C.orange, 1, C.ink, n);
        }
      });
    }
    if (t > 46.0) {
      const hide = 1 - prog(t, 46.0, 0.3);
      p.with({ hide }, () => {
        const base = 88;
        p.rect(8, base, 74, 1, C.cream3);
        const b1 = Math.round(easeOut(prog(t, 46.3, 0.4)) * 4);
        p.rect(16, base - b1, 18, b1, C.cream3);
        const b2 = Math.round(easeOut(prog(t, 46.9, 1.4)) * 66);
        p.rect(50, base - b2, 20, b2, C.orange);
        p.rect(50, base - b2, 2, b2, C.orangeL);
        p.rect(68, base - b2, 2, b2, C.orange2);
        if (t > 48.3) {
          const bounce = Math.round(Math.abs(Math.sin((t - 48.3) * 4)) * 2);
          const ay = base - 66 - 14 - bounce;
          p.rect(58, ay + 4, 4, 8, C.teal);
          p.rect(54, ay + 4, 12, 2, C.teal);
          p.rect(56, ay + 2, 8, 2, C.teal);
          p.rect(58, ay, 4, 2, C.teal);
          [
            [42, 30],
            [80, 36],
            [40, 62],
            [80, 66],
            [72, 10],
          ].forEach(([x, y], k) => sparkle(p, x, y, t * 1.5 + k * 0.23, C.orangeL));
        }
      });
    }
  }
};

const bookClosedMini = (p: Pix, x: number, y: number, c: string) => {
  p.rect(x + 1, y + 1, 18, 14, C.ink);
  p.rect(x, y, 18, 14, c);
  p.rect(x, y, 3, 14, C.ink);
  p.rect(x + 16, y + 1, 2, 12, C.cream2);
  p.rect(x + 6, y + 4, 7, 1, C.orange);
};

// ---------- avatar direction ----------

type Cue = [number, number, Pose];
const CUES: Cue[] = [
  [0.5, 3.0, "raise"],
  [9.2, 12.4, "point"],
  [13.4, 15.2, "point"],
  [22.3, 24.0, "thumbs"],
  [28.2, 30.4, "point"],
  [41.0, 43.0, "point"],
  [47.0, 49.2, "point"],
  [52.0, 54.6, "shrug"],
];
const LOOK: [number, number][] = [
  [19.2, 20.6],
  [33.5, 38.0],
];

export const avatarAt = (frame: number, fps: number): AvatarState => {
  const t = frame / fps;
  let to: Pose = "rest";
  let mix = 0;
  for (const [a, b, pose] of CUES) {
    if (t >= a && t <= b) {
      to = pose;
      mix = Math.min(prog(t, a, 0.25), 1 - prog(t, b - 0.25, 0.25));
    }
  }
  const mouth = (mouthData as { mouth: number[] }).mouth;
  let m = mouth[frame] ?? 0;
  const smiling = (to === "thumbs" && mix > 0.5) || t > 54.6;
  if (m === 0 && smiling) m = 3;
  const look =
    (to === "point" && mix > 0.5) || LOOK.some(([a, b]) => t >= a && t <= b) ? 1 : 0;
  return {
    from: "rest",
    to,
    mix: easeInOut(mix),
    mouth: m,
    blink: isBlinking(frame),
    look,
    brows: (to === "thumbs" || to === "shrug") && mix > 0.5 ? 1 : 0,
    bob: Math.sin(t * 2.4) > 0.75 ? -1 : 0,
  };
};
