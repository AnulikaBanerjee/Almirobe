from __future__ import annotations

import io

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from rembg import new_session, remove

# u2net_cloth_seg is a 3-class person parser (upper / lower / full). Using it on
# a product photo stacks leftover class channels into a tall, broken canvas.
_SESSION = None
PREFERRED_MODELS = ("u2net", "u2netp")


def cloth_session():
    global _SESSION
    if _SESSION is None:
        last_error: Exception | None = None
        for name in PREFERRED_MODELS:
            try:
                _SESSION = new_session(name)
                break
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        if _SESSION is None:
            raise RuntimeError(f"Could not load rembg model: {last_error}")
    return _SESSION


def keep_significant_components(image: Image.Image, min_area_ratio: float = 0.015, relative: float = 0.22) -> tuple[Image.Image, int]:
    arr = np.array(image)
    if arr.shape[2] < 4:
        return image, 1
    alpha = arr[:, :, 3]
    mask = (alpha > 24).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if count <= 1:
        return image, 0
    areas = stats[1:, cv2.CC_STAT_AREA]
    largest_area = int(np.max(areas))
    image_area = image.width * image.height
    keep_ids: list[int] = []
    for idx, area in enumerate(areas, start=1):
        if int(area) >= max(int(image_area * min_area_ratio), int(largest_area * relative)):
            keep_ids.append(idx)
    if not keep_ids:
        return image, 0
    keep = np.isin(labels, keep_ids)
    arr[~keep, 3] = 0
    return Image.fromarray(arr), len(keep_ids)


def occupancy_has_gaps(alpha: np.ndarray) -> bool:
    mask = alpha > 24
    for axis in (0, 1):
        profile = mask.sum(axis=axis).astype(np.float32)
        if profile.max() < 1:
            continue
        k = max(3, len(profile) // 40)
        kernel = np.ones(k, dtype=np.float32) / k
        smooth = np.convolve(profile, kernel, mode="same")
        thresh = float(smooth.max() * 0.18)
        min_len = max(3, int(len(profile) * 0.06))
        segments = 0
        run = 0
        for value in smooth:
            if value > thresh:
                run += 1
            elif run:
                if run >= min_len:
                    segments += 1
                run = 0
        if run >= min_len:
            segments += 1
        if segments >= 2:
            return True
    return False


def needs_manual_crop(image: Image.Image, component_count: int) -> bool:
    if component_count >= 2:
        return True
    alpha = np.array(image.getchannel("A"))
    return occupancy_has_gaps(alpha)


def remove_background(image: Image.Image) -> tuple[Image.Image, int]:
    cut = remove(image.convert("RGB"), session=cloth_session())
    if not isinstance(cut, Image.Image):
        cut = Image.open(io.BytesIO(cut)).convert("RGBA")
    else:
        cut = cut.convert("RGBA")
    return keep_significant_components(cut)


def auto_crop(image: Image.Image, pad_ratio: float = 0.08) -> Image.Image:
    alpha = np.array(image.getchannel("A"))
    ys, xs = np.where(alpha > 24)
    if len(xs) == 0:
        return image
    min_x, max_x = int(xs.min()), int(xs.max())
    min_y, max_y = int(ys.min()), int(ys.max())
    pad_x = max(8, int((max_x - min_x) * pad_ratio))
    pad_y = max(8, int((max_y - min_y) * pad_ratio))
    min_x = max(0, min_x - pad_x)
    min_y = max(0, min_y - pad_y)
    max_x = min(image.width - 1, max_x + pad_x)
    max_y = min(image.height - 1, max_y + pad_y)
    return image.crop((min_x, min_y, max_x + 1, max_y + 1))


def cutout_is_usable(original: Image.Image, cutout: Image.Image) -> bool:
    orig = np.array(original.convert("RGBA"))
    cut = np.array(cutout)
    if cut.shape[2] < 4:
        return False
    opaque = int(np.count_nonzero(cut[:, :, 3] > 24))
    pixels = cut.shape[0] * cut.shape[1]
    if opaque < pixels * 0.04:
        return False
    # Product shots on white should still keep most of the garment, not a speck.
    orig_nonwhite = int(
        np.count_nonzero(np.max(orig[:, :, :3], axis=2) < 245)
    )
    if orig_nonwhite > 0 and opaque < orig_nonwhite * 0.25:
        return False
    return True


def composite_shadow(cutout: Image.Image) -> Image.Image:
    cutout = auto_crop(cutout)
    w, h = cutout.size
    max_edge = max(w, h)
    canvas_w = int(max_edge * 1.12)
    canvas_h = int(max_edge * 1.18)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (212, 207, 196, 255))
    dx = (canvas_w - w) // 2
    dy = (canvas_h - h) // 2

    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    ellipse = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ellipse)
    draw.ellipse(
        [dx + w * 0.12, dy + h * 0.88, dx + w * 0.88, dy + h * 1.08],
        fill=(0, 0, 0, 110),
    )
    ellipse = ellipse.filter(ImageFilter.GaussianBlur(radius=max(8, h // 18)))
    shadow = Image.alpha_composite(shadow, ellipse)

    offset = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    black = cutout.copy()
    black.putdata([(0, 0, 0, a) for _, _, _, a in black.getdata()])
    offset.paste(black, (dx + 4, dy + 8), black)
    offset = offset.filter(ImageFilter.GaussianBlur(radius=max(6, h // 22)))
    shadow = Image.alpha_composite(shadow, offset)

    out = Image.alpha_composite(canvas, shadow)
    out.paste(cutout, (dx, dy), cutout)
    return out


def extract_png_bytes(original: Image.Image) -> tuple[bytes, bool]:
    cut, components = remove_background(original)
    if not cutout_is_usable(original, cut):
        cut = original.convert("RGBA")
        review = False
        finished = composite_shadow(cut)
    elif needs_manual_crop(cut, components):
        review = True
        finished = auto_crop(cut, pad_ratio=0.04)
    else:
        review = False
        finished = composite_shadow(cut)
    buf = io.BytesIO()
    finished.save(buf, format="PNG", optimize=True)
    return buf.getvalue(), review
