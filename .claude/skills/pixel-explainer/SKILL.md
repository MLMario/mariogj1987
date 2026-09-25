---
name: pixel-explainer
description: Turn a voice recording plus script into a vertical pixel-art explainer video with the host character (Remotion project in pixel-video/). Use when the user sends a new recording or script for a pixel video.
---

# Pixel explainer videos

Project: `pixel-video/` (Remotion). Character pack: `pixel-video/characters/host/`
(read `STYLE.md` first). Remotion skills live in `.claude/skills/remotion-*`.

## Setup in a fresh container
```bash
cd pixel-video && npm i
pip install imageio-ffmpeg numpy pillow   # ffmpeg binary + audio analysis
```
Chromium is preconfigured in `remotion.config.ts` (`/opt/pw-browsers/...`).

## Steps
1. **Audio.** Trim the leading silence, clean and normalise into `public/voice.wav`:
   `ffmpeg -ss <start> -i in.mov -vn -af "highpass=f=80,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -ac 1 public/voice.wav`
   (the voice file is gitignored).
2. **Pauses.** `ffmpeg -i public/voice.wav -af silencedetect=noise=-35dB:d=0.5 -f null -`
   to find sentence boundaries. Speech-to-text needs `huggingface.co` network access;
   without it, ask the user for the script and map sentences to pauses.
3. **Mouth track.** Per-frame RMS at 30 fps → levels 0/1/2 (< -38 dB, < -26 dB, else),
   remove single-frame flicker, write `src/data/mouth.json`.
4. **Beat sheet.** One visual beat per sentence (about 6 per minute). Agree on it with
   the user before building. At most 2–3 highlight words, no subtitles.
5. **Build.** Edit `T`, `drawStage` and `CUES` in `src/scene/beats.ts`. The stage is
   90x92 units above the avatar (2x foreground units). Beats dither-dissolve in/out.
6. **Check stills, then render.**
   `npx remotion still PromptTip out/x.png --frame=N`, then
   `npx remotion render PromptTip out/video.mp4 --codec=h264 --crf=18`.

## Rules the user has set
- 9:16 vertical, deep navy + orange palette, everything pixel art (no real footage).
- Avatar large at lower left; eyes always toward the content.
- Beat images fill most of the space above the avatar.
- Casual tone; no extras (music, SFX, CRT) unless asked.
- Original art only; never copy another channel's characters or scenes.
