"""
Neon Avatar engine.

Flat lane: generate ONE colorless white-line template from a photo (paid, ~$0.13),
then recolor/reposition the gradient LOCALLY and instantly for free.
16-bit lane: each color variation is a fresh paid render (colors are baked into pixels).
Circular chip export is always local + free.
"""
import io
import json
import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

from generate_neon import load_key, b64_image, generate, extract_image

MODELS = {"pro": "gemini-3-pro-image", "flash": "gemini-2.5-flash-image"}
NAVY = np.array([13, 11, 22], dtype=np.float32)          # dark face fill (Tether bg)
DEFAULT_A = "#8b7bff"                                     # Tether violet
DEFAULT_B = "#f28c4c"                                     # Tether ember (editable)
DEFAULT_BG = "#0d0b16"
ENV_PATH = r"C:\Workspace\.env"

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(HERE, "out", "templates")
PRESET_PATH = os.path.join(HERE, "presets.json")
STATE_PATH = os.path.join(HERE, "maker_state.json")

BUILTIN_PRESETS = {
    "Tether": (DEFAULT_A, DEFAULT_B),
    "Violet / Cyan": ("#8b7bff", "#4bd6e8"),
    "Ember / Magenta": ("#f28c4c", "#ef3fd6"),
    "Acid": ("#b6ff3c", "#00e5a0"),
    "Ice": ("#7fb2ff", "#e6f2ff"),
    "Mono violet": ("#8b7bff", "#8b7bff"),
}


def load_pin(path=ENV_PATH):
    """Read the paid-render gate PIN from .env (TETHER_AVATAR_MAKER_PIN). None if unset."""
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip().upper() == "TETHER_AVATAR_MAKER_PIN":
                        return v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return None


# ----------------------------- tiny json store ------------------------------
def _read_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _write_json(path, obj):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2)
    except Exception:
        pass


def load_presets():
    """Built-in swatch pairs plus anything the user saved."""
    out = {k: tuple(v) for k, v in BUILTIN_PRESETS.items()}
    for k, v in _read_json(PRESET_PATH, {}).items():
        out[k] = tuple(v)
    return out


def save_preset(name, color_a, color_b):
    user = _read_json(PRESET_PATH, {})
    user[name] = [color_a, color_b]
    _write_json(PRESET_PATH, user)


def delete_preset(name):
    user = _read_json(PRESET_PATH, {})
    if name in user:
        del user[name]
        _write_json(PRESET_PATH, user)


def load_state():
    return _read_json(STATE_PATH, {})


def save_state(state):
    _write_json(STATE_PATH, state)


# ----------------------------- color helpers --------------------------------
def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def random_pair(rng):
    """A pleasing random A/B pair: same saturation/lightness band, split hues."""
    import colorsys
    h1 = rng.random()
    h2 = (h1 + rng.uniform(0.18, 0.55)) % 1.0
    pair = []
    for h in (h1, h2):
        r, g, b = colorsys.hls_to_rgb(h, rng.uniform(0.58, 0.72), rng.uniform(0.65, 1.0))
        pair.append("#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255)))
    return pair[0], pair[1]


# ----------------------------- Gemini calls ---------------------------------
TEMPLATE_PROMPT = (
    "Create an ultra-minimal flat neon line-art glyph of this exact person's face and hair, "
    "keeping them clearly recognizable. Draw ONLY clean glowing lines in pure WHITE on a strict "
    "pure-black background: the outline of the head, hair strands, eyebrows, eyes, nose, lips, and "
    "jaw/neck. Leave the face unfilled (black). Monochrome white line art only, absolutely no "
    "other colors. Bold, simple, minimal, like a neon sign. Square, centered, head-and-shoulders. "
    "No text, no watermark, no border."
)


def _run(model_key, prompt, photo_path):
    key = load_key()
    mime, b64 = b64_image(photo_path)
    resp = generate(key, MODELS[model_key], prompt, mime, b64)
    img = extract_image(resp)
    if not img:
        raise RuntimeError("model returned no image")
    return Image.open(io.BytesIO(img)).convert("RGB")


def generate_template(photo_path, model_key="pro"):
    """Colorless white-line glyph -> recolor locally afterwards. One paid render."""
    return _run(model_key, TEMPLATE_PROMPT, photo_path)


def generate_16bit(photo_path, color_a=DEFAULT_A, color_b=DEFAULT_B, model_key="pro"):
    """16-bit pixel portrait with the two colors as rim light. Paid per call."""
    prompt = (
        "Stylized 16-bit pixel-art portrait avatar of this exact person, face clearly "
        "recognizable, natural skin tones, brown hair with a subtle auburn tint. SNES-era pixel "
        f"art, crisp clean pixels, near-black background, square, centered. Rim lighting: one side "
        f"lit in the color {color_a}, the other side in {color_b}. No text, no watermark, no border."
    )
    return _run(model_key, prompt, photo_path)


def archive_template(img, stem):
    """Every paid template lands on disk so a good render is never lost to a crash."""
    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    path = os.path.join(TEMPLATE_DIR, f"{stem}.png")
    n = 2
    while os.path.exists(path):
        path = os.path.join(TEMPLATE_DIR, f"{stem}_{n}.png")
        n += 1
    img.save(path)
    return path


# ----------------------- local recolor (flat lane) --------------------------
def _smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-6), 0, 1)
    return t * t * (3 - 2 * t)


