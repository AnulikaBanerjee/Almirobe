"""
Universal ghost-mannequin garment + accessory extraction.

Faithful to the user pipeline:
  SegFormer clothes segmentation → full human/skin inpaint mask →
  Stable Diffusion inpainting (hollow ghost mannequin) →
  rembg (isnet-general-use) → alpha = garment ∪ inpainted holes.

Scoped to worker/ only; Create Look callers use extract_ghost_mannequin_png_bytes.
"""
from __future__ import annotations

import io
import os
from typing import BinaryIO

import numpy as np
from PIL import Image, ImageFilter

# SegFormer ATR-style labels used by mattmdjaga/segformer_b2_clothes
CLOTHING_CATEGORIES = {
    "upper": ["Upper-clothes", "Coat"],
    "dress": ["Dress"],
    "lower": ["Pants", "Skirt"],
    "drape": ["Scarf", "Belt"],
    "accessory": ["Hat", "Bag", "Glove", "Socks", "Shoes"],
}

HUMAN_SKIN_LABELS = frozenset(
    {
        "Face",
        "Hair",
        "Neck",
        "Left-arm",
        "Right-arm",
        "Left-leg",
        "Right-leg",
    }
)

ALL_GARMENT_LABELS = frozenset(
    label for labels in CLOTHING_CATEGORIES.values() for label in labels
)

_SEGMENTER = None
_INPAINT_PIPE = None
_REMBG_SESSION = None


def _pick_device() -> str:
    import torch

    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _segmenter():
    global _SEGMENTER
    if _SEGMENTER is None:
        from transformers import pipeline

        _SEGMENTER = pipeline("image-segmentation", model="mattmdjaga/segformer_b2_clothes")
    return _SEGMENTER


def _inpaint_pipe():
    global _INPAINT_PIPE
    if _INPAINT_PIPE is None:
        import torch
        from diffusers import StableDiffusionInpaintPipeline

        device = _pick_device()
        # float16 is CUDA-only for this pipeline; MPS/CPU need float32
        dtype = torch.float16 if device == "cuda" else torch.float32
        pipe = StableDiffusionInpaintPipeline.from_pretrained(
            "runwayml/stable-diffusion-inpainting",
            torch_dtype=dtype,
            safety_checker=None,
        )
        pipe = pipe.to(device)
        if device == "cuda":
            pipe.enable_attention_slicing()
        _INPAINT_PIPE = pipe
    return _INPAINT_PIPE


def _rembg_session():
    global _REMBG_SESSION
    if _REMBG_SESSION is None:
        from rembg import new_session

        _REMBG_SESSION = new_session("isnet-general-use")
    return _REMBG_SESSION


def _union_mask(base: Image.Image | None, mask: Image.Image) -> Image.Image:
    mask_l = mask.convert("L")
    if base is None:
        return mask_l
    return Image.fromarray(np.maximum(np.array(base), np.array(mask_l)))


def _mask_area(mask: Image.Image | None) -> int:
    if mask is None:
        return 0
    return int((np.array(mask.convert("L")) > 128).sum())


def _dominant_garment_color_name(image: Image.Image, garment_mask: Image.Image | None) -> str:
    if garment_mask is None:
        return "colored"
    rgb = np.array(image.convert("RGB"))
    mask = np.array(garment_mask.convert("L")) > 128
    if not mask.any():
        return "colored"
    pixels = rgb[mask]
    mean = pixels.mean(axis=0)
    r, g, b = float(mean[0]), float(mean[1]), float(mean[2])
    brightness = float(mean.mean())
    if brightness > 210:
        return "white"
    if brightness < 45:
        return "black"
    if max(r, g, b) - min(r, g, b) < 25:
        return "beige" if brightness > 140 else "grey"
    if r > g + 15 and r > b + 15:
        return "red" if r > 140 else "maroon"
    if b > r + 10 and b > g + 10:
        return "blue" if b > 120 else "navy"
    if g > r + 10 and g > b + 10:
        return "green"
    if r > 160 and g > 100 and b < 90:
        return "orange"
    if r > 150 and g > 120 and b < 140:
        return "gold"
    if r > 140 and b > 140 and g < 120:
        return "pink"
    return "printed"


