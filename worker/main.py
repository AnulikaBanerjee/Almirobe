from __future__ import annotations

import io
import json
import os
import threading

import redis
from PIL import Image

from worker.extract import extract_png_bytes
from worker.s3util import get_bytes, put_bytes
from worker.tags import build_tags

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
QUEUE_TAGS = os.environ.get("QUEUE_TAGS", "almirobe:jobs:tags")
QUEUE_EXTRACT = os.environ.get("QUEUE_EXTRACT", "almirobe:jobs:extract")
RESULT_PREFIX = os.environ.get("RESULT_PREFIX", "almirobe:job:")


def redis_client() -> redis.Redis:
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


def job_key(job_id: str) -> str:
    return f"{RESULT_PREFIX}{job_id}"


def load_original(r: redis.Redis, job_id: str) -> Image.Image:
    meta = r.hgetall(job_key(job_id))
    object_key = meta.get("original_object_key")
    if not object_key:
        raise RuntimeError(f"missing original_object_key for {job_id}")
    data = get_bytes(object_key)
    return Image.open(io.BytesIO(data)).convert("RGBA")


def process_tags(r: redis.Redis, job_id: str) -> None:
    key = job_key(job_id)
    r.hset(key, "tags_status", "running")
    image = load_original(r, job_id)
    thumb = image.copy()
    thumb.thumbnail((512, 512))
    tags = build_tags(thumb)
    r.hset(key, mapping={"tags_status": "succeeded", "tags_json": json.dumps(tags)})


def process_extract(r: redis.Redis, job_id: str) -> None:
    key = job_key(job_id)
    meta = r.hgetall(key)
    processed_key = meta.get("processed_object_key")
    if not processed_key:
        raise RuntimeError(f"missing processed_object_key for {job_id}")
    r.hset(key, "cutout_status", "running")
    image = load_original(r, job_id)
    png, needs_review = extract_png_bytes(image)
    put_bytes(processed_key, png, "image/png")
    r.hset(
        key,
        mapping={
            "cutout_status": "succeeded",
            "processed_object_key": processed_key,
            "needs_review": "true" if needs_review else "false",
        },
    )


def loop(queue: str, handler) -> None:
    r = redis_client()
    while True:
        item = r.brpop(queue, timeout=5)
        if not item:
            continue
        _, job_id = item
        try:
            handler(r, job_id)
        except Exception as exc:  # noqa: BLE001
            field = "tags_status" if queue == QUEUE_TAGS else "cutout_status"
            r.hset(
                job_key(job_id),
                mapping={field: "failed", "error": str(exc)[:500]},
            )


def main() -> None:
    print("almirobe worker listening", flush=True)
    tags_thread = threading.Thread(target=loop, args=(QUEUE_TAGS, process_tags), daemon=True)
    extract_thread = threading.Thread(target=loop, args=(QUEUE_EXTRACT, process_extract), daemon=True)
    tags_thread.start()
    extract_thread.start()
    tags_thread.join()


if __name__ == "__main__":
    main()
