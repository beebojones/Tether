"""
Circular avatar chips with breathing room so nothing clips.
Usage: python make_chips.py MARGIN file1 [file2 ...]
MARGIN is the fraction inset on each side before the circle mask.
(>=0.15 guarantees the whole square fits inside the circle, zero clipping.)
"""
import sys, os
from PIL import Image, ImageDraw

OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "chips")
PREVIEW_BG = (11, 16, 22)


def circle(img, size, margin):
    img = img.convert("RGB")
    w, h = img.size
    s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    fill = img.getpixel((2, 2))                 # sample corner as pad color
    inner = max(1, int(size * (1 - 2 * margin)))
    scaled = img.resize((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), fill)
    off = (size - inner) // 2
    canvas.paste(scaled, (off, off))
    canvas = canvas.convert("RGBA")
    # smooth circular mask via supersampling
    ss = size * 4
    m = Image.new("L", (ss, ss), 0)
    ImageDraw.Draw(m).ellipse((0, 0, ss - 1, ss - 1), fill=255)
    canvas.putalpha(m.resize((size, size), Image.LANCZOS))
    return canvas


def main():
    margin = float(sys.argv[1])
    os.makedirs(OUTDIR, exist_ok=True)
    for src in sys.argv[2:]:
        stem = os.path.splitext(os.path.basename(src))[0]
        base = Image.open(src)
        for size in (256, 64):
            chip = circle(base, size, margin)
            chip.save(os.path.join(OUTDIR, f"{stem}_c{size}.png"))
            prev = Image.new("RGB", (size, size), PREVIEW_BG)
            prev.paste(chip, (0, 0), chip)
            prev.save(os.path.join(OUTDIR, f"{stem}_c{size}_preview.png"))
        print(f"OK  {stem}: chips 256+64 (margin {margin})")


if __name__ == "__main__":
    main()