def infer_garment_type(present_labels: set[str], garment_areas: dict[str, int]) -> str:
    """Infer prompt key from SegFormer labels + relative areas."""
    has = present_labels.__contains__
    upper = garment_areas.get("Upper-clothes", 0) + garment_areas.get("Coat", 0)
    dress = garment_areas.get("Dress", 0)
    pants = garment_areas.get("Pants", 0)
    skirt = garment_areas.get("Skirt", 0)
    scarf = garment_areas.get("Scarf", 0)
    belt = garment_areas.get("Belt", 0)
    accessory = sum(
        garment_areas.get(lbl, 0) for lbl in ("Hat", "Bag", "Glove", "Socks", "Shoes")
    )

    clothing_total = upper + dress + pants + skirt + scarf
    if accessory > clothing_total * 1.2 and accessory > 0:
        return "accessory"

    if scarf > 0 and scarf >= max(upper, dress, pants, skirt) * 0.55:
        if dress > 0 or (upper > 0 and skirt > 0):
            return "saree"
        return "dupatta"

    if dress > 0 and dress >= max(upper, pants, skirt, scarf):
        if scarf > dress * 0.25:
            return "saree"
        return "dress"

    if skirt > 0 and upper > 0 and skirt >= upper * 0.6:
        return "lehenga"

    if pants > 0 and upper > 0:
        coat = garment_areas.get("Coat", 0)
        if coat > upper * 0.5:
            return "sherwani"
        if pants > upper * 1.4:
            return "jeans"
        return "salwar_suit"

    if pants > 0 and pants >= max(upper, dress, skirt, scarf):
        return "jeans"

    if skirt > 0 and skirt >= max(upper, dress, pants, scarf):
        return "lehenga"

    if upper > 0:
        if has("Coat"):
            return "sherwani"
        img_area = garment_areas.get("_image", 0) or 1
        coverage = upper / img_area
        if coverage < 0.18:
            return "blouse"
        if coverage > 0.35:
            return "kurta"
        return "western"

    if scarf > 0 or belt > 0:
        return "dupatta"
    if accessory > 0:
        return "accessory"
    return "western"


def generate_garment_prompt(
    garment_type: str,
    prompt_desc: str | None = None,
    *,
    custom_desc: str | None = None,
    color_word: str = "colored",
) -> tuple[str, str]:
    """
    Specialized inpaint prompts for Indian + Western garments.
    `custom_desc` is an alias of `prompt_desc` (user script used both names).
    """
    desc = prompt_desc if prompt_desc is not None else custom_desc
    if desc:
        base_desc = desc
    else:
        # Emphasize hollow ghost mannequin + inner lining (critical for neck/sleeve holes)
        ethnic_prompts = {
            "saree": (
                f"inside back pattern of {color_word} silk saree and blouse, "
                "hollow ghost mannequin view, seamless neck collar lining, "
                "studio product photography, clean stitching"
            ),
            "lehenga": (
                f"inside back pattern of {color_word} embroidered lehenga choli, "
                "hollow ghost mannequin view, seamless blouse back lining, "
                "studio product photography, clean stitching"
            ),
            "kurta": (
                f"inside back pattern of {color_word} floral printed kurta tunic, "
                "hollow ghost mannequin view, seamless neck collar lining, "
                "studio product photography, clean stitching"
            ),
            "salwar_suit": (
                f"inside back pattern of {color_word} salwar kameez, "
                "hollow ghost mannequin view, seamless neck lining, "
                "studio product photography, clean stitching"
            ),
            "sherwani": (
                f"inside back pattern of {color_word} embroidered sherwani, "
                "hollow ghost mannequin view, seamless collar lining, "
                "studio product photography, clean stitching"
            ),
            "dupatta": (
                f"{color_word} draped ethnic dupatta with scalloped border, "
                "product catalog photo, no model, clean edges"
            ),
            "blouse": (
                f"inside back pattern of {color_word} designer blouse, "
                "hollow ghost mannequin view, seamless inner back lining, "
                "studio product photography, clean stitching"
            ),
            "dress": (
                f"inside back pattern of {color_word} floral printed tunic dress, "
                "hollow ghost mannequin view, seamless neck collar lining, "
                "studio product photography, clean stitching"
            ),
            "jeans": (
                f"{color_word} denim pants product photo, clean waistband interior, "
                "hollow ghost mannequin, no body, studio catalog"
            ),
            "accessory": (
                f"{color_word} fashion accessory product photo, clean edges, "
                "studio catalog, no model"
            ),
            "western": (
                f"inside back pattern of {color_word} garment, "
                "hollow ghost mannequin view, seamless inner fabric lining, "
                "studio product photography, clean stitching"
            ),
        }
        key = (garment_type or "western").lower()
        base_desc = ethnic_prompts.get(key, ethnic_prompts["western"])

    prompt = (
        f"{base_desc}, studio product catalog photo, seamless inner fabric lining, "
        "high quality, ghost mannequin presentation, 8k resolution"
    )
    negative_prompt = (
        "human skin, neck, body, face, head, bare arms, midriff skin, legs, hands, "
        "hair, model body parts, person, mannequin, plastic mannequin, white mannequin head, "
        "dummy, mannequin wrists, blurry, distorted fabric, ugly seams"
    )
    return prompt, negative_prompt


