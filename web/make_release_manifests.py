#!/usr/bin/env python3
"""Writes the two release manifests from freshly built images.

    make_release_manifests.py <version> <factory.bin> <ota.bin> <release-base-url>

Reads the hashes itself, writes web/firmware/manifest.json (the web wizard's
factory manifest), web/firmware/ota-manifest.json and out/ota-manifest.json
(the OTA manifest the Sticky reads as a release asset; out/ is what gets
uploaded). Each version's list in CHANGELOG.md becomes the update screen's
"What's new". Run by .github/workflows/build-firmware.yml.
"""
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

version, factory, ota, rel = sys.argv[1:5]
root = Path(__file__).resolve().parent.parent


def digest(path, algo):
    h = hashlib.new(algo)
    h.update(Path(path).read_bytes())
    return h.hexdigest()


data = Path(root, "CHANGELOG.md").read_text()
m = re.search(rf"^## {re.escape(version)}\n(.*?)(?=^## |\Z)", data, re.S | re.M)
if not m:
    sys.exit(f"CHANGELOG.md has no section for {version}")
items = [l[2:].strip() for l in m.group(1).splitlines() if l.startswith("- ")]
if not items:
    sys.exit(f"CHANGELOG.md list for {version} is empty")

manifest = {
    "name": "Sticky Remote",
    "version": version,
    "chip": "ESP32-S3",
    "file": Path(factory).name,
    "size": Path(factory).stat().st_size,
    "sha256": digest(factory, "sha256"),
    "built": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
}
Path(root, "web/firmware/manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

ota_manifest = {
    "name": "Sticky Remote",
    "version": version,
    "builds": [{
        "chipFamily": "ESP32-S3",
        "ota": {
            "path": f"{rel}/download/v{version}/{Path(ota).name}",
            "md5": digest(ota, "md5"),
            "release_url": f"{rel}/tag/v{version}",
            "summary": "\n".join(items),
        },
    }],
}
out = json.dumps(ota_manifest, indent=2, ensure_ascii=False) + "\n"
Path(root, "web/firmware/ota-manifest.json").write_text(out)  # the wizard's copy
Path(root, "out").mkdir(exist_ok=True)
Path(root, "out/ota-manifest.json").write_text(out)           # the release asset
print(f"manifests for {version}: factory {manifest['size']} bytes, sha {manifest['sha256'][:12]}…")
