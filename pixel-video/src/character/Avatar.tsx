// Drop-in pixel avatar for any Remotion video.
//   <Avatar mode="standing" anim="wave" frame={i} scale={6} />
import { useLayoutEffect, useRef } from "react";
import { Pix } from "../pixel/engine";
import { Outfit, OUTFITS } from "./char";
import { ANIMS, CELL_H, CELL_W, drawFrame, HEAD_X, HEAD_Y, Mode } from "./frames";

export const Avatar: React.FC<{
  mode?: Mode;
  anim?: keyof typeof ANIMS;
  frame?: number;
  outfit?: Outfit | keyof typeof OUTFITS;
  scale?: number;
  style?: React.CSSProperties;
}> = ({ mode = "standing", anim = "idle", frame = 0, outfit = "everyday", scale = 6, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const o = typeof outfit === "string" ? OUTFITS[outfit] : outfit;
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CELL_W, CELL_H);
    drawFrame(new Pix(ctx, 1), mode, anim, frame, HEAD_X, HEAD_Y, o);
  }, [mode, anim, frame, o]);
  return (
    <canvas
      ref={ref}
      width={CELL_W}
      height={CELL_H}
      style={{ width: CELL_W * scale, height: CELL_H * scale, imageRendering: "pixelated", ...style }}
    />
  );
};