def _collect_masks(
    segments: list,
) -> tuple[Image.Image | None, Image.Image | None, set[str], dict[str, int]]:
    garment_mask: Image.Image | None = None
    skin_mask: Image.Image | None = None
    present: set[str] = set()
    areas: dict[str, int] = {}

    for seg in segments:
        label = seg["label"]
        mask = seg["mask"]
        present.add(label)
        area = int((np.array(mask.convert("L")) > 128).sum())
        areas[label] = areas.get(label, 0) + area

        if label in ALL_GARMENT_LABELS:
            garment_mask = _union_mask(garment_mask, mask)
        elif label in HUMAN_SKIN_LABELS:
            skin_mask = _union_mask(skin_mask, mask)

    return garment_mask, skin_mask, present, areas


def _label_mask(segments: list, labels: set[str]) -> Image.Image | None:
    out: Image.Image | None = None
    for seg in segments:
        if seg["label"] in labels:
            out = _union_mask(out, seg["mask"])
    return out


def _garment_envelope(garment_mask: Image.Image, *, expand: int = 36) -> Image.Image:
    """Soft dilated garment silhouette."""
    g = garment_mask.convert("L")
    g = g.filter(ImageFilter.MaxFilter(size=15))
    g = g.filter(ImageFilter.GaussianBlur(radius=max(4, expand // 2)))
    return g


def _opencv_texture_inpaint(image: Image.Image, mask: Image.Image) -> Image.Image:
    """Fast local texture fill — preserves nearby floral fabric (good for hands/hair on cloth)."""
    import cv2

    rgb = np.array(image.convert("RGB"))
    m = np.array(mask.convert("L"))
    binary = (m > 32).astype(np.uint8) * 255
    if binary.sum() == 0:
        return image.convert("RGB")
    # Slight dilate so edges blend
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.dilate(binary, kernel, iterations=1)
    filled = cv2.inpaint(rgb, binary, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    return Image.fromarray(filled)


def _build_inpaint_masks(
    skin_mask: Image.Image,
    garment_mask: Image.Image | None,
    *,
    neck_mask: Image.Image | None = None,
) -> tuple[Image.Image, Image.Image]:
    """
    Returns (texture_mask, neck_sd_mask):
      - texture_mask: skin overlapping garment (hands on hem, hair on shoulder) → OpenCV fill
      - neck_sd_mask: neck opening → Stable Diffusion hollow lining
    """
    skin = np.array(skin_mask.convert("L"))
    texture = np.zeros_like(skin)
    neck_sd = np.zeros_like(skin)

    if neck_mask is not None:
        n = np.array(neck_mask.convert("L"))
        n_img = Image.fromarray(n, mode="L").filter(ImageFilter.MaxFilter(size=13))
        n_img = n_img.filter(ImageFilter.GaussianBlur(radius=5))
        neck_sd = np.maximum(neck_sd, np.array(n_img))

    if garment_mask is not None:
        env = np.array(_garment_envelope(garment_mask, expand=30))
        on_garment = np.where(env > 20, skin, 0).astype(np.uint8)
        # Skin on garment goes to texture fill; subtract pure neck (handled by SD)
        if neck_mask is not None:
            n = np.array(neck_mask.convert("L"))
            on_garment = np.where(n > 40, 0, on_garment)
        texture = np.maximum(texture, on_garment)
        # Face pixels inside the collar gap (V-neck) also need SD hollow fill
        face_in_collar = np.where((env > 40) & (skin > 40), skin, 0).astype(np.uint8)
        # Limit face_in_collar to upper third of garment bbox to avoid hem hands
        ys = np.where(np.array(garment_mask.convert("L")) > 128)[0]
        if len(ys):
            y_cut = int(ys.min() + 0.35 * (ys.max() - ys.min()))
            face_in_collar[y_cut:, :] = 0
        neck_sd = np.maximum(neck_sd, face_in_collar)
    else:
        texture = skin

    texture_img = Image.fromarray(texture, mode="L").filter(ImageFilter.GaussianBlur(radius=1.5))
    neck_img = Image.fromarray(neck_sd.astype(np.uint8), mode="L").filter(
        ImageFilter.GaussianBlur(radius=2)
    )
    return texture_img, neck_img


def _compose_ghost_rgba(
    inpainted_rgb: Image.Image,
    garment_mask: Image.Image | None,
    inpaint_mask: Image.Image | None,
) -> Image.Image:
    """
    Build the ghost PNG from the inpainted RGB using the garment mask as truth.

    rembg alone keeps leftover heads/hands; garment-mask alpha is what makes a
    clean product cutout. Inpainted neck/cuff pixels are admitted only where the
    inpaint mask overlaps a soft garment envelope.
    """
    from rembg import remove

    rgb = inpainted_rgb.convert("RGB")
    # rembg used only to anti-alias outer edges against the studio background
    rembg_rgba = remove(rgb, session=_rembg_session())
    if not isinstance(rembg_rgba, Image.Image):
        rembg_rgba = Image.open(io.BytesIO(rembg_rgba)).convert("RGBA")
    else:
        rembg_rgba = rembg_rgba.convert("RGBA")

    w, h = rgb.size
    base = np.array(rgb)
    rembg_a = np.array(rembg_rgba)[:, :, 3].astype(np.float32)

    if garment_mask is None:
        out = np.dstack([base, rembg_a.astype(np.uint8)])
        return Image.fromarray(out, mode="RGBA")

    g = np.array(
        garment_mask.convert("L").resize((w, h), Image.Resampling.NEAREST)
    ).astype(np.float32)
    g_img = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), mode="L")
    g_edge = g_img.filter(ImageFilter.MaxFilter(size=3)).filter(ImageFilter.GaussianBlur(radius=0.9))
    keep = np.array(g_edge).astype(np.float32)

    if inpaint_mask is not None:
        ip = np.array(
            inpaint_mask.convert("L").resize((w, h), Image.Resampling.BILINEAR)
        ).astype(np.float32)
        env = np.array(_garment_envelope(g_img, expand=22)).astype(np.float32)
        keep = np.maximum(keep, np.minimum(ip, env))

    keep_norm = np.clip(keep / 255.0, 0.0, 1.0)
    # Prefer garment geometry; use rembg only to knock out leftover studio bg on edges
    edge_gate = np.maximum(rembg_a / 255.0, keep_norm)
    final_a = (keep_norm * edge_gate * 255.0).astype(np.uint8)
    return Image.fromarray(np.dstack([base, final_a]), mode="RGBA")

def extract_ghost_mannequin(
    image: Image.Image,
    *,
    garment_type: str = "auto",
    prompt_desc: str | None = None,
    custom_desc: str | None = None,
    skip_inpaint: bool | None = None,
    inference_steps: int | None = None,
) -> Image.Image:
    """Returns RGBA PNG-ready image (transparent background, ghost mannequin)."""
    if skip_inpaint is None:
        skip_inpaint = os.environ.get("GHOST_SKIP_INPAINT", "").lower() in ("1", "true", "yes")
    desc = prompt_desc if prompt_desc is not None else custom_desc
    init_image = image.convert("RGB")

    # SD inpaint works best near 512; allow override but default 512 like classic pipeline
    max_side = int(os.environ.get("GHOST_MAX_SIDE", "512"))
    w, h = init_image.size
    if max(w, h) != max_side or w % 8 or h % 8:
        scale = max_side / float(max(w, h))
        nw = max(8, int(round(w * scale / 8.0)) * 8)
        nh = max(8, int(round(h * scale / 8.0)) * 8)
        init_image = init_image.resize((nw, nh), Image.Resampling.LANCZOS)

    # Match user script defaults (35 steps, guidance 8.0) unless overridden
    steps = inference_steps or int(os.environ.get("GHOST_INPAINT_STEPS", "35"))
    guidance = float(os.environ.get("GHOST_GUIDANCE_SCALE", "8.0"))

    print("1. Segmenting clothing and body parts...")
    segments = _segmenter()(init_image)
    garment_mask, skin_mask, present, areas = _collect_masks(segments)
    areas["_image"] = init_image.size[0] * init_image.size[1]

    resolved_type = garment_type
    if not resolved_type or resolved_type.lower() == "auto":
        resolved_type = infer_garment_type(present, areas)
    print(
        f"   garment_type={resolved_type} "
        f"labels={sorted(present & (ALL_GARMENT_LABELS | HUMAN_SKIN_LABELS))}"
    )

    color_word = _dominant_garment_color_name(init_image, garment_mask)
    working = init_image
    combined_inpaint: Image.Image | None = None
    neck_mask = _label_mask(segments, {"Neck"})

    has_human = skin_mask is not None and any(lbl in HUMAN_SKIN_LABELS for lbl in present)
    if has_human and skin_mask is not None and not skip_inpaint:
        print("2. Building texture + neck hollow masks...")
        texture_mask, neck_sd_mask = _build_inpaint_masks(
            skin_mask, garment_mask, neck_mask=neck_mask
        )
        combined_inpaint = Image.fromarray(
            np.maximum(np.array(texture_mask), np.array(neck_sd_mask)), mode="L"
        )

        if _mask_area(texture_mask) > 30:
            print("2b. Filling skin-on-fabric (hands/hair) with local texture inpaint...")
            working = _opencv_texture_inpaint(working, texture_mask)

        if _mask_area(neck_sd_mask) > 30:
            print("3. Synthesizing hollow neck lining via Stable Diffusion...")
            prompt, negative_prompt = generate_garment_prompt(
                resolved_type,
                prompt_desc=desc,
                color_word=color_word,
            )
            print(f"   prompt: {prompt[:140]}...")
            pipe = _inpaint_pipe()
            working = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=working,
                mask_image=neck_sd_mask,
                num_inference_steps=steps,
                guidance_scale=guidance,
            ).images[0]
        elif _mask_area(texture_mask) <= 30:
            print("2. Inpaint masks empty; skipping generative inpainting.")
            combined_inpaint = None
    else:
        print("2. No human model detected (or GHOST_SKIP_INPAINT). Skipping inpainting...")

    print("4. Compositing garment-only ghost PNG (mask alpha + rembg edges)...")
    return _compose_ghost_rgba(working, garment_mask, combined_inpaint)
def extract_ghost_mannequin_png_bytes(
    source: bytes | BinaryIO,
    *,
    garment_type: str = "auto",
    prompt_desc: str | None = None,
    custom_desc: str | None = None,
    skip_inpaint: bool | None = None,
    inference_steps: int | None = None,
) -> bytes:
    if isinstance(source, (bytes, bytearray)):
        image = Image.open(io.BytesIO(source))
    else:
        image = Image.open(source)
    out = extract_ghost_mannequin(
        image,
        garment_type=garment_type,
        prompt_desc=prompt_desc,
        custom_desc=custom_desc,
        skip_inpaint=skip_inpaint,
        inference_steps=inference_steps,
    )
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def extract_universal_garment(
    image_path: str,
    garment_type: str = "auto",
    prompt_desc: str | None = None,
    custom_desc: str | None = None,
    output_path: str = "extracted_garment.png",
    *,
    skip_inpaint: bool | None = None,
    inference_steps: int | None = None,
) -> str:
    """Path-based API matching the user-supplied script surface."""
    with open(image_path, "rb") as handle:
        png = extract_ghost_mannequin_png_bytes(
            handle.read(),
            garment_type=garment_type,
            prompt_desc=prompt_desc,
            custom_desc=custom_desc,
            skip_inpaint=skip_inpaint,
            inference_steps=inference_steps,
        )
    with open(output_path, "wb") as handle:
        handle.write(png)
    print(f"Success! Output saved to '{output_path}'.")
    return output_path
