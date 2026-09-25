// Reusable, outfit-able version of the avatar. Coordinates are relative to
// the head's top-left corner; the head is 16 x 18 units.
import { lerp, Pix } from "../pixel/engine";
import { C } from "../pixel/palette";
import { AvatarState, drawFace, HEAD, HEAD_PAL } from "../scene/avatar";

export type Hand = "rest" | "open" | "point" | "thumbs" | "hold" | "palm";
export type Limb = { el: [number, number]; hd: [number, number]; hand: Hand };

// Standing arm presets (shoulders at (-4, 23) and (20, 23)).
export const ARMS = {
  restR: { el: [-8, 34], hd: [-8, 44], hand: "rest" },
  restL: { el: [24, 34], hd: [24, 44], hand: "rest" },
  waveL: { el: [30, 14], hd: [30, -4], hand: "open" },
  pointL: { el: [32, 22], hd: [42, 12], hand: "point" },
  holdL: { el: [27, 36], hd: [31, 27], hand: "hold" },
  thumbsL: { el: [28, 36], hd: [26, 26], hand: "thumbs" },
  openL: { el: [29, 33], hd: [37, 27], hand: "palm" },
  poleR: { el: [-10, 33], hd: [-13, 40], hand: "hold" },
  micR: { el: [-10, 33], hd: [1, 20], hand: "hold" },
  // seated at the desk, hands on the keyboard
  deskR: { el: [-9, 36], hd: [-1, 48], hand: "rest" },
  deskL: { el: [25, 36], hd: [17, 48], hand: "rest" },
} satisfies Record<string, Limb>;

export type Outfit = {
  shirt: [string, string, string]; // base, shade, light
  sleeves: "short" | "long";
  coat?: [string, string]; // open coat / jacket over the shirt
  pants: [string, string];
  shorts?: boolean;
  shoes: string;
  headphones?: boolean;
  hat?: "cap" | "none";
  hatColor?: string;
  eyes?: "none" | "sun" | "goggles";
  backpack?: string;
  helmet?: boolean;
  shirtDots?: string;
  patch?: string;
};

export const OUTFITS: Record<string, Outfit> = {
  everyday: {
    shirt: [C.tee, C.teeS, C.teeL],
    sleeves: "short",
    pants: ["#3b4a73", "#2c3858"],
    shoes: C.white,
    headphones: true,
  },
  hiking: {
    shirt: [C.teal2, "#215c59", C.teal],
    sleeves: "short",
    pants: ["#8a7757", "#6b5b41"],
    shoes: "#5a3a26",
    hat: "cap",
    hatColor: C.orange2,
    backpack: C.orange2,
  },
  beach: {
    shirt: [C.orange, C.orange2, C.orangeL],
    sleeves: "short",
    shirtDots: C.cream,
    pants: [C.teal, C.teal2],
    shorts: true,
    shoes: C.pink,
    eyes: "sun",
  },
  scientist: {
    shirt: [C.tee, C.teeS, C.teeL],
    sleeves: "long",
    coat: [C.white, C.hpS],
    pants: ["#3b4a73", "#2c3858"],
    shoes: C.ink,
    eyes: "goggles",
  },
  teacher: {
    shirt: [C.cream, C.cream2, C.white],
    sleeves: "long",
    coat: [C.orange2, C.red],
    pants: ["#4a4f63", "#383c4c"],
    shoes: "#5a3a26",
  },
  speaker: {
    shirt: [C.tee, C.teeS, C.teeL],
    sleeves: "long",
    coat: [C.bg3, C.bg1],
    pants: [C.bg2, C.bg0],
    shoes: C.ink,
    headphones: false,
  },
  astronaut: {
    shirt: [C.cream, C.cream2, C.white],
    sleeves: "long",
    pants: [C.cream, C.cream2],
    shoes: C.cream3,
    backpack: C.cream2,
    helmet: true,
    patch: C.orange,
  },
};

export type CharOpts = {
  outfit: Outfit;
  r: Limb;
  l: Limb;
  face: AvatarState;
  seated?: boolean;
  // Draw only the body or only the arms (so arms can go over a desk).
  layer?: "all" | "body" | "arms";
};

