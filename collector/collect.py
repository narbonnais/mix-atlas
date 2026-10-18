"""Small, bounded collector for the public sources listed in sources.json.

1001Tracklists is intentionally not fetched: its access is not validated.
No credentials, proxy rotation, CAPTCHA handling, or background crawling.
"""
import argparse
import hashlib
import html
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

ROOT = Path(__file__).resolve().parents[1]
UA = "OlanderAtlas/0.1"


class TracklistParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.lines = []
        self.current = []
        self.in_heading = False

    def flush(self):
        line = " ".join("".join(self.current).split())
        self.current = []
        if line and not line.startswith("Tracklist"):
            self.lines.append(line)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div" and "div-mix-tracklist" in attrs.get("class", "").split():
            self.depth = 1
        elif self.depth and tag == "div":
            self.depth += 1
        if self.depth and tag == "h2":
            self.in_heading = True
        if self.depth and tag in ("p", "br"):
            self.flush()

    def handle_endtag(self, tag):
        if self.depth and tag in ("p", "br"):
            self.flush()
        if tag == "h2":
            self.in_heading = False
        if self.depth and tag == "div":
            self.depth -= 1

    def handle_data(self, data):
        if self.depth and not self.in_heading:
            self.current.append(data)


def seconds(value):
    parts = [int(x) for x in value.split(":")]
    return sum(v * 60 ** i for i, v in enumerate(reversed(parts)))


def parse_lines(lines):
    entries, position = [], 0
    for line in lines:
        raw = line.strip()
        overlay = bool(re.match(r"^w/\s*", raw, re.I))
        raw = re.sub(r"^w/\s*", "", raw, flags=re.I)
        numbered = re.match(r"^(\d+)\.\s+", raw)
        if numbered:
            position = int(numbered[1])
            raw = raw[numbered.end():]
        elif not overlay:
            position += 1
        timestamp = re.match(r"^(\d{1,3}:\d{2}(?::\d{2})?)\s+", raw)
        moment = seconds(timestamp[1]) if timestamp else None
        if timestamp:
            raw = raw[timestamp.end():]
        raw = re.sub(r"\s*\[[^\]]*\]", "", raw).strip()
        pair = re.split(r"\s+[-–—]\s+", raw, maxsplit=1)
        if len(pair) != 2:
            raise ValueError("Unrecognized track row: " + line)
        artist, title = pair
        unresolved = bool(re.search(r"\bID\b|\bWorking Title\b|\?", artist + " " + title, re.I))
        entries.append({"position": position, "artist": artist, "title": title,
                        "timeSeconds": moment, "layer": "overlay" if overlay else "main",
                        "status": "unresolved" if unresolved else "identified"})
    if not entries:
        raise ValueError("Empty tracklist; the page format may have changed")
    return entries


def read_page(source, cache, fetch):
    file = cache / (source["id"] + ".html")
    if not fetch:
        return file.read_text()
    url = source["sourceUrl"]
    parts = urlparse(url)
    if parts.hostname not in ("watchthedj.com", "magneticmag.com"):
        raise ValueError("Source not supported: " + parts.hostname)
    robot = RobotFileParser(parts.scheme + "://" + parts.netloc + "/robots.txt")
    try:
        with urlopen(Request(robot.url, headers={"User-Agent": UA}), timeout=20) as r:
            robot.parse(r.read(200000).decode().splitlines())
    except Exception as exc:
        raise RuntimeError("Could not verify robots.txt; stopping for " + parts.netloc) from exc
    if not robot.can_fetch(UA, url):
        raise RuntimeError("robots.txt does not permit this source")
    time.sleep(max(2, robot.crawl_delay(UA) or 0))
    with urlopen(Request(url, headers={"User-Agent": UA}), timeout=20) as r:
        page = r.read(2000000).decode("utf-8")
    if re.search(r"captcha|access denied|verify you are human", page, re.I):
        raise RuntimeError("Access challenge detected; stopping")
    cache.mkdir(parents=True, exist_ok=True)
    file.write_text(page)
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", type=Path, default=ROOT / "collector/cache")
    ap.add_argument("--fetch", action="store_true", help="Fetch only the four explicit public sources")
    ap.add_argument("--collected-on", default="2026-10-18")
    args = ap.parse_args()
    sources = json.loads((ROOT / "collector/sources.json").read_text())
    sets = []
    for source in sources:
        page = read_page(source, args.cache, args.fetch)
        if source["kind"] == "watchthedj":
            parser = TracklistParser()
            parser.feed(page)
            lines = parser.lines
        else:
            match = re.search(r"<p>1\. Rezident.*?</p>", page, re.S)
            if not match:
                raise ValueError("Magnetic Mix tracklist was not found")
            lines = [html.unescape(re.sub(r"<[^>]+>", "", x)).strip()
                     for x in re.split(r"<br\s*/?>", match[0])]
        item = {k: v for k, v in source.items() if k != "kind"}
        item.update({"entries": parse_lines(lines), "collectedOn": args.collected_on,
                     "sourceSha256": hashlib.sha256(page.encode()).hexdigest()})
        # Media links are taken from the retrieved public page, never guessed.
        youtube = re.search(r"youtube\.com/embed/([A-Za-z0-9_-]+)", page)
        if youtube:
            item["mediaUrl"] = "https://www.youtube.com/watch?v=" + youtube[1]
        elif source["id"] == "sydney":
            fb = re.search(r"href=(https://facebook\.com/watch/\?v=\d+)", page)
            item["mediaUrl"] = fb[1] if fb else None
        elif source["id"] == "rezident":
            sc = re.search(r"api\.soundcloud\.com/playlists/(\d+)", page)
            item["mediaUrl"] = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/" + sc[1] if sc else None
        sets.append(item)
    dataset = {"schemaVersion": 1, "seedDj": "Jeremy Olander", "collectedOn": args.collected_on,
               "coverage": "Échantillon de tracklists publiées ; aucune exhaustivité annoncée.",
               "sets": sets}
    serialized = json.dumps(dataset, ensure_ascii=False, indent=2)
    (ROOT / "dist/dataset.json").write_text(serialized + "\n")
    (ROOT / "dist/data.mjs").write_text("export const SEED = " + serialized + ";\n")
    print(json.dumps({"sets": len(sets), "entries": sum(len(s["entries"]) for s in sets)}))


if __name__ == "__main__":
    main()
