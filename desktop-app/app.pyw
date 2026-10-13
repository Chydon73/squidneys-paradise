"""Squidney's Paradise league tracker.

Runs a small web server on this PC only (127.0.0.1) and opens the tracker in its own
Edge app window. All league data is saved in data/league.json next to this file, with
automatic backups in data/backups.

    pythonw app.pyw                 normal start (the desktop shortcut does this)
    python app.pyw --server-only    just the server, no window, never auto-exits
"""

import json
import os
import shutil
import subprocess
import sys
import threading
import time
import traceback
import urllib.request
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

APP_ID = "squidneys-paradise-tracker"
PORT = 47816
HOST = "127.0.0.1"
URL = f"http://{HOST}:{PORT}/"

APP_DIR = Path(__file__).resolve().parent
WEB_DIR = APP_DIR / "web"
DATA_DIR = APP_DIR / "data"
DATA_FILE = DATA_DIR / "league.json"
BACKUP_DIR = DATA_DIR / "backups"
CACHE_DIR = APP_DIR / ".cache"
EDGE_PROFILE = APP_DIR / ".edge-profile"
LOG_FILE = DATA_DIR / "app.log"
MAX_BACKUPS = 40

# Close the server this long after the window has gone away. A minimized window can
# slow its heartbeat to about once a minute, hence the longer fallback.
GRACE_AFTER_WINDOW_CLOSED = 10
GRACE_WITHOUT_WINDOW_PROCESS = 150

state = {"last_ping": time.time(), "backed_up_this_session": False}
save_lock = threading.Lock()


def log(msg):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now():%Y-%m-%d %H:%M:%S}  {msg}\n")


def season_count(path):
    try:
        return len(json.loads(path.read_text(encoding="utf-8")).get("years", []))
    except (OSError, ValueError, AttributeError):
        return None


def backup_current(reason):
    if not DATA_FILE.exists():
        return
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    dest = BACKUP_DIR / f"league-{datetime.now():%Y-%m-%d_%H%M%S}.json"
    shutil.copy2(DATA_FILE, dest)
    log(f"backup {dest.name} ({reason})")
    backups = sorted(BACKUP_DIR.glob("league-*.json"))
    for old in backups[:-MAX_BACKUPS]:
        old.unlink()


def save_league(raw_bytes):
    league = json.loads(raw_bytes.decode("utf-8"))
    if not isinstance(league, dict) or not isinstance(league.get("years"), list):
        raise ValueError("not a league")
    with save_lock:
        # Snapshot once per session, and whenever the number of seasons changes
        # (an import or a deleted season), so a mistake can always be undone.
        if not state["backed_up_this_session"]:
            backup_current("first save this session")
            state["backed_up_this_session"] = True
        elif season_count(DATA_FILE) not in (None, len(league["years"])):
            backup_current("season count changed")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp = DATA_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(league, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, DATA_FILE)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".jsx": "text/plain; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _allowed(self):
        # Only answer pages served by this app, not other websites open in a browser.
        allowed_hosts = {f"{HOST}:{PORT}", f"localhost:{PORT}"}
        if self.headers.get("Host") not in allowed_hosts:
            return False
        origin = self.headers.get("Origin")
        return origin is None or origin in {f"http://{h}" for h in allowed_hosts}

    def _send(self, code, body=b"", ctype="text/plain; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        return self.rfile.read(int(self.headers.get("Content-Length") or 0))

    def do_GET(self):
        if not self._allowed():
            return self._send(403)
        url = urlparse(self.path)
        if url.path == "/api/whoami":
            return self._send(200, APP_ID.encode())
        if url.path == "/api/data":
            if not DATA_FILE.exists():
                return self._send(404)
            return self._send(200, DATA_FILE.read_bytes(), "application/json; charset=utf-8")
        if url.path == "/api/compiled":
            key = parse_qs(url.query).get("key", [""])[0]
            f = CACHE_DIR / f"app-{key}.js"
            if key.isalnum() and f.exists():
                return self._send(200, f.read_bytes(), "text/javascript; charset=utf-8")
            return self._send(404)
        return super().do_GET()

    def do_POST(self):
        if not self._allowed():
            return self._send(403)
        url = urlparse(self.path)
        if url.path == "/api/ping":
            state["last_ping"] = time.time()
            return self._send(204)
        if url.path == "/api/data":
            try:
                save_league(self._body())
            except (ValueError, UnicodeDecodeError) as e:
                log(f"rejected save: {e}")
                return self._send(400, b"bad league data")
            except OSError as e:
                log(f"save failed: {e}")
                return self._send(500, b"could not write league file")
            return self._send(204)
        if url.path == "/api/compiled":
            key = parse_qs(url.query).get("key", [""])[0]
            if not key.isalnum():
                return self._send(400)
            CACHE_DIR.mkdir(exist_ok=True)
            for old in CACHE_DIR.glob("app-*.js"):
                old.unlink()
            (CACHE_DIR / f"app-{key}.js").write_bytes(self._body())
            return self._send(204)
        return self._send(404)


def already_running():
    try:
        with urllib.request.urlopen(URL + "api/whoami", timeout=1) as r:
            return r.read().decode() == APP_ID
    except OSError:
        return False


def find_edge():
    for base in (os.environ.get("ProgramFiles(x86)"), os.environ.get("ProgramFiles"), os.environ.get("LOCALAPPDATA")):
        if base:
            exe = Path(base) / "Microsoft" / "Edge" / "Application" / "msedge.exe"
            if exe.exists():
                return exe
    return None


def open_window():
    edge = find_edge()
    if edge is None:
        webbrowser.open(URL)
        return None
    return subprocess.Popen([
        str(edge),
        f"--app={URL}",
        f"--user-data-dir={EDGE_PROFILE}",
        "--no-first-run",
        "--no-default-browser-check",
        # Otherwise Edge signs this window into the Windows account and syncs in the
        # extensions, passwords, etc. from the user's normal browser.
        "--disable-sync",
        "--disable-extensions",
        "--window-size=1400,900",
    ])


def wait_for_window_to_close(proc):
    started = time.time()
    proc_ended_at = None
    while True:
        time.sleep(2)
        idle = time.time() - state["last_ping"]
        if proc is not None and proc.poll() is None:
            continue
        if proc_ended_at is None:
            proc_ended_at = time.time()
        # If Edge handed the window to an already-running copy, the process ends right
        # away while the window stays open, so fall back to the heartbeat alone.
        window_really_closed = proc is not None and proc_ended_at - started > 15
        grace = GRACE_AFTER_WINDOW_CLOSED if window_really_closed else GRACE_WITHOUT_WINDOW_PROCESS
        if idle > grace:
            return


def main():
    server_only = "--server-only" in sys.argv
    if already_running():
        if not server_only:
            open_window()
        return
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    log("started")
    if server_only:
        print(f"Serving {URL}  (Ctrl+C to stop)")
        try:
            while True:
                time.sleep(3600)
        except KeyboardInterrupt:
            pass
    else:
        wait_for_window_to_close(open_window())
    server.shutdown()
    log("stopped")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("crash:\n" + traceback.format_exc())
        raise
