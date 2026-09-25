# Host character pack

| File | What it is |
|---|---|
| `spritesheet.png` | All frames at 1x (transparent). One animation per row: standing idle, talk, wave, point, thumbs, shrug, then the same seated. 80x84 cells. |
| `spritesheet@8x.png` | Same, scaled 8x for tools that don't scale pixel art well. |
| `spritesheet.json` | Aseprite-style atlas: frame rects plus `frameTags` per animation. |
| `character.json` | The character definition: head pixel grid, palette, arm presets, outfits, face states. |
| `poses/*.png` | First frame of each animation, at 1x and 12x. |
| `loops/*.webm` | Transparent (VP9 alpha) 2-second loops of every animation, 6x scale. |
| `STYLE.md` | Look and usage rules. |

## Regenerate
From `pixel-video/`:
```bash
npx remotion still SpriteSheet characters/host/spritesheet.png --image-format=png
npx tsx scripts/export-character.ts
# one loop (ProRes 4444 for Premiere/Resolve: --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le)
npx remotion render Loop characters/host/loops/standing_wave.webm \
  --props='{"mode":"standing","anim":"wave"}' --codec=vp9 --pixel-format=yuva420p --image-format=png
```

## In a Remotion video
```tsx
import { Avatar } from "../src/character/Avatar";
<Avatar mode="standing" anim="talk" frame={Math.floor(frame / 5)} outfit="hiking" scale={12} />
```
