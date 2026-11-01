#!/usr/bin/env python3
"""Split the mascot's eyes, brows and mouth out of assets/splash-screen.png.

Writes assets/mascot/: base.png (the splash with those features painted out
from nearby clean fur) and one transparent PNG per feature. Prints each
feature's box as a fraction of the splash; paste those into
src/screens/title/faceLayout.ts if the artwork changes.

Needs Pillow only. Re-run after replacing assets/splash-screen.png, then
re-measure the search regions below.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/splash-screen.png"
OUT = ROOT / "assets/mascot"

# Search regions (x0, y0, x1, y1) in splash pixels. Each holds one feature and
# no other dark pixels, so the first connected shape inside it is the feature.
REGIONS = {
    "eye-left": (655, 1090, 735, 1170),
    "eye-right": (762, 1095, 842, 1172),
    "brow-left": (672, 1040, 730, 1090),
    "brow-right": (790, 1040, 850, 1092),
    "mouth": (676, 1166, 802, 1262),
}
INK_MAX_GREEN = 140  # skin is g=171, ink g~47, tongue g~90
MARGIN = 3  # px kept around each feature
FEATHER_GROW = 11  # px: how far the cleanup patch reaches past the feature
TILE = 48  # px: cleanup is patched tile by tile, each from its own clean donor


def feature_mask(
    img: Image.Image, region: tuple[int, int, int, int], exclude: Image.Image | None = None
) -> Image.Image:
    """Full-size 'L' mask of the feature, holes (eye highlight, tongue) filled."""
    g = img.getchannel("G")
    full = Image.new("L", img.size, 0)
    crop = g.crop(region).point(lambda v: 255 if v < INK_MAX_GREEN else 0)
    full.paste(crop, region[:2])
    if exclude is not None:
        full = ImageChops.subtract(full, exclude)
    # Fill holes: flood the outside, whatever the flood misses is inside.
    x0, y0, x1, y1 = region
    probe = full.crop(region)
    ImageDraw.floodfill(probe, (0, 0), 128)
    probe = probe.point(lambda v: 0 if v == 128 else 255)
    out = Image.new("L", img.size, 0)
    out.paste(probe, region[:2])
    return out


def clean_donor_shift(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int] | None:
    """Smallest shift whose donor patch holds nothing but fur."""
    g = img.getchannel("G")
    w, h = box[2] - box[0], box[3] - box[1]
    shifts = sorted(
        ((dx, dy) for dx in range(-240, 241, 2) for dy in range(-240, 241, 2)),
        key=lambda s: s[0] ** 2 + s[1] ** 2,
    )
    for dx, dy in shifts:
        if dx == 0 and dy == 0:
            continue
        x0, y0 = box[0] + dx, box[1] + dy
        if x0 < 0 or y0 < 0 or x0 + w > img.width or y0 + h > img.height:
            continue
        lo, hi = g.crop((x0, y0, x0 + w, y0 + h)).getextrema()
        if lo >= 150 and hi <= 200:
            return dx, dy
    return None


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    W, H = img.size
    OUT.mkdir(exist_ok=True)
    base = img.copy()
    boxes = {}
    taken = Image.new("L", img.size, 0)  # earlier features, kept out of later masks

    for name, region in REGIONS.items():
        mask = feature_mask(img, region, taken)
        bbox = mask.getbbox()
        taken = ImageChops.lighter(taken, mask.filter(ImageFilter.MaxFilter(5)))
        if bbox is None:
            raise SystemExit(f"{name}: no feature found in {region}")
        box = (bbox[0] - MARGIN, bbox[1] - MARGIN, bbox[2] + MARGIN, bbox[3] + MARGIN)

        # Transparent feature: original pixels, softened alpha.
        alpha = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
        part = img.convert("RGBA")
        part.putalpha(alpha)
        part.crop(box).save(OUT / f"{name}.png")

        # Cleanup patch: copy clean fur from the nearest feature-free spot.
        reach = (box[0] - FEATHER_GROW, box[1] - FEATHER_GROW, box[2] + FEATHER_GROW, box[3] + FEATHER_GROW)
        grow = mask.filter(ImageFilter.MaxFilter(FEATHER_GROW)).filter(ImageFilter.GaussianBlur(2))
        tiles = [reach]
        if clean_donor_shift(img, reach) is None:
            tiles = [
                (tx, ty, min(tx + TILE, reach[2]), min(ty + TILE, reach[3]))
                for ty in range(reach[1], reach[3], TILE)
                for tx in range(reach[0], reach[2], TILE)
            ]
        shifts = []
        for tile in tiles:
            shift = clean_donor_shift(img, tile)
            if shift is None:
                raise SystemExit(f"{name}: no clean donor for {tile}")
            dx, dy = shift
            donor = img.crop((tile[0] + dx, tile[1] + dy, tile[2] + dx, tile[3] + dy))
            base.paste(donor, tile[:2], grow.crop(tile))
            shifts.append(shift)
        dx, dy = shifts[0]

        boxes[name] = {
            "x": round(box[0] / W, 4),
            "y": round(box[1] / H, 4),
            "w": round((box[2] - box[0]) / W, 4),
            "h": round((box[3] - box[1]) / H, 4),
        }
        print(f"{name}: px {box} donor shift ({dx},{dy})")

    base.save(OUT / "base.png")
    print("\nfaceLayout.ts boxes:")
    for name, b in boxes.items():
        print(f"  {name}: {b}")


if __name__ == "__main__":
    main()
