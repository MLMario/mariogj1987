import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pix, SCALE } from "../pixel/engine";
import { drawSheet, PH, PW } from "./sheet";

export const SHEET_W = PW * 2;
export const SHEET_H = PH * 4;

export const CharacterSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawSheet(new Pix(ctx, 1));
  }, []);
  return (
    <AbsoluteFill>
      <canvas
        ref={ref}
        width={SHEET_W}
        height={SHEET_H}
        style={{
          width: SHEET_W * SCALE,
          height: SHEET_H * SCALE,
          imageRendering: "pixelated",
        }}
      />
    </AbsoluteFill>
  );
};
