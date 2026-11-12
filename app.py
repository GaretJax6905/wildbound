"""Wildbound: serves the static browser game (all game logic runs client-side)."""
from pathlib import Path

from flask import Flask, send_from_directory

STATIC = Path(__file__).parent / "static"
app = Flask(__name__, static_folder=str(STATIC), static_url_path="/static")


@app.after_request
def no_stale_cache(resp):
    """Let the service worker manage caching; always revalidate with the server."""
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.get("/")
def index():
    return send_from_directory(STATIC, "index.html")


@app.get("/sw.js")
def service_worker():
    resp = send_from_directory(STATIC, "sw.js", mimetype="text/javascript")
    resp.headers["Service-Worker-Allowed"] = "/"
    return resp


@app.get("/manifest.webmanifest")
def manifest():
    return send_from_directory(STATIC, "manifest.webmanifest", mimetype="application/manifest+json")


@app.get("/healthz")
def health():
    return {"ok": True}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
