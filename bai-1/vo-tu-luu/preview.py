"""Run a loopback-only preview with a separate, simulated SCORM server."""
import argparse
import json
import re
from functools import partial
from html import escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlsplit
from uuid import uuid4

from build import build, SOURCE

TOKEN = re.compile(r"[0-9a-f]{32}")
attempts = {}
lock = Lock()
shell = """<!doctype html><html lang="vi"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cùng Sóc khám phá AI — Bản xem thử</title>
<style>body{margin:0;font:1rem system-ui;background:#fff9ec;color:#214538}
header{padding:.65rem 1rem;text-align:center;background:#e8f0df}
a{color:#174f39} iframe{display:block;border:0;width:100%;height:calc(100dvh - 3rem)}
@media(max-width:540px){iframe{height:calc(100dvh - 4.5rem)}}</style>
<header>Bản xem thử cục bộ · dùng dữ liệu mẫu · <a href="/bao-cao?luot={token}" target="_blank" rel="noopener">Xem báo cáo thử</a></header>
<script src="/preview.js"></script>
<iframe src="/sco/index.html" title="Cùng Sóc khám phá AI" allow="fullscreen"></iframe></html>"""


class Preview(SimpleHTTPRequestHandler):
    def body(self, content, kind="text/html; charset=utf-8", status=200):
        if isinstance(content, str):
            content = content.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def result(self, data):
        self.body(json.dumps(data, ensure_ascii=False), "application/json; charset=utf-8")

    def do_GET(self):
        url = urlsplit(self.path)
        token = parse_qs(url.query).get("luot", [""])[0]
        if url.path == "/":
            if not TOKEN.fullmatch(token):
                self.send_response(302)
                self.send_header("Location", "/?luot=" + uuid4().hex)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.body(shell.replace("{token}", token))
            return
        if url.path == "/preview.js":
            self.body((SOURCE / "preview.js").read_bytes(), "text/javascript; charset=utf-8")
            return
        if url.path == "/sco/index.html":
            page = (Path(self.directory) / "sco/index.html").read_text(encoding="utf-8")
            self.body(page.replace('<body class="guided-lesson">', '<body class="guided-lesson" data-preview="true">'))
            return
        if url.path.startswith("/api/attempt/") or url.path == "/bao-cao":
            if url.path != "/bao-cao":
                token = url.path.removeprefix("/api/attempt/")
            if not TOKEN.fullmatch(token):
                self.send_error(404)
                return
            with lock:
                current = attempts.get(token, {"revision": 0, "values": {}})
            if url.path.startswith("/api/attempt/"):
                self.result(current)
            else:
                values = current["values"]
                snap = json.loads(values.get("cmi.suspend_data", "{}"))
                if not snap:
                    data = "<p>Chưa có dữ liệu được máy chủ xem thử ghi nhận.</p>"
                else:
                    summaries = [("Q1 · Hai ví dụ hoặc lời kể", snap["q1"]),
                                 ("Q2 · Hai lượt thử", snap["q2"])]
                    data = '<p>Bước ' + str(snap["step"]) + ' trong 6 · ' + (
                        'Đã xác nhận nhật ký' if snap["finished"] else 'Đang thực hiện') + '</p>'
                    for title, entry in summaries:
                        data += "<h2>" + title + "</h2><pre>" + escape(json.dumps(entry, ensure_ascii=False, indent=2)) + "</pre>"
                self.body('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" '
                          'content="width=device-width,initial-scale=1"><title>Báo cáo xem thử</title>'
                          '<style>body{max-width:52rem;margin:2rem auto;padding:0 1rem;font:1rem system-ui}'
                          'pre{background:#eef3e7;padding:.8rem;white-space:pre-wrap;overflow-wrap:anywhere}</style>'
                          '<h1>Báo cáo xem thử</h1><p>Dữ liệu trên máy chủ localhost.</p>' + data)
            return
        if url.path.startswith("/sco/") and ".." not in url.path and "%" not in url.path:
            super().do_GET()
            return
        self.send_error(404)

    def do_POST(self):
        url = urlsplit(self.path)
        token = url.path.removeprefix("/api/attempt/")
        if not TOKEN.fullmatch(token):
            self.send_error(404)
            return
        try:
            length = int(self.headers["Content-Length"])
            if not 0 < length < 8000:
                raise ValueError("Invalid request length")
            data = json.loads(self.rfile.read(length))
            stored = data["values"]
            state = json.loads(stored["cmi.suspend_data"])
            if state["version"] != 1 or state["step"] not in range(1, 7):
                raise ValueError("Invalid workbook state")
        except (ValueError, KeyError, TypeError):
            self.send_error(400)
            return
        with lock:
            revision = attempts.get(token, {"revision": 0})["revision"]
            if data["revision"] == revision:
                attempts[token] = {"revision": revision + 1, "values": stored}
                saved = True
            else:
                saved = False
        if not saved:
            self.send_error(409, "A newer preview state exists")
            return
        self.result({"revision": revision + 1})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--port", type=int, default=8363)
    args = parser.parse_args()
    output = args.output.resolve()
    print(build(output), flush=True)
    host = "127.0.0.1"
    print(f"http://{host}:{args.port}/", flush=True)
    ThreadingHTTPServer((host, args.port), partial(Preview, directory=output)).serve_forever()
