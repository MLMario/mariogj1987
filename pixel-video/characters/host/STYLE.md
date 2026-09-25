# Host character: style guide

A pixel-art version of the channel host. Everything is drawn from code
(`src/character/`), so these files can always be regenerated.

## Look
- **Hair:** short dark buzz cut, slightly receding at the temples.
- **Face:** light stubble on the jaw, brows in hair colour, 2x2 eyes.
- **Signature:** white over-ear headphones resting around the neck (everyday outfit).
- **Default outfit:** dark gray tee, navy jeans, white sneakers.
- **Build:** head 16x18, torso 22 wide, 71 px tall standing.

## Rules
1. **Eyes always face the content.** Pupils sit on the right column; he never
   looks off-screen. Put the character on the left, content on the right.
2. **Integer scaling only** (6x, 8x, 12x) with nearest-neighbour. No blur,
   rotation or non-integer resizing, which breaks the pixel grid.
3. **One pixel size per layer.** In videos the character uses 12 px pixels,
   and the background texture can be finer (6 px).
4. **Keep the palette.** Use the colours below; highlights are orange.
5. **Mouth shapes:** 0 closed, 1 half, 2 open, 3 smile. Lip-sync from audio
   loudness (see `src/scene/beats.ts`).

## Palette
| Role | Hex |
|---|---|
| Skin / shade / dark | `#e3a982` / `#c4845f` / `#94583f` |
| Stubble | `#b98a6c` |
| Hair | `#2b211d` |
| Tee / shade | `#4b4f5c` / `#373a45` |
| Headphones | `#eeeae3` |
| Background navy | `#0a0e1d` `#10162f` `#172043` `#212c58` |
| Accent orange | `#f29e4c` `#c8702c` `#ffcf8f` |
| Accent teal | `#4fb3a9` `#2c7a76` |
| Cream (cards, text) | `#f3e7cf` |

## Outfits
`everyday`, `hiking`, `beach`, `scientist`, `teacher`, `speaker`, `astronaut`
(see `character.json` → `outfits`).