const arm = (p: Pix, sx: number, sy: number, a: Limb, x: number, y: number, o: Outfit, side: 1 | -1) => {
  const ex = x + a.el[0];
  const ey = y + a.el[1];
  const hx = x + a.hd[0];
  const hy = y + a.hd[1];
  const sleeve = o.coat ?? [o.shirt[0], o.shirt[1]];
  if (o.sleeves === "long") {
    p.line(sx, sy, ex, ey, 7, sleeve[1]);
    p.line(ex, ey, hx, hy, 7, sleeve[1]);
    p.line(sx, sy, ex, ey, 5, sleeve[0]);
    p.line(ex, ey, hx, hy, 5, sleeve[0]);
  } else {
    p.line(sx, sy, ex, ey, 6, C.skinS);
    p.line(ex, ey, hx, hy, 6, C.skinS);
    p.line(sx, sy, ex, ey, 4, C.skin);
    p.line(ex, ey, hx, hy, 4, C.skin);
    const mx = lerp(sx, ex, 0.35);
    const my = lerp(sy, ey, 0.35);
    p.line(sx, sy, mx, my, 7, sleeve[1]);
    p.line(sx, sy, mx, my, 5, sleeve[0]);
  }
  const X = Math.round(hx);
  const Y = Math.round(hy);
  const skin = o.helmet ? C.cream : C.skin;
  const skinS = o.helmet ? C.cream3 : C.skinS;
  switch (a.hand) {
    case "open":
      p.box(X - 3, Y - 2, 7, 7, skin, skinS);
      for (let f = 0; f < 4; f++) p.rect(X - 3 + f * 2, Y - 5, 1, 3, skin);
      p.rect(X + 4 * side, Y, 2, 2, skin);
      break;
    case "point":
      p.box(X - 3, Y - 3, 6, 6, skin, skinS);
      p.line(X + 2, Y - 2, X + 6, Y - 5, 2, skin);
      break;
    case "thumbs":
      p.box(X - 3, Y - 2, 7, 6, skin, skinS);
      p.rect(X - 1, Y - 6, 2, 4, skin);
      p.rect(X - 2, Y - 6, 1, 4, skinS);
      break;
    case "palm":
      p.box(X - 3, Y - 2, 7, 4, skin, skinS);
      break;
    default:
      p.box(X - 3, Y - 2, 6, 6, skin, skinS);
  }
};

