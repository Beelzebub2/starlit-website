"""Generates generic, made-up artwork for the website screenshots.

Every title, image and description here is invented: abstract skies, planets
and ridgelines in the Starlit palette, so the real app UI can be shown without
any real show, actor, studio or logo. Writes posters (2:3), backdrops (16:9)
and transparent title logos into ./img, plus catalog.json for the add-on.
"""
import json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).parent
IMG = ROOT / "img"
IMG.mkdir(exist_ok=True)
FONTS = "C:/Windows/Fonts/"

# name, type, palette (sky top, sky bottom, glow, accent), font, genres, year, description
TITLES = [
    ("Hollow Orbit", "series", ("#0b1030", "#3a1e6b", "#7fdcec", "#b250ef"), "bahnschrift.ttf", ["Sci-Fi", "Drama"], "2026",
     "A salvage crew drifts past the last lit station in the system and finds it still answering calls."),
    ("Paper Lanterns", "series", ("#1a0f2e", "#7a2f4f", "#ffb37a", "#ec70a9"), "georgiab.ttf", ["Drama", "Romance"], "2025",
     "Two rival lantern makers share a market stall for one festival season."),
    ("Saltwind Academy", "series", ("#06222c", "#1f6e7c", "#9ff3ff", "#22d37c"), "trebucbd.ttf", ["Comedy", "School"], "2025",
     "A seaside academy where the weather is a graded subject."),
    ("Ironbloom", "series", ("#1b0d08", "#7a2e15", "#ecae62", "#de7b45"), "impact.ttf", ["Action", "Fantasy"], "2024",
     "A blacksmith's apprentice forges a sword that keeps growing flowers."),
    ("Lantern Moth", "movie", ("#0e0b1c", "#3c2b6e", "#ffd58a", "#b75aff"), "georgiab.ttf", ["Mystery"], "2023",
     "A night-shift archivist follows a moth that only flies toward forgotten letters."),
    ("Velvet Kingdom", "series", ("#140818", "#4d1747", "#ff8fd0", "#b250ef"), "georgiab.ttf", ["Fantasy", "Drama"], "2026",
     "An heir with no interest in the throne keeps winning it by accident."),
    ("Neon Ferry", "series", ("#04121f", "#123a6b", "#45d6eb", "#3185f5"), "bahnschrift.ttf", ["Sci-Fi", "Thriller"], "2026",
     "The last ferry across a flooded city runs on time, whatever happens on board."),
    ("Quiet Static", "movie", ("#0a0c12", "#2b3340", "#d7dce3", "#8d96a3"), "segoeuib.ttf", ["Thriller"], "2024",
     "A radio engineer hears tomorrow's weather report a day early."),
    ("The Ninth Meridian", "series", ("#08101c", "#24305e", "#9db4ff", "#4d55e8"), "bahnschrift.ttf", ["Adventure"], "2026",
     "Cartographers race to map a line of longitude that moves every night."),
    ("Glass Harbor", "series", ("#051618", "#165552", "#7bf08d", "#0bbf9a"), "trebucbd.ttf", ["Mystery", "Drama"], "2021",
     "In a harbor town made of glass, nobody can keep a secret for long."),
    ("Northlight Station", "movie", ("#020a14", "#0f3550", "#7bf0d8", "#45d6eb"), "segoeuib.ttf", ["Sci-Fi"], "2022",
     "Two researchers wintering at a polar observatory receive a signal from the aurora."),
    ("Ember Run", "series", ("#190a06", "#6b1f12", "#ffb37a", "#c95945"), "impact.ttf", ["Action", "Sports"], "2024",
     "An underground relay race through a city that never turns its lights off."),
    ("Moonward", "series", ("#0a0b1a", "#2c2f6e", "#e8ecff", "#7f8cff"), "bahnschrift.ttf", ["Sci-Fi", "Slice of Life"], "2026",
     "A crew of teenagers runs the night shift on a lunar greenhouse."),
    ("Orbit Café", "series", ("#120c1e", "#4a2d63", "#ffd58a", "#ec70a9"), "trebucbd.ttf", ["Comedy", "Slice of Life"], "2025",
     "A tiny café on a space elevator, one floor and one customer at a time."),
    ("Paper Comets", "movie", ("#0d0a1f", "#3b2468", "#ffe7b8", "#b75aff"), "georgiab.ttf", ["Family", "Animation"], "2023",
     "A girl folds a paper comet that refuses to come back down."),
    ("Salt & Signal", "series", ("#07141a", "#1c4a59", "#bff3fa", "#3185f5"), "segoeuib.ttf", ["Drama"], "2025",
     "A lighthouse keeper and a ham-radio operator solve shipwrecks they never saw."),
]

def rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def slug(name):
    import unicodedata
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    out = "".join(c.lower() if c.isalnum() else "-" for c in plain).strip("-")
    while "--" in out: out = out.replace("--", "-")
    return out

def scene(w, h, pal, seed):
    rnd = random.Random(seed)
    top, bottom, glow, accent = (rgb(c) for c in pal)
    img = Image.new("RGB", (w, h))
    px = ImageDraw.Draw(img)
    for y in range(h):
        px.line([(0, y), (w, y)], fill=mix(top, bottom, (y / h) ** 1.3))
    # Soft glow behind the planet.
    gl = Image.new("L", (w, h), 0)
    cx, cy, r = int(w * rnd.uniform(.55, .75)), int(h * rnd.uniform(.25, .4)), int(min(w, h) * rnd.uniform(.28, .38))
    ImageDraw.Draw(gl).ellipse([cx - r * 2, cy - r * 2, cx + r * 2, cy + r * 2], fill=150)
    gl = gl.filter(ImageFilter.GaussianBlur(min(w, h) * .12))
    img = Image.composite(Image.new("RGB", (w, h), mix(glow, accent, .5)), img, gl)
    # Stars.
    d = ImageDraw.Draw(img)
    for _ in range(int(w * h / 2600)):
        x, y = rnd.randrange(w), rnd.randrange(int(h * .7))
        b = rnd.randint(120, 255); s = rnd.choice([1, 1, 1, 2])
        d.ellipse([x, y, x + s, y + s], fill=(b, b, min(255, b + 20)))
    # Planet with a lit edge.
    planet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(planet)
    for i in range(r, 0, -1):
        t = i / r
        pd.ellipse([cx - i, cy - i, cx + i, cy + i], fill=mix(mix(glow, accent, .35), bottom, 1 - (1 - t) ** .6) + (255,))
    shade = Image.new("L", (w, h), 0)
    ImageDraw.Draw(shade).ellipse([cx - r + r * .35, cy - r - r * .2, cx + r + r * .35, cy + r - r * .2], fill=200)
    shade = shade.filter(ImageFilter.GaussianBlur(r * .25))
    mask = Image.new("L", (w, h), 0); ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    img.paste(planet, (0, 0), planet)
    dark = Image.new("RGB", (w, h), mix(top, (0, 0, 0), .4))
    img = Image.composite(dark, img, Image.composite(shade, Image.new("L", (w, h), 0), mask))
    kind = seed % 4
    if kind == 1:   # city skyline with lit windows
        d = ImageDraw.Draw(img); x = 0
        while x < w:
            bw, bh = rnd.randint(int(w * .04), int(w * .1)), rnd.randint(int(h * .18), int(h * .5))
            d.rectangle([x, h - bh, x + bw, h], fill=mix(bottom, (3, 4, 10), .75))
            for wy in range(h - bh + 8, h - 6, 12):
                for wx in range(x + 5, x + bw - 5, 10):
                    if rnd.random() < .22: d.rectangle([wx, wy, wx + 3, wy + 5], fill=mix(glow, (255, 255, 255), .3))
            x += bw + rnd.randint(2, 10)
        return Image.blend(img, Image.merge("RGB", [Image.effect_noise((w, h), 18).convert("L")] * 3), .03)
    if kind == 2:   # sea horizon with a reflected column of light
        hz = int(h * .62); d = ImageDraw.Draw(img)
        for y in range(hz, h):
            d.line([(0, y), (w, y)], fill=mix(mix(bottom, (2, 3, 8), .6), (2, 3, 8), (y - hz) / (h - hz)))
        for y in range(hz + 4, h, 7):
            half = int(r * (1 - (y - hz) / (h - hz)) * rnd.uniform(.3, .9))
            d.line([(cx - half, y), (cx + half, y)], fill=mix(glow, accent, .3), width=2)
        return Image.blend(img, Image.merge("RGB", [Image.effect_noise((w, h), 18).convert("L")] * 3), .03)
    if kind == 3:   # aurora ribbons over a dark ridge
        band = Image.new("L", (w, h), 0); bd = ImageDraw.Draw(band)
        for k in range(3):
            pts = [(x, h * (.25 + k * .08) + math.sin(x / w * 6 + k) * h * .06) for x in range(0, w + 20, 20)]
            bd.line(pts, fill=170 - k * 40, width=int(h * .05))
        band = band.filter(ImageFilter.GaussianBlur(h * .03))
        img = Image.composite(Image.new("RGB", (w, h), mix(glow, accent, .25)), img, band)
    # Ridgelines, darkest in front.
    for layer in range(3):
        base = h * (.62 + layer * .1)
        pts, x = [(0, h)], 0
        while x <= w:
            pts.append((x, base - rnd.uniform(0, h * (.16 - layer * .03)))); x += rnd.randint(int(w / 14), int(w / 7))
        pts += [(w, base), (w, h)]
        col = mix(bottom, (4, 5, 12), .55 + layer * .17)
        ImageDraw.Draw(img).polygon(pts, fill=col)
    # Gentle grain.
    noise = Image.effect_noise((w, h), 18).convert("L")
    img = Image.blend(img, Image.merge("RGB", (noise, noise, noise)), .035)
    return img

