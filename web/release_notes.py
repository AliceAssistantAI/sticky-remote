#!/usr/bin/env python3
"""Prints the release notes for a version: its CHANGELOG.md list.

    release_notes.py <version>

Run by .github/workflows/build-firmware.yml.
"""
import re
import sys
from pathlib import Path

version = sys.argv[1]
data = Path(__file__).resolve().parent.parent.joinpath("CHANGELOG.md").read_text()
m = re.search(rf"^## {re.escape(version)}\n(.*?)(?=^## |\Z)", data, re.S | re.M)
if not m:
    sys.exit(f"CHANGELOG.md has no section for {version}")
print("**What's new** (also shown on the Sticky's update screen):\n")
print("\n".join(l for l in m.group(1).splitlines() if l.startswith("- ")))
