"""Fetch starter icons for the vault (dev only, not bundled).

Devicon (MIT, devicons/devicon, pinned to a tag):
  30 homelab icons, variant preference plain > original > line,
  no wordmark, no eps -> starter-icons/devicon/<name>.svg

Simple Icons (CC0, simple-icons/simple-icons, pinned to a release tag):
  homelab brands missing from Devicon -> starter-icons/simple/<slug>.svg

Extra brands (homarr-labs/dashboard-icons, community source):
  dockhand, not in Devicon or Simple Icons -> starter-icons/dockhand.svg

Catalogs (baked fallback, refreshed per plugin release):
  cdn-catalog.ts from devicon.json,
  selfhost-catalog.ts from selfh.st index.json (CC-BY-4.0, attribution in README).

Usage: python3 scripts/fetch-icons.py
Copy the result into the vault: starter-icons/* -> _assets/icons/
"""
import datetime
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DEVICON = ROOT / "starter-icons" / "devicon"
OUT_SIMPLE = ROOT / "starter-icons" / "simple"

DEVICON_TAG = "v2.17.0"
DEVICON_LIST = [
    "proxmox", "raspberrypi", "docker", "podman", "kubernetes", "helm",
    "argocd", "terraform", "ansible", "portainer", "debian", "ubuntu",
    "linux", "nginx", "pfsense", "postgresql", "mariadb", "sqlite",
    "redis", "mongodb", "influxdb", "grafana", "prometheus",
    "elasticsearch", "vault", "consul", "nomad", "jenkins", "git",
    "nodered",
]
DEVICON_VARIANTS = ["plain", "original", "line"]

SIMPLE_SLUGS = [
    "homeassistant", "homebridge", "pihole", "truenas", "nextcloud",
    "jellyfin", "traefikproxy", "esphome", "unraid", "opnsense",
]


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def simple_tag() -> str:
    raw = get("https://api.github.com/repos/simple-icons/simple-icons/releases/latest")
    return json.loads(raw)["tag_name"]


def main() -> None:
    OUT_DEVICON.mkdir(parents=True, exist_ok=True)
    OUT_SIMPLE.mkdir(parents=True, exist_ok=True)

    meta = json.loads(get(
        f"https://raw.githubusercontent.com/devicons/devicon/{DEVICON_TAG}/devicon.json"
    ))
    by_name = {d["name"]: d for d in meta}

    catalog = ["// Generiert aus devicon.json (v2.17.0). Nicht von Hand pflegen."]
    catalog.append("export const DEVICON_NAMES: string[] = [")
    for d in sorted(meta, key=lambda x: x["name"]):
        catalog.append(f'  "{d["name"]}",')
    catalog.append("];")
    catalog.append("export const DEVICON_TAGS: Record<string, string[]> = {")
    for d in sorted(meta, key=lambda x: x["name"]):
        tags = [t for t in d.get("tags", []) if isinstance(t, str)][:6]
        if tags:
            quoted = ", ".join(f'"{t}"' for t in tags)
            catalog.append(f'  "{d["name"]}": [{quoted}],')
    catalog.append("};")
    (ROOT / "cdn-catalog.ts").write_text("\n".join(catalog) + "\n", encoding="utf-8")
    print(f"cdn-catalog.ts ({len(meta)} Namen)")

    missing = [n for n in DEVICON_LIST if n not in by_name]
    if missing:
        raise SystemExit(f"unknown devicon names: {missing}")

    for name in DEVICON_LIST:
        variants = [v for v in by_name[name]["versions"]["svg"]
                    if "wordmark" not in v]
        variant = next((v for v in DEVICON_VARIANTS if v in variants), None)
        if not variant:
            raise SystemExit(f"no plain/original/line variant for {name}: {variants}")
        url = (f"https://raw.githubusercontent.com/devicons/devicon/{DEVICON_TAG}"
               f"/icons/{name}/{name}-{variant}.svg")
        (OUT_DEVICON / f"{name}.svg").write_bytes(get(url))
        print(f"devicon/{name}.svg ({variant})")

    tag = simple_tag()
    print(f"simple-icons tag: {tag}")
    for slug in SIMPLE_SLUGS:
        url = (f"https://raw.githubusercontent.com/simple-icons/simple-icons"
               f"/{tag}/icons/{slug}.svg")
        try:
            (OUT_SIMPLE / f"{slug}.svg").write_bytes(get(url))
        except Exception as e:
            raise SystemExit(f"simple-icons slug failed: {slug}: {e}")
        print(f"simple/{slug}.svg")

    (ROOT / "starter-icons" / "dockhand.svg").write_bytes(get(
        "https://raw.githubusercontent.com/homarr-labs/dashboard-icons"
        "/main/svg/dockhand-svg.svg"
    ))
    print("dockhand.svg (dashboard-icons)")

    for name in ["technitium", "adguard-home"]:
        (ROOT / "starter-icons" / f"{name}.svg").write_bytes(get(
            "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons"
            f"/svg/{name}.svg"
        ))
        print(f"{name}.svg (dashboard-icons)")

    index = json.loads(get("https://cdn.jsdelivr.net/gh/selfhst/icons/index.json"))
    today = datetime.date.today().isoformat()
    out = ["// Generiert aus selfh.st index.json (CC-BY-4.0, Namensnennung in README).",
           "// Nicht von Hand pflegen.",
           f'export const SELFHOST_DATE = "{today}";',
           "export interface SelfhostEntry { light: boolean; tags: string[]; }",
           "export const SELFHOST_CATALOG: Record<string, SelfhostEntry> = {"]
    count = 0
    for d in sorted(index, key=lambda x: str(x.get("Reference", ""))):
        ref = str(d.get("Reference", "")).lower()
        if not ref or d.get("SVG") != "Yes":
            continue
        if not __import__("re").match(r"^[a-z0-9-]+$", ref):
            continue
        tags = [t for t in str(d.get("Tags", "")).split(",") if t.strip()][:6]
        quoted = ", ".join(f'"{t.strip()}"' for t in tags)
        light = "true" if d.get("Light") == "Yes" else "false"
        out.append(f'  "{ref}": {{ light: {light}, tags: [{quoted}] }},')
        count += 1
    out.append("};")
    (ROOT / "selfhost-catalog.ts").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"selfhost-catalog.ts ({count} Einträge, Stand {today})")


if __name__ == "__main__":
    main()
