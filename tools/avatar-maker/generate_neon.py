"""
Render a cyberpunk-neon portrait avatar from a reference photo via Gemini image models.
Key is read from C:\\Workspace\\.env (GEMINI_API_KEY) and never printed.
"""
import os, json, base64, urllib.request, urllib.error, mimetypes

ENV = r"C:\Workspace\.env"
REF = r"C:\Workspace\tether-avatars\john_ref.jpg"
OUTDIR = r"C:\Workspace\tether-avatars\out"
MODELS = ["gemini-3-pro-image", "gemini-2.5-flash-image"]  # try pro first, fall back

BASE = (
    "Transform this exact person into a high-end cyberpunk character portrait. "
    "Preserve his precise facial features, bone structure, eye shape, hairstyle and "
    "identity so he stays clearly and unmistakably recognizable as the same man. "
    "Head-and-shoulders, front-facing, centered for a profile avatar, square composition. "
    "Crisp, clean, ultra-sharp, cinematic Cyberpunk 2077 concept-art render, glossy and "
    "high-end, professional digital painting, fine detail. No text, no watermark, no logo, "
    "no UI, no border. "
)
VARIANTS = [
    ("v1_cyan_magenta",
     "Neon rim lighting in electric cyan and magenta tracing the edges of his face and "
     "hair; deep teal-black background with soft neon bokeh; subtle glossy skin highlights."),
    ("v2_electric_blue",
     "Dominant electric-blue and violet neon glow, faint holographic circuit lines drifting "
     "in the dark background, cool cinematic lighting, sleek and futuristic."),
    ("v3_hot_magenta",
     "Moodier palette: hot magenta and warm amber neon rim light against a near-black "
     "background, dramatic shadow across one side of the face, film-still atmosphere."),
]


def load_key(path=ENV):
    with open(path, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                if k.strip().upper() in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY"):
                    return v.strip().strip('"').strip("'")
    raise SystemExit("no key in .env")


def b64_image(path):
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        return mime, base64.b64encode(f.read()).decode()


def extract_image(resp):
    for cand in resp.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            blob = part.get("inlineData") or part.get("inline_data")
            if blob and blob.get("data"):
                return base64.b64decode(blob["data"])
    return None


def generate(key, model, prompt, mime, img_b64):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime, "data": img_b64}},
            ],
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "1:1"},
        },
    }
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    key = load_key()
    mime, img_b64 = b64_image(REF)
    for name, extra in VARIANTS:
        prompt = BASE + extra
        done = False
        for model in MODELS:
            try:
                resp = generate(key, model, prompt, mime, img_b64)
                img = extract_image(resp)
                if img:
                    path = os.path.join(OUTDIR, f"neon_{name}_{model.split('-')[1]}.png")
                    with open(path, "wb") as f:
                        f.write(img)
                    print(f"OK  {name}: {model} -> {path} ({len(img)} bytes)")
                    done = True
                    break
                else:
                    fb = json.dumps(resp)[:200]
                    print(f"..  {name}: {model} returned no image ({fb})")
            except urllib.error.HTTPError as e:
                print(f"..  {name}: {model} HTTP {e.code} {e.read().decode()[:160]}")
            except Exception as e:
                print(f"..  {name}: {model} {type(e).__name__} {str(e)[:160]}")
        if not done:
            print(f"XX  {name}: all models failed")


if __name__ == "__main__":
    main()
