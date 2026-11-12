import re
import shutil
import subprocess
from pathlib import Path

import pytest

from app import app

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    return app.test_client()


def test_index_serves_game(client):
    r = client.get("/")
    assert r.status_code == 200
    assert b'id="screen"' in r.data
    assert b"/static/js/main.js" in r.data


def test_pwa_files(client):
    assert client.get("/manifest.webmanifest").status_code == 200
    r = client.get("/sw.js")
    assert r.status_code == 200
    assert r.headers["Service-Worker-Allowed"] == "/"


def test_health(client):
    assert client.get("/healthz").get_json() == {"ok": True}


def test_offline_cache_lists_every_js_module():
    sw = (ROOT / "static" / "sw.js").read_text()
    listed = set(re.findall(r"'(\w+)'", sw.split("map(")[0].split("...[")[1]))
    actual = {p.stem for p in (ROOT / "static" / "js").glob("*.js")}
    assert actual == listed, f"sw.js cache list out of date: {actual ^ listed}"


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_game_data_rules():
    r = subprocess.run(["node", "tests/check_data.mjs"], cwd=ROOT, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
