from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.cluster import MiniBatchKMeans

CATALOG_PATH = Path(__file__).resolve().parents[1] / "catalog" / "tags.json"

COLOR_NAMES = [
    ((15, 15, 15), "black"),
    ((250, 250, 250), "white"),
    ((190, 190, 190), "grey"),
    ((90, 90, 90), "charcoal"),
    ((30, 60, 140), "navy"),
    ((40, 90, 200), "blue"),
    ((80, 160, 220), "sky blue"),
    ((20, 120, 80), "green"),
    ((180, 40, 40), "red"),
    ((220, 80, 120), "pink"),
    ((200, 40, 90), "maroon"),
    ((230, 160, 40), "mustard"),
    ((210, 180, 120), "beige"),
    ((140, 90, 50), "brown"),
    ((120, 70, 40), "tan"),
    ((160, 120, 80), "khaki"),
    ((90, 50, 30), "chocolate"),
    ((200, 200, 80), "yellow"),
    ((160, 80, 180), "purple"),
    ((240, 120, 40), "orange"),
    ((180, 78, 28), "rust"),
]


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text())


def _nearest_color_name(rgb: np.ndarray) -> str:
    best = "other"
    best_d = 1e9
    for sample, name in COLOR_NAMES:
        d = float(np.linalg.norm(rgb - np.array(sample)))
        if d < best_d:
            best_d = d
            best = name
    return best


def dominant_color(image: Image.Image) -> tuple[str, str, float]:
    rgba = image.convert("RGBA")
    arr = np.array(rgba)
    if arr.ndim != 3:
        return "unknown", "#888888", 0.2
    rgb = arr[:, :, :3].astype(np.int16)
    if arr.shape[2] == 4:
        visible = arr[:, :, 3] > 24
    else:
        visible = np.ones(rgb.shape[:2], dtype=bool)
    # Ignore studio white so garment colour wins.
    non_bg = np.max(rgb, axis=2) < 245
    pixels = rgb[visible & non_bg]
    if len(pixels) < 20:
        pixels = rgb[visible]
    if len(pixels) < 20:
        pixels = rgb.reshape(-1, 3)
    sample = pixels
    if len(sample) > 8000:
        idx = np.random.default_rng(0).choice(len(sample), 8000, replace=False)
        sample = sample[idx]
    kmeans = MiniBatchKMeans(n_clusters=min(3, len(sample)), random_state=0, n_init=4)
    kmeans.fit(sample)
    counts = np.bincount(kmeans.labels_, minlength=len(kmeans.cluster_centers_))
    center = kmeans.cluster_centers_[int(np.argmax(counts))]
    rgb = np.clip(center, 0, 255)
    hex_color = "#{:02x}{:02x}{:02x}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))
    return _nearest_color_name(rgb), hex_color, 0.82


def guess_visual_tags(image: Image.Image, color_name: str) -> dict:
    """Lightweight stand-in until Fashion-CLIP weights are enabled on GPU."""
    w, h = image.size
    aspect = h / max(w, 1)
    product_type = "other"
    subtype = None
    occasion = "casual"
    weather = "all"
    type_conf = 0.42
    if aspect > 1.45:
        product_type = "dress"
        type_conf = 0.48
        occasion = "ethnic" if color_name in {"maroon", "mustard", "gold"} else "casual"
    elif aspect < 0.85:
        product_type = "jeans"
        subtype = "jeans"
        type_conf = 0.46
        occasion = "casual"
    else:
        product_type = "shirt"
        subtype = "full-sleeve"
        type_conf = 0.47
        occasion = "office" if color_name in {"navy", "white", "black", "charcoal"} else "casual"

    if color_name in {"white", "beige", "sky blue", "yellow"}:
        weather = "summer"
    elif color_name in {"navy", "charcoal", "brown", "maroon"}:
        weather = "winter"

    suggested = f"{color_name} {product_type}".strip().title()
    return {
        "productType": {"value": product_type, "confidence": type_conf},
        "subtype": {"value": subtype, "confidence": 0.4} if subtype else None,
        "occasion": {"value": occasion, "confidence": 0.4},
        "weather": {"value": weather, "confidence": 0.4},
        "pattern": {"value": "solid", "confidence": 0.36},
        "suggestedName": suggested,
    }


def build_tags(image: Image.Image) -> dict:
    color_name, color_hex, color_conf = dominant_color(image)
    guessed = guess_visual_tags(image, color_name)
    tags = {
        "productType": guessed["productType"],
        "subtype": guessed["subtype"],
        "color": {"value": color_name, "confidence": color_conf},
        "colorHex": color_hex,
        "pattern": guessed["pattern"],
        "occasion": guessed["occasion"],
        "weather": guessed["weather"],
        "suggestedName": guessed["suggestedName"],
        "candidates": [],
    }
    return {k: v for k, v in tags.items() if v is not None}
