# Tether Neon Avatar Maker

A small PySide6 desktop tool that turns a photo into a Tether-styled neon profile avatar.

![two lanes: flat neon glyph and 16-bit pixel]()

## Two lanes

- **Flat glyph** — a minimal neon line-art face. Generates one colorless "template" from your
  photo (a single paid render), then you recolor and move the gradient **locally, instantly, and
  free**: two colors, linear/split/radial/bands mode, angle, position, and softness.
- **16-bit pixel** — a pixel-art portrait with the two colors as rim light. Each color combo is a
  fresh paid render (colors are baked into the pixels).

## Controls

Everything below the paid render is local and free.

- **Look** — glow strength, glow size, line threshold, face tint on/off, and a background of
  Tether navy, transparent, or any custom color.
- **Colors** — six built-in swatch presets plus your own (saved to `presets.json`), swap A/B,
  and a randomizer that rolls a hue-split pair.
- **Chip** — `Fill` sets how much of the chip the art spans (over 100% crops in), `Nudge X/Y`
  pans it, plus circle/square and a transparent or matching surround. A live strip previews
  128 / 64 / 32 px as you drag.
- **Export** — type any file name; what you type wins and **overwrites silently**. Tick the
  sizes you want (512 / 256 / 128 / 64) and pick the folder. `Copy 256` puts the chip on the
  clipboard.
- **Never re-pay** — every paid render is auto-archived to `out/templates/`, and *Load Template*
  reopens one for free. *Variants…* offers nine free looks off the current template, and the
  session strip restores any render you made this run.
- Drag a photo onto the window, or pick one from recents. Shortcuts: `Ctrl+O` load, `Ctrl+G`
  generate, `Ctrl+E` export, `Ctrl+S` swap, `Ctrl+R` randomize, `Ctrl+D` variants.

Your last-used look, export folder, and recents persist in `maker_state.json` (git-ignored).

### Performance note

The live preview renders at 512 px (~20 fps; full 1024 px is ~4 fps and feels broken), and
export re-renders at full resolution. Render calls are coalesced onto the event loop so a fast
drag can't queue frames and lag behind the mouse.

## Setup

```bash
pip install -r requirements.txt
python avatar_maker.py
```

Requires Python 3.10+ and two secrets in `C:\Workspace\.env` (outside this repo, never committed):

```
GEMINI_API_KEY=...              # Google AI Studio / Gemini API key (billing enabled)
TETHER_AVATAR_MAKER_PIN=1234    # PIN required before any paid render
```

Rendering uses Google's `gemini-3-pro-image` (~$0.13/render) with a `flash` fallback (~$0.04).
Every paid render is PIN-gated so you can't fire off 50 by accident.

## Brand

Defaults to Tether violet `#8b7bff` and ember `#f28c4c`, both editable in the color pickers.
Fonts: Space Grotesk / Inter / Fira Code (falls back to Segoe UI / Consolas if not installed).
The angle dial is custom-painted (`AngleDial`) because Qt stylesheets can't reach `QDial`'s
internals, which left it stock grey against the rest of the panel.

## Files

- `avatar_maker.py` — the PySide6 GUI
- `avatar_engine.py` — Gemini calls + the local gradient-recolor engine
- `generate_neon.py` — shared low-level helpers (key loading, API request)
- `make_chips.py` — standalone circular-chip cropper (`python make_chips.py 0.1 img.png`)
