import { useLayoutEffect, useRef } from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { H, Pix, SCALE, W } from "./pixel/engine";
import { DESK_Y, drawBack, drawDesk } from "./scene/room";
import {
  drawArms,
  drawAvatar,
  drawAvatarBack,
} from "./scene/avatar";
import { avatarAt, drawBeats } from "./scene/beats";

// Avatar head top-left, in 2x foreground units.
export const AV_X = 12;
export const AV_Y = DESK_Y - 46;

export const PixelVideo: React.FC<{ withAudio?: boolean }> = ({
  withAudio = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const t = frame / fps;
    const bg = new Pix(ctx, 1);
    const p = new Pix(ctx, 2);
    const av = avatarAt(frame, fps);
    drawBack(bg, p);
    drawAvatarBack(p, AV_X, AV_Y);
    drawAvatar(p, AV_X, AV_Y, av);
    drawDesk(p, t);
    drawArms(p, AV_X, AV_Y, av);
    drawBeats(p, t);
  }, [frame, fps]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0e1d" }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: W * SCALE,
          height: H * SCALE,
          imageRendering: "pixelated",
        }}
      />
      {withAudio ? <Audio src={staticFile("voice.wav")} /> : null}
    </AbsoluteFill>
  );
};