def fit_font(path, text, max_w, start):
    size = start
    while size > 12:
        f = ImageFont.truetype(FONTS + path, size)
        if f.getbbox(text)[2] <= max_w: return f
        size -= 2
    return ImageFont.truetype(FONTS + path, 12)

def poster(t, i):
    name, _, pal, font, *_ = t
    img = scene(600, 900, pal, i * 7 + 1).convert("RGBA")
    fade = Image.new("RGBA", img.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(fade)
    for y in range(500, 900):
        fd.line([(0, y), (600, y)], fill=(4, 5, 12, int(220 * ((y - 500) / 400) ** 1.4)))
    img = Image.alpha_composite(img, fade)
    d = ImageDraw.Draw(img)
    text = name.upper()
    f = fit_font(font, text, 520, 64)
    tw = f.getbbox(text)[2]
    d.text(((600 - tw) / 2, 760), text, font=f, fill=(255, 255, 255, 255))
    return img.convert("RGB")

def logo(t):
    name, _, pal, font, *_ = t
    text = name.upper()
    f = fit_font(font, text, 1100, 150)
    box = f.getbbox(text)
    img = Image.new("RGBA", (box[2] + 40, box[3] + 40), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((20, 10), text, font=f, fill=(255, 255, 255, 255))
    return img

catalog = []
for i, t in enumerate(TITLES):
    name, kind, pal, font, genres, year, desc = t
    s = slug(name)
    poster(t, i).save(IMG / f"{s}-poster.jpg", quality=88)
    ImageEnhance.Brightness(scene(1920, 1080, pal, i * 7 + 1)).enhance(1.45).save(IMG / f"{s}-backdrop.jpg", quality=86)
    logo(t).save(IMG / f"{s}-logo.png")
    catalog.append({"slug": s, "name": name, "type": kind, "genres": genres, "year": year, "description": desc,
                    "rating": round(6.8 + (i * 0.37) % 2.4, 1)})
(ROOT / "catalog.json").write_text(json.dumps(catalog, indent=1), encoding="utf-8")
print(f"wrote {len(catalog)} titles")
