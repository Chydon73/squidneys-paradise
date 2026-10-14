"""Builds the folder to upload to GitHub: a read-only website (GitHub Pages) showing the
league, plus the desktop app's source in desktop-app/. Run it any time you want to update the
site, then upload the folder's contents on github.com.

The website reuses the app's code as compiled by the desktop app (in .cache), so open the
tracker at least once after any code change before running this.
"""

import json
import shutil
import sys
from datetime import date, datetime, timezone
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
OUT_DIR = Path.home() / "Desktop" / "Squidney's Paradise - GitHub upload"
if "--out" in sys.argv:  # for testing: build somewhere else
    OUT_DIR = Path(sys.argv[sys.argv.index("--out") + 1])


def compile_key(source):
    # Same hash web/index.html uses to name the compiled copy of app.jsx in .cache.
    data = source.encode("utf-16-le")
    h = 5381
    for i in range(0, len(data), 2):
        h = ((h * 33) ^ (data[i] | (data[i + 1] << 8))) & 0xFFFFFFFF
    return format(h, "x")


SITE_INDEX = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Squidney's Paradise</title>
<link rel="icon" href="icon.png" />
<style>
  html, body {{ margin: 0; background: #121418; color-scheme: dark; }}
  #boot {{ font: 13px 'Segoe UI', sans-serif; color: #A4ABB6; padding: 60px 16px; text-align: center; }}
</style>
<script>window.FL_STATIC = true; window.FL_PUBLISHED = {published}; window.FL_PUBLISHED_AT = {published_at};</script>
<script src="vendor/react.production.min.js"></script>
<script src="vendor/react-dom.production.min.js"></script>
</head>
<body>
<div id="root"><div id="boot">Loading the league...</div></div>
<script src="app.js?v={version}"></script>
</body>
</html>
"""

README = """# Squidney's Paradise

League record book for the Squidney's Paradise fantasy football league: standings, game logs,
drafts, playoffs, trades, career stats and the all-time record book.

**View it:** this repository's GitHub Pages site (Settings -> Pages shows the address).

The website is read-only and shows the league as of the date in its top-right corner.

## What's here

- `index.html`, `app.js`, `vendor/`, `icon.png` - the website.
- `league.json` - the league data the website shows.
- `desktop-app/` - the Windows desktop app used to keep the league up to date. It needs
  Python 3; run `app.pyw` to open it. It saves to `desktop-app/data/league.json`.
"""


def build():
    # Read it byte-for-byte like the browser does (keep Windows line endings, drop a BOM).
    source = (APP_DIR / "web" / "app.jsx").read_bytes().decode("utf-8")
    if source.startswith("﻿"):
        source = source[1:]
    compiled = APP_DIR / ".cache" / f"app-{compile_key(source)}.js"
    if not compiled.exists():
        raise RuntimeError(
            "The website code is out of date with the tracker.\n\n"
            "Open the Squidney's Paradise app once (then close it), and run this again."
        )
    league_file = APP_DIR / "data" / "league.json"
    league = json.loads(league_file.read_text(encoding="utf-8"))
    seasons = sorted(y["year"] for y in league.get("years", []))

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    (OUT_DIR / "vendor").mkdir(parents=True)

    published = date.today().strftime("%b %d, %Y").replace(" 0", " ")
    # The page shows this moment in Eastern time (EST or EDT, whichever applied then).
    published_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    (OUT_DIR / "index.html").write_text(
        SITE_INDEX.format(published=json.dumps(published), published_at=json.dumps(published_at),
                          version=compile_key(source)), encoding="utf-8")
    shutil.copy2(compiled, OUT_DIR / "app.js")
    shutil.copy2(league_file, OUT_DIR / "league.json")
    shutil.copy2(APP_DIR / "web" / "icon.png", OUT_DIR / "icon.png")
    for lib in ("react.production.min.js", "react-dom.production.min.js"):
        shutil.copy2(APP_DIR / "web" / "vendor" / lib, OUT_DIR / "vendor" / lib)
    (OUT_DIR / "README.md").write_text(README, encoding="utf-8")

    desk = OUT_DIR / "desktop-app"
    (desk / "web" / "vendor").mkdir(parents=True)
    for name in ("app.pyw", "icon.ico", "make_github_upload.pyw"):
        shutil.copy2(APP_DIR / name, desk / name)
    for name in ("index.html", "app.jsx", "icon.png"):
        shutil.copy2(APP_DIR / "web" / name, desk / "web" / name)
    for lib in (APP_DIR / "web" / "vendor").glob("*.js"):
        shutil.copy2(lib, desk / "web" / "vendor" / lib.name)

    files = sum(1 for p in OUT_DIR.rglob("*") if p.is_file())
    return f"Ready to upload: {files} files, seasons {seasons[0]}-{seasons[-1]}, dated {published}.\n\n{OUT_DIR}"


def main():
    import tkinter
    from tkinter import messagebox
    root = tkinter.Tk()
    root.withdraw()
    try:
        message = build()
    except Exception as e:  # shown to the user instead of failing silently under pythonw
        messagebox.showerror("Prepare GitHub upload", str(e))
        return 1
    messagebox.showinfo("Prepare GitHub upload", message + "\n\nThe folder will open now.")
    import os
    os.startfile(OUT_DIR)
    return 0


if __name__ == "__main__":
    if "--quiet" in sys.argv:
        print(build())
    else:
        sys.exit(main())
