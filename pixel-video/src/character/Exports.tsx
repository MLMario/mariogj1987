// Compositions used to export the character pack (transparent backgrounds).
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Pix } from "../pixel/engine";
import { Avatar } from "./Avatar";
import { ANIMS, CELL_H, CELL_W, drawSpriteSheet, Mode, SHEET_COLS, SHEET_ROWS } from "./frames";

export const SPRITE_W = SHEET_COLS * CELL_W;
export const SPRITE_H = SHEET_ROWS * CELL_H;

export const SpriteSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawSpriteSheet(new Pix(ctx, 1));
  }, []);
  return <canvas ref={ref} width={SPRITE_W} height={SPRITE_H} />;
};

// Each sprite frame is held for 5 video frames (6 fps at 30 fps), pixel-art style.
export const HOLD = 5;
export const LOOP_SCALE = 6;

export const Loop: React.FC<{ mode: Mode; anim: string }> = ({ mode, anim }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Avatar mode={mode} anim={anim} frame={Math.floor(f / HOLD) % ANIMS[anim].length} scale={LOOP_SCALE} />
    </AbsoluteFill>
  );
};
