"""A local, generic add-on for website screenshots (127.0.0.1 only).

Serves made-up titles from catalog.json with generated artwork, episode lists
for the series, and one generic demo stream (a still of generated art), using
the standard add-on protocol: /manifest.json, /catalog/..., /meta/..., /stream/...
Nothing here refers to any real title, source or service.
"""
import json, os, re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
PORT = 7781
BASE = f"http://127.0.0.1:{PORT}"
CATALOG = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
EPISODE_NAMES = ["The Quiet Shore", "Lights Out", "Signal Fire", "Low Tide", "Northbound", "Paper Moons",
                 "The Long Night", "Glass Rain", "Second Orbit", "Embers", "Homecoming", "Last Light"]

MANIFEST = {
    "id": "uk.rrmtools.starlit.demo", "version": "1.0.0", "name": "Starlit Demo Catalog",
    "description": "Made-up titles with generated artwork, for screenshots.",
    "resources": ["catalog", "meta", "stream"], "types": ["movie", "series"], "idPrefixes": ["demo:"],
    "catalogs": [
        {"type": "series", "id": "demo-trending", "name": "Trending series"},
        {"type": "movie", "id": "demo-movies", "name": "Popular films"},
        {"type": "series", "id": "demo-new", "name": "New this season"},
    ],
}

def art(t, kind):
    ext = "png" if kind == "logo" else "jpg"
    return f"{BASE}/img/{t['slug']}-{kind}.{ext}"

def preview(t):
    return {"id": f"demo:{t['slug']}", "type": t["type"], "name": t["name"], "poster": art(t, "poster"),
            "background": art(t, "backdrop"), "logo": art(t, "logo"), "description": t["description"],
            "releaseInfo": t["year"], "genres": t["genres"]}

def meta(t):
    m = preview(t)
    if t["type"] == "series":
        m["videos"] = [{"id": f"demo:{t['slug']}:{s}:{e}", "title": EPISODE_NAMES[(e - 1) % 12], "season": s, "episode": e,
                        "released": f"{t['year']}-0{min(s, 9)}-{10 + e:02d}T00:00:00.000Z", "thumbnail": art(t, "backdrop"),
                        "overview": t["description"]} for s in (1, 2) for e in range(1, 13 if s == 1 else 7)]
    return m

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # quiet
        pass

    def send_json(self, data):
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        from urllib.parse import unquote
        path = unquote(self.path.split("?")[0])
        if path == "/manifest.json":
            return self.send_json(MANIFEST)
        m = re.match(r"^/catalog/(movie|series)/([\w-]+)(?:/[^/]*)?\.json$", path)
        if m:
            kind, cid = m.groups()
            items = [t for t in CATALOG if t["type"] == kind]
            if cid == "demo-new":
                items = list(reversed(items))
            return self.send_json({"metas": [preview(t) for t in items]})
        m = re.match(r"^/meta/(movie|series)/demo:([\w-]+)\.json$", path)
        if m:
            t = next((x for x in CATALOG if x["slug"] == m.group(2)), None)
            return self.send_json({"meta": meta(t)} if t else {"meta": None})
        if re.match(r"^/stream/(movie|series)/demo:", path):
            return self.send_json({"streams": [{"name": "Starlit Demo", "title": "Demo video · 1080p",
                                                "url": f"{BASE}/demo.mp4"}]})
        return super().do_GET()

if __name__ == "__main__":
    os.chdir(ROOT)
    ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT))).serve_forever()
