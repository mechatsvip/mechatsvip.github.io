#!/usr/bin/env python3
"""Rename the visible Mecha brand to MeChat across tracked text files."""

from __future__ import annotations

import subprocess
from pathlib import Path

# Build the old spellings from pieces so this script does not rewrite itself.
replacements = (("Me" + "Cha", "Me" + "Chat"), ("Me" + "cha", "Me" + "Chat"))
files = subprocess.check_output(["git", "ls-files", "-z"]).split(b"\0")
updated: list[str] = []

for raw_path in files:
    if not raw_path:
        continue
    path = Path(raw_path.decode("utf-8"))
    if path.as_posix() == "scripts/rename_brand.py":
        continue
    try:
        original = path.read_bytes()
        text = original.decode("utf-8")
    except (OSError, UnicodeDecodeError):
        continue

    changed = text
    for old, new in replacements:
        changed = changed.replace(old, new)
    if changed != text:
        path.write_text(changed, encoding="utf-8", newline="")
        updated.append(path.as_posix())

if updated:
    print("Renamed brand text in:")
    print("\n".join(updated))
else:
    print("No old brand spelling found; files are already up to date.")