// Draws the character; returns hand positions so scenes can attach props.
export const drawChar = (p: Pix, x: number, y: number, o: CharOpts) => {
  const f = o.outfit;
  const [sh, shS, shL] = f.shirt;
  const top = y + 18;
  const torsoLen = o.seated ? 32 : 27;
  const layer = o.layer ?? "all";
  if (layer === "arms") {
    arm(p, x - 4, y + 23, o.r, x, y, f, -1);
    arm(p, x + 20, y + 23, o.l, x, y, f, 1);
    return {
      r: [x + o.r.hd[0], y + o.r.hd[1]] as const,
      l: [x + o.l.hd[0], y + o.l.hd[1]] as const,
    };
  }

  if (f.backpack) {
    p.rect(x - 8, top + 1, 32, 22, C.ink);
    p.rect(x - 7, top + 2, 30, 20, f.backpack);
  }

  if (!o.seated) {
    const hip = top + 3 + torsoLen;
    const [pc, ps] = f.pants;
    p.rect(x - 5, hip, 26, 5, pc);
    p.rect(x - 5, hip + 5, 11, 15, pc);
    p.rect(x + 10, hip + 5, 11, 15, pc);
    p.rect(x - 5, hip + 5, 2, 15, ps);
    p.rect(x + 19, hip + 5, 2, 15, ps);
    p.rect(x - 5, hip, 26, 1, ps);
    if (f.shorts) {
      p.rect(x - 4, hip + 12, 9, 8, C.skin);
      p.rect(x + 11, hip + 12, 9, 8, C.skin);
      p.rect(x - 4, hip + 12, 1, 8, C.skinS);
      p.rect(x + 19, hip + 12, 1, 8, C.skinS);
    }
    const fy = hip + 20;
    p.rect(x - 6, fy, 12, 3, f.shoes);
    p.rect(x + 10, fy, 12, 3, f.shoes);
    p.rect(x - 6, fy + 2, 12, 1, C.ink);
    p.rect(x + 10, fy + 2, 12, 1, C.ink);
  }

  // torso
  p.rect(x + 1, top, 14, 1, sh);
  p.rect(x - 2, top + 1, 20, 1, sh);
  p.rect(x - 5, top + 2, 26, 1, sh);
  p.rect(x - 6, top + 3, 28, torsoLen, sh);
  p.rect(x - 6, top + 3, 2, torsoLen, shS);
  p.rect(x + 20, top + 3, 2, torsoLen, shS);
  p.px(x + 3, top + 10, shL);
  p.px(x + 12, top + 14, shL);
  if (f.shirtDots)
    for (let j = 0; j < torsoLen; j += 5)
      for (let i = 0; i < 24; i += 6) p.px(x - 3 + i + (j % 10 ? 3 : 0), top + 5 + j, f.shirtDots);
  if (f.patch) {
    p.rect(x + 12, top + 7, 5, 4, f.patch);
    p.rect(x - 1, top + 12, 5, 2, C.blue);
  }
  if (f.coat) {
    const [cc, cs] = f.coat;
    p.rect(x - 6, top + 2, 10, torsoLen + 1, cc);
    p.rect(x + 12, top + 2, 10, torsoLen + 1, cc);
    p.rect(x + 3, top + 2, 1, torsoLen + 1, cs);
    p.rect(x + 12, top + 2, 1, torsoLen + 1, cs);
    p.rect(x - 6, top + 2, 2, torsoLen + 1, cs);
    p.rect(x + 20, top + 2, 2, torsoLen + 1, cs);
    // lapels
    p.rect(x + 4, top, 2, 4, cc);
    p.rect(x + 10, top, 2, 4, cc);
  }
  // crew neck
  p.rect(x + 5, top, 6, 2, C.skin);
  p.rect(x + 6, top + 2, 4, 1, C.skinS);

  // head
  p.sprite(HEAD, HEAD_PAL, x, y);
  drawFace(p, x, y, o.face);
  if (f.eyes === "sun") {
    p.rect(x + 3, y + 7, 4, 2, C.ink);
    p.rect(x + 9, y + 7, 4, 2, C.ink);
    p.rect(x + 7, y + 7, 2, 1, C.ink);
    p.px(x + 4, y + 7, C.blue);
    p.px(x + 10, y + 7, C.blue);
  }
  if (f.eyes === "goggles") {
    p.rect(x + 1, y + 3, 14, 1, C.teal2);
    p.box(x + 3, y + 1, 4, 3, C.teal, C.ink);
    p.box(x + 9, y + 1, 4, 3, C.teal, C.ink);
    p.px(x + 4, y + 2, C.white);
    p.px(x + 10, y + 2, C.white);
  }
  if (f.hat === "cap") {
    const hc = f.hatColor ?? C.orange2;
    p.rect(x + 1, y - 1, 14, 5, hc);
    p.rect(x + 3, y - 2, 10, 1, hc);
    p.rect(x + 8, y + 3, 12, 2, hc);
    p.rect(x + 8, y + 4, 12, 1, C.ink);
    p.px(x + 7, y - 2, C.cream);
  }
  if (f.headphones) {
    const cy = y + 16;
    for (const cx of [x - 1, x + 12]) {
      p.rect(cx + 1, cy, 3, 6, C.hp);
      p.rect(cx, cy + 1, 5, 4, C.hp);
      p.rect(cx + 4, cy + 1, 1, 4, C.hpS);
    }
    p.rect(x + 3, cy + 1, 1, 4, C.hpD);
    p.rect(x + 12, cy + 1, 1, 4, C.hpD);
  }
  if (f.helmet) {
    const cx = x + 8;
    const cy = y + 10;
    for (let j = -14; j <= 14; j++)
      for (let i = -14; i <= 14; i++) {
        const d = Math.sqrt(i * i + j * j);
        if (d > 12.4 && d <= 13.6 && cy + j < top + 2) p.px(cx + i, cy + j, C.cream);
      }
    p.rect(cx - 8, cy - 8, 2, 2, C.white);
    p.px(cx - 9, cy - 5, C.white);
    p.rect(x - 4, top, 24, 2, C.cream3);
  }

  if (layer === "all") {
    arm(p, x - 4, y + 23, o.r, x, y, f, -1);
    arm(p, x + 20, y + 23, o.l, x, y, f, 1);
  }
  return {
    r: [x + o.r.hd[0], y + o.r.hd[1]] as const,
    l: [x + o.l.hd[0], y + o.l.hd[1]] as const,
  };
};
