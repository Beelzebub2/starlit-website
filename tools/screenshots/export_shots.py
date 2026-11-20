"""Turns the raw window captures into the website's screenshot assets.

Trims the Windows border and title bar, crops the settings views to the parts
shown on the site, and writes WebP files at two widths (for srcset).
"""
import sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
CAP = HERE / "captures"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parents[1] / "assets" / "shots"
OUT.mkdir(parents=True, exist_ok=True)
WINDOW = (8, 31, 1592, 992)   # client area inside the 1600x1000 capture

SHOTS = {
    # name: (source, crop or None for the whole client area, widths)
    "home": ("home-5", None, (1584, 960)),
    "home-rows": ("home-rows", None, (1584, 960)),
    "discover": ("discover", None, (1584, 960)),
    "library": ("library", None, (1584, 960)),
    "details": ("details", None, (1584, 960)),
    "episodes": ("details-episodes", None, (1584, 960)),
    "signin": ("probe", None, (1584, 960)),
    "skips": ("settings-skips", (382, 286, 1302, 704), (920, 600)),
    "themes": ("settings-appearance", (382, 222, 1302, 590), (920, 600)),
}

for name, (src, crop, widths) in SHOTS.items():
    im = Image.open(CAP / f"{src}.png").convert("RGB")
    im = im.crop(crop or WINDOW)
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", "WEBP", quality=82, method=6)
    print(name, im.size)
