import { Composition } from "remotion";
import { PixelVideo } from "./Video";
import { T } from "./scene/beats";

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
    </>
  );
};