def prepare_template(tmpl):
    """Keep the luminance map; line/glow are derived per-threshold and cached."""
    arr = np.asarray(tmpl.convert("RGB"), dtype=np.float32) / 255.0
    L = arr @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    return {"size": tmpl.size, "L": L, "face": _face_mask(L, tmpl.size), "cache": {}}


def _line_glow(data, threshold, glow_radius):
    """Line mask + blurred halo for a threshold. Cached so color drags stay instant."""
    key = (round(threshold, 3), round(glow_radius, 3))
    hit = data["cache"].get(key)
    if hit is not None:
        return hit
    lo = float(np.clip(threshold, 0.02, 0.9))
    line = _smoothstep(lo, min(lo + 0.55, 0.99), data["L"])
    radius = max(0.5, data["size"][0] * glow_radius)
    glow = np.asarray(Image.fromarray((line * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0
    if len(data["cache"]) > 24:
        data["cache"].clear()
    data["cache"][key] = (line, glow)
    return line, glow


def _face_mask(L, size):
    """Interior of the head silhouette, for the navy face fill.

    The outline often has gaps (a beard, a hair part, the open neck) that let a
    flood-fill of the exterior leak into the face and leave it hollow. So dilate
    the line mask first (blur + low threshold) to seal those gaps, then flood the
    outside from the top corners; whatever the flood can't reach is the face.
    """
    W, H = size
    line = ((L > 0.42) * 255).astype(np.uint8)
    grow = max(2.0, min(W, H) * 0.013)
    dil = np.asarray(Image.fromarray(line, "L").filter(ImageFilter.GaussianBlur(grow))) > 8
    barrier = Image.fromarray((dil * 255).astype(np.uint8), "L")
    ImageDraw.Draw(barrier).line([(0, H - 1), (W - 1, H - 1)], fill=255, width=int(grow) + 2)  # seal neck
    fill = barrier.copy()
    for seed in ((0, 0), (W - 1, 0)):
        try:
            ImageDraw.floodfill(fill, seed, 128, thresh=8)
        except Exception:
            pass
    face = np.asarray(fill) == 0                             # not exterior(128), not line(255)
    frac = face.mean()
    if frac < 0.02 or frac > 0.85:
        return None                                          # detection unreliable -> skip tint
    return face


def _shaded_navy(grad):
    """Navy face fill with a soft top-light and a faint wash of the outline color,
    so the filled face reads with depth instead of a flat silhouette."""
    H = grad.shape[0]
    shade = np.linspace(1.08, 0.6, H, dtype=np.float32)[:, None, None]   # brighter up top
    return np.clip(NAVY[None, None, :] * shade + grad * 0.10, 0, 255)


def _gradient(size, color_a, color_b, mode, angle_deg, position, softness=1.0):
    """Per-pixel blend factor 0..1 -> lerp(A,B)."""
    W, H = size
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    x = xs / (W - 1) - 0.5
    y = ys / (H - 1) - 0.5
    if mode == "radial":
        t = np.sqrt(x * x + y * y) / 0.7071
        blend = _smoothstep(0.5 - softness / 2, 0.5 + softness / 2, t - position + 0.5)
    else:
        a = np.deg2rad(angle_deg)
        u = x * np.cos(a) + y * np.sin(a) + 0.5             # ~0..1 along axis
        if mode == "split":
            edge = max(0.004, softness * 0.02)
            blend = _smoothstep(position - edge, position + edge, u)
        elif mode == "bands":
            reps = 2 + int(softness * 6)
            tri = np.abs(((u - position) * reps) % 2.0 - 1.0)
            blend = _smoothstep(0.15, 0.85, tri)
        else:                                               # linear
            blend = _smoothstep(0.5 - softness / 2, 0.5 + softness / 2, u - position + 0.5)
    A, B = hex_rgb(color_a), hex_rgb(color_b)
    return A[None, None, :] * (1 - blend[..., None]) + B[None, None, :] * blend[..., None]


GRADIENT_MODES = ["linear", "split", "radial", "bands"]


def recolor_flat(data, color_a=DEFAULT_A, color_b=DEFAULT_B, mode="linear",
                 angle_deg=90.0, position=0.5, glow_strength=0.85, face_tint=True,
                 threshold=0.35, glow_radius=0.02, softness=1.0, bg=DEFAULT_BG):
    """Apply a two-color gradient to a prepared template. Instant, free. Returns RGBA.

    bg=None makes everything but the ink (and the tinted face) transparent.
    """
    grad = _gradient(data["size"], color_a, color_b, mode, angle_deg, position, softness)
    line, glow = _line_glow(data, threshold, glow_radius)
    face = data["face"]
    line, glow = line[..., None], glow[..., None]

    cov = np.clip(line + glow * glow_strength * (1 - line), 0, 1)     # ink coverage 0..1
    base = np.zeros_like(grad) if bg is None else np.broadcast_to(
        hex_rgb(bg)[None, None, :], grad.shape).copy()
    if face_tint and face is not None:
        base[face] = _shaded_navy(grad)[face]
    rgb = base * (1 - cov) + grad * cov

    if bg is None:
        alpha = cov[..., 0]
        if face_tint and face is not None:
            alpha = np.maximum(alpha, face.astype(np.float32))
    else:
        alpha = np.ones(grad.shape[:2], dtype=np.float32)
    out = np.concatenate([np.clip(rgb, 0, 255), (alpha * 255)[..., None]], axis=2)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


# ----------------------------- chip export ----------------------------------
def circular_chip(img, size=256, fill=0.80, zoom=1.0, offset=(0.0, 0.0),
                  shape="circle", bg=None):
    """Crop to square, scale the art to `fill` of the chip, optionally mask to a circle.

    fill  - how much of the chip width the art spans (1.0 = edge to edge, >1 crops in).
    zoom  - extra scale on top of fill; art beyond the chip is cropped.
    offset- (x, y) pan in chip widths, -0.5..0.5.
    bg    - backdrop hex, or None for transparent surround.
    """
    img = img.convert("RGBA")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))

    if bg is None:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        c = hex_rgb(bg).astype(int)
        canvas = Image.new("RGBA", (size, size), (int(c[0]), int(c[1]), int(c[2]), 255))

    inner = max(1, int(round(size * fill * zoom)))
    art = img.resize((inner, inner), Image.LANCZOS)
    x = int(round((size - inner) / 2 + offset[0] * size))
    y = int(round((size - inner) / 2 + offset[1] * size))
    # paste onto a full-size layer first: it crops out-of-bounds art that
    # alpha_composite would reject outright.
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(art, (x, y))
    canvas = Image.alpha_composite(canvas, layer)

    if shape == "circle":
        ss = size * 4
        m = Image.new("L", (ss, ss), 0)
        ImageDraw.Draw(m).ellipse((0, 0, ss - 1, ss - 1), fill=255)
        mask = m.resize((size, size), Image.LANCZOS)
        a = canvas.getchannel("A")
        canvas.putalpha(Image.fromarray(
            (np.asarray(a, dtype=np.float32) * np.asarray(mask, dtype=np.float32) / 255
             ).astype(np.uint8), "L"))
    return canvas
