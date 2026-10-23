"""CLI: python -m worker.ghost_mannequin_cli input.jpg output.png [--type auto] [--desc ...]"""
from __future__ import annotations

import argparse
import sys

from worker.ghost_mannequin import extract_ghost_mannequin_png_bytes


def main() -> int:
    parser = argparse.ArgumentParser(description="Universal ghost-mannequin garment extraction")
    parser.add_argument("input", help="Input model/product photo")
    parser.add_argument("output", help="Output transparent PNG path")
    parser.add_argument(
        "--type",
        dest="garment_type",
        default="auto",
        help="Garment type key (auto, kurta, saree, dress, western, ...)",
    )
    parser.add_argument(
        "--desc",
        dest="prompt_desc",
        default=None,
        help="Custom inpaint prompt description (overrides type templates)",
    )
    parser.add_argument("--skip-inpaint", action="store_true", help="Skip Stable Diffusion inpainting")
    parser.add_argument("--steps", type=int, default=None, help="Inpaint inference steps")
    args = parser.parse_args()

    with open(args.input, "rb") as handle:
        data = handle.read()
    png = extract_ghost_mannequin_png_bytes(
        data,
        garment_type=args.garment_type,
        prompt_desc=args.prompt_desc,
        skip_inpaint=True if args.skip_inpaint else None,
        inference_steps=args.steps,
    )
    with open(args.output, "wb") as handle:
        handle.write(png)
    print(f"Wrote {args.output} ({len(png)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
