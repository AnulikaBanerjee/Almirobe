"""Lightweight HTTP server for synchronous universal ghost-mannequin extraction."""
from __future__ import annotations

import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from worker.ghost_mannequin import extract_ghost_mannequin_png_bytes

PORT = int(os.environ.get("GHOST_SERVER_PORT", "8090"))
MAX_BYTES = 12 * 1024 * 1024


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.rstrip("/") != "/extract":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BYTES:
            self.send_error(400, "Invalid body size")
            return
        body = self.rfile.read(length)
        qs = parse_qs(parsed.query)
        garment_type = (qs.get("type") or ["auto"])[0]
        prompt_desc = (qs.get("desc") or [None])[0]
        try:
            png = extract_ghost_mannequin_png_bytes(
                body,
                garment_type=garment_type,
                prompt_desc=prompt_desc,
            )
        except Exception as exc:  # noqa: BLE001
            self.send_error(500, str(exc))
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(png)))
        self.end_headers()
        self.wfile.write(png)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        print(f"[ghost] {self.address_string()} - {format % args}")


def main() -> None:
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"ghost extract server on :{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
