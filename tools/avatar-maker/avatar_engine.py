"""
Neon Avatar engine.

Flat lane: generate ONE colorless white-line template from a photo (paid, ~$0.13),
then recolor/reposition the gradient LOCALLY and instantly for free.
16-bit lane: each color variation is a fresh paid render (colors are baked into pixels).
Circular chip export is always local + free.
"""
import io
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

from generate_neon import load_key, b64_image, generate, extract_image

MODELS = {"pro": "gemini-3-pro-image", "flash": "gemini-2.5-flash-image"}
NAVY = np.array([13, 11, 22], dtype=np.float32)          # dark face fill (Tether bg)
DEFAULT_A = "#8b7bff"                                     # Tether violet
DEFAULT_B = "#f28c4c"                                     # Tether ember (editable)
ENV_PATH = r"C:\Workspace\.env"


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


# ----------------------------- color helpers --------------------------------
def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


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


# ----------------------- local recolor (flat lane) --------------------------
def _smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-6), 0, 1)
    return t * t * (3 - 2 * t)


def prepare_template(tmpl):
    """Precompute the expensive maps once so slider moves stay instant."""
    arr = np.asarray(tmpl.convert("RGB"), dtype=np.float32) / 255.0
    L = arr @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    line = _smoothstep(0.35, 0.9, L)                         # bright lines -> 1
    glow = np.asarray(Image.fromarray((line * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(tmpl.size[0] * 0.02)),
                      dtype=np.float32) / 255.0
    face = _face_mask(L, tmpl.size)
    return {"size": tmpl.size, "line": line, "glow": glow, "face": face}


def _face_mask(L, size):
    """Interior of the head silhouette (for a subtle navy fill). Robust-ish; may be empty."""
    W, H = size
    barrier = Image.fromarray(((L > 0.45) * 255).astype(np.uint8), "L")
    ImageDraw.Draw(barrier).line([(0, H - 1), (W - 1, H - 1)], fill=255, width=3)  # seal neck
    fill = barrier.copy()
    for seed in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        try:
            ImageDraw.floodfill(fill, seed, 128, thresh=10)
        except Exception:
            pass
    arr = np.asarray(fill)
    face = arr == 0                                          # not exterior(128), not line(255)
    if face.mean() < 0.03 or face.mean() > 0.6:
        return None                                          # detection unreliable -> skip tint
    return face


def _gradient(size, color_a, color_b, mode, angle_deg, position):
    """Per-pixel blend factor 0..1 -> lerp(A,B)."""
    W, H = size
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    x = xs / (W - 1) - 0.5
    y = ys / (H - 1) - 0.5
    if mode == "radial":
        t = np.sqrt(x * x + y * y) / 0.7071
        blend = _smoothstep(0, 1, t - position + 0.5)
    else:
        a = np.deg2rad(angle_deg)
        u = x * np.cos(a) + y * np.sin(a) + 0.5             # ~0..1 along axis
        if mode == "split":
            blend = _smoothstep(position - 0.02, position + 0.02, u)
        else:                                               # linear
            blend = _smoothstep(0, 1, u - position + 0.5)
    A, B = hex_rgb(color_a), hex_rgb(color_b)
    return A[None, None, :] * (1 - blend[..., None]) + B[None, None, :] * blend[..., None]


def recolor_flat(data, color_a=DEFAULT_A, color_b=DEFAULT_B, mode="linear",
                 angle_deg=90.0, position=0.5, glow_strength=0.85, face_tint=True):
    """Apply a two-color gradient to a prepared template. Instant, free."""
    grad = _gradient(data["size"], color_a, color_b, mode, angle_deg, position)
    line, glow, face = data["line"][..., None], data["glow"][..., None], data["face"]
    res = np.zeros_like(grad)
    if face_tint and face is not None:
        res[face] = NAVY
    res = res + grad * glow * glow_strength * (1 - line)     # glow halo
    res = res * (1 - line) + grad * line                     # crisp lines on top
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8), "RGB")


# ----------------------------- chip export ----------------------------------
def circular_chip(img, size=256, margin=0.12):
    img = img.convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    fill = img.getpixel((2, 2))
    inner = max(1, int(size * (1 - 2 * margin)))
    canvas = Image.new("RGB", (size, size), fill)
    canvas.paste(img.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2)
    canvas = canvas.convert("RGBA")
    ss = size * 4
    m = Image.new("L", (ss, ss), 0)
    ImageDraw.Draw(m).ellipse((0, 0, ss - 1, ss - 1), fill=255)
    canvas.putalpha(m.resize((size, size), Image.LANCZOS))
    return canvas
