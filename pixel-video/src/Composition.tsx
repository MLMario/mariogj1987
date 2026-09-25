import { Composition } from "remotion";
import { PixelVideo } from "./Video";
import { T } from "./scene/beats";
import { CharacterSheet, SHEET_H, SHEET_W } from "./character/Sheet";

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
    </>
  );
};
