# Tether Neon Avatar Maker

A small PySide6 desktop tool that turns a photo into a Tether-styled neon profile avatar.

![two lanes: flat neon glyph and 16-bit pixel]()

## Two lanes

- **Flat glyph** — a minimal neon line-art face. Generates one colorless "template" from your
  photo (a single paid render), then you recolor and move the gradient **locally, instantly, and
  free**: two colors, linear/split/radial mode, angle, and position.
- **16-bit pixel** — a pixel-art portrait with the two colors as rim light. Each color combo is a
  fresh paid render (colors are baked into the pixels).

Export cuts transparent circular chips at 256 + 64 px, ready to drop into Tether.

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

## Files

- `avatar_maker.py` — the PySide6 GUI
- `avatar_engine.py` — Gemini calls + the local gradient-recolor engine
- `generate_neon.py` — shared low-level helpers (key loading, API request)
- `make_chips.py` — standalone circular-chip cropper (`python make_chips.py 0.1 img.png`)
