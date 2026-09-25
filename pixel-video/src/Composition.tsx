import { Composition } from "remotion";
import { PixelVideo } from "./Video";
import { T } from "./scene/beats";
import { CharacterSheet, SHEET_H, SHEET_W } from "./character/Sheet";
import { HOLD, Loop, LOOP_SCALE, SPRITE_H, SPRITE_W, SpriteSheet } from "./character/Exports";
import { ANIMS, CELL_H, CELL_W } from "./character/frames";

const FPS = 30;

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="PromptTip"
        component={PixelVideo}
        durationInFrames={Math.round(T.end * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ withAudio: true }}
      />
      <Composition
        id="CharacterSheet"
        component={CharacterSheet}
        durationInFrames={1}
        fps={FPS}
        width={SHEET_W * 6}
        height={SHEET_H * 6}
      />
      <Composition
        id="SpriteSheet"
        component={SpriteSheet}
        durationInFrames={1}
        fps={FPS}
        width={SPRITE_W}
        height={SPRITE_H}
      />
      <Composition
        id="Loop"
        component={Loop}
        durationInFrames={HOLD * 4 * 3}
        fps={FPS}
        width={CELL_W * LOOP_SCALE}
        height={CELL_H * LOOP_SCALE}
        defaultProps={{ mode: "standing" as const, anim: "wave" }}
        calculateMetadata={({ props }) => ({
          // three full cycles of the animation
          durationInFrames: HOLD * ANIMS[props.anim].length * (ANIMS[props.anim].length > 2 ? 3 : 6),
        })}
      />
    </>
  );
};
